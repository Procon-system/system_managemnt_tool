const taskService = require('../Services/taskService');
const { sendResponse } = require('../utils/responseHandler');
const calculateTaskPeriod = require('../Helper/taskPeriodCalc');
const getColorForStatus =require('../utils/getColorForStatus');
const uploadFileToGridFS = require('../utils/uploadImage'); // Import the upload function
const mongoose = require('mongoose');
const cleanObjectId = (id) => {
  if (!id) return null;
  const possibleIds = id.split('_').filter(mongoose.Types.ObjectId.isValid);
  return possibleIds.length > 0 ? new mongoose.Types.ObjectId(possibleIds[0]) : null;
};
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

exports.setTaskSocketIoInstance = (ioInstance) => {
  io = ioInstance;
};
exports.createTask = async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.title || !req.body.schedule?.start || !req.body.schedule?.end) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        data: null
      });
    }

    // Prepare task data
    const taskData = {
      title: req.body.title,
      organization: req.user.organization,
      createdBy: req.user._id,
      schedule: {
        start: new Date(req.body.schedule.start),
        end: new Date(req.body.schedule.end),
        timezone: req.body.schedule.timezone || 'UTC'
      },
      // Optional fields with defaults
      status: req.body.status || 'pending',
      priority: req.body.priority || 'medium',
      notes: req.body.notes || '',
      assignments: req.body.assigned_to 
    ? req.body.assigned_to.map(userId => ({ user: userId })) 
    : [],
      // Only include if provided
      ...(req.body.resources && { resources: req.body.resources }),
      ...(req.body.repeat_frequency && { repeat_frequency: req.body.repeat_frequency }),
      ...(req.body.task_period && { task_period: req.body.task_period })
    };

    // Clear any undefined fields
    Object.keys(taskData).forEach(key => taskData[key] === undefined && delete taskData[key]);

    let createdTask;
    if (taskData.repeat_frequency !== 'none' && taskData.task_period) {
      // Handle recurring tasks
      const periodEndDate = calculateTaskPeriod(taskData.schedule.start, taskData.task_period);
      createdTask = await taskService.createRecurringTasks({
        baseTask: taskData,
        frequency: taskData.repeat_frequency,
        endDate: periodEndDate
      });
    } else {
      // Handle single task
      console.log("Creating single task");
      createdTask = await taskService.createTask(taskData);
    }

    // Ensure we're sending a response
    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: createdTask
    });

  } catch (error) {
    console.error('Error in createTask:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Task creation failed',
      data: null
    });
  }
};
exports.updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const updateData = {};
    const mongoose = require('mongoose');
    console.log("req.nody",req.body)
    // Parse the assigned_resources if it exists
    if (req.body.assigned_resources) {
      const assignedResources = JSON.parse(req.body.assigned_resources);
      
      // Transform resources to match your DB structure with proper ObjectIds
     // In your updateTask controller:
updateData.resources = assignedResources.resources
.filter(resource => resource?.resource?._id) // Filter out invalid resources
.map(resource => ({
  resource: new mongoose.Types.ObjectId(resource.resource._id),
  relationshipType: resource.relationshipType,
  required: resource.required,
  _id: resource._id 
    ? new mongoose.Types.ObjectId(resource._id) 
    : new mongoose.Types.ObjectId()
}));
      
      // Transform assignments with proper ObjectIds
      updateData.assignments = assignedResources.assigned_to.map(user => ({
        user: new mongoose.Types.ObjectId(user._id),
        role: 'assignee',
        _id: new mongoose.Types.ObjectId()
      }));
    }

    // Handle images - keptImages should be an array of image IDs to keep
    if (req.body.keptImages) {
      updateData.images = JSON.parse(req.body.keptImages).map(id => 
       new mongoose.Types.ObjectId(id)
      );
    }

    // Handle new file uploads
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => 
        uploadFileToGridFS(file).then(result => result.file._id)
      );
      
      const uploadedImageIds = await Promise.all(uploadPromises);
      
      // Combine kept images with new ones (max 5 total)
      updateData.images = [
        ...(updateData.images || []),
        ...uploadedImageIds
      ].slice(0, 5);
    }

    // Handle other fields
    const fieldsToUpdate = [
      'title', 'status', 'priority', 'visibility',
      'task_period', 'repeat_frequency', 'notes'
    ];
    
    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Handle schedule if needed
    if (req.body.start || req.body.end) {
      updateData.schedule = {
        start: req.body.start,
        end: req.body.end,
        timezone: req.body.timezone || 'UTC'
      };
    }

    // Handle status color
    if (req.body.status) {
      
      updateData.color_code = getColorForStatus(req.body.status);
    }

    console.log("Final update data:", updateData);
    
    const updatedTask = await taskService.updateTask(
      taskId,
      updateData,
      req.user.organization
    );
    const responseTask = {
      ...updatedTask.toObject(), // Convert Mongoose document to plain object
      // Ensure all necessary fields are included
      assigned_resources: updatedTask.assigned_resources || [],
      images: updatedTask.images || [],
      // Add any other fields that might be missing
    };
    
    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: responseTask
    });
  } catch (error) {
    console.error("Update task error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update task'
    });
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
    const { page = 1, limit = 10 } = req.query; // Keep pagination
    
    const tasks = await taskService.getTasksByOrganization(
      req.user.organization,
      { page, limit } // Only pass pagination params
    );
    
    sendResponse(res, 200, 'Tasks retrieved successfully', tasks);
  } catch (error) {
    sendResponse(res, error.statusCode || 500, error.message, null);
  }
};
exports.filterTasksByOrganization = async (req, res) => {
  try {
    // Handle both POST (body) and GET (query) requests
    const requestData = req.method === 'POST' ? req.body.filters : req.query;

    // Properly extract filters and pagination
    const { 
      page = 1, 
      limit = 10,
      filters: requestFilters = {} 
    } = requestData;

    // Handle cases where filters might be nested or direct
    const filters = typeof requestFilters === 'string' 
      ? JSON.parse(requestFilters) 
      : requestFilters;

    // Process filters
    const parsedFilters = {};
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === '') continue;
      
      if (value === 'true') parsedFilters[key] = true;
      else if (value === 'false') parsedFilters[key] = false;
      else if (key.endsWith('Date')) {
        parsedFilters[key] = new Date(value);
        if (isNaN(parsedFilters[key].getTime())) {
          throw new Error(`Invalid date format for ${key}`);
        }
      }
      else if (mongoose.Types.ObjectId.isValid(value)) {
        parsedFilters[key] = new mongoose.Types.ObjectId(value);
      }
      else if (key === 'tags' && typeof value === 'string') {
        parsedFilters[key] = value.split(',');
      }
      else {
        parsedFilters[key] = value;
      }
    }

    console.log('Processed filters:', parsedFilters);

    const result = await taskService.filterTasksByOrganization(
      req.user.organization,
      { 
        page: parseInt(page), 
        limit: Math.min(parseInt(limit), 100),
        filters: parsedFilters
      }
    );

    sendResponse(res, 200, 'Tasks filtered successfully', result);
  } catch (error) {
    console.error('Filter error:', error);
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
// Get all done tasks
exports.getAllDoneTasks = async (req, res) => {
  try {
    const tasks = await taskService.fetchAllDoneTasks(req.user.organization);
    
    if (!tasks || tasks.length === 0) {
      return sendResponse(res, 404, 'No done tasks found', null);
    }
    
    sendResponse(res, 200, 'Done tasks retrieved successfully', tasks);
  } catch (error) {
    sendResponse(res, error.statusCode || 500, error.message, null);
  }
};

// Get done tasks for specific user
exports.getDoneTasksForUser = async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return sendResponse(res, 400, 'User ID is required', null);
  }

  try {
    const tasks = await taskService.fetchDoneTasksForUser(userId, req.user.organization);
    
    if (!tasks || tasks.length === 0) {
      return sendResponse(res, 404, 'No done tasks found for this user', null);
    }
    
    sendResponse(res, 200, 'Done tasks retrieved successfully', tasks);
  } catch (error) {
    sendResponse(res, error.statusCode || 500, error.message, null);
  }
};

// Get tasks assigned to a user
exports.getTasksByAssignedUser = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return sendResponse(res, 400, 'User ID is required', null);
    }

    const tasks = await taskService.getTasksByAssignedUser(userId, req.user.organization);
    
    if (tasks.length === 0) {
      return sendResponse(res, 404, 'No tasks found for the given user', null);
    }
    
    sendResponse(res, 200, 'Assigned tasks retrieved successfully', tasks);
  } catch (error) {
    sendResponse(res, 500, 'Failed to fetch tasks', { details: error.message });
  }
};