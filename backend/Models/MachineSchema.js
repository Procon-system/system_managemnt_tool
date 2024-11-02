const mongoose = require('mongoose');
const machineSchema = new mongoose.Schema({
 machine_name:{
    type:String,
    required:true,

 },
 machine_type:{
    type:String,
 },
 facility:{
    type: mongoose.Schema.Types.ObjectId,ref:'Facility',
    required:true,
 },

});
const Machine = mongoose.model('Machine', machineSchema);

module.exports = Machine;