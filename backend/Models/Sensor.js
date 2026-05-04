// const mongoose = require('mongoose');

// const tagSchema = new mongoose.Schema({
//   tag_id:   { type: String, required: true },
//   tag_name: { type: String, required: true },
// }, { _id: false });

// const sensorSchema = new mongoose.Schema({
//   device_id:   { type: String, required: true },
//   device_name: { type: String, required: true },
//   source:      { type: String, default: 'fuxa' },
//   tags:        { type: [tagSchema], default: [] },
// }, { timestamps: true });

// sensorSchema.index({ device_id: 1 }, { unique: true });

// module.exports = (connection) =>
//   connection.model('Sensor', sensorSchema);
// Models/Sensor.js
const mongoose = require('mongoose');

const sensorTagSchema = new mongoose.Schema(
  {
    tag_id: {
      type: String,
      required: true,
    },

    tag_name: {
      type: String,
      required: true,
    },

    tag_actual_name: {
      type: String,
      default: '',
    },

    sensor_type: {
      type: String,
      default: '',
    },

    sensor_type_label: {
      type: String,
      default: '',
    },

    unit: {
      type: String,
      default: '',
    },

    source: {
      type: String,
      default: 'fuxa',
    },

    last_value: {
      type: Number,
      default: null,
    },

    last_seen_at: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const sensorSchema = new mongoose.Schema(
  {
    device_id: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },

    device_name: {
      type: String,
      required: true,
    },

    device_actual_name: {
      type: String,
      default: '',
    },

    source: {
      type: String,
      default: 'fuxa',
    },

    tags: {
      type: [sensorTagSchema],
      default: [],
    },

    last_seen_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

sensorSchema.index({ device_id: 1 });
sensorSchema.index({ 'tags.tag_id': 1 });

module.exports = function initSensorModel(connection) {
  return connection.models.Sensor || connection.model('Sensor', sensorSchema);
};