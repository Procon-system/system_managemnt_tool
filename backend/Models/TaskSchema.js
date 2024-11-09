const mongoose = require('mongoose');
//define task schema
const taskSchema=new mongoose.Schema({
  title:{
    type:String,
  },
  custom_id: {
    type:String,
  },
    facility:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Facility',
    },
    machine:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Machine',
    },
    service_location:{
        type:String,
    },
    task_period:{
        type:String,
    },
    repeat_frequency:{
        type:String,
    },
    status:{
      type:String,
      enum:["pending","in progress","done","overdue"]
    },
    notes:{
      type:String,
    },
    start_time:{
     type:Date,
     required:true,
    },
    end_time:{
      type:Date,
      required:true,
    },
    
    color_code:{
      type:String,
      enum: ["green", "yellow", "red"], //green,yellow,red

    },
    alarm_enabled:{
      type:Boolean,
      default:false,
    },

    assigned_to:{
      type: mongoose.Schema.Types.ObjectId,
      ref:'User', //reference to user model
    },
    created_by:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User',
    },
    tools: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Tool' },
    
    materials: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Material' },
    created_at:{
        type:Date,
        default:Date.now,
      },
      updated_at:{
        type:Date,
        default:Date.now,
      }
});
taskSchema.pre('save',function(next){
    this.updated_at=Date.now();
    next();
});
const Task = mongoose.model('Task',
    taskSchema
);
module.exports = Task;