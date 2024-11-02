
const toolService = require('../Services/toolServices'); 

const createTool = async (req, res) => {
  try {
    const newTool = await toolService.createTool(req.body);
    res.status(201).json(newTool);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create tool', details: error.message });
  }
};

const getAllTools = async (req, res) => {
  try {
    const tools = await toolService.getAllTools();
    res.status(200).json(tools);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tools', details: error.message });
  }
};

const getToolById = async (req, res) => {
  try {
    const tool = await toolService.getToolById(req.params.id);
    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }
    res.status(200).json(tool);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tool', details: error.message });
  }
};

const updateTool = async (req, res) => {
  try {
    const updatedTool = await toolService.updateTool(req.params.id, req.body);
    if (!updatedTool) {
      return res.status(404).json({ error: 'Tool not found' });
    }
    res.status(200).json(updatedTool);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update tool', details: error.message });
  }
};

const deleteTool = async (req, res) => {
  try {
    const deletedTool = await toolService.deleteTool(req.params.id);
    if (!deletedTool) {
      return res.status(404).json({ error: 'Tool not found' });
    }
    res.status(200).json({ message: 'Tool deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete tool', details: error.message });
  }
};

module.exports = {
  createTool,
  getAllTools,
  getToolById,
  updateTool,
  deleteTool,
};
