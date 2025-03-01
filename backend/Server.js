
const http = require("http");
const { Server } = require("socket.io");
const redis = require("redis");
const authRoutes = require('./Routes/authRoutes');
const facilityRoutes = require('./Routes/facilityRoutes');
const machineRoutes = require('./Routes/machineRoutes');
const materialsRoutes = require('./Routes/materialRoutes');
const tasksRoutes = require('./Routes/taskRoutes');
const toolRoutes = require('./Routes/toolRoutes');
const userRoutes = require('./Routes/userRoutes');
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const config = require('./config/config');
const { setSocketIoInstance } = require('./Controllers/materialControllers');
const {setTaskSocketIoInstance }= require('./Controllers/taskControllers');
const {setMachineSocketIoInstance} = require('./Controllers/machineControllers')
const { setToolSocketIoInstance } = require('./Controllers/toolsControllers');
const { setFacilitySocketIoInstance } = require('./Controllers/facilityControllers');
require('dotenv').config(); // Load environment variables

const app = express();
const server = http.createServer(app); // Create HTTP server
const { redisClient, connectRedis } = require("./redisClient");

// Ensure Redis is connected before starting the server
(async () => {
  await connectRedis(); // ✅ Ensures Redis is only connected once
})();

// Now use redisClient normally in your code

const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins
    methods: ["GET", "POST","DELETE","PUT"], // Allow specific methods
  },
});
// Pass the io instance to the material controller after initializing io
setSocketIoInstance(io);  // Pass the io instance to the materials controller
setTaskSocketIoInstance (io);
setMachineSocketIoInstance(io);
setToolSocketIoInstance(io);
setFacilitySocketIoInstance(io);
// Middleware setup
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

// Routes setup
app.use('/api/auth', authRoutes);
app.use('/api/facility', facilityRoutes);
app.use('/api/machine', machineRoutes);
app.use('/api/material', materialsRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/users', userRoutes);

// // WebSocket setup
// WebSocket Middleware
// io.on("connection", (socket) => {
//   console.log(`User connected: ${socket.id}`);

//   // Log received events
//   socket.onAny((event, ...args) => {
//     console.log(`Event received: ${event}`, args);
//   });

//   // Handle task updates with Redis cache
//   socket.on("updateTask", async (data) => {
//     console.log("Task update received:", data);

//     // Invalidate Redis cache
//     await redisClient.del("tasks");

//     io.emit("taskUpdated", data);
//     console.log("Task update broadcasted and cache cleared.");
//   });

//   // Handle task deletions with Redis cache
//   socket.on("deleteTask", async (taskId) => {
//     console.log(`Task with ID ${taskId} deleted`);

//     // Invalidate Redis cache
//     await redisClient.del("tasks");

//     io.emit("taskDeleted", taskId);
//     console.log(`Task deletion broadcasted and cache cleared.`);
//   });

//   // Handle disconnection
//   socket.on("disconnect", () => {
//     console.log(`User disconnected: ${socket.id}`);
//   });
// });
// Start the server
server.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
