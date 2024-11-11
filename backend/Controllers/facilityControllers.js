const facilityService = require('../Services/facilityServices');
const createFacility= async (req,res)=>{
    try{
        const newFacility=await facilityService.createFacility(req.body);
        res.status(201).json(newFacility);
    }catch (error){
        res.status(400).json({error:'Failed to create new facility',details:error.message});
    }
};
 const getAllFacilities = async (req, res) =>{
    try{
       const facilities = await facilityService.getAllFacilities(); 
       res.status(201).json(facilities);
    }catch(error){
        res.status(400).json({error:'Failed to get all facilities',details:error.message});

    }
 }

 const getFacilitiesById = async (req, res) =>{
    try{
        const facility = await facilityService.getFacilitiesById(req.params.id);
        if (!facility){
            return res.status(404).json({error:'Failed to get facility'});
        }
        res.status(200).json(facility);
    }catch(error){
        res.status(500).json({error: 'Failed to get facility',details:error.message});  
      }
 };
  const updateFacility = async (req,res)=>{
    try{
       const updatedFacility = await facilityService.updateFacilityById(req.params.id,req.body);
       if (!updatedFacility){
        return res.status(404).json({error:'Facility not found'});
    }
    res.status(200).json(updatedFacility);
    } catch(error){
    res.status(500).json({error: 'Failed to update facility',details:error.message});  

    }
  }
const deleteFacility= async(req,res)=>{
    try{
      const deleteFacility= await facilityService.deleteFacilityById(req.params.id);
      if (!deleteFacility){
        return res.status(404).json({error:'Facility not found'});
    }
    res.status(200).json({message:'Facility deleted successfully'});
    }catch(error){
        res.status(500).json({error: 'Failed to delete facility',details:error.message});  

    }
}
module.exports = {
    createFacility,
    getAllFacilities,
    getFacilitiesById,
    updateFacility,
    deleteFacility,
}