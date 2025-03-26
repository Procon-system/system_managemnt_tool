
const mongoose = require('mongoose');
const teamSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true
    },
    members: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      role: {
        type: String,
        enum: ['member', 'manager', 'admin'],
        default: 'member'
      }
    }],
    permissions: {
      taskAccess: String,
      resourceAccess: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });
  
  const Team = mongoose.model('Team', teamSchema);
  module.exports = Team;