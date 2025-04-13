const taskService = require('../Services/taskService');
const { sendResponse } = require('../utils/responseHandler');
const calculateTaskPeriod = require('../Helper/taskPeriodCalc');
const getColorForStatus =require('../utils/getColorForStatus');
const uploadFileToGridFS = require('../utils/uploadImage'); // Import the upload function
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
    // 1. Validate required fields
    if (!req.body.title || !req.body.schedule?.start || !req.body.schedule?.end) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: title, schedule.start, or schedule.end",
        data: null
      });
    }

    // 2. Prepare task data (for both single and recurring)
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
      // Only include if provided
      ...(req.body.resources && { resources: req.body.resources }),
      ...(req.body.repeat_frequency && { repeat_frequency: req.body.repeat_frequency }),
      ...(req.body.task_period && { task_period: req.body.task_period })
    };

    // 3. Handle task creation based on frequency
    let createdTask;
    if (taskData.repeat_frequency && taskData.task_period) {
      // Recurring task path
      console.log("recurring")
      const periodEndDate = calculateTaskPeriod(taskData.schedule.start, taskData.task_period);
      createdTask = await taskService.createRecurringTasks({
        baseTask: taskData,
        frequency: taskData.repeat_frequency,
        endDate: periodEndDate
      });
    } else {
      // Single task path - simplified
      console.log("Creating single task with data:", taskData);
      createdTask = await taskService.createTask(taskData);
    }

    // 4. Send appropriate response
    return res.status(201).json({
      success: true,
      message: Array.isArray(createdTask) 
        ? 'Recurring tasks created successfully'
        : 'Task created successfully',
      data: createdTask
    });

  } catch (error) {
    console.error('Task creation error:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
      data: null
    });
  }
};
exports.updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const updateData = {};
    const mongoose = require('mongoose');
    console.log(req.body)
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