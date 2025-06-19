// socket/index.js
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { getOrganizationDB } = require("../config/dbManager");
const { handleAdminRegistration } = require("../Services/adminRegistration");

const connectedUsers = {}; // userId -> socketId

let io;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Middleware: authenticate socket connection
  io.use(async (socket, next) => {
    const remoteIp =
      socket.handshake.headers['x-forwarded-for'] ||
      socket.conn.remoteAddress ||
      '';
  
      const flaskIp = process.env.FLASK_IP_ADDRESS;

      // Safely check if the flaskIp is defined and if the remote IP includes it
      if (flaskIp && remoteIp.includes(flaskIp)) {
        console.log(`🟡 Bypassing auth for allowed IP (${flaskIp}) from remote: ${remoteIp}`);
        return next();
      }
  
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Token required"));
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_TOKEN_KEY);
      const orgId = decoded.tenantId || decoded.organization;
  
      // const tenantDB = await getOrganizationDB(orgId);
      // const User = tenantDB.models.get("User");
      // const user = await User.findById(decoded._id);
      // if (!user) return next(new Error("Invalid user"));

      socket.user = decoded;
      socket.orgId = orgId;
  
      socket.join(`org:${orgId}`);
      socket.join(`org:${orgId}:role:${socket.user.role}`);
      connectedUsers[decoded._id.toString()] = socket.id;
      next();
    } catch (err) {
      console.log("err",err)
      next(new Error("Invalid or expired token"));
    }
  });
  

  io.on("connection", (socket) => {
    console.log("✅ Socket connected:", socket.id);

    socket.on("disconnect", () => {
      const userId = socket.user?._id?.toString();
      if (userId) delete connectedUsers[userId];
      console.warn("🔌 Socket disconnected:", socket.id);
    });

    // This is where you handle messages from Flask if needed
    socket.on("subscriber_created", async (data) => {
      try {
        const result = await handleAdminRegistration(data);
        
        socket.emit("ack", {
          status: "success",
          message: "Subscriber registered successfully",
          data: result
        });
      } catch (err) {
        socket.emit("ack", {
          status: "error",
          message: err.message
        });
      }
    });
  });

  return io;
}

function getSocket() {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
}

module.exports = { initSocket, getSocket, connectedUsers };
