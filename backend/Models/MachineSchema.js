const MachineModel = {
   _id: '',                // Unique identifier for the machine
   type: 'machine',        // Type to identify the document as a machine
   machine_name: '',       // Required: Name of the machine
   machine_type: '',       // Optional: Type of the machine (e.g., 'CNC', 'Lathe')
   facility_id: '',        // Required: Foreign key reference to Facility (_id)
   created_at: '',         // Auto-generated when the machine is created
   updated_at: '',         // Auto-updated when the machine is modified
 };
 
 module.exports = MachineModel;
 