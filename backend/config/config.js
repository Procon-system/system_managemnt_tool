// config.js
require('dotenv').config();

module.exports = {
  mongoURI: process.env.MONGO_URI || "mongodb://mongo:27017/ManagementTool2",
  baseDBName: process.env.BASE_DB_NAME || "ManagementTool2",
  port: process.env.PORT || 5000,
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
};