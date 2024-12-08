
const authRoutes = require('./Routes/authRoutes');
const facilityRoutes =require('./Routes/facilityRoutes');
const machineRoutes = require('./Routes/machineRoutes');
const materialsRoutes = require('./Routes/materialRoutes');
const tasksRoutes = require('./Routes/taskRoutes');
const toolRoutes = require('./Routes/toolRoutes');
const userRoutes =require('./Routes/userRoutes');
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const config = require('./config/config');
require('dotenv').config();  // Load environment variables
const app = express();

// Middleware setup
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [config.corsOrigin],
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

  // Start the server if CouchDB is connected
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });

