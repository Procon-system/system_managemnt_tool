// const mongoose = require('mongoose');
// //define task schema
// const taskSchema=new mongoose.Schema({
//   title:{
//     type:String,
//   },
//   custom_id: {
//     type:String,
//   },
//     facility:{
//         type:mongoose.Schema.Types.ObjectId,
//         ref:'Facility',
//     },
//     machine:{
//         type:mongoose.Schema.Types.ObjectId,
//         ref:'Machine',
//     },
//     service_location:{
//         type:String,
//     },
//     task_period:{
//         type:String,
//     },
//     repeat_frequency:{
//         type:String,
//     },
//     status:{
//       type:String,
//       enum:["pending","in progress","done","overdue","impossible"]
//     },
//     notes:{
//       type:String,
//     },
//     image: {  // New field for storing the image reference
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'uploads.files', // Reference to GridFS
//     },
//     start_time:{
//      type:Date,
//      required:true,
//     },
//     end_time:{
//       type:Date,
//       required:true,
//     },
    
//     color_code:{
//       type:String,
//       enum: ["blue","green", "yellow", "red","gray"], //green,yellow,red,blue

//     },
//     alarm_enabled:{
//       type:Boolean,
//       default:false,
//     },

//     assigned_to:[
//       {
//       type: mongoose.Schema.Types.ObjectId,
//       ref:'User', //reference to user model
//     }
//   ],
//     created_by:{
//         type: mongoose.Schema.Types.ObjectId,
//         ref:'User',
//     },
//     tools: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Tool',
//       }
//     ],
//     materials: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Material',
//       }
//     ],
//     created_at:{
//         type:Date,
//         default:Date.now,
//       },
//       updated_at:{
//         type:Date,
//         default:Date.now,
//       }
// },
// {
//   toObject: { virtuals: true },
//   toJSON: { virtuals: true }
// });
// taskSchema.pre('save',function(next){
//     this.updated_at=Date.now();
//     next();
// });
// taskSchema.virtual('assigned_resources').get(function() {
//   return {
//     assigned_to: this.assigned_to,
//     tools: this.tools,
//     materials: this.materials,
//   };
// });
// const Task = mongoose.model('Task',
//     taskSchema
// );
// module.exports = Task;
const TaskModel = {
  _id: '',                    // Unique identifier for the task
  type: 'task',               // Type to distinguish task documents
  title: '',                  // Title of the task
  facility: '',               // Foreign key: ID of the associated Facility
  machine: '',                // Foreign key: ID of the associated Machine
  service_location: '',       // Location for the task
  task_period: '',            // Period for task execution (e.g., 'daily', 'weekly')
  repeat_frequency: '',       // Frequency of repetition
  status: 'pending',          // Task status: pending, in progress, etc.
  notes: '',                  // Optional notes about the task
  image: '',                  // ID of the image document in GridFS
  start_time: '',             // Start time (ISO 8601 format)
  end_time: '',               // End time (ISO 8601 format)
  color_code: '',             // Status-dependent color code (blue, green, yellow, red, etc.)
  alarm_enabled: false,       // Boolean to indicate if alarm is enabled
  assigned_to: [],            // Array of User IDs assigned to this task
  created_by: '',             // ID of the User who created the task
  tools: [],                  // Array of Tool IDs required for the task
  materials: [],              // Array of Material IDs required for the task
  created_at: '',             // Timestamp for task creation
  updated_at: '',             // Timestamp for the last update
};

module.exports = TaskModel;
