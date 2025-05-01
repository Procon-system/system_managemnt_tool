// dbManager.js
const mongoose = require('mongoose');
const connections = new Map();

async function getOrganizationDB(orgId) {
  if (connections.has(orgId)) {
    return connections.get(orgId);
  }

  const dbName = `org_${orgId}`;
  const connection = await mongoose.createConnection(
    `mongodb://mongo:27017/${dbName}`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  );

  connections.set(orgId, connection);
  return connection;
}

module.exports = { getOrganizationDB };