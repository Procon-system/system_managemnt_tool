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
 certification:{
    type:String,
 }

});
const Tool = mongoose.model('Tool', toolSchema);

module.exports = Tool;