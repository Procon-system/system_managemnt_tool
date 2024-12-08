const {db} = require('../config/couchdb'); // Import CouchDB instance
const FacilityModel = require('../Models/FacilitySchema');

// Create a new Facility
const createFacility = async (facilityData) => {
   try {
     const newFacility = {
       ...FacilityModel,
       _id: `facility:${Date.now()}`, // Generate unique ID
       type: 'facility',             // Set type as 'facility'
       facility_name: facilityData.facility_name,
       location: facilityData.location,
       created_at: new Date().toISOString(),
       updated_at: new Date().toISOString(),
     };
     const response = await db.insert(newFacility);
     return response;
   } catch (error) {
     throw new Error(`Error creating facility: ${error.message}`);
   }
 };
 
 // Get all Facilities
 const getAllFacilities = async () => {
   try {
     const response = await db.find({ selector: { type: 'facility' } });
     return response.docs; // Return only the docs of type 'facility'
   } catch (error) {
     throw new Error(`Error retrieving facilities: ${error.message}`);
   }
 };
 

// Get a Facility by ID
const getFacilityById = async (id) => {
  try {
    const facility = await db.get(id);
    return facility;
  } catch (error) {
    throw new Error(`Error retrieving facility: ${error.message}`);
  }
};

// Update a Facility by ID
const updateFacilityById = async (id, facilityData) => {
  try {
    const facility = await db.get(id);
    const updatedFacility = {
      ...facility,
      ...facilityData,
      updated_at: new Date().toISOString(),
    };
    const response = await db.insert(updatedFacility);
    return response;
  } catch (error) {
    throw new Error(`Error updating facility: ${error.message}`);
  }
};

// Delete a Facility by ID
const deleteFacilityById = async (id) => {
  try {
    const facility = await db.get(id);
    const response = await db.destroy(id, facility._rev);
    return response;
  } catch (error) {
    throw new Error(`Error deleting facility: ${error.message}`);
  }
};

module.exports = {
  createFacility,
  getAllFacilities,
  getFacilityById,
  updateFacilityById,
  deleteFacilityById,
};
