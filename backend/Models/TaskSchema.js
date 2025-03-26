
const mongoose = require('mongoose');
const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  relatedResources: [{
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource'
    },
    relationshipType: String,
    required: Boolean
  }],
  timeData: {
    type: Map,
    of: Date
  },
  status: {
    current: String,
    history: [{
      status: String,
      changedAt: Date,
      changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      notes: String
    }]
  },
  customData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  visibility: {
    type: String,
    enum: ['private', 'team', 'organization'],
    default: 'team'
  },
  assignedTeams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }],
  assignedUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['assignee', 'reviewer', 'observer']
    }
  }],
  dependencies: [{
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    type: {
      type: String,
      enum: ['blocks', 'precedes', 'related']
    }
  }],
  tags: [String],
  priority: String,
  estimatedDuration: Number, // in minutes
  actualDuration: Number,  // in minutes
  completionPercentage: {
    type: Number,
    min: 0,
    max: 100
  }
}, {
  timestamps: true,
  toObject: { virtuals: true },
  toJSON: { virtuals: true }
});

const Task = mongoose.model('Task', taskSchema);