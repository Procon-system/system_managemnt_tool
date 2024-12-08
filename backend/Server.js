
const authRoutes = require('./Routes/authRoutes');
const facilityRoutes =require('./Routes/facilityRoutes');
const machineRoutes = require('./Routes/machineRoutes');
const materialsRoutes = require('./Routes/materialRoutes');
const tasksRoutes = require('./Routes/taskRoutes');
const toolRoutes = require('./Routes/toolRoutes');
const userRoutes =require('./Routes/userRoutes');
// // const teamRoutes = require('./Routes/teamRoutes');
// // const departmentRoutes = require('./Routes/departmentRoutes');
// const cookieParser = require("cookie-parser");
// const cors = require("cors");
// const config = require('./config/config'); 
// require('dotenv').config();
// // const { GridFsStorage } = require('multer-gridfs-storage');
// // const multer = require('multer');
// const app = express();
// const { initializeStorage } =require('./utils/uploadImage')
// app.use(bodyParser.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(
//   cors({
//     origin: [config.corsOrigin],
//     credentials: true,
//   })
// );
// app.use(cookieParser());

// // MongoDB connection
// mongoose.connect(config.mongoURI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   serverSelectionTimeoutMS: 10000,
// })
//   .then(() => {
//     console.log('Connected to MongoDB');
//   })
//   .catch((err) => console.error('MongoDB connection error:', err));

// // Handle connection errors
// mongoose.connection.on('error', (err) => {
//   console.error('Mongoose connection error:', err);
// });
// // Routes setup
// app.use('/api/auth', authRoutes);
// app.use('/api/facility', facilityRoutes);
// app.use('/api/machine', machineRoutes);
// app.use('/api/material', materialsRoutes);
// app.use('/api/tools', toolRoutes);
// app.use('/api/tasks', tasksRoutes);
// app.use('/api/users',userRoutes);
// // Start the server
// app.listen(config.port, () => {
//   console.log(`Server running on port ${config.port}`);
// });
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const config = require('./config/config');
require('dotenv').config();  // Load environment variables

const axios = require('axios');  // Import axios for HTTP requests
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

// // CouchDB connection check function
// const checkCouchDBConnection = async () => {
//   const couchdbUrl = process.env.COUCHDB_URL;
//   const couchdbUser = process.env.COUCHDB_USER;
//   const couchdbPassword = process.env.COUCHDB_PASSWORD;

//   try {
//     const response = await axios.get(couchdbUrl, {
//       auth: {
//         username: couchdbUser,
//         password: couchdbPassword,
//       },
//     });
//     console.log('CouchDB is running:', response.data);
//   } catch (error) {
//     console.error('Error connecting to CouchDB:', error.message);
//     process.exit(1); // Stop server startup if connection fails
//   }
// };

// // Check CouchDB connection and then start the server
// checkCouchDBConnection().then(() => {
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

