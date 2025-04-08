
const http = require("http");
const mongoose = require('mongoose');
const { Server } = require("socket.io");
const redis = require("redis");
const routes = require('./Routes/index');
const errorHandler = require('./Middleware/errorHandler');
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const config = require('./config/config');
const {setTaskSocketIoInstance }= require('./Controllers/taskControllers');
const {setResourceTypeSocketIoInstance}=require('./Controllers/resourceTypeController')
require('dotenv').config(); // Load environment variables

const app = express();
const server = http.createServer(app); // Create HTTP server
const { redisClient, connectRedis } = require("./redisClient");

// Ensure Redis is connected before starting the server
(async () => {
  await connectRedis(); // ✅ Ensures Redis is only connected once
})();
// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 50000,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit the process if MongoDB connection fails
  }
};

// Call the MongoDB connection function
connectDB();

// Now use redisClient normally in your code

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


// Start the server
server.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
