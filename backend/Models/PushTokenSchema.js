const mongoose = require('mongoose');

module.exports = (connection) => {
  
  if (connection.models.PushToken) {
    return connection.models.PushToken;
  }

  const PushTokenSchema = new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
      },
      organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true,
      },
      token: {
        type: String,
        required: true,
        unique: true,
        trim: true,
      },
      platform: {
        type: String,
        enum: ['ios', 'android', 'web', 'unknown'],
        default: 'unknown',
        index: true,
      },
      lastSeenAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      timestamps: true,
      toJSON: {
        transform: function (doc, ret) {
          delete ret.__v;
          return ret;
        },
      },
    }
  );

 
  PushTokenSchema.index({ token: 1 }, { unique: true });
  PushTokenSchema.index({ user: 1, organization: 1 });
  PushTokenSchema.index({ organization: 1, platform: 1 });
  PushTokenSchema.path('token').validate(function (v) {
    return typeof v === 'string' && v.length >= 10;
  }, 'Invalid push token');

  PushTokenSchema.statics.upsertForUser = async function ({
    token,
    userId,
    organizationId,
    platform = 'unknown',
  }) {
    return this.findOneAndUpdate(
      { token },
      {
        token,
        user: userId,
        organization: organizationId,
        platform,
        lastSeenAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  };

  return connection.model('PushToken', PushTokenSchema);
};
