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
// Function to create system databases
const createSystemDatabases = async () => {
  const systemDbs = ['_global_changes', '_replicator', '_users'];
  try {
    const existingDbs = await couch.db.list();

    for (const systemDb of systemDbs) {
      if (!existingDbs.includes(systemDb)) {
        await couch.db.create(systemDb);
        console.log(`System database "${systemDb}" created.`);
      } else {
        console.log(`System database "${systemDb}" already exists.`);
      }
    }
  } catch (error) {
    console.error('Error ensuring system databases:', error.message);
  }
};

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
const createStatusAssignedToIndex = async () => {
  try {
    const response = await db.createIndex({
      index: {
        fields: ['status', 'assigned_to'], // Fields for fetchDoneTasksForUser
      },
      name: 'status-assigned_to-index',
      ddoc: 'status-assigned_to-ddoc',
      type: 'json',
    });
    console.log('Status-Assigned_To Index created successfully:', response);
  } catch (error) {
    console.error('Failed to create Status-Assigned_To index:', error.message);
  }
};

// Call these functions at server startup
(async () => {
  await testConnection();
  await createSystemDatabases();
  await createDatabase();
  await createIndex();
  await createStatusAssignedToIndex(); // Ensure the index is created
})();

module.exports = { db };
