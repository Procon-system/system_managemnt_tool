const mongoose = require('mongoose');
const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  industry: String,
  settings: {
    taskSettings: {
      defaultStatuses: [String],
      defaultPriorities: [String],
      customWorkflows: mongoose.Schema.Types.Mixed
    },
    uiPreferences: mongoose.Schema.Types.Mixed
  },
  subscription: {
    plan: String,
    expiresAt: Date,
    features: [String]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Organization = mongoose.model('Organization', organizationSchema);
module.exports= Organization;