// models/Role.js
const mongoose = require('mongoose');

module.exports = (connection) => {
  if (connection.models['Role']) {
    return connection.models['Role'];
  }

  const roleSchema = new mongoose.Schema({
    name: {
      type: String,
      required: [true, 'Role name is required.'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    permissions: {
      type: mongoose.Schema.Types.Map,
      of: [String],
      default: {}
    }
  }, { timestamps: true });

  roleSchema.index({ name: 1 });

  return connection.model('Role', roleSchema);
};