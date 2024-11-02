
const Tool = require('../Models/ToolsSchema');

const createTool = async (toolData) => {
  const tool = new Tool(toolData);
  return await tool.save();
};

const getAllTools = async () => {
  return await Tool.find();
};

const getToolById = async (id) => {
  return await Tool.findById(id);
};

const updateTool = async (id, updateData) => {
  return await Tool.findByIdAndUpdate(id, updateData, { new: true });
};

const deleteTool = async (id) => {
  return await Tool.findByIdAndDelete(id);
};

module.exports = {
  createTool,
  getAllTools,
  getToolById,
  updateTool,
  deleteTool,
};
