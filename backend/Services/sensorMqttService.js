const { getOrganizationDB } = require('../config/dbManager');

function getModel(tenantDB, modelName) {
  if (tenantDB.models?.get && typeof tenantDB.models.get === 'function') {
    return tenantDB.models.get(modelName);
  }

  return tenantDB.models?.[modelName];
}

async function getSensorModels(orgId) {
  const tenantDB = await getOrganizationDB(orgId);

  return {
    Sensor: getModel(tenantDB, 'Sensor'),
    SensorData: getModel(tenantDB, 'SensorData'),
    tenantDB,
  };
}

function unwrapPayload(rawMsg) {
  return rawMsg?.published_payload || rawMsg || {};
}

function getDeviceObject(rawMsg) {
  if (rawMsg?.device && typeof rawMsg.device === 'object') {
    return rawMsg.device;
  }

  return {};
}

function getTagObject(rawMsg) {
  if (rawMsg?.tag && typeof rawMsg.tag === 'object') {
    return rawMsg.tag;
  }

  return {};
}

function toDate(timestamp) {
  if (!timestamp) return new Date();

  const date = new Date(Number(timestamp));

  if (Number.isNaN(date.getTime())) {
    return new Date();
  }

  return date;
}

function pickReadingTimestamp(tagPayload = {}, devicePayload = {}, rootPayload = {}) {
  return (
    tagPayload.last_published_at ||
    tagPayload.timestamp ||
    devicePayload.last_published_at ||
    devicePayload.timestamp ||
    rootPayload.timestamp ||
    rootPayload.last_publish?.timestamp ||
    Date.now()
  );
}

function getDeviceId(payload, fallbackDeviceId = null) {
  return (
    payload.device_id ||
    payload.device ||
    payload.device_name ||
    fallbackDeviceId ||
    null
  );
}

function getDeviceActualName(payload, fallbackDeviceId = '') {
  return (
    payload.device_actual_name ||
    payload.device_display_name ||
    payload.device_name ||
    payload.device ||
    fallbackDeviceId ||
    ''
  );
}

function getTagId(payload, fallbackTagId = null) {
  return (
    payload.tag_id ||
    payload.tag_name ||
    fallbackTagId ||
    null
  );
}

function getTagActualName(payload, fallbackTagId = '') {
  return (
    payload.tag_actual_name ||
    payload.sensor_display_name ||
    payload.tag_name ||
    payload.tag_id ||
    fallbackTagId ||
    ''
  );
}

function normalizeTag(tagPayload = {}, fallbackTagId = null) {
  const tagId = getTagId(tagPayload, fallbackTagId);

  if (!tagId) return null;

  const lastValue =
    tagPayload.current_value !== undefined && tagPayload.current_value !== null
      ? Number(tagPayload.current_value)
      : tagPayload.value !== undefined && tagPayload.value !== null
        ? Number(tagPayload.value)
        : null;

  return {
    tag_id: tagId,
    tag_name: tagPayload.tag_name || tagId,
    tag_actual_name: getTagActualName(tagPayload, tagId),

    sensor_type: tagPayload.sensor_type || '',
    sensor_type_label: tagPayload.sensor_type_label || '',
    unit: tagPayload.unit || '',

    source: tagPayload.source || 'fuxa',

    last_value: Number.isNaN(lastValue) ? null : lastValue,
    last_seen_at: toDate(tagPayload.last_published_at || tagPayload.timestamp),
  };
}

async function ensureSensorExists(Sensor, deviceId, payload = {}) {
  const deviceActualName = getDeviceActualName(payload, deviceId);
  const timestamp = toDate(payload.timestamp || payload.last_published_at);

  return await Sensor.findOneAndUpdate(
    { device_id: deviceId },
    {
      $set: {
        device_id: deviceId,
        device_name: payload.device_name || deviceId,
        device_actual_name: deviceActualName,
        source: payload.source || 'fuxa',
        last_seen_at: timestamp,
      },
      $setOnInsert: {
        tags: [],
      },
    },
    {
      upsert: true,
      new: true,
    }
  );
}

async function addOrUpdateTagInSensor(Sensor, deviceId, tag) {
  if (!tag?.tag_id) return null;

  const updatedExistingTag = await Sensor.findOneAndUpdate(
    {
      device_id: deviceId,
      'tags.tag_id': tag.tag_id,
    },
    {
      $set: {
        'tags.$.tag_name': tag.tag_name,
        'tags.$.tag_actual_name': tag.tag_actual_name,
        'tags.$.sensor_type': tag.sensor_type || '',
        'tags.$.sensor_type_label': tag.sensor_type_label || '',
        'tags.$.unit': tag.unit || '',
        'tags.$.source': tag.source || 'fuxa',
        'tags.$.last_value': tag.last_value,
        'tags.$.last_seen_at': tag.last_seen_at || new Date(),
      },
    },
    {
      new: true,
    }
  );

  if (updatedExistingTag) {
    return updatedExistingTag;
  }

  return await Sensor.findOneAndUpdate(
    { device_id: deviceId },
    {
      $push: {
        tags: tag,
      },
    },
    {
      new: true,
      upsert: false,
    }
  );
}

async function saveReadingToTimeSeries({
  SensorData,
  deviceId,
  deviceName,
  deviceActualName,
  tagId,
  tagName,
  tagActualName,
  value,
  unit = '',
  sensorType = '',
  timestamp,
  sourceTimestamp = null,
  source = 'fuxa',
  rawPayload = {},
}) {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    console.warn('⚠️ [Sensor MQTT Service] Invalid time-series value:', {
      deviceId,
      tagId,
      value,
    });
    return null;
  }

  const receivedAt = new Date();
  const ts = timestamp ? toDate(timestamp) : receivedAt;
  const srcTs = sourceTimestamp ? toDate(sourceTimestamp) : null;

  const doc = {
    device_id: deviceId,
    device_name: deviceName || deviceId,
    device_actual_name: deviceActualName || '',

    tag_id: tagId,
    tag_name: tagName || tagId,
    tag_actual_name: tagActualName || '',

    value: numericValue,
    unit,
    sensor_type: sensorType,

    timestamp: ts,
    source_timestamp: srcTs,
    received_at: receivedAt,

    source,
    raw_payload: rawPayload,
  };

  console.log('📝 [SensorData INSERT TRY]', {
    device_id: doc.device_id,
    tag_id: doc.tag_id,
    value: doc.value,
    timestamp: doc.timestamp,
  });

  const saved = await SensorData.create(doc);

  console.log('✅ [SensorData INSERTED]', {
    _id: saved._id,
    device_id: saved.device_id,
    tag_id: saved.tag_id,
    value: saved.value,
    timestamp: saved.timestamp,
  });

  return saved;
}

/**
 * Topic:
 * <orgId>/newSensorCreated
 *
 * Saves or updates the parent sensor device.
 */
async function saveSensorDeviceFromMqtt(orgId, rawMsg) {
  const payload = unwrapPayload(rawMsg);
  const deviceObject = getDeviceObject(rawMsg);

  const mergedPayload = {
    ...deviceObject,
    ...payload,
  };

  const deviceId = getDeviceId(mergedPayload);

  if (!deviceId) {
    console.warn('⚠️ [Sensor MQTT Service] Missing device id in newSensorCreated:', rawMsg);
    return null;
  }

  const { Sensor } = await getSensorModels(orgId);

  if (!Sensor) {
    console.error('❌ [Sensor MQTT Service] Sensor model not found for org:', orgId);
    return null;
  }

  const savedSensor = await ensureSensorExists(Sensor, deviceId, mergedPayload);

  const incomingTags = Array.isArray(mergedPayload.tags)
    ? mergedPayload.tags.map(tag => normalizeTag(tag)).filter(Boolean)
    : [];

  for (const tag of incomingTags) {
    await addOrUpdateTagInSensor(Sensor, deviceId, tag);
  }

  console.log('✅ [Sensor MQTT Service] Device saved:', {
    orgId,
    device_id: deviceId,
    device_actual_name: getDeviceActualName(mergedPayload, deviceId),
    tags_count: incomingTags.length,
  });

  return savedSensor;
}

/**
 * Topic:
 * <orgId>/<deviceId>/newTag
 *
 * Adds/updates one tag under the parent sensor.
 */
async function saveSensorTagFromMqtt(orgId, deviceIdFromTopic, rawMsg) {
  const payload = unwrapPayload(rawMsg);
  const tagObject = getTagObject(rawMsg);

  const mergedPayload = {
    ...tagObject,
    ...payload,
  };

  const deviceId = getDeviceId(mergedPayload, deviceIdFromTopic);

  if (!deviceId) {
    console.warn('⚠️ [Sensor MQTT Service] Missing device id in newTag:', rawMsg);
    return null;
  }

  const tag = normalizeTag(mergedPayload);

  if (!tag?.tag_id) {
    console.warn('⚠️ [Sensor MQTT Service] Missing tag id in newTag:', rawMsg);
    return null;
  }

  const { Sensor } = await getSensorModels(orgId);

  if (!Sensor) {
    console.error('❌ [Sensor MQTT Service] Sensor model not found for org:', orgId);
    return null;
  }

  await ensureSensorExists(Sensor, deviceId, mergedPayload);

  const savedSensor = await addOrUpdateTagInSensor(Sensor, deviceId, tag);

  console.log('✅ [Sensor MQTT Service] Tag saved under sensor:', {
    orgId,
    device_id: deviceId,
    tag_id: tag.tag_id,
    tag_actual_name: tag.tag_actual_name,
  });

  return savedSensor;
}

/**
 * Topic:
 * <orgId>/<deviceId>/<tagId>
 *
 * Saves one live sensor reading into SensorData.
 * Also updates latest value inside Sensor.tags[].
 */
async function saveSensorReadingFromMqtt(orgId, deviceIdFromTopic, tagIdFromTopic, rawMsg) {
  const payload = unwrapPayload(rawMsg);

  const deviceId = getDeviceId(payload, deviceIdFromTopic);
  const tagId = getTagId(payload, tagIdFromTopic);

  if (!deviceId) {
    console.warn('⚠️ [Sensor MQTT Service] Missing device id in reading:', rawMsg);
    return null;
  }

  if (!tagId) {
    console.warn('⚠️ [Sensor MQTT Service] Missing tag id in reading:', rawMsg);
    return null;
  }

  if (payload.value === undefined || payload.value === null) {
    console.warn('⚠️ [Sensor MQTT Service] Missing value in reading:', rawMsg);
    return null;
  }

  const { Sensor, SensorData } = await getSensorModels(orgId);

  if (!SensorData) {
    console.error('❌ [Sensor MQTT Service] SensorData model not found for org:', orgId);
    return null;
  }

 const receivedAt = new Date();
const sourceTimestamp = payload.last_published_at || payload.timestamp || null;
  
const deviceActualName = getDeviceActualName(payload, deviceId);
  const tagActualName = getTagActualName(payload, tagId);

  const savedReading = await saveReadingToTimeSeries({
  SensorData,
  deviceId,
  deviceName: payload.device_name || deviceId,
  deviceActualName,

  tagId,
  tagName: payload.tag_name || tagId,
  tagActualName,

  value: payload.value,
  unit: payload.unit || '',
  sensorType: payload.sensor_type || '',

  // Main chart time should be the receive time
  timestamp: receivedAt,

  // Keep original MQTT/FUXA time separately
  sourceTimestamp,

  source: payload.source || 'fuxa',
  rawPayload: payload,
});

  if (Sensor) {
    await ensureSensorExists(Sensor, deviceId, {
  ...payload,
  device: deviceId,
  device_name: payload.device_name || deviceId,
  device_actual_name: deviceActualName,
  timestamp: receivedAt,
});

const tag = normalizeTag(
  {
    ...payload,
    tag_id: tagId,
    tag_name: payload.tag_name || tagId,
    tag_actual_name: tagActualName,
    current_value: payload.value,
    timestamp: receivedAt,
  },
  tagId
);

    await addOrUpdateTagInSensor(Sensor, deviceId, tag);
  }

  console.log('✅ [Sensor MQTT Service] Time-series reading saved:', {
    orgId,
    device_id: deviceId,
    tag_id: tagId,
    value: payload.value,
    reading_id: savedReading?._id,
  });

  return savedReading;
}

/**
 * Snapshot payload:
 * {
 *   broadcast_enabled: true,
 *   devices: [
 *     {
 *       device: "...",
 *       device_display_name: "...",
 *       tags: [
 *         {
 *           tag_id: "...",
 *           current_value: 58.35,
 *           last_published_at: 1777756321510
 *         }
 *       ]
 *     }
 *   ]
 * }
 *
 * This is the important function for your case:
 * It loops all devices and all tags, then saves every tag value to SensorData.
 */
async function saveSensorSnapshotFromMqtt(orgId, rawMsg) {
  const devices = Array.isArray(rawMsg?.devices) ? rawMsg.devices : [];

  if (devices.length === 0) {
    console.warn('⚠️ [Sensor MQTT Service] Snapshot has no devices[]:', rawMsg);
    return null;
  }

  const { Sensor, SensorData } = await getSensorModels(orgId);

  if (!Sensor) {
    console.error('❌ [Sensor MQTT Service] Sensor model not found for org:', orgId);
    return null;
  }

  if (!SensorData) {
    console.error('❌ [Sensor MQTT Service] SensorData model not found for org:', orgId);
    return null;
  }

  const snapshotReceivedAt = new Date();

  let savedDevices = 0;
  let savedTags = 0;
  let readingsToInsert = [];

  for (const devicePayload of devices) {
    const deviceId = getDeviceId(devicePayload);

    if (!deviceId) {
      console.warn('⚠️ [Sensor MQTT Service] Skipping snapshot device without id:', devicePayload);
      continue;
    }

    await ensureSensorExists(Sensor, deviceId, {
      ...devicePayload,
      timestamp: snapshotReceivedAt,
    });

    savedDevices += 1;

    const deviceActualName = getDeviceActualName(devicePayload, deviceId);
    const tags = Array.isArray(devicePayload.tags) ? devicePayload.tags : [];

    for (const tagPayload of tags) {
      const tagId = getTagId(tagPayload);

      if (!tagId) {
        console.warn('⚠️ [Sensor MQTT Service] Skipping snapshot tag without tag_id:', tagPayload);
        continue;
      }

      const value =
        tagPayload.current_value !== undefined && tagPayload.current_value !== null
          ? tagPayload.current_value
          : tagPayload.value;

      if (value === undefined || value === null) {
        continue;
      }

      const numericValue = Number(value);

      if (Number.isNaN(numericValue)) {
        console.warn('⚠️ [Sensor MQTT Service] Skipping invalid snapshot value:', {
          deviceId,
          tagId,
          value,
        });
        continue;
      }

      const tag = normalizeTag(
        {
          ...tagPayload,
          current_value: numericValue,
          timestamp: snapshotReceivedAt,
        },
        tagId
      );

      await addOrUpdateTagInSensor(Sensor, deviceId, tag);
      savedTags += 1;

      const sourceTimestamp =
        tagPayload.last_published_at ||
        tagPayload.timestamp ||
        devicePayload.timestamp ||
        rawMsg.last_publish?.timestamp ||
        null;

      readingsToInsert.push({
        device_id: deviceId,
        device_name: tagPayload.device_name || devicePayload.device_name || deviceId,
        device_actual_name: deviceActualName,

        tag_id: tagId,
        tag_name: tagPayload.tag_name || tagId,
        tag_actual_name: getTagActualName(tagPayload, tagId),

        value: numericValue,
        unit: tagPayload.unit || '',
        sensor_type: tagPayload.sensor_type || '',

        // This is the timestamp you use for charts.
        // It changes every time this snapshot is received.
        timestamp: snapshotReceivedAt,

        // This preserves the original simulator/FUXA timestamp.
        source_timestamp: sourceTimestamp ? toDate(sourceTimestamp) : null,

        received_at: snapshotReceivedAt,
        source: tagPayload.source || devicePayload.source || 'fuxa',
        raw_payload: tagPayload,
      });
    }
  }

  let insertedReadings = 0;

  if (readingsToInsert.length > 0) {
    const inserted = await SensorData.insertMany(readingsToInsert, {
      ordered: false,
    });

    insertedReadings = inserted.length;
  }

  console.log('✅ [Sensor MQTT Service] Snapshot time-series batch saved:', {
    orgId,
    savedDevices,
    savedTags,
    insertedReadings,
    snapshot_time: snapshotReceivedAt,
  });

  return {
    savedDevices,
    savedTags,
    insertedReadings,
    snapshot_time: snapshotReceivedAt,
  };
}

module.exports = {
  saveSensorDeviceFromMqtt,
  saveSensorTagFromMqtt,
  saveSensorReadingFromMqtt,
  saveSensorSnapshotFromMqtt,
};