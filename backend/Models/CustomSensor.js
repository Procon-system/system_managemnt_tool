const mongoose = require('mongoose');

const customSensorSchema = new mongoose.Schema(
  {
    custom_name: {
      type: String,
      required: true,
      trim: true,
    },

    source_device_id: {
      type: String,
      required: true,
      index: true,
    },

    source_device_name: {
      type: String,
      default: '',
    },

    source_device_actual_name: {
      type: String,
      default: '',
    },

    source_tag_id: {
      type: String,
      required: true,
      index: true,
    },

    source_tag_name: {
      type: String,
      default: '',
    },

    source_tag_actual_name: {
      type: String,
      default: '',
    },

    sensor_type: {
      type: String,
      default: '',
    },

    unit: {
      type: String,
      default: '',
    },

    display_unit: {
      type: String,
      default: '',
    },

    // Notification thresholds
    notification_enabled: {
      type: Boolean,
      default: true,
    },

    notification_min: {
      type: Number,
      default: null,
    },

    notification_max: {
      type: Number,
      default: null,
    },

    // Task creation thresholds
    task_creation_enabled: {
      type: Boolean,
      default: false,
    },

    task_low_low: {
      type: Number,
      default: null,
    },

    task_high_high: {
      type: Number,
      default: null,
    },

    show_on_dashboard: {
      type: Boolean,
      default: true,
    },

    display_order: {
      type: Number,
      default: 0,
    },

    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

customSensorSchema.index({ source_device_id: 1, source_tag_id: 1 });
customSensorSchema.index({ custom_name: 1 });

module.exports = function initCustomSensorModel(connection) {
  return connection.models.CustomSensor ||
    connection.model('CustomSensor', customSensorSchema);
};