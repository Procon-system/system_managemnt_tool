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
     // SOFT DELETE
     isDeleted: { type: Boolean, default: false },
     deletedAt: { type: Date },
     deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
 
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

  // resourceTypeSchema.index({ organization: 1,name: 1 }, { unique: true });
  // resourceTypeSchema.index({ isSystem: 1 });
 
  resourceTypeSchema.index(
  { organization: 1, name: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
resourceTypeSchema.index({ organization: 1, isDeleted: 1 });
resourceTypeSchema.index({ isSystem: 1 });

resourceTypeSchema.pre('findOneAndDelete', function () {
  throw new Error('Hard deletes disabled. Use soft delete.');
});
  return connection.model('ResourceType', resourceTypeSchema);
};