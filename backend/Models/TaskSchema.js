const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  // Core Task Metadata
  title: { type: String, required: true, trim: true, maxlength: 120 },
  organization: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization',
    required: true,
    index: true 
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Resource Relationships (Improved Structure)
  resources: [{
    resource: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
    relationshipType: { 
      type: String, 
      enum: ['requires', 'uses', 'produces', 'references'],
      default: 'requires'
    },
    required: { type: Boolean, default: false }
  }],
  // Team & Assignment (Simplified)
  assignments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    role: { 
      type: String, 
      enum: ['assignee', 'reviewer', 'observer'],
      default: 'assignee'
    }
  }],

  // Task Relationships
  dependencies: [{
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    relation: { 
      type: String,
      enum: ['blocks', 'precedes', 'related-to'],
      default: 'blocks'
    }
  }],

  // Classification
  tags: [{ type: String, lowercase: true, trim: true }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // System
  visibility: {
    type: String,
    enum: ['private', 'team', 'organization'],
    default: 'team'
  },
  task_period: {
    type: String,
    enum: ['', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    default: ''
  },
  repeat_frequency: {  // e.g., "every 2 weeks"
    type: String,
    default: '',
    trim: true
  },
  schedule: {
    start: { type: Date, required: true },
    end: { type: Date },
    timezone: { type: String, default: 'UTC' }
  },

  // Visual & Attachments
  color_code: {
    type: String,
    default: '#fbbf24',
    // validate: {
    //   validator: v => /^#([0-9a-f]{3}){1,2}$/i.test(v),
    //   message: props => `${props.value} is not a valid hex color`
    // }
  },
  attachments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attachment' // GridFS references
  }],

  // Task Tracking
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'done', 'impossible', 'archived'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 5000
  },

}, {
  timestamps: true,
  toObject: { virtuals: true },
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v; // Remove version key
      return ret;
    }
  }
});

// Indexes for better performance
taskSchema.index({ organization: 1, status: 1 });
taskSchema.index({ 'assignments.user': 1 });
taskSchema.index({ tags: 1 });

// // Virtual for completion percentage
// taskSchema.virtual('completion').get(function() {
//   return this.time.logged / this.time.estimated * 100;
// });

const Task = mongoose.model('Task', taskSchema);
module.exports = Task;