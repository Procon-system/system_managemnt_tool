const mongoose = require('mongoose');
const resourceSchema = new mongoose.Schema({
  type: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResourceType',
    required: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  displayName: {
    type: String,
    required: true
  },
  fields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  status: String,
  tags: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { 
  timestamps: true,
  toObject: { virtuals: true },
  toJSON: { virtuals: true }
});

const Resource = mongoose.model('Resource', resourceSchema);
module.exports = Resource;