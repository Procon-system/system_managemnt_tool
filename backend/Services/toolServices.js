// services/ToolService.js
const ToolModel = require('../Models/ToolsSchema');
const { db } = require('../config/couchdb');  // Assuming 'db' is your CouchDB connection instance

// Create a new Tool
const createTool = async (toolData) => {
  try {
    const newTool = {
      ...ToolModel,
      _id: `tool:${Date.now()}`, // Generate unique ID
      type: 'tool',             // Set type as 'tool'
      tool_name: toolData.tool_name,
      available_since: toolData.available_since || null,
      amount_available: toolData.amount_available || 0,
      certification: toolData.certification || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const response = await db.insert(newTool);
    return response;
  } catch (error) {
    throw new Error(`Error creating tool: ${error.message}`);
  }
};

// Get all Tools
const getAllTools = async () => {
  try {
    const response = await db.find({ selector: { type: 'tool' } });
    return response.docs; // Return only the docs of type 'tool'
  } catch (error) {
    throw new Error(`Error retrieving tools: ${error.message}`);
  }
};


// Get a tool by its _id
const getToolById = async (id) => {
  try {
    const tool = await db.get(id);
    return tool;
  } catch (error) {
    console.error('Error fetching tool by ID:', error.message);
    throw error;
  }
};

// Update a tool's data in CouchDB
const updateTool = async (id, updateData) => {
  try {
    const tool = await db.get(id);
    const updatedTool = {
      ...tool,
      ...updateData,
      updated_at: new Date().toISOString(),
    };
    const response = await db.insert(updatedTool);
    console.log('Tool updated:', response);
    return response;
  } catch (error) {
    console.error('Error updating tool:', error.message);
    throw error;
  }
};

// Delete a tool from CouchDB
const deleteTool = async (id) => {
  try {
    const tool = await db.get(id);
    const response = await db.destroy(id, tool._rev);
    console.log('Tool deleted:', response);
    return response;
  } catch (error) {
    console.error('Error deleting tool:', error.message);
    throw error;
  }
};

module.exports = {
  createTool,
  getAllTools,
  getToolById,
  updateTool,
  deleteTool,
};
