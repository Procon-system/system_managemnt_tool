
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
const { WebSocketServer } = require('ws');
require('dotenv').config();
const {registerAdminController}= require('./Controllers/authController')
const app = express();
const server = http.createServer(app);
const { redisClient, connectRedis } = require("./redisClient");
const { 
  getOrganizationDB, 
  closeAllConnections,
  getActiveTenantCount} = require('./config/dbManager');
const WebSocket = require('ws');
// 🌐 WebSocket server instance listening on port 8765
const wss = new WebSocketServer({ server, path: '/ws' });

const ADMIN_API_URL = process.env.ADMIN_API_URL;  // Use service name
const ADMIN_ACCESS_LEVEL = 5; // Your admin access level



// Socket.IO Handlers
function setupSocketIO() {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    
    const tenantId = socket.handshake.auth.tenantId || 
                   socket.handshake.headers['x-tenant-id'];
    
    if (!tenantId) {
      console.log('No tenantId provided, disconnecting socket');
      socket.disconnect(true);
      return;
    }

    // Get tenant DB connection for socket operations
    getOrganizationDB(tenantId)
      .then(tenantDB => {
        socket.tenantModels = {
          User: tenantDB.model('User'),
          Team: tenantDB.model('Team')
        };
        
        const tenantRoom = `tenant_${tenantId}`;
        socket.join(tenantRoom);
        
        socket.on('joinRoom', (roomId, callback) => {
          const fullRoomId = `${tenantRoom}_${roomId}`;
          socket.join(fullRoomId);
          if (callback) callback({ status: 'success', room: fullRoomId });
        });
        
        socket.on('leaveRoom', (roomId, callback) => {
          const fullRoomId = `${tenantRoom}_${roomId}`;
          socket.leave(fullRoomId);
          if (callback) callback({ status: 'success', room: fullRoomId });
        });
      })
      .catch(error => {
        console.error('Socket tenant DB error:', error);
        socket.disconnect(true);
      });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}
async function handleAdminRegistration(extUser) {
  try {
    // 1. Check/Create Organization in Main DB
    const Organization = mongoose.model('Organization');
    let organization = await Organization.findOne({ name: extUser.organization_name });
    
    if (!organization) {
      organization = await Organization.create({
        name: extUser.organization_name,
        subdomain: extUser.organization_name.toLowerCase().replace(/\s+/g, '-'),
        contactEmail: extUser.email,
        config: {
          databaseName: `tenant_${new mongoose.Types.ObjectId()}`,
          features: { tasks: true, resources: true, teams: true }
        },
        subscription: {
          plan: extUser.subscription_type || 'free',
          startsAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
    }

    // 2. Handle Superadmin in MAIN DB
    const Superadmin = mongoose.model('Superadmin'); // Model in main DB
    const existingSuperadmin = await Superadmin.findOne({ 
      $or: [
        { email: extUser.email },
        { personal_number: extUser.id.toString() }
      ]
    });

    if (existingSuperadmin) {
      return { 
        user: existingSuperadmin, 
        organization 
      };
    }

    // 3. Create new superadmin in MAIN DB
    const newSuperadmin = await Superadmin.create({
      email: extUser.email,
      password: extUser.password || 'tempPassword123!',
      first_name: extUser.name?.split(' ')[0] || 'Admin',
      last_name: extUser.name?.split(' ').slice(1).join(' ') || 'User',
      personal_number: extUser.id.toString(),
      org_id: organization._id, // Critical link to organization
      max_permitted_user_amount: extUser.max_permitted_user_amount || 5,
      max_permitted_resource_amount: extUser.max_permitted_resource_amount || 5,
      subscription_type: extUser.subscription_type || 'free',
      role: 'admin',
      isConfirmed: true,
      isActive: true
    });

    // Ensure models are initialized for the tenant
    const tenantConn = await getOrganizationDB(organization._id);
    if (!tenantConn.models.has('User')) {
      throw new Error(`User model not found for org ${organization._id}`);
    }
    return {
      user: newSuperadmin.toObject(),
      organization
    };

  } catch (error) {
    console.error('Admin registration error:', error);
    throw error;
  }
}
async function createFallbackAdmin() {
  try {
    const Organization = mongoose.model('Organization');
    const FALLBACK_EMAIL = 'admin@fallback.com';
    const FALLBACK_ORG_NAME = 'Fallback Organization';
    const FALLBACK_SUBDOMAIN = 'fallback';
    const FALLBACK_DB_NAME = 'tenant_fallback';

    // 1. Find existing fallback organization (with multiple possible queries)
    let organization = await Organization.findOne({
      $or: [
        { name: FALLBACK_ORG_NAME },
        { subdomain: FALLBACK_SUBDOMAIN },
        { 'config.databaseName': FALLBACK_DB_NAME }
      ]
    });

    // 2. If none exists, create exactly one fallback organization
    if (!organization) {
      organization = await Organization.create({
        name: FALLBACK_ORG_NAME,
        subdomain: FALLBACK_SUBDOMAIN,
        status: 'active',
        contactEmail: FALLBACK_EMAIL,
        config: {
          databaseName: FALLBACK_DB_NAME,
          features: { tasks: true, resources: true, teams: true }
        },
        subscription: {
          plan: 'free',
          startsAt: new Date()
        }
      });
      console.warn('Created new fallback organization');
    } else {
      console.warn('Using existing fallback organization');
    }

    const tenantConn = await getOrganizationDB(organization._id);
    const User = tenantConn.models.get('User');
    if (!User) {
      throw new Error('Fallback tenant User model not initialized');
    }
    // 5. Find or create THE fallback admin user
    const adminUser = await User.findOneAndUpdate(
      { email: FALLBACK_EMAIL },
      {
        email: FALLBACK_EMAIL,
        password: 'fallbackPassword123!',
        first_name: 'Fallback',
        last_name: 'Admin',
        personal_number: '00000000',
        access_level: ADMIN_ACCESS_LEVEL,
        max_permitted_user_amount: 1,
      max_permitted_resource_amount: 1,
      subscription_type: 'free',
        isConfirmed: true,
        isActive: true
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.warn(`Using fallback admin: ${FALLBACK_EMAIL}`);
    return {
      user: adminUser.toObject(),
      organization: organization.toObject()
    };
  } catch (error) {
    console.error('CRITICAL: Fallback admin creation failed:', error);
    throw error;
  }
}

function initializeMainModels(mainConnection) {
  return {
    Organization: require('./Models/OrganizationSchema')(mainConnection),
    Superadmin: require('./Models/SuperAdminSchema')(mainConnection),
    TenantUser: require('./Models/TenantUserSchema')(mainConnection)
  };
}
// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: config.corsOrigin,
    methods: ["GET", "POST", "DELETE", "PUT"],
  },
});

// Middleware to attach DB connections to requests
app.use(async (req, res, next) => {
  try {
    // Main DB models are always available
    req.mainModels = {
      Organization: mongoose.model('Organization'),
      Superadmin: mongoose.model('Superadmin'),
      TenantUser: mongoose.model('TenantUser')
    };
    
    // Tenant DB injection if tenantId is present
    const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;
    if (tenantId) {
      const tenantConn = await getOrganizationDB(tenantId);

      req.tenantConnection = tenantConn; // Optional: keep for debugging/advanced usage
      req.tenantDB = tenantConn.connection;
      req.tenantModels = {
        User: tenantConn.models.get('User'),
        Team: tenantConn.models.get('Team'),
        Task: tenantConn.models.get('Task'),
        Resource: tenantConn.models.get('Resource'),
        ResourceType: tenantConn.models.get('ResourceType')
      };
    }

    next();
  } catch (error) {
    console.error('Database middleware error:', error);
    next(error);
  }
});

wss.on('connection', (ws) => {
  console.log('🟢 Flask connected via WebSocket');

  ws.on('message', async (data) => {
    try {
      const adminData = JSON.parse(data);
      console.log('📥 Received admin data from Flask:', adminData);

      const result = await handleAdminRegistration(adminData);
      console.log('✅ Admin synced:', result);

      // ✅ Send success response back to Flask
      ws.send(JSON.stringify({
        status: 'success',
        message: 'Admin registered successfully',
        data: result // Optional: include any useful data
      }));

    } catch (err) {
      console.error('❌ Error processing WebSocket message:', err.message);

      // ❌ Send error response back to Flask
      ws.send(JSON.stringify({
        status: 'error',
        message: err.message
      }));
    }
  });

  ws.on('close', () => {
    console.warn('🔌 Flask WebSocket disconnected');
  });
});

async function initializeApplication() {
  try {
    await mongoose.connect(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      socketTimeoutMS: 30000
    });

    const { Organization, Superadmin, TenantUser } = initializeMainModels(mongoose.connection);

    app.use(bodyParser.json());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cors({ origin: config.corsOrigin, credentials: true }));
    app.use(cookieParser());

    app.use('/api', routes);
    app.use('*', (req, res) => res.status(404).send('Not Found'));

    server.listen(config.port, () => {
      console.log(`
        ✅ Server running on port ${config.port}
        🏢 Active tenants: ${getActiveTenantCount()}
        🌐 Main DB URI: ${config.mongoURI}
        🔌 WebSocket server listening on ws://<app>:${config.port}/ws
      `);
    });

  } catch (error) {
    console.error('❌ Initialization failed:', error);

    if (mongoose.connection.readyState === 1) {
      app.use((req, res, next) => {
        req.mainModels = { Organization: mongoose.model('Organization') };
        next();
      });
      console.log(`⚠️ Running in fallback mode; WebSocket and tenants disabled.`);

    } else {
      console.error('🚨 CRITICAL: No database connection. Exiting...');
      process.exit(1);
    }
  }
}




async function shutdown() {
  console.log('Shutting down gracefully...');
  await closeAllConnections();

  mongoose.connection.close(false, () => {
    console.log('Main DB closed');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

// ✅ Support for Nodemon Hot Reload
process.once('SIGUSR2', async () => {
  console.log('SIGUSR2 received — preparing for restart...');
  await shutdown();
  process.kill(process.pid, 'SIGUSR2');
});

process.on('unhandledRejection', err => {
  console.error('Unhandled rejection:', err);
});
process.on('uncaughtException', err => {
  console.error('Uncaught exception:', err);
  shutdown();
});
initializeApplication();