const mongoose = require('mongoose');
module.exports = (connection) => {
 
  if (connection.models['ResourceType']) {
    return connection.models['ResourceType'];
  }
  const resourceTypeSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      trim: true
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true
    },
    isBlockable: {
      type: Boolean,
      default: false 
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
        enum: ['string', 'number'],
        required: true
      },
      isQuantifiable: {
        type: Boolean,
        default: false 
      },
    
      quantifiableUnit: { 
        type: String, 
        required: function() { return this.isQuantifiable; }
      },
      quantifiableCategory: { 
        type: String,
        enum: ['cost', 'time', 'capacity', 'output', 'measurement', 'other'],
        default: 'other'
      },
      referenceType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ResourceType'  // Self-reference within tenant
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
    }
  }, {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  });

  // Indexes
  resourceTypeSchema.index({ name: 1 }, { unique: true });
  resourceTypeSchema.index({ isSystem: 1 });

  return connection.model('ResourceType', resourceTypeSchema);
};