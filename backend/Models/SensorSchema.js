const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  tag_id:   { type: String, required: true },
  tag_name: { type: String, required: true },
}, { _id: false });

const sensorSchema = new mongoose.Schema({
  device_id:   { type: String, required: true },
  device_name: { type: String, required: true },
  source:      { type: String, default: 'fuxa' },
  tags:        { type: [tagSchema], default: [] },
}, { timestamps: true });

sensorSchema.index({ device_id: 1 }, { unique: true });

module.exports = (connection) =>
  connection.model('Sensor', sensorSchema);
