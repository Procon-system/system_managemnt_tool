const mongoose = require('mongoose');
const historicalTaskSchema=new mongoose.Schema({
    task_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'Task',
    },
    completed_by:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User', //reference to user model
    },
    completed_at:{
        type:Date,
        required:true,
    },
    notes:{
        type:String,
    },
    image:{
        type:String
    },
    created_at:{
        type:Date,
        default:Date.now(),
    },
    
});
historicalTaskSchema.pre('save',
    function(next){
        this.created_at=Date.now();
        next();
    }
);
const TaskHistory=mongoose.model('TaskHistory',historicalTaskSchema);
mongoose.exports = TaskHistory;