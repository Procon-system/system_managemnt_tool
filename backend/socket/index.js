

const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { createAdapter } = require("@socket.io/redis-adapter");
const { handleAdminRegistration, handleUserLogin } = require("../Services/adminRegistration");
const { redisClient } = require("../redisClient"); 
const config = require('../config/config'); 

let io; 

async function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
  });

  try {
    const pubClient = redisClient.duplicate();
    const subClient = pubClient.duplicate();

    // Add error listeners for ongoing monitoring
    pubClient.on('error', (err) => console.error('[Socket.IO Redis Pub] Error:', err));
    subClient.on('error', (err) => console.error('[Socket.IO Redis Sub] Error:', err));
    
    // ✅ AWAIT THE CONNECTION
    await Promise.all([pubClient.connect(), subClient.connect()]);
    
    io.adapter(createAdapter(pubClient, subClient));
    io.redisAdapterClients = { pubClient, subClient };
    console.log("✅ Successfully attached Redis adapter for multi-node scaling.");

  } catch (err) {
    // ✅ THIS WILL NOW EXECUTE IN PRODUCTION AND SHOW YOU THE REAL ERROR
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("CRITICAL: Could not connect to Redis for Socket.IO adapter.");
    console.error("This is why you are seeing '400 Bad Request' errors.");
    console.error("Check your REDIS_URL environment variable and firewall rules.");
    console.error("Error Details:", err);
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  }
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

        const handoffData = {
          token: token,
          user: {
            _id: payload._id,
            email: payload.email,
            first_name: payload.first_name,
            last_name: payload.last_name,
            access_level: payload.access_level
          },
          access_level: payload.access_level 
        };
        
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

  const userNamespace = io.of("/"); 

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
    
    if (socket.user) {
      const userIdStr = socket.user._id.toString();
      console.log(`[User] ✅ User ${userIdStr} connected with socket ${socket.id}`);

      socket.join(userIdStr); 
      socket.join(`org:${socket.orgId}`); 
      if (socket.user.role) {
          socket.join(`org:${socket.orgId}:role:${socket.user.role}`); 
      }
      socket.on("disconnect", () => {
       
      console.warn(`[User] 🔌 User socket disconnected: ${socket.id}`);
      });
    } else {
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
    
};