const mongoose = require('mongoose');

const TenantUserSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  userIdInTenantDB: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  access_level: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

TenantUserSchema.index({ email: 1, tenantId: 1 }, { unique: true });

module.exports = mongoose.model('TenantUser', TenantUserSchema);
