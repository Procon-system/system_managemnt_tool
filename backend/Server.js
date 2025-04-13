
// const http = require("http");
// const mongoose = require('mongoose');
// const { Server } = require("socket.io");
// const redis = require("redis");
// const routes = require('./Routes/index');
// const errorHandler = require('./Middleware/errorHandler');
// const express = require("express");
// const bodyParser = require("body-parser");
// const cookieParser = require("cookie-parser");
// const cors = require("cors");
// const config = require('./config/config');
// const {setTaskSocketIoInstance }= require('./Controllers/taskControllers');
// const {setResourceTypeSocketIoInstance}=require('./Controllers/resourceTypeController')
// require('dotenv').config(); // Load environment variables

// const app = express();
// const server = http.createServer(app); // Create HTTP server
// const { redisClient, connectRedis } = require("./redisClient");

// // Ensure Redis is connected before starting the server
// (async () => {
//   await connectRedis(); // ✅ Ensures Redis is only connected once
// })();
// // MongoDB Connection
// const connectDB = async () => {
//   try {
//     await mongoose.connect(config.mongoURI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//       serverSelectionTimeoutMS: 50000,
//     });
//     console.log('MongoDB connected successfully');
//   } catch (error) {
//     console.error('MongoDB connection error:', error);
//     process.exit(1); // Exit the process if MongoDB connection fails
//   }
// };

// // Call the MongoDB connection function
// connectDB();

// // Now use redisClient normally in your code

// const io = new Server(server, {
//   cors: {
//     origin: "*", // Allow all origins
//     methods: ["GET", "POST","DELETE","PUT"], // Allow specific methods
//   },
// });
// // Add this right after creating the io instance
// io.on('connection', (socket) => {
//   console.log(`Client connected: ${socket.id}`);

//   // Handle room joining
//   socket.on('joinRoom', (roomId, callback) => {
//     socket.join(roomId);
//     console.log(`Client ${socket.id} joined room ${roomId}`);
//     if (callback) {
//       callback({ status: 'success', room: roomId });
//     }
//   });

//   // Handle room leaving
//   socket.on('leaveRoom', (roomId, callback) => {
//     socket.leave(roomId);
//     console.log(`Client ${socket.id} left room ${roomId}`);
//     if (callback) {
//       callback({ status: 'success', room: roomId });
//     }
//   });

//   socket.on('disconnect', () => {
//     console.log(`Client disconnected: ${socket.id}`);
//   });
// });
// setTaskSocketIoInstance (io);
// setResourceTypeSocketIoInstance(io);

// app.use(bodyParser.json());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(
//   cors({
//     origin: "*",
//     credentials: true,
//   })
// );
// app.use(cookieParser());
// // Routes
// app.use('/api', routes);

// // Error Handling Middleware
// app.use(errorHandler);


// // Start the server
// server.listen(config.port, () => {
//   console.log(`Server running on port ${config.port}`);
// });
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

const ADMIN_API_URL = 'http://admin-api:8000/api/users';  // Use service name
const ADMIN_ACCESS_LEVEL = 5; // Your admin access level
// In your backend code
function getContainerId() {
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
    console.error('Could not read container ID:', error);
  }
  
  // Development fallback
  return process.env.DEV_CONTAINER_ID || 'dev-container-id';
}
async function fetchAdminUsers() {
  try {
    const response = await axios.get(ADMIN_API_URL);
    console.log("response", response.data);  // Note: response.data contains the actual data
    return response.data.users;  // Access data property
  } catch (error) {
    console.error('Failed to fetch admin users:', error.message);
    return [];
  }
}
async function syncAdminUsers() {
  try {
    const externalUsers = await fetchAdminUsers();
    const currentContainerId = getContainerId();
    console.log('Container ID:', currentContainerId);
    
    if (!currentContainerId) {
      console.warn('Could not determine container ID - using fallback admin');
      return createFallbackAdmin();
    }

    for (const extUser of externalUsers) {
      if (extUser.unique_id === currentContainerId) {
        try {
          // ... existing registration logic ...
          return await handleAdminRegistration(extUser);
        } catch (error) {
          console.error('Error syncing admin user:', error.message);
          return createFallbackAdmin();
        }
      }
    }

    console.warn('No admin user found for container ID - using fallback admin');
    return createFallbackAdmin();
  } catch (error) {
    console.error('Admin sync failed:', error.message);
    return createFallbackAdmin();
  }
}

async function handleAdminRegistration(extUser) {
 
  const registrationData = {
    email: extUser.email,
    password: 'tempPassword123!', // Default password
    first_name: extUser.name.split(' ')[0] || 'Admin',
    last_name: extUser.name.split(' ')[1] || 'User',
    personal_number: extUser.id.toString(),
    access_level: ADMIN_ACCESS_LEVEL,
    organizationName: 'procon',
    max_permitted_user_amount: extUser.max_permitted_user_amount || 1,
    max_permitted_resource_amount: extUser.max_permitted_resource_amount || 1,
    subscription_type: extUser.subscription_type || 'free', // Default to free if not provided  
    isConfirmed: true // Auto-confirm admin users
  };

  // Create a mock request object
  const mockReq = {
    body: registrationData
  };

  // Create a mock response object
  const mockRes = {
    status: function(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json: function(data) {
      if (data.success) {
        return data.data; // Return the created user
      }
      throw new Error(data.error || 'Registration failed');
    }
  };

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [
      { email: extUser.email },
      { personal_number: extUser.id.toString() }
    ]
  });

  if (existingUser) {
    // Update existing user through registration controller
    mockReq.body._id = existingUser._id; // Add ID for update
    return await registerAdminController(mockReq, mockRes);
  } else {
    // Create new user through registration controller
    return await registerAdminController(mockReq, mockRes);
  }
}

function createFallbackAdmin() {
  const fallbackEmail = `admin-${Date.now()}@fallback.com`;
  console.warn(`Creating fallback admin: ${fallbackEmail}`);
  
  return User.findOneAndUpdate(
    { email: fallbackEmail },
    {
      email: fallbackEmail,
      password: 'fallbackPassword123!',
      first_name: 'Fallback',
      last_name: 'Admin',
      personal_number: '00000000',
      access_level: ADMIN_ACCESS_LEVEL,
      organizationName: 'procon',
      max_permitted_user_amount: extUser.max_permitted_user_amount || 1,
    max_permitted_resource_amount: extUser.max_permitted_resource_amount || 1,
    subscription_type: extUser.subscription_type || 'free', // Default to free if not provided  
      isConfirmed: true,
      isActive: true
    },
    { upsert: true, new: true }
  );
}
// Initialize the application
async function initializeApplication() {
  try {
    const containerId = getContainerId();
    console.log(`Container ID: ${containerId}`);
    
    await connectRedis();
    await mongoose.connect(config.mongoURI);
    
    try {
      const adminUser = await syncAdminUsers();
      console.log(`Admin user: ${adminUser.email}`);
    } catch (adminError) {
      console.error('Admin sync failed, but continuing:', adminError.message);
    }
    const io = new Server(server, {
        cors: {
          origin: "*", // Allow all origins
          methods: ["GET", "POST","DELETE","PUT"], // Allow specific methods
        },
      });
      // Add this right after creating the io instance
      io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);
      
        // Handle room joining
        socket.on('joinRoom', (roomId, callback) => {
          socket.join(roomId);
          console.log(`Client ${socket.id} joined room ${roomId}`);
          if (callback) {
            callback({ status: 'success', room: roomId });
          }
        });
      
        // Handle room leaving
        socket.on('leaveRoom', (roomId, callback) => {
          socket.leave(roomId);
          console.log(`Client ${socket.id} left room ${roomId}`);
          if (callback) {
            callback({ status: 'success', room: roomId });
          }
        });
      
        socket.on('disconnect', () => {
          console.log(`Client disconnected: ${socket.id}`);
        });
      });
      setTaskSocketIoInstance (io);
      setResourceTypeSocketIoInstance(io);
      
      app.use(bodyParser.json());
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));
      app.use(
        cors({
          origin: "*",
          credentials: true,
        })
      );
      app.use(cookieParser());
      // Routes
      app.use('/api', routes);
      
      // Error Handling Middleware
      app.use(errorHandler);
      
      
    server.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });

    // Add process error handlers
    process.on('unhandledRejection', (error) => {
      console.error('Unhandled rejection:', error);
    });

    process.on('uncaughtException', (error) => {
      console.error('Uncaught exception:', error);
    });
    
  } catch (error) {
    console.error('Initialization failed:', error);
    // Instead of exiting, attempt to start in limited mode
    server.listen(config.port, () => {
      console.log(`Server running in fallback mode on port ${config.port}`);
    });
  }
}
// Start the application
initializeApplication();