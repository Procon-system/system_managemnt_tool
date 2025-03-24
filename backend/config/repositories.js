// config/repositories.js
const { db } = require('./couchdb'); // CouchDB connection
const CouchDBTaskRepository = require('../repositories/CouchDBTaskRepository');

// Initialize repositories
const taskRepository = new CouchDBTaskRepository(db);

module.exports = {
  taskRepository,
};