const FacilityModel = {
   _id: '',             // Unique identifier for the facility
   type: 'facility',    
   facility_name: '',   // Required: Name of the facility
   location: '',        // Required: Location of the facility
   created_at: '',      // Optional: Auto-generated when created
   updated_at: '',      // Optional: Updated whenever the document changes
 };
 
 module.exports = FacilityModel;