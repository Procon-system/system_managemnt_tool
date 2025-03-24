// config.js
require('dotenv').config();

module.exports = {
  mongoURI: process.env.MONGO_URI || "mongodb://mongo:27017/ManagementTool",
  port: process.env.PORT || 5000,
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
};