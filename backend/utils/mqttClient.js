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
  mqttClient.subscribe('tasks/update_monitor/+', { qos: 1 });
  mqttClient.subscribe('tasks/newMonitor/+', { qos: 1 })
  console.log(' Mqtt Subscribed to tasks/update/+ and tasks/new/+');
});

mqttClient.on('error', err => {
  console.error('⚠️ MQTT connection error:', err);
});

mqttClient.on('close', () => {
  console.log('🔌 MQTT client disconnected');
});
mqttClient.on('message', async (topic, msgBuf) => {
  try {
    const [topicPrefix, action, orgId] = topic.split('/');
    const msg = JSON.parse(msgBuf.toString());
    
    if (msg.origin !== 'monitor') return;

    console.log(`📨 MQTT msg [${action}] for org ${orgId}:`, msg);

    // ———————— Common setup for any action ————————
    const tenantDB = await getOrganizationDB(orgId);
    const tenantModels = {
      Task:            tenantDB.models.get('Task'),
      Resource:        tenantDB.models.get('Resource'),
      ResourceBooking: tenantDB.models.get('ResourceBooking'),
      Notification:    tenantDB.models.get('Notification'),
    };
    const tenantCache = getTenantRedis(orgId);

    // A mock response object for logging controller output
    const res = {
      status: code => ({
        json: data => console.log(`[MQTT][${action}Task] Response ${code}:`, data.message || data)
      })
    };
    
    let req;

    // ———————— Route to the correct logic based on topic ————————
    switch (action) {
      case 'update_monitor':
        req = {
          params: { id: msg._id },
         
          body: { status: msg.status},
          files: [],
          tenantDB,
          tenantModels,
          tenantCache,
          user: {
            org_id: orgId,
            first_name: msg.updatedByName || 'Monitor'
          },
          _fromMqttMonitor: true,
          _mqttAction: 'update_monitor',
          _mqttTopic: topic,
        };
        await taskController.updateTask(req, res);
        break;

      case 'newMonitor':
      
        req = {
          params: {}, 
          body: msg,
          files: [],
          tenantDB,
          tenantModels,
          tenantCache,
          user: {
            org_id: orgId,
            _id: msg.createdBy || msg.created_by ,
            first_name: msg.createdByName || 'Monitor'
          },
          // mark source
      _fromMqttMonitor: true,
      _mqttAction: 'newMonitor',
      _mqttTopic: topic,
        };
        if (!req.user._id) {
          console.error(`❌ Cannot create task via MQTT: Missing 'createdBy' in payload and no fallback SYSTEM_USER_ID is set. Topic: ${topic}`);
          return; 
      }
        await taskController.createTask(req, res);
        break;

      default:
        console.warn(`🤷‍♀️ Unhandled MQTT action '${action}' on topic: ${topic}`);
    }

  } catch (err) {
    console.error(`❌ Error in MQTT handler for topic "${topic}":`, err);
  }
});
module.exports = { mqttClient, opts };