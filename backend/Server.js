
// const authRoutes = require('./Routes/authRoutes');
// const facilityRoutes =require('./Routes/facilityRoutes');
// const machineRoutes = require('./Routes/machineRoutes');
// const materialsRoutes = require('./Routes/materialRoutes');
// const tasksRoutes = require('./Routes/taskRoutes');
// const toolRoutes = require('./Routes/toolRoutes');
// const userRoutes =require('./Routes/userRoutes');
// const express = require("express");
// const bodyParser = require("body-parser");
// const cookieParser = require("cookie-parser");
// const cors = require("cors");
// const config = require('./config/config');
// const { Server } = require("socket.io");
// require('dotenv').config();  // Load environment variables
// const app = express();

// // Middleware setup
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
//   // Routes setup
//   app.use('/api/auth', authRoutes);
//   app.use('/api/facility', facilityRoutes);
//   app.use('/api/machine', machineRoutes);
//   app.use('/api/material', materialsRoutes);
//   app.use('/api/tools', toolRoutes);
//   app.use('/api/tasks', tasksRoutes);
//   app.use('/api/users', userRoutes);

//   // Start the server if CouchDB is connected
//   app.listen(config.port, () => {
//     console.log(`Server running on port ${config.port}`);
//   });

const http = require("http");
const { Server } = require("socket.io");
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
require('dotenv').config(); // Load environment variables

const app = express();
const server = http.createServer(app); // Create HTTP server
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins
    methods: ["GET", "POST"], // Allow specific methods
  },
});

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

// WebSocket setup
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle custom events
  socket.on("updateTask", (data) => {
    console.log("Task update received:", data);
  
    // Emit to all connected clients
    io.emit("taskUpdated", data);
    console.log("Task update broadcasted to all clients:", data);
  });
   // Handle task creation
   socket.on("createTask", (data) => {
    console.log("Task creation received:", data);

    // Emit to all connected clients
    io.emit("taskCreated", data);
    console.log("Task creation broadcasted to all clients:", data);
  });
   // Handle task deletion
   socket.on("deleteTask", (taskId) => {
    console.log(`Task with ID ${taskId} deleted`);

    // Emit the taskDeleted event to all clients
    io.emit("taskDeleted", taskId);  // Notify all clients about the task deletion
    console.log(`Task deletion broadcasted to all clients: ${taskId}`);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Start the server
server.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
