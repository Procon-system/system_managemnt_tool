
const http = require("http");
const mongoose = require('mongoose');
const axios = require('axios');
const { Server } = require("socket.io");
const redis = require("redis");
const routes = require('./Routes/index');
const errorHandler = require('./Middleware/errorHandler');
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const config = require('./config/config');
const {setTaskSocketIoInstance} = require('./Controllers/taskControllers');
const {setResourceTypeSocketIoInstance} = require('./Controllers/resourceTypeController');
const User = require('./Models/UserSchema');
require('dotenv').config();
const {registerAdminController}= require('./Controllers/authController')
const app = express();
const server = http.createServer(app);
const { redisClient, connectRedis } = require("./redisClient");
const { getOrganizationDB } = require('./config/dbManager');
const ADMIN_API_URL = 'http://admin-api:8000/api/users';  // Use service name
const ADMIN_ACCESS_LEVEL = 5; // Your admin access level
// In your backend code
async function getContainerIdWithRetry(maxRetries = 3, retryDelay = 4000) {
  let retries = 0;
  
  const getContainerId = () => {
    // Method 1: From HOSTNAME environment variable
    if (process.env.HOSTNAME) {
      return process.env.HOSTNAME;
    }
    
    // Method 2: From /proc/self/cgroup (Linux containers)
    try {
      const fs = require('fs');
      const content = fs.readFileSync('/proc/self/cgroup', 'utf-8');
      const lines = content.split('\n');
      for (const line of lines) {
        const match = line.match(/([0-9a-f]{64})/);
        if (match) return match[1];
      }
    } catch (error) {
      console.error(`Could not read container ID from cgroup:`, error.message);
    }
    
    return null;
  };

  while (retries < maxRetries) {
    try {
      const containerId = getContainerId();
      if (containerId) {
        return containerId;
      }
      
      if (retries < maxRetries - 1) {
        console.log(`Container ID not available yet. Retrying in ${retryDelay/1000} seconds... (Attempt ${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    } catch (error) {
      console.error(`Attempt ${retries + 1} failed:`, error.message);
    }
    
    retries++;
  }
  
  // Final fallback options
  return process.env.DEV_CONTAINER_ID || 
         process.env.HOSTNAME || 
         'default-container-id';
}
async function fetchAdminUsers() {
  try {
    const response = await axios.get(ADMIN_API_URL, {
      headers: {
        'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000 // 5 second timeout
    });
    
    if (!response.data || !Array.isArray(response.data.users)) {
      throw new Error('Invalid response format from admin API');
    }
    return response.data.users;
  } catch (error) {
    console.error('Failed to fetch admin users:', error.message);
    throw error; // Rethrow to be handled by caller
  }
}

async function handleAdminRegistration(extUser) {
  try {
    // First check if organization exists in main DB
    const Organization = mongoose.model('Organization');
    let organization = await Organization.findOne({ name: extUser.organization_name });
    
    if (!organization) {
      // Create new organization in main DB
      organization = await Organization.create({
        name: extUser.organization_name,
        subdomain: extUser.organization_name.toLowerCase().replace(/\s+/g, '-'),
        contactEmail: extUser.email,
        config: {
          databaseName: `tenant_${new mongoose.Types.ObjectId()}`,
          features: {
            tasks: true,
            resources: true,
            teams: true
          }
        },
        subscription: {
          plan: extUser.subscription_type || 'free',
          startsAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        }
      });
    }

    // Get tenant-specific DB connection
    const tenantDB = await getOrganizationDB(organization._id);
    
    // Initialize User model for this tenant connection
    const User = require('./Models/UserSchema')(tenantDB);

    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: extUser.email },
        { personal_number: extUser.id.toString() }
      ]
    });

    if (existingUser) {
      return {
        user: existingUser,
        organization
      };
    }

    // Hash password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(extUser.password || 'tempPassword123!', salt);

    // Create new admin user in tenant DB
    const newUser = new User({
      email: extUser.email,
      password: hashedPassword,
      first_name: extUser.name?.split(' ')[0] || 'Admin',
      last_name: extUser.name?.split(' ').slice(1).join(' ') || 'User',
      personal_number: extUser.id.toString(),
      access_level: ADMIN_ACCESS_LEVEL,
      max_permitted_user_amount: extUser.max_permitted_user_amount || 1,
      max_permitted_resource_amount: extUser.max_permitted_resource_amount || 1,
      subscription_type: extUser.subscription_type || 'free',
      isConfirmed: true,
      isActive: true
    });

    await newUser.save();
    
    return {
      user: newUser.toObject(),
      organization
    };
    
  } catch (error) {
    console.error('Admin registration error:', error);
    throw error;
  }
}

async function syncAdminUsers() {
  try {
    const externalUsers = await fetchAdminUsers();
    const currentContainerId = await getContainerIdWithRetry();
    
    console.log("External users:", externalUsers);
    console.log("Current container ID:", currentContainerId);

    if (!currentContainerId) {
      throw new Error('Could not determine container ID');
    }

    // Find admin user for this container
    const adminUser = externalUsers.find(user => 
      user.user_container_id === currentContainerId
    );

    if (!adminUser) {
      throw new Error(`No admin user found for container ${currentContainerId}`);
    }

    const result = await handleAdminRegistration(adminUser);
    
    if (!result?.user || !result?.organization) {
      throw new Error('Admin registration returned invalid result');
    }

    return {
      ...result.user,
      organization: result.organization
    };

  } catch (error) {
    console.error('Admin sync failed:', error.message);
    const fallback = await createFallbackAdmin();
    
    if (!fallback?.user || !fallback?.organization) {
      throw new Error('Fallback admin creation failed');
    }

    return {
      ...fallback.user,
      organization: fallback.organization
    };
  }
}

async function createFallbackAdmin() {
  try {
    const Organization = mongoose.model('Organization');
    const fallbackEmail = `admin-${Date.now()}@fallback.com`;
    
    // Find or create fallback organization
    let organization = await Organization.findOne({ 
      name: /^Fallback Organization/
    });

    if (!organization) {
      organization = await Organization.create({
        name: `Fallback Organization ${Date.now()}`,
        subdomain: `fallback-${Date.now()}`,
        status: 'active',
        contactEmail: fallbackEmail,
        config: {
          databaseName: `tenant_fallback_${Date.now()}`,
          features: {
            tasks: true,
            resources: true,
            teams: true
          }
        },
        subscription: {
          plan: 'free',
          startsAt: new Date()
        }
      });
    }

    // Initialize tenant database connection
    const tenantDB = await getOrganizationDB(organization._id);
    
    // Initialize and get the User model instance
    const User = require('./Models/UserSchema')(tenantDB);

    // Create or update admin user
    const adminUser = await User.findOneAndUpdate(
      { email: fallbackEmail },
      {
        email: fallbackEmail,
        password: await bcrypt.hash('fallbackPassword123!', 10),
        first_name: 'Fallback',
        last_name: 'Admin',
        personal_number: '00000000',
        access_level: ADMIN_ACCESS_LEVEL,
        isConfirmed: true,
        isActive: true
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.warn(`Created fallback admin: ${fallbackEmail}`);
    return {
      user: adminUser.toObject(),
      organization
    };
  } catch (error) {
    console.error('CRITICAL: Fallback admin creation failed:', error);
    throw error;
  }
}
async function createFallbackAdmin() {
  try {
    const Organization = mongoose.model('Organization');
    const fallbackEmail = `admin-${Date.now()}@fallback.com`;
    
    // Find or create fallback organization
    let organization = await Organization.findOne({ 
      name: 'Fallback Organization'
    });

    if (!organization) {
      organization = await Organization.create({
        name: `Fallback Organization ${Date.now()}`,
        subdomain: `fallback-${Date.now()}`,
        status: 'active',
        contactEmail: fallbackEmail,
        config: {
          databaseName: `tenant_fallback_${Date.now()}`,
          features: {
            tasks: true,
            resources: true,
            teams: true
          }
        }
      });
    }

    // Initialize tenant database connection
    const tenantDB = await getOrganizationDB(organization._id);
    // Initialize and get the User model instance
    const User = require('./Models/UserSchema')(tenantDB);
 
    require('./Models/TeamSchema')(tenantDB);
    require('./Models/TaskSchema')(tenantDB);
    require('./Models/ResourceSchema')(tenantDB);
    require('./Models/ResourceTypeSchema')(tenantDB);

    // Create or update admin user
    const adminUser = await User.findOneAndUpdate(
      { email: fallbackEmail },
      {
        email: fallbackEmail,
        password: 'fallbackPassword123!',
        first_name: 'Fallback',
        last_name: 'Admin',
        personal_number: '00000000',
        access_level: ADMIN_ACCESS_LEVEL,
        isConfirmed: true,
        isActive: true
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.warn(`Created fallback admin: ${fallbackEmail}`);
    return {
      ...adminUser.toObject(),
      organization,
      tenantId: organization._id
    };
  } catch (error) {
    console.error('CRITICAL: Fallback admin creation failed:', error);
    throw error;
  }
}
// Initialize the application
async function initializeApplication() {
  try {
    const containerId = await getContainerIdWithRetry();
    await connectRedis();
    
    // Connect to main database
    await mongoose.connect(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      socketTimeoutMS: 30000
    });

    // Initialize Organization model in main DB
    const Organization = require('./Models/OrganizationSchema')(mongoose.connection);

    // Get admin user data from external API
    const adminUser = await syncAdminUsers();
    if (!adminUser || !adminUser.organization) {
      throw new Error('Admin user or organization not properly initialized');
    }
    
    console.log(`Admin user initialized: ${adminUser.email}`);

    // Initialize tenant database connection
    const tenantDB = await getOrganizationDB(adminUser.organization._id);
    
    // Initialize tenant models
    const User = require('./Models/UserSchema')(tenantDB);
    const Team = require('./Models/TeamSchema')(tenantDB);
    const Task = require('./Models/TaskSchema')(tenantDB);
    const Resource = require('./Models/ResourceSchema')(tenantDB);
    const ResourceType = require('./Models/ResourceTypeSchema')(tenantDB);

    // Verify all models initialized correctly
    if (!User || !Team || !Task || !Resource || !ResourceType) {
      throw new Error('Failed to initialize tenant models');
    }

    // Setup Socket.IO with multi-tenant support
    const io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST", "DELETE", "PUT"],
      },
    });

    io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
      
      // Extract tenant from handshake
      const tenantId = socket.handshake.auth.tenantId || 
                     socket.handshake.headers['x-tenant-id'];
      
      if (!tenantId) {
        console.log('No tenantId provided, disconnecting socket');
        socket.disconnect(true);
        return;
      }

      // Join tenant-specific room
      const tenantRoom = `tenant_${tenantId}`;
      socket.join(tenantRoom);
      
      socket.on('joinRoom', (roomId, callback) => {
        const fullRoomId = `${tenantRoom}_${roomId}`;
        socket.join(fullRoomId);
        console.log(`Client ${socket.id} joined room ${fullRoomId}`);
        if (callback) callback({ status: 'success', room: fullRoomId });
      });
      
      socket.on('leaveRoom', (roomId, callback) => {
        const fullRoomId = `${tenantRoom}_${roomId}`;
        socket.leave(fullRoomId);
        console.log(`Client ${socket.id} left room ${fullRoomId}`);
        if (callback) callback({ status: 'success', room: fullRoomId });
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });

    setTaskSocketIoInstance(io);
    setResourceTypeSocketIoInstance(io);
    
    // Express middleware
    app.use(bodyParser.json());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cors({
      origin: "*",
      credentials: true,
    }));
    app.use(cookieParser());

    // Routes
    app.use('/api', routes);
    app.use(errorHandler);
      
    server.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });

    // Error handlers
    process.on('unhandledRejection', (error) => {
      console.error('Unhandled rejection:', error);
    });

    process.on('uncaughtException', (error) => {
      console.error('Uncaught exception:', error);
    });
    
  } catch (error) {
    console.error('Initialization failed:', error);
    // Fallback mode
    app.use((req, res, next) => {
      req.orgDB = mongoose.connection;
      next();
    });
    
    server.listen(config.port, () => {
      console.log(`Server running in fallback mode on port ${config.port}`);
    });
  }
}
// Start the application
initializeApplication();