
const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema({
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true
    },
    type: {
      type: String,
      enum: ['task_assignment', 'status_change', 'due_date', 'comment', 'custom']
    },
    relatedEntity: {
      entityType: String, // 'Task', 'Resource', etc.
      entityId: mongoose.Schema.Types.ObjectId
    },
    message: String,
    read: {
      type: Boolean,
      default: false
    },
    metadata: mongoose.Schema.Types.Mixed,
    createdAt: {
      type: Date,
      default: Date.now
    }
  });
  
  const Notification = mongoose.model('Notification', notificationSchema);