const taskService = require('../Services/taskService');
const { sendResponse } = require('../utils/responseHandler');

exports.createTask = async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      organization: req.user.organization,
      createdBy: req.user._id
    };
    
    const task = await taskService.createTask(taskData);
    sendResponse(res, 201, 'Task created successfully', task);
  } catch (error) {
    sendResponse(res, error.statusCode || 500, error.message, null);
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await taskService.getTaskById(req.params.id, req.user.organization);
    if (!task) {
      return sendResponse(res, 404, 'Task not found', null);
    }
    sendResponse(res, 200, 'Task retrieved successfully', task);
  } catch (error) {
    sendResponse(res, error.statusCode || 500, error.message, null);
  }
};

exports.updateTask = async (req, res) => {
  try {
    const updatedTask = await taskService.updateTask(
      req.params.id,
      req.body,
      req.user.organization
    );
    sendResponse(res, 200, 'Task updated successfully', updatedTask);
  } catch (error) {
    sendResponse(res, error.statusCode || 500, error.message, null);
  }
};

exports.deleteTask = async (req, res) => {
  try {
    await taskService.deleteTask(req.params.id, req.user.organization);
    sendResponse(res, 200, 'Task deleted successfully', null);
  } catch (error) {
    sendResponse(res, error.statusCode || 500, error.message, null);
  }
};

exports.getTasksByOrganization = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      resourceId,
      teamId,
      period 
    } = req.query;
    
    const tasks = await taskService.getTasksByOrganization(
      req.user.organization,
      { page, limit, status, resourceId, teamId, period }
    );
    sendResponse(res, 200, 'Tasks retrieved successfully', tasks);
  } catch (error) {
    sendResponse(res, error.statusCode || 500, error.message, null);
  }
};

exports.changeTaskStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const updatedTask = await taskService.changeTaskStatus(
      req.params.id,
      status,
      req.user._id,
      notes,
      req.user.organization
    );
    sendResponse(res, 200, 'Task status updated successfully', updatedTask);
  } catch (error) {
    sendResponse(res, error.statusCode || 500, error.message, null);
  }
};