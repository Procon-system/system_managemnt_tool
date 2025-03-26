
const mongoose = require('mongoose');
const resourceTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  icon: String,
  color: String,
  fieldDefinitions: [{
    fieldName: {
      type: String,
      required: true
    },
    displayName: String,
    fieldType: {
      type: String,
      enum: ['string', 'number', 'boolean', 'date', 'array', 'object', 'reference'],
      required: true
    },
    referenceType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ResourceType'
    },
    required: {
      type: Boolean,
      default: false
    },
    defaultValue: mongoose.Schema.Types.Mixed,
    validation: mongoose.Schema.Types.Mixed
  }],
  isSystem: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ResourceType = mongoose.model('ResourceType', resourceTypeSchema);