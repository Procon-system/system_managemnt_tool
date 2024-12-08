const MaterialModel = {
   _id: '',                   // Unique identifier for the material
   type: 'material',          // Explicit type to identify the document
   material_name: '',         // Material name (Required, Unique)
   amount_available: 0,       // Available amount (Default: 0)
   material_description: '',  // Optional description
   created_at: '',            // Timestamp for creation
   updated_at: '',            // Timestamp for updates
 };
 
 module.exports = MaterialModel;
 