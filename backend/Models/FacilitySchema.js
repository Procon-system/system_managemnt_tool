const mongoose = require('mongoose');
const facilitySchema = new mongoose.Schema({
   facility_name:{
    type:String,
    required:true,
   },
   location:{
    type:String,
    required:true,
   },
});
const Facility = mongoose.model('Facility', facilitySchema);

module.exports = Facility;
