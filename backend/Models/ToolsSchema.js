// models/ToolModel.js
const ToolModel = {
   _id: '',               // Unique identifier for the tool,
   type: 'tool', 
   tool_name: '',         // Required: Name of the tool
   available_since: '',   // Optional: Date when tool became available
   amount_available: 0,   // Optional: Default to 0 if not provided
   certification: '',     // Optional: Certification info for the tool
   created_at: '',        // Optional: Auto-generated when created
   updated_at: '',        // Optional: Manually updated when the document changes
 };
 
 module.exports = ToolModel;
 