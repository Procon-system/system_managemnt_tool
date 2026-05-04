// Models/SensorData.js
const mongoose = require('mongoose');

const COLLECTION_NAME = 'sensordatas';

const sensorDataSchema = new mongoose.Schema(
  {
    device_id: {
      type: String,
      required: true,
      index: true,
    },

    device_name: {
      type: String,
      default: '',
    },

    device_actual_name: {
      type: String,
      default: '',
    },

    tag_id: {
      type: String,
      required: true,
      index: true,
    },

    tag_name: {
      type: String,
      default: '',
    },

    tag_actual_name: {
      type: String,
      default: '',
    },

    value: {
      type: Number,
      required: true,
    },

    unit: {
      type: String,
      default: '',
    },

    sensor_type: {
      type: String,
      default: '',
    },

    timestamp: {
      type: Date,
      required: true,
      index: true,
    },

    source_timestamp: {
      type: Date,
      default: null,
    },

    received_at: {
      type: Date,
      default: Date.now,
      index: true,
    },

    source: {
      type: String,
      default: 'fuxa',
    },

    metadata: {
      device_id: {
        type: String,
        default: '',
      },
      tag_id: {
        type: String,
        default: '',
      },
      source: {
        type: String,
        default: 'fuxa',
      },
    },

    raw_payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
    timeseries: {
      timeField: 'timestamp',
      metaField: 'metadata',
      granularity: 'seconds',
    },
  }
);

sensorDataSchema.index({ device_id: 1, tag_id: 1, timestamp: -1 });

module.exports = function initSensorDataModel(connection) {
  return connection.models.SensorData ||
    connection.model('SensorData', sensorDataSchema, COLLECTION_NAME);
};