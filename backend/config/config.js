// config.js
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
};
