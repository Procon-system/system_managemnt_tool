const asyncHandler = require('../utils/asyncHandler');

// GET /api/sensors
const getSensors = asyncHandler(async (req, res) => {
  const Sensor = req.tenantModels.Sensor;
  if (!Sensor) return res.status(503).json({ error: 'Sensor model not available' });

  const sensors = await Sensor.find({}).sort({ device_name: 1 }).lean();
  res.json({ success: true, data: sensors });
});

// GET /api/sensors/:deviceId/tags
const getTags = asyncHandler(async (req, res) => {
  const Sensor = req.tenantModels.Sensor;
  if (!Sensor) return res.status(503).json({ error: 'Sensor model not available' });

  const sensor = await Sensor.findOne({ device_id: req.params.deviceId }).lean();
  if (!sensor) return res.status(404).json({ error: 'Sensor not found' });

  res.json({ success: true, data: sensor.tags });
});

// GET /api/sensors/:deviceId/tags/:tagId/data?from=&to=&limit=
const getTagData = asyncHandler(async (req, res) => {
  const SensorData = req.tenantModels.SensorData;
  if (!SensorData) return res.status(503).json({ error: 'SensorData model not available' });

  const { deviceId, tagId } = req.params;
  const { from, to, limit = 500 } = req.query;

  const filter = { device_id: deviceId, tag_id: tagId };
  if (from || to) {
    filter.timestamp = {};
    if (from) filter.timestamp.$gte = new Date(Number(from));
    if (to)   filter.timestamp.$lte = new Date(Number(to));
  }

  const data = await SensorData.find(filter)
    .sort({ timestamp: 1 })
    .limit(Number(limit))
    .lean();

  res.json({ success: true, data });
});

// GET /api/sensors/:deviceId/tags/:tagId/latest
const getLatestTagValue = asyncHandler(async (req, res) => {
  const SensorData = req.tenantModels.SensorData;
  if (!SensorData) return res.status(503).json({ error: 'SensorData model not available' });

  const { deviceId, tagId } = req.params;
  const doc = await SensorData.findOne({ device_id: deviceId, tag_id: tagId })
    .sort({ timestamp: -1 })
    .lean();

  res.json({ success: true, data: doc || null });
});

// GET /api/sensors/all-latest  (for Trend page cards)
const getAllLatest = asyncHandler(async (req, res) => {
  const Sensor    = req.tenantModels.Sensor;
  const SensorData = req.tenantModels.SensorData;
  if (!Sensor || !SensorData)
    return res.status(503).json({ error: 'Sensor models not available' });

  const sensors = await Sensor.find({}).lean();
  const results = [];

  for (const sensor of sensors) {
    for (const tag of sensor.tags) {
      const latest = await SensorData.findOne({
        device_id: sensor.device_id,
        tag_id: tag.tag_id,
      }).sort({ timestamp: -1 }).lean();

      results.push({
        device_id:   sensor.device_id,
        device_name: sensor.device_name,
        tag_id:      tag.tag_id,
        tag_name:    tag.tag_name,
        latest,
      });
    }
  }

  res.json({ success: true, data: results });
});

module.exports = { getSensors, getTags, getTagData, getLatestTagValue, getAllLatest };
