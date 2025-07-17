
// const { Server } = require("socket.io");
// const jwt = require("jsonwebtoken");
// const { handleAdminRegistration , handleUserLogin} = require("../Services/adminRegistration");
// const connectedUsers = {};
// let io;

// function initSocket(httpServer) {
//   io = new Server(httpServer, {
//     cors: { origin: "*", methods: ["GET", "POST"] }
//   });

//   const internalNamespace = io.of("/internal");

//   internalNamespace.use((socket, next) => {
//     const internalSecret = process.env.INTERNAL_SOCKET_SECRET;
//     const clientSecret = socket.handshake.auth.secret;

//     // Rely ONLY on the shared secret. This is secure and network-independent.
//     if (internalSecret && clientSecret === internalSecret) {
//         console.log(`[Internal] ✅ Auth successful for service: ${socket.id}`);
//         return next();
//     }

//     // If the secret is missing or incorrect, reject the connection.
//     const remoteIp = socket.handshake.headers['x-forwarded-for'] || socket.conn.remoteAddress || '';
//     console.error(`[Internal] ❌ FORBIDDEN: Connection attempt from ${remoteIp} with invalid secret.`);
//     next(new Error("Forbidden: Invalid credentials for internal namespace"));
//   });
  
//   // This part remains the same
//   internalNamespace.on("connection", (socket) => {
//     console.log("🔌 Flask/Internal service connected to /internal namespace:", socket.id);
//     socket.on("subscriber_login", async (data) => {
//       try {
//         const { token, user, organization } = await handleUserLogin(data.data);
        
//         // Now, we need to send this token to the correct user's browser socket.
//         // We identify the user by the flask_subscriber_id we added.
//         const flaskId = data.data.flask_subscriber_id;
        
//         // This is a simplified way to target the user. In a real app, you'd
//         // map flaskId to a socket.id when the user connects to the React app.
//         // For now, we broadcast to a "temporary" room that only the user will join.
//         const roomName = `handoff:${flaskId}`;
//         const io = getIoInstance();
        
//         io.to(roomName).emit("auth_token", { token });

//         console.log(`[Internal] ✅ Sent JWT to user in room ${roomName}`);
//         socket.emit("ack", { status: "success", message: "Token sent" });

//       } catch (err) {
//         console.error("[Internal] ❌ Error processing 'subscriber_login':", err.message);
//         socket.emit("ack", { status: "error", message: err.message });
//       }
//     });
//     socket.on("subscriber_created", async (data) => {
//       try {
//         const result = await handleAdminRegistration(data);
//         console.log(`[Internal] ✅ Processed 'subscriber_created' for ${data.email}`);
//         socket.emit("ack", { status: "success", data: result });
//       } catch (err) {
//         console.error("[Internal] ❌ Error processing 'subscriber_created':", err.message);
//         socket.emit("ack", { status: "error", message: err.message });
//       }
//     });
// socket.on('join_handoff_room', (roomName) => {
//     socket.join(roomName);
//     console.log(`Socket ${socket.id} joined temporary handoff room: ${roomName}`);
// });
//     socket.on("disconnect", (reason) => {
//         console.warn(`🔌 Internal service disconnected: ${socket.id}, Reason: ${reason}`);
//     });
//   });

//   const userNamespace = io.of("/"); // Or just `io`

//   userNamespace.use(async (socket, next) => {
//     const token = socket.handshake.auth?.token;
//     if (!token) {
//         return next(new Error("Authentication error: Token required"));
//     }
  
//     try {
//       const decoded = jwt.verify(token, process.env.JWT_TOKEN_KEY);
//       const orgId = decoded.tenantId || decoded.organization;
  
//       socket.user = decoded;
//       socket.orgId = orgId;
  
//       next(); // Pass control to the connection handler
//     } catch (err) {
//       console.log("Authentication error:", err.message);
//       next(new Error("Authentication error: Invalid or expired token"));
//     }
//   });
  
//   userNamespace.on("connection", (socket) => {
//     console.log(`✅ User socket connected: ${socket.id} (User: ${socket.user._id})`);
    
//     // Add user to relevant rooms
//     socket.join(`org:${socket.orgId}`);
//     socket.join(`org:${socket.orgId}:role:${socket.user.role}`);
//     connectedUsers[socket.user._id.toString()] = socket.id;

//     socket.on("disconnect", () => {
//       const userId = socket.user?._id?.toString();
//       if (userId) {
//           delete connectedUsers[userId];
//       }
//       console.warn(`🔌 User socket disconnected: ${socket.id}`);
//     });
//   });

//   return io;
// }

// function getIoInstance() {
//   if (!io) throw new Error("Socket.IO not initialized");
//   return io;
// }

// module.exports = { 
//     initSocket, 
//     getIoInstance, // Renamed for clarity
//     connectedUsers 
// };

const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { handleAdminRegistration, handleUserLogin } = require("../Services/adminRegistration");
const { redisClient } = require("../redisClient"); 
const connectedUsers = {};
const config = require('../config/config'); 

let io; // Will be initialized once

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
  });
  const internalNamespace = io.of("/internal");

  // Authentication middleware for the internal namespace
  internalNamespace.use((socket, next) => {
    const internalSecret = process.env.INTERNAL_SOCKET_SECRET;
    const clientSecret = socket.handshake.auth.secret;

    if (config.internalSocketSecret && clientSecret === config.internalSocketSecret) {
      console.log(`[Internal] ✅ Auth successful for service: ${socket.id}`);
      return next();
    }
    
    const remoteIp = socket.handshake.headers['x-forwarded-for'] || socket.conn.remoteAddress || '';
    console.error(`[Internal] ❌ FORBIDDEN: Connection attempt from ${remoteIp} with invalid secret.`);
    next(new Error("Forbidden: Invalid credentials for internal namespace"));
  });
  
  // Connection handler for the internal namespace
  internalNamespace.on("connection", (socket) => {
    console.log("🔌 Flask/Internal service connected to /internal namespace:", socket.id);

    // Listener for when a user logs in via Flask
    socket.on("subscriber_login", async (data) => {
      try {
        const { token } = await handleUserLogin(data.data);
        const flaskId = data.data.flask_subscriber_id;
        const redisKey = `handoff:${flaskId}`;
        const payload = jwt.decode(token);

        // 3. Construct the full handoff object
        const handoffData = {
          token: token,
          user: {
            _id: payload._id,
            email: payload.email,
            first_name: payload.first_name,
            last_name: payload.last_name,
            access_level: payload.access_level
          },
          access_level: payload.access_level // Assuming 'role' in the JWT maps to 'access_level'
        };
        // **FIX**: Store the generated JWT in Redis with a 60-second expiration.
        // await redisClient.setEx(redisKey, 60, token);
        await redisClient.setEx(redisKey, 60, JSON.stringify(handoffData));

        console.log(`[Internal] ✅ Token for user ${flaskId} cached in Redis.`);
        socket.emit("ack", { status: "success", message: "Token cached" });

      } catch (err) {
        console.error("[Internal] ❌ Error processing 'subscriber_login':", err.message);
        socket.emit("ack", { status: "error", message: err.message });
      }
    });

    // Listener for when a new user is created
    socket.on("subscriber_created", async (data) => {
      try {
        const result = await handleAdminRegistration(data);
        console.log(`[Internal] ✅ Processed 'subscriber_created' for ${data.email}`);
        socket.emit("ack", { status: "success", data: result });
      } catch (err) {
        console.error("[Internal] ❌ Error processing 'subscriber_created':", err.message);
        socket.emit("ack", { status: "error", message: err.message });
      }
    });

    socket.on("disconnect", (reason) => {
      console.warn(`🔌 Internal service disconnected: ${socket.id}, Reason: ${reason}`);
    });
  });

  //==================================================================
  // 2. USER NAMESPACE (PUBLIC) - For communication with React App
  //==================================================================
  const userNamespace = io.of("/"); 

  // Authentication middleware for the public namespace
  userNamespace.use(async (socket, next) => {
    const isHandoff = socket.handshake.query.handoff === 'true';
    if (isHandoff) {
        console.log(`[Handoff] 🤝 Allowing pre-auth connection for handoff: ${socket.id}`);
        return next();
    }

    const token = socket.handshake.auth?.token;
    if (!token) {
        return next(new Error("Authentication error: Token required"));
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_TOKEN_KEY);
      socket.user = decoded;
      socket.orgId = decoded.tenantId || decoded.organization;
      next();
    } catch (err) {
      console.log(`[User] ❌ Auth error for socket ${socket.id}:`, err.message);
      next(new Error("Authentication error: Invalid or expired token"));
    }
  });
  
  // Connection handler for the public namespace
  userNamespace.on("connection", (socket) => {
    
    socket.on('join_handoff_room', async (roomName) => {
      socket.join(roomName);
      console.log(`[Handoff] ✅ Socket ${socket.id} joined temporary room: ${roomName}`);
      
      const redisKey = roomName;

      try {
        // 1. Get the stringified data from Redis
        const cachedDataString = await redisClient.get(redisKey);

        if (cachedDataString) {
          console.log(`[Handoff] ✨ Found cached payload for ${redisKey}. Emitting...`);
          
          // 2. Parse the string back into an object
          const handoffPayload = JSON.parse(cachedDataString);
          
          // 3. Emit the full object to the client
          socket.emit('auth_token', handoffPayload);
          
          await redisClient.del(redisKey);
        } else {
          console.log(`[Handoff] ⏳ No cached token found for ${redisKey}. Waiting or will time out.`);
        }
      } catch (err) {
        console.error(`[Handoff] ❌ Redis error checking for key ${redisKey}:`, err);
      }
    });
    // Handle regular, authenticated user connections
    if (socket.user) {
      console.log(`[User] ✅ User socket connected: ${socket.id} (User: ${socket.user._id})`);
      
      socket.join(`org:${socket.orgId}`);
      socket.join(`org:${socket.orgId}:role:${socket.user.role}`);
      connectedUsers[socket.user._id.toString()] = socket.id;

      socket.on("disconnect", () => {
        const userId = socket.user?._id?.toString();
        if (userId) {
            delete connectedUsers[userId];
        }
        console.warn(`[User] 🔌 User socket disconnected: ${socket.id}`);
      });
    } else {
      // This is the initial state of a handoff socket before it joins a room.
      console.log(`[Handoff] ❔ Pre-auth socket connected, awaiting room join: ${socket.id}`);
    }
  });

  return io;
}

function getIoInstance() {
  if (!io) {
    throw new Error("Socket.IO not initialized! Call initSocket first.");
  }
  return io;
}

module.exports = { 
    initSocket, 
    getIoInstance,
    connectedUsers 
};