const Facility = require('../Models/FacilitySchema');
const createFacility = async (facilityData)=>{
    const facility =new Facility(facilityData);
    return await facility.save();
};
const getAllFacilities = async (facilityData)=>{
    return await Facility.find();
 
};
 const getFacilitiesById= async(id)=>{
    return await Facility.findById(id);
 };
 const updateFacilityById = async (id,facilityData) => {
    return await Facility.findByIdAndUpdate(id,facilityData,{new:true});
 };
 const deleteFacilityById = async (id) =>{
    return await Facility.findByIdAndDelete(id);
 };
 module.exports = {
    createFacility,
    getAllFacilities,
    getFacilitiesById,
    updateFacilityById,
    deleteFacilityById
 }