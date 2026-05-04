// src/mqttClient.js
const mqtt = require('mqtt');
const { getOrganizationDB } = require('../config/dbManager');
const taskController = require('../Controllers/taskControllers');       // your HTTP controller
const { getTenantRedis } = require('../utils/tenantRedis');
const sensorMqttService = require('../Services/sensorMqttService');
const url = 'mqtt://mqtt.tasknitter.com';
const ORG_ID = process.env.DEFAULT_ORG_ID || '69e9f78b199e523b543ad39e';

// || process.env.MQTT_URL
const opts = {
  clientId: `api-server-${Math.random().toString(16).substr(2, 8)}`,
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
  mqttClient.subscribe('+/newSensorCreated', { qos: 1 }, err => {
    if (err) console.error('❌ Failed to subscribe +/newSensorCreated:', err);
    else console.log('✅ Subscribed to +/newSensorCreated');
  });

  mqttClient.subscribe('+/+/newTag', { qos: 1 }, err => {
    if (err) console.error('❌ Failed to subscribe +/+/newTag:', err);
    else console.log('✅ Subscribed to +/+/newTag');
  });

  mqttClient.subscribe('+/+/+', { qos: 1 }, err => {
    if (err) console.error('❌ Failed to subscribe +/+/+:', err);
    else console.log('✅ Subscribed to +/+/+ sensor readings');
  });
  console.log('📡 MQTT subscribed to task and sensor topics');
  console.log(' Mqtt Subscribed to tasks/update/+ and tasks/new/+');
});


mqttClient.on('error', err => {
  console.error('⚠️ MQTT connection error:', err);
});

mqttClient.on('close', () => {
  console.log('🔌 MQTT client disconnected');
});

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
        Task: tenantDB.models.get('Task'),
        Resource: tenantDB.models.get('Resource'),
        ResourceBooking: tenantDB.models.get('ResourceBooking'),
        Notification: tenantDB.models.get('Notification'),
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
    // ── Sensor topics ─────────────────────────────────────────────────────────

    const rawPayload = msgBuf.toString();

    console.log('📩 [MQTT RAW SENSOR CHECK]', {
      topic,
      parts,
      partsLength: parts.length,
      rawPayload,
    });

    const hasValue = msg.value !== undefined && msg.value !== null;
    const hasDevice = !!(msg.device || msg.device_name || msg.device_id);
    const hasTag = !!(msg.tag_id || msg.tag_name);

    console.log('🧭 [MQTT SENSOR DEBUG]', {
      topic,
      hasValue,
      hasDevice,
      hasTag,
      value: msg.value,
      device: msg.device,
      device_name: msg.device_name,
      tag_id: msg.tag_id,
      tag_name: msg.tag_name,
      payloadKeys: Object.keys(msg),
    });

    // 1. Full snapshot payload: { devices: [...] }
    if (Array.isArray(msg.devices)) {
      const orgId = msg.settings?.org_id || parts[0];

      console.log('📦 [MQTT SNAPSHOT ROUTE]', {
        orgId,
        devices_count: msg.devices.length,
      });

      await sensorMqttService.saveSensorSnapshotFromMqtt(orgId, msg);
      return;
    }

    // 2. Live reading payload.
    // IMPORTANT: Put this BEFORE newTag/newSensorCreated fallback.
    // If a payload has value, we save it to SensorData no matter the exact topic shape.
    if (hasValue && hasDevice && hasTag) {
      const orgId = msg.org_id || msg.organization_id || parts[0];
      const deviceId = msg.device || msg.device_name || msg.device_id;
      const tagId = msg.tag_id || msg.tag_name;

      console.log('📈 [MQTT READING VALUE ROUTE]', {
        orgId,
        deviceId,
        tagId,
        value: msg.value,
        topic,
      });

      await sensorMqttService.saveSensorReadingFromMqtt(orgId, deviceId, tagId, msg);
      return;
    }

    // 3. Device created
    if (topic.endsWith('/newSensorCreated')) {
      const orgId = parts[0];

      console.log('🆕 [MQTT DEVICE ROUTE]', {
        orgId,
        device: msg.device,
        device_name: msg.device_name,
      });

      await sensorMqttService.saveSensorDeviceFromMqtt(orgId, msg);
      return;
    }

    // 4. New tag created
    if (topic.endsWith('/newTag')) {
      const orgId = parts[0];
      const deviceId = msg.device || msg.device_name || parts[parts.length - 2];

      console.log('🏷️ [MQTT TAG ROUTE]', {
        orgId,
        deviceId,
        tag_id: msg.tag_id,
      });

      await sensorMqttService.saveSensorTagFromMqtt(orgId, deviceId, msg);
      return;
    }

    // 5. Strict 3-part reading fallback
    if (parts.length === 3 && parts[2] !== 'newTag') {
      const [orgId, deviceId, tagId] = parts;

      console.log('📈 [MQTT STRICT 3-PART READING ROUTE]', {
        orgId,
        deviceId,
        tagId,
        value: msg.value,
      });

      await sensorMqttService.saveSensorReadingFromMqtt(orgId, deviceId, tagId, msg);
      return;
    }

    console.warn('⚠️ [MQTT UNHANDLED SENSOR TOPIC]', {
      topic,
      parts,
      msg,
    });
  } catch (err) {
    console.error(`❌ Error in MQTT handler for topic "${topic}":`, err);
  }
});

module.exports = { mqttClient, opts };