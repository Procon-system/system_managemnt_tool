const mongoose = require('mongoose');
const toolSchema = new mongoose.Schema({
 tool_name:{
    type:String,
    required:true,
    unique: true
},
 available_since:{
    type:Date,
 },
 amount_available:{
   type:Number,
   default:0,
},
 certification:{
    type:String,
 }

});
const Tool = mongoose.model('Tool', toolSchema);

module.exports = Tool;