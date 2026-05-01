const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  device_id:   { type: String, required: true },
  device_name: { type: String },
  tag_id:      { type: String, required: true },
  tag_name:    { type: String },
  value:       { type: Number, required: true },
  timestamp:   { type: Date, required: true },
  source:      { type: String, default: 'fuxa' },
}, {
  // No timestamps here – the sensor timestamp IS the time
  timeseries: {
    timeField: 'timestamp',
    metaField:  'device_id',
    granularity: 'seconds',
  },
  expireAfterSeconds: 60 * 60 * 24 * 90, // auto-drop after 90 days
});

// Compound index for fast tag queries
sensorDataSchema.index({ device_id: 1, tag_id: 1, timestamp: -1 });

module.exports = (connection) =>
  connection.model('SensorData', sensorDataSchema);
