
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
const cookieParser = require("cookie-parser");
const cors = require("cors");
const config = require('./config/config'); 
require('dotenv').config();
const app = express();
// Middleware to parse JSON bodies
// app.use(bodyParser.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(
//   cors({
//     origin: [
//       "http://localhost:3000",
//     ],
//     credentials: true,
//   })
// );
// app.use(cookieParser());
// const mongoURI = process.env.MONGO_URI

// mongoose.connect(mongoURI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   serverSelectionTimeoutMS: 10000,
// })
//   .then(() => console.log('Connected to MongoDB'))
//   .catch((err) => console.error('MongoDB connection error:', err));
//   app.use('/api/auth', authRoutes);
//   app.use('/api/facility',facilityRoutes);
//   app.use('/api/machine',machineRoutes);
//   app.use('/api/material',materialsRoutes);
//   app.use('/api/tools',toolRoutes);
//   app.use('/api/tasks',tasksRoutes);
//   const port = process.env.PORT || 5000;

// // Start the server
// app.listen(port, () => {
//   console.log('Server running on port 5000');
// });
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
  serverSelectionTimeoutMS: 10000,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));


// Routes setup
app.use('/api/auth', authRoutes);
app.use('/api/facility', facilityRoutes);
app.use('/api/machine', machineRoutes);
app.use('/api/material', materialsRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/tasks', tasksRoutes);

// Start the server
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});