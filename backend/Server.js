
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const User = require('./Models/UserSchema');
const Task = require('./Models/TaskSchema');
const Resource = require('./Models/ResourceSchema');
const TaskHistory =require('./Models/HistoricalTaskSchema');
const Notification = require('./Models/NotificationSchema');
const Machine = require('./Models/MachineSchema');
const Tool=require('./Models/ToolsSchema');
const Material = require('./Models/MaterialsSchema');
const Facility = require('./Models/FacilitySchema');
const authRoutes = require('./Routes/authRoutes');
const facilityRoutes =require('./Routes/facilityRoutes');
const machineRoutes = require('./Routes/machineRoutes');
const materialsRoutes = require('./Routes/materialRoutes');
const tasksRoutes = require('./Routes/taskRoutes');
const toolRoutes = require('./Routes/toolRoutes');
const userRoutes =require('./Routes/userRoutes');
// const teamRoutes = require('./Routes/teamRoutes');
// const departmentRoutes = require('./Routes/departmentRoutes');
const cookieParser = require("cookie-parser");
const cors = require("cors");
const config = require('./config/config'); 
require('dotenv').config();
// const { GridFsStorage } = require('multer-gridfs-storage');
// const multer = require('multer');
const app = express();
const { initializeStorage } =require('./utils/uploadImage')
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [config.corsOrigin],
    credentials: true,
  })
);
app.use(cookieParser());

// MongoDB connection
mongoose.connect(config.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
})
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// Handle connection errors
mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});
// Routes setup
app.use('/api/auth', authRoutes);
app.use('/api/facility', facilityRoutes);
app.use('/api/machine', machineRoutes);
app.use('/api/material', materialsRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/users',userRoutes);
// Start the server
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
