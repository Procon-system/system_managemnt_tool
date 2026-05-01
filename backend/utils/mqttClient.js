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

  // Existing task topics
  mqttClient.subscribe('tasks/update_monitor/+', { qos: 1 });
  mqttClient.subscribe('tasks/newMonitor/+', { qos: 1 })
   // Sensor topics:
  // <orgId>/newSensorCreated          – device registration
  // <orgId>/<deviceId>/newTag         – new tag on existing device
  // <orgId>/<deviceId>/<tagId>        – time-series reading
  mqttClient.subscribe('+/newSensorCreated', { qos: 1 });
  mqttClient.subscribe('+/+/newTag',         { qos: 1 });
  mqttClient.subscribe('+/+/+',             { qos: 1 });

  console.log('📡 MQTT subscribed to task and sensor topics');
  console.log(' Mqtt Subscribed to tasks/update/+ and tasks/new/+');
});

mqttClient.on('error', err => {
  console.error('⚠️ MQTT connection error:', err);
});

mqttClient.on('close', () => {
  console.log('🔌 MQTT client disconnected');
});

// ─── Sensor Helpers ───────────────────────────────────────────────────────────

async function getSensorModels(orgId) {
  const tenantDB = await getOrganizationDB(orgId);
  return {
    Sensor:     tenantDB.models.get('Sensor'),
    SensorData: tenantDB.models.get('SensorData'),
    tenantDB,
  };
}

async function handleNewSensorCreated(orgId, payload) {
  const { device_id, device, device_name, source, tags = [] } = payload;
  const deviceId = device_id || device;
  if (!deviceId) return console.warn('⚠️ [MQTT sensor] Missing device_id in newSensorCreated payload');

  const { Sensor } = await getSensorModels(orgId);
  if (!Sensor) return console.error('❌ [MQTT sensor] Sensor model not available for org', orgId);

  await Sensor.findOneAndUpdate(
    { device_id: deviceId },
    {
      $set:      { device_name: device_name || deviceId, source: source || 'fuxa' },
      $addToSet: { tags: { $each: tags } },
    },
    { upsert: true, new: true }
  );
  console.log(`✅ [MQTT sensor] Upserted sensor "${deviceId}" for org ${orgId}`);
}

async function handleNewTag(orgId, deviceId, payload) {
  const { tag_id, tag_name } = payload;
  if (!tag_id) return console.warn('⚠️ [MQTT sensor] Missing tag_id in newTag payload');

  const { Sensor } = await getSensorModels(orgId);
  if (!Sensor) return console.error('❌ [MQTT sensor] Sensor model not available for org', orgId);

  await Sensor.findOneAndUpdate(
    { device_id: deviceId },
    { $addToSet: { tags: { tag_id, tag_name: tag_name || tag_id } } },
    { upsert: true }
  );
  console.log(`✅ [MQTT sensor] Added tag "${tag_id}" to sensor "${deviceId}" for org ${orgId}`);
}

async function handleTagReading(orgId, deviceId, tagId, payload) {
  const { device_name, tag_name, value, timestamp, source } = payload;
  if (value === undefined || value === null) return;

  const { SensorData } = await getSensorModels(orgId);
  if (!SensorData) return console.error('❌ [MQTT sensor] SensorData model not available for org', orgId);

  const ts = timestamp ? new Date(Number(timestamp)) : new Date();
  await SensorData.create({
    device_id:   deviceId,
    device_name: device_name || deviceId,
    tag_id:      tagId,
    tag_name:    tag_name || tagId,
    value:       Number(value),
    timestamp:   ts,
    source:      source || 'fuxa',
  });
}

// ─── Main Message Handler ─────────────────────────────────────────────────────

mqttClient.on('message', async (topic, msgBuf) => {
  try {
    const parts = topic.split('/');
    const msg = JSON.parse(msgBuf.toString());

    // ── Task topics (3-part: tasks/action/orgId) ──────────────────────────────
    if (parts[0] === 'tasks' && parts.length === 3) {
      const [, action, orgId] = parts;
      if (msg.origin !== 'monitor') return;

      console.log(`📨 MQTT msg [${action}] for org ${orgId}:`, msg);

      // ———————— Common setup for task actions ————————
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

      // ———————— Route to the correct logic based on task action ————————
      switch (action) {
        case 'update_monitor':
          req = {
            params: { id: msg._id },
            body: { status: msg.status },
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
              _id: msg.createdBy || msg.created_by,
              first_name: msg.createdByName || 'Monitor'
            },
            _fromMqttMonitor: true,
            _mqttAction: 'newMonitor',
            _mqttTopic: topic,
          };
          if (!req.user._id) {
            console.error(`❌ Cannot create task via MQTT: Missing 'createdBy'. Topic: ${topic}`);
            return;
          }
          await taskController.createTask(req, res);
          break;

        default:
          console.warn(`🤷 Unhandled MQTT task action '${action}' on topic: ${topic}`);
      }
      return;
    }

    // ── Sensor topics ─────────────────────────────────────────────────────────

    // <orgId>/newSensorCreated  (2 parts)
    if (parts.length === 2 && parts[1] === 'newSensorCreated') {
      const [orgId] = parts;
      return await handleNewSensorCreated(orgId, msg);
    }

    // <orgId>/<deviceId>/newTag  (3 parts, last = newTag)
    if (parts.length === 3 && parts[2] === 'newTag') {
      const [orgId, deviceId] = parts;
      return await handleNewTag(orgId, deviceId, msg);
    }

    // <orgId>/<deviceId>/<tagId>  (3 parts, tag reading)
    if (parts.length === 3 && parts[2] !== 'newTag') {
      const [orgId, deviceId, tagId] = parts;
      return await handleTagReading(orgId, deviceId, tagId, msg);
    }

  } catch (err) {
    console.error(`❌ Error in MQTT handler for topic "${topic}":`, err);
  }
});

module.exports = { mqttClient, opts };