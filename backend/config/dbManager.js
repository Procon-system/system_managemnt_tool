
const mongoose = require('mongoose');
const config = require('./config');
const tenantConnections = new Map();
const initializedTenants = new Map();
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
        CustomSensor: require('../Models/CustomSensor'),
        User: require('../Models/UserSchema'),
        Team: require('../Models/TeamSchema'),
        Task: require('../Models/TaskSchema'),
        Resource: require('../Models/ResourceSchema'),
        ResourceType: require('../Models/ResourceTypeSchema'),
        Notification: require('../Models/NotificationSchema'),
        ResourceBooking: require('../Models/ResourceBookingSchema'),
        PushToken: require('../Models/PushTokenSchema'),
        ClientAsset: require('../Models/ClientAsset'),
        Sensor: require('../Models/Sensor'),
        SensorData: require('../Models/SensorData'),
        
      };

      for (const [modelName, initFn] of Object.entries(modelInitializers)) {
        if (typeof initFn !== 'function') {
          throw new TypeError(
            `Model initializer for ${modelName} must export a function. Check ../Models/${modelName}.js`
          );
        }

        // Important:
        // Do not return early just because some models exist.
        // Always add any missing models.
        let model = this.models.get(modelName);

        if (!model) {
          model = this.connection.models[modelName] || await initFn(this.connection);
          this.models.set(modelName, model);
        }
      }

      console.log(`✅ Tenant models initialized for org ${this.orgId}:`, [
        ...this.models.keys(),
      ]);

      // for (const [modelName, initFn] of Object.entries(modelInitializers)) {
      //   if (!this.connection.models[modelName]) {
      //     const model = initFn(this.connection);
      //     this.models.set(modelName, model);
      //   }
      // }
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

  // if (tenantConnections.has(orgIdStr)) {
  //   // ✅ Return the whole TenantConnection object
  //   return tenantConnections.get(orgIdStr);
  // }
  if (tenantConnections.has(orgIdStr)) {
    const tenantConn = tenantConnections.get(orgIdStr);

    // Important:
    // Re-run initializeModels so newly added models like CustomSensor are added.
    await tenantConn.initializeModels();

    return tenantConn;
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
      const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000);

      connection.once('connected', () => {
        clearTimeout(timeout);
        if (connection.readyState === 1) {
          resolve();
        } else {
          reject(new Error('Connection is not fully ready'));
        }
      });

      connection.once('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    await tenantConn.initializeModels();
    tenantConnections.set(orgIdStr, tenantConn);
    // ✅ Return full TenantConnection instance
    return tenantConn;

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