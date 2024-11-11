const mongoose = require('mongoose');
const materialSchema = new mongoose.Schema({
    material_name:{
    type:String,
    required:true,
    unique: true

 },
 amount_available:{
    type:Number,
    default:0,
 },
 material_description:{
    type:String,
 },

});
const Material = mongoose.model('Material', materialSchema);

module.exports = Material;