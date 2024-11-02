const mongoose = require('mongoose');
const notificationSchema=new mongoose.Schema({
    task_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Task',
    },
    notificationType:{
        type:String,
        enum:['email','sms'],
        required:true,
    },
    message:{
        type:String,
        required:true,
    },
    sent_at:{
        type:Date,
        default: Date.now,
    },
});
notificationSchema.pre('save',function(next){
    this.sent_at=Date.now();
    next();
});
const Notification= mongoose.model('Notification',notificationSchema);
module.exports = Notification;