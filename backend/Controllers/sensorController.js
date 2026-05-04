const asyncHandler = require('../utils/asyncHandler');

function cleanString(v, fallback = '') {
  if (v === undefined || v === null) return fallback;
  return String(v).trim();
}

function toNumberOrNull(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

// POST /api/sensors
// Manager creates a sensor/device manually
const createSensor = asyncHandler(async (req, res) => {
  console.log("req.tenantModels", req.tenantModels)
  const Sensor = req.tenantModels.Sensor;
  if (!Sensor) return res.status(503).json({ error: 'Sensor model not available' });

  const {
    device_id,
    device_name,
    device_actual_name,
    source = 'manual',
    location = '',
    description = '',
  } = req.body;

  const finalDeviceId = cleanString(device_id || device_name);

  if (!finalDeviceId) {
    return res.status(400).json({
      success: false,
      error: 'device_id is required. It must match the MQTT device id.',
    });
  }

  const sensor = await Sensor.findOneAndUpdate(
    { device_id: finalDeviceId },
    {
      $set: {
        device_id: finalDeviceId,
        device_name: cleanString(device_name, finalDeviceId),
        device_actual_name: cleanString(device_actual_name, finalDeviceId),
        source,
        location,
        description,
        last_seen_at: new Date(),
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

  res.status(201).json({ success: true, data: sensor });
});

// PUT /api/sensors/:deviceId
const updateSensor = asyncHandler(async (req, res) => {
  const Sensor = req.tenantModels.Sensor;
  if (!Sensor) return res.status(503).json({ error: 'Sensor model not available' });

  const { deviceId } = req.params;

  const update = {};
  const allowed = [
    'device_name',
    'device_actual_name',
    'source',
    'location',
    'description',
  ];

  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }

  const sensor = await Sensor.findOneAndUpdate(
    { device_id: deviceId },
    { $set: update },
    { new: true }
  );

  if (!sensor) {
    return res.status(404).json({ success: false, error: 'Sensor not found' });
  }

  res.json({ success: true, data: sensor });
});

// POST /api/sensors/:deviceId/tags
// Manager adds a tag to an existing sensor
const addTagToSensor = asyncHandler(async (req, res) => {
  const Sensor = req.tenantModels.Sensor;
  if (!Sensor) return res.status(503).json({ error: 'Sensor model not available' });

  const { deviceId } = req.params;

  const {
    tag_id,
    tag_name,
    tag_actual_name,
    sensor_display_name,
    sensor_type = '',
    sensor_type_label = '',
    unit = '',
    alert_min,
    alert_max,
    alert_enabled = false,
    show_on_dashboard = true,
  } = req.body;

  const finalTagId = cleanString(tag_id || tag_name);

  if (!finalTagId) {
    return res.status(400).json({
      success: false,
      error: 'tag_id is required. It must match the MQTT tag id.',
    });
  }

  const tag = {
    tag_id: finalTagId,
    tag_name: cleanString(tag_name, finalTagId),
    tag_actual_name: cleanString(
      tag_actual_name || sensor_display_name,
      finalTagId
    ),
    sensor_type,
    sensor_type_label,
    unit,
    source: 'manual',
    alert_min: toNumberOrNull(alert_min),
    alert_max: toNumberOrNull(alert_max),
    alert_enabled: Boolean(alert_enabled),
    show_on_dashboard: Boolean(show_on_dashboard),
    last_value: null,
    last_seen_at: null,
  };

  const existing = await Sensor.findOne({
    device_id: deviceId,
    'tags.tag_id': finalTagId,
  }).lean();

  if (existing) {
    return res.status(409).json({
      success: false,
      error: 'Tag already exists for this sensor',
    });
  }

  const sensor = await Sensor.findOneAndUpdate(
    { device_id: deviceId },
    {
      $push: { tags: tag },
      $set: { last_seen_at: new Date() },
    },
    {
      new: true,
    }
  );

  if (!sensor) {
    return res.status(404).json({ success: false, error: 'Sensor not found' });
  }

  res.status(201).json({ success: true, data: sensor });
});

// PUT /api/sensors/:deviceId/tags/:tagId
const updateTag = asyncHandler(async (req, res) => {
  const Sensor = req.tenantModels.Sensor;
  if (!Sensor) return res.status(503).json({ error: 'Sensor model not available' });

  const { deviceId, tagId } = req.params;

  const set = {};

  const map = {
    tag_name: 'tags.$.tag_name',
    tag_actual_name: 'tags.$.tag_actual_name',
    sensor_type: 'tags.$.sensor_type',
    sensor_type_label: 'tags.$.sensor_type_label',
    unit: 'tags.$.unit',
    alert_enabled: 'tags.$.alert_enabled',
    alert_min: 'tags.$.alert_min',
    alert_max: 'tags.$.alert_max',
    show_on_dashboard: 'tags.$.show_on_dashboard',
  };

  for (const [bodyKey, dbKey] of Object.entries(map)) {
    if (req.body[bodyKey] !== undefined) {
      if (bodyKey === 'alert_min' || bodyKey === 'alert_max') {
        set[dbKey] = toNumberOrNull(req.body[bodyKey]);
      } else {
        set[dbKey] = req.body[bodyKey];
      }
    }
  }

  const sensor = await Sensor.findOneAndUpdate(
    {
      device_id: deviceId,
      'tags.tag_id': tagId,
    },
    {
      $set: set,
    },
    {
      new: true,
    }
  );

  if (!sensor) {
    return res.status(404).json({ success: false, error: 'Sensor or tag not found' });
  }

  res.json({ success: true, data: sensor });
});

// GET /api/sensors
const getSensors = asyncHandler(async (req, res) => {
  const Sensor = req.tenantModels.Sensor;
  if (!Sensor) return res.status(503).json({ error: 'Sensor model not available' });

  const sensors = await Sensor.find({}).sort({ device_actual_name: 1, device_name: 1 }).lean();

  res.json({ success: true, data: sensors });
});

// GET /api/sensors/:deviceId/tags
const getTags = asyncHandler(async (req, res) => {
  const Sensor = req.tenantModels.Sensor;
  if (!Sensor) return res.status(503).json({ error: 'Sensor model not available' });

  const sensor = await Sensor.findOne({ device_id: req.params.deviceId }).lean();
  if (!sensor) return res.status(404).json({ error: 'Sensor not found' });

  res.json({ success: true, data: sensor.tags || [] });
});

// GET /api/sensors/:deviceId/tags/:tagId/data?from=&to=&limit=
const getTagData = asyncHandler(async (req, res) => {
  const SensorData = req.tenantModels.SensorData;
  if (!SensorData) return res.status(503).json({ error: 'SensorData model not available' });

  const { deviceId, tagId } = req.params;
  const { from, to, limit = 500 } = req.query;

  const filter = {
    device_id: deviceId,
    tag_id: tagId,
  };

  if (from || to) {
    filter.timestamp = {};
    if (from) filter.timestamp.$gte = new Date(Number(from));
    if (to) filter.timestamp.$lte = new Date(Number(to));
  }

  const data = await SensorData.find(filter)
    .sort({ timestamp: 1 })
    .limit(Math.min(Number(limit) || 500, 5000))
    .lean();

  res.json({ success: true, data });
});

// GET /api/sensors/:deviceId/tags/:tagId/latest
const getLatestTagValue = asyncHandler(async (req, res) => {
  const SensorData = req.tenantModels.SensorData;
  if (!SensorData) return res.status(503).json({ error: 'SensorData model not available' });

  const { deviceId, tagId } = req.params;

  const doc = await SensorData.findOne({
    device_id: deviceId,
    tag_id: tagId,
  })
    .sort({ timestamp: -1 })
    .lean();

  res.json({ success: true, data: doc || null });
});

// GET /api/sensors/all-latest
const getAllLatest = asyncHandler(async (req, res) => {
  const Sensor = req.tenantModels.Sensor;
  const SensorData = req.tenantModels.SensorData;

  if (!Sensor || !SensorData) {
    return res.status(503).json({ error: 'Sensor models not available' });
  }

  const sensors = await Sensor.find({}).lean();
  const results = [];

  for (const sensor of sensors) {
    for (const tag of sensor.tags || []) {
      const latest = await SensorData.findOne({
        device_id: sensor.device_id,
        tag_id: tag.tag_id,
      })
        .sort({ timestamp: -1 })
        .lean();

      results.push({
        device_id: sensor.device_id,
        device_name: sensor.device_name,
        device_actual_name: sensor.device_actual_name,

        tag_id: tag.tag_id,
        tag_name: tag.tag_name,
        tag_actual_name: tag.tag_actual_name,

        sensor_type: tag.sensor_type,
        unit: tag.unit,

        alert_min: tag.alert_min,
        alert_max: tag.alert_max,
        alert_enabled: tag.alert_enabled,

        latest,
      });
    }
  }

  res.json({ success: true, data: results });
});

module.exports = {
  createSensor,
  addTagToSensor,
  updateSensor,
  updateTag,
  getSensors,
  getTags,
  getTagData,
  getLatestTagValue,
  getAllLatest,
};