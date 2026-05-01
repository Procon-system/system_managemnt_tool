// models/ClientAsset.js
const mongoose = require('mongoose');

module.exports = (connection) => {
  if (connection.models['ClientAsset']) return connection.models['ClientAsset'];

  const ClientAssetSchema = new mongoose.Schema({
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },

    // Core business fields
    clientName: { type: String, required: true, trim: true },
    taskName:   { type: String, required: true, trim: true },
    reason:     { type: String, default: '' },

    startDate:  { type: Date, required: true },
    endDate:    { type: Date, required: true },

    travelMode: { type: String, enum: ['domestic','international'], default: 'domestic' },

    settlementType: { type: String, enum: ['flat_rate','on_receipt'], required: true },
    currency:       { type: String, default: 'USD' },
    perDiemRate:    { type: Number, min: 0 },   // required only if flat_rate

    estimatedAmount: { type: Number, min: 0 },
    costCenter:      { type: String, trim: true },

    // You kept this; leave it as a manual/derived total as you wish
    totalAmount:   { type: Number, min: 0, default: 0 },

    // Soft delete (match your conventions)
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Audit
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }, {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => { delete ret.__v; return ret; }
    }
  });

  // Validation (simplified)
  ClientAssetSchema.pre('validate', function(next) {
    if (this.endDate < this.startDate) {
      return next(new Error('endDate must be after startDate'));
    }
    if (this.settlementType === 'flat_rate' && (this.perDiemRate == null)) {
      return next(new Error('perDiemRate is required for flat_rate'));
    }
    next();
  });

  // Indexes
  ClientAssetSchema.index({ organization: 1, clientName: 1, startDate: 1 });
  ClientAssetSchema.index({ organization: 1, isDeleted: 1 });

  return connection.model('ClientAsset', ClientAssetSchema);
};
