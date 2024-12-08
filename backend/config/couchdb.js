const nano = require('nano');
require('dotenv').config();

// Initialize CouchDB connection
const couch = nano({
  url: process.env.COUCHDB_URL,
  requestDefaults: {
    auth: {
      username: process.env.COUCHDB_USER,
      password: process.env.COUCHDB_PASSWORD,
    },
  },
});

const dbName = 'task_management';
const db = couch.use(dbName);

// Test CouchDB connection
const testConnection = async () => {
  try {
    const info = await couch.info(); // Get server info to verify connection
    console.log('CouchDB connection successful:', info);
  } catch (error) {
    console.error('Error connecting to CouchDB:', error.message);
  }
};

// Create a database if it doesn't already exist
const createDatabase = async () => {
  try {
    const dbList = await couch.db.list();
    if (!dbList.includes(dbName)) {
      await couch.db.create(dbName);
      console.log(`Database "${dbName}" created.`);
    } else {
      console.log(`Database "${dbName}" already exists.`);
    }
  } catch (error) {
    console.error('Error creating database:', error.message);
  }
};

// Create an index
const createIndex = async () => {
  try {
    const response = await db.createIndex({
      index: {
        fields: ['type', 'updated_at'], // Fields to be indexed
      },
      name: 'type-updated_at-index',    // Name for the index
      ddoc: 'type-updated_at-ddoc',    // Design document name
      type: 'json',                    // Index type
    });
    console.log('Index created successfully:', response);
  } catch (error) {
    console.error('Failed to create index:', error.message);
  }
};

// Call these functions at server startup
(async () => {
  await testConnection();
  await createDatabase();
  await createIndex(); // Ensure the index is created
})();

module.exports = { db };
