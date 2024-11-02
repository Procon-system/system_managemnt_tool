const mongoose = require('mongoose');
const resourceSchema = new mongoose.Schema({
  type:{
    type: String,
    enum:['tool','person'],
    required:true,
  },
  tool:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Tool'
  },
  person:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User'
  },
  name:{
    type:String,
    required:true,
  },
  cost:{
    type:Number,
  },
  working_hours:{
    type:Number,

  },
  resource_status:{
    type:String,
    enum:['available','in_use','blocked'],
    default:'available'
  },
  created_at:{
    type:Date,
    default:Date.now,
  },
  updated_at:{
    type:Date,
    default:Date.now,
  }
});
//update date and time before saving
resourceSchema.pre('save',function(next){
this.updated_at=Date.now();
next();
});
const Resource=mongoose.model('Resource',resourceSchema);
module.exports = Resource;