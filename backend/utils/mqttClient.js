// src/mqttClient.js
const mqtt = require('mqtt');
const { getOrganizationDB } = require('../config/dbManager');
const taskController = require('../Controllers/taskControllers');       // your HTTP controller
const { getTenantRedis } = require('../utils/tenantRedis'); 
const url = process.env.MQTT_URL;

const opts = {
  clientId: `api-server-${Math.random().toString(16).substr(2,8)}`,
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 5000,
};

console.log(`🔌 Connecting to MQTT broker at ${url}`);
const mqttClient = mqtt.connect(url, opts);

mqttClient.on('connect', () => {
  console.log(`✅ Connected to ${url}`);
  // subscribe to tasks/update/<any-org-id>
  mqttClient.subscribe('tasks/update/+', { qos: 1 });
});

mqttClient.on('error', err => {
  console.error('⚠️ MQTT connection error:', err);
});

mqttClient.on('close', () => {
  console.log('🔌 MQTT client disconnected');
});

mqttClient.on('message', async (topic, msgBuf) => {
  try {
    const [, , orgId] = topic.split('/');
    const msg = JSON.parse(msgBuf.toString());
    console.log(`📨 MQTT msg for org ${orgId}:`, msg);

    if (msg.origin !== 'monitor') return;

    // ———————— Build a fake req/res just like Express ————————
    const tenantDB = await getOrganizationDB(orgId);
    const tenantModels = {
      Task:            tenantDB.models.get('Task'),
      Resource:        tenantDB.models.get('Resource'),
      ResourceBooking: tenantDB.models.get('ResourceBooking'),
      Notification:    tenantDB.models.get('Notification'),
    };

    const req = {
      params:        { id: msg._id },
      body:          { status: msg.status /* add any other fields you want to pass */ },
      files:         [],                                       // no file uploads here
      tenantDB,                                              
      tenantModels,                                          
      tenantCache:    getTenantRedis(orgId),                 // same cache you use in HTTP
      user:           { 
                       org_id: orgId, 
                       first_name: msg.updatedByName || 'Monitor' 
                     },
    };

    const res = {
      status: code => ({
        json: data => console.log(`[MQTT][updateTask] ${code}`, data)
      })
    };

    // ———————— Call your HTTP controller ————————
    await taskController.updateTask(req, res);

  } catch (err) {
    console.error('❌ Error in MQTT handler:', err);
  }
});

module.exports = { mqttClient };
