
const mongoose = require('mongoose');
const config = require('./config');

// Track all active connections and initialized tenants
const tenantConnections = new Map();
const initializedTenants = new Map(); // Now tracks model initialization per connection
// Track all active connections

class TenantConnection {
  constructor(connection, orgId) {
    this.connection = connection;
    this.orgId = orgId;
    this.models = new Map(); // Track initialized models per connection
  }

  async initializeModels() {
    try {
      // Only initialize models once per connection
      if (this.models.size > 0) return;

      const modelInitializers = {
        User: require('../Models/UserSchema'),
        Team: require('../Models/TeamSchema'),
        Task: require('../Models/TaskSchema'),
        Resource: require('../Models/ResourceSchema'),
        ResourceType: require('../Models/ResourceTypeSchema')
      };

      for (const [modelName, initFn] of Object.entries(modelInitializers)) {
        if (!this.connection.models[modelName]) {
          const model = initFn(this.connection);
          this.models.set(modelName, model);
        }
      }
    } catch (error) {
      console.error(`Model initialization failed for org ${this.orgId}:`, error);
      throw error;
    }
  }

  async close() {
    try {
      await this.connection.close();
      tenantConnections.delete(this.orgId);
    } catch (error) {
      console.error(`Error closing connection for org ${this.orgId}:`, error);
    }
  }
}

async function getOrganizationDB(orgId) {
  const orgIdStr = orgId.toString();

  if (tenantConnections.has(orgIdStr)) {
    return tenantConnections.get(orgIdStr).connection;
  }

  const dbName = `org_${orgIdStr}`;
  const connectionUri = config.mongoURI.replace(
    new RegExp(`/${config.baseDBName}(?=[/?]|$)`), 
    `/${dbName}`
  );

  const connection = mongoose.createConnection(connectionUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: config.maxTenantConnections || 5,
    socketTimeoutMS: config.connectionTimeout || 30000
  });

  const tenantConn = new TenantConnection(connection, orgIdStr);

  try {
    await new Promise((resolve, reject) => {
      connection.on('connected', resolve);
      connection.on('error', reject);
      setTimeout(() => reject(new Error('Connection timeout')), 10000);
    });

    await tenantConn.initializeModels();
    tenantConnections.set(orgIdStr, tenantConn);
    return connection;
  } catch (error) {
    await tenantConn.close();
    throw error;
  }
}
async function closeAllConnections() {
  const closing = [];
  for (const tenantConn of tenantConnections.values()) {
    closing.push(tenantConn.close());
  }
  await Promise.allSettled(closing);
}

module.exports = {
  getOrganizationDB,
  closeAllConnections,
  getActiveTenantCount: () => tenantConnections.size,
};