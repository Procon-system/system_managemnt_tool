const toolService = require('../Services/toolServices'); 
let io = null;

// Set up Socket.IO instance
const setToolSocketIoInstance = (ioInstance) => {
  io = ioInstance;
};

// Create a new tool
const createTool = async (req, res) => {
  try {
    const newTool = await toolService.createTool(req.body);
    
    // Emit socket event for tool creation
    if (io) {
      io.emit('toolCreated', { newTool });
      console.log('Tool created event emitted:', newTool);
    } else {
      console.warn('Socket.IO instance not set in toolController');
    }

    res.status(201).json(newTool);
  } catch (error) {
    console.log("Error creating tool:", error);
    res.status(400).json({ error: 'Failed to create tool', details: error.message });
  }
};

// Get all tools
const getAllTools = async (req, res) => {
  try {
    const tools = await toolService.getAllTools();
    res.status(200).json(tools);
  } catch (error) {
    console.error("Error fetching tools:", error);
    res.status(500).json({ error: 'Failed to fetch tools', details: error.message });
  }
};

// Get tool by ID
const getToolById = async (req, res) => {
  try {
    const tool = await toolService.getToolById(req.params.id);
    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }
    res.status(200).json(tool);
  } catch (error) {
    console.error("Error fetching tool:", error);
    res.status(500).json({ error: 'Failed to fetch tool', details: error.message });
  }
};

// Update tool by ID
const updateTool = async (req, res) => {
  try {
    const updatedTool = await toolService.updateTool(req.params.id, req.body);
    if (!updatedTool) {
      return res.status(404).json({ error: 'Tool not found' });
    }
    // Emit socket event for tool update
    if (io) {
      io.emit('toolUpdated', updatedTool);
      console.log('Tool updated event emitted:', updatedTool);
    }

    res.status(200).json(updatedTool);
  } catch (error) {
    console.error("Error updating tool:", error);
    res.status(400).json({ error: 'Failed to update tool', details: error.message });
  }
};

// Delete tool by ID
const deleteTool = async (req, res) => {
  try {
    const deletedTool = await toolService.deleteTool(req.params.id);
    if (!deletedTool) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    // Emit socket event for tool deletion
    if (io) {
      io.emit('toolDeleted', req.params.id);
      console.log('Tool deleted event emitted:', req.params.id);
    }

    res.status(200).json({ message: 'Tool deleted successfully' });
  } catch (error) {
    console.error("Error deleting tool:", error);
    res.status(500).json({ error: 'Failed to delete tool', details: error.message });
  }
};

module.exports = {
  createTool,
  getAllTools,
  getToolById,
  updateTool,
  deleteTool,
  setToolSocketIoInstance
};
