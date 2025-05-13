const taskService = require('../Services/taskService');
const { sendResponse } = require('../utils/responseHandler');
const calculateTaskPeriod = require('../Helper/taskPeriodCalc');
const getColorForStatus =require('../utils/getColorForStatus');
const uploadFileToGridFS = require('../utils/uploadImage'); // Import the upload function
const mongoose = require('mongoose');
const {getFromCache, setToCache, deleteFromCache, 
  clearPattern,generateCacheKey,cachePaginatedResults,invalidateTaskCaches } =require('../redisUtils');
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
    const { Task, Resource } = req.tenantModels;
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
      organization: req.user.org_id,
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
        endDate: periodEndDate,
        TaskModel: Task,          // ✅ FIXED
        ResourceModel: Resource   // ✅ FIXED
      });
    } else {
      // Handle single task
      
      createdTask = await taskService.createTask(taskData, Task, Resource);
    }
    // Fire-and-forget cache invalidation
  // invalidateTaskCaches(task.organization, task._id, task.createdBy)
  // .catch(err => console.error('Background cache invalidation failed:', err));

    
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
    const { Task } = req.tenantModels;
    
    // Parse the assigned_resources if it exists
    if (req.body.assigned_resources) {
      const assignedResources = JSON.parse(req.body.assigned_resources);
      
      // Transform resources to match your DB structure with proper ObjectIds
     // In your updateTask controller:
     if (assignedResources.resources && Array.isArray(assignedResources.resources)) {
      updateData.resources = assignedResources.resources
        .filter(resource => resource?.resource?._id)
        .map(resource => ({
          resource: new mongoose.Types.ObjectId(resource.resource._id),
          relationshipType: resource.relationshipType,
          required: resource.required,
          _id: resource._id 
            ? new mongoose.Types.ObjectId(resource._id) 
            : new mongoose.Types.ObjectId()
        }));
    }
    
     // Transform assignments with proper ObjectIds
     if (Array.isArray(assignedResources.assigned_to)) {
      updateData.assignments = assignedResources.assigned_to.map(user => ({
        user: new mongoose.Types.ObjectId(user._id),
        role: 'assignee',
        _id: new mongoose.Types.ObjectId()
      }));
    }
    
    }

    // Handle images - keptImages should be an array of image IDs to keep
    if (req.body.keptImages) {
      updateData.images = JSON.parse(req.body.keptImages).map(id => 
       new mongoose.Types.ObjectId(id)
      );
    }
   
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => 
        uploadFileToGridFS(file,req.tenantDB).then(result => result.file._id)
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

    
    
    const updatedTask = await taskService.updateTask(
      taskId,
      updateData,
      Task
    );
     // Clear cache for this task and related lists
    //  await Promise.all([
    //   deleteFromCache(`task:${taskId}:org:${req.user.organization}`),
    //   clearPattern(`tasks:org:${req.user.organization}:*`),
    //   clearPattern(`user_tasks:*:${taskId}`),
    //   // Clear image cache for any modified images
    //   ...(updatedTask.images?.length ? 
    //     updatedTask.images.map(imageId => 
    //       deleteFromCache(`image:meta:${imageId}`)
    //     ) : []
    //   ),
      // Clear cache for any removed images
    //   ...(req.body.removedImages?.length ?
    //     req.body.removedImages.map(imageId =>
    //       deleteFromCache(`image:meta:${imageId}`)
    //     ) : []
    //   )
    // ]);
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
    const cacheKey = `task:${req.params.id}:org:${req.user.org_id}`;
    
    const { Task } = req.tenantModels;
    // Try to get from cache first
    const cachedTask = await getFromCache(cacheKey);
    if (cachedTask) {
      return sendResponse(res, 200, 'Task retrieved from cache', cachedTask);
    }
    
    // If not in cache, get from DB
    const task = await taskService.getTaskById(req.params.id, Task);
    if (!task) {
      return sendResponse(res, 404, 'Task not found', null);
    }
    
    // Store in cache
    await setToCache(cacheKey, task);
    
    sendResponse(res, 200, 'Task retrieved successfully', task);
  } catch (error) {
    sendResponse(res, error.statusCode || 500, error.message, null);
  }
};
exports.deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { Task } = req.tenantModels;

    await taskService.deleteTask(taskId, Task);

        // Clear all relevant cache entries
        // await Promise.all([
        //   deleteFromCache(`task:${taskId}:org:${orgId}`),
        //   clearPattern(`tasks:org:${orgId}:*`),
        //   clearPattern(`user_tasks:*:${taskId}`),
        //   clearPattern(`filtered_tasks:org:${orgId}:*`),
        //   // Clear image cache for any task images
        //   ...(task?.images?.length ? 
        //     task.images.map(imageId => 
        //       deleteFromCache(`image:meta:${imageId}`)
        //     ) : []
        //   )
        // ]);
    sendResponse(res, 200, 'Task deleted successfully', null);
  } catch (error) {
    sendResponse(res, error.statusCode || 500, error.message, null);
  }
};
exports.getTasksByOrganization = async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const { Task } = req.tenantModels;

    const orgId = req.user.org_id;
    
    const cacheKey = generateCacheKey('tasks', orgId, { page, limit });
    
    // Try cache first
    // const cachedTasks = await getFromCache(cacheKey);
    // if (cachedTasks) {
    //   return sendResponse(res, 200, 'Tasks retrieved from cache', cachedTasks);
    // }
    
    const tasks = await taskService.getTasksByOrganization(
      Task,
      { page, limit }
    );
    
    // Cache the results
    // await cachePaginatedResults(cacheKey, tasks);
    
    sendResponse(res, 200, 'Tasks retrieved successfully', tasks);
  } catch (error) {
    sendResponse(res, error.statusCode || 500, error.message, null);
  }
};
exports.filterTasksByOrganization = async (req, res) => {
  try {
    // Handle both POST (body) and GET (query) requests
    const requestData = req.method === 'POST' ? req.body.filters : req.query;
    const orgId = req.user.org_id;
    const { Task } = req.tenantModels;
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
    
    // Generate cache key based on filters and pagination
    // const cacheKey = generateCacheKey('filtered_tasks', orgId, {
    //   ...parsedFilters,
    //   page,
    //   limit
    // });

    // Try cache first
    // const cachedResults = await getFromCache(cacheKey);
    // if (cachedResults) {
    //   return sendResponse(res, 200, 'Filtered tasks retrieved from cache', cachedResults);
    // }

    const result = await taskService.filterTasksByOrganization(
      orgId,
      Task,
      { 
        page: parseInt(page), 
        limit: Math.min(parseInt(limit), 100),
        filters: parsedFilters
      }
    );

    // Cache filtered results with shorter TTL (as filters may change more often)
    // await cachePaginatedResults(cacheKey, result, 60); // 1 minute TTL

   
    sendResponse(res, 200, 'Tasks filtered successfully', result);
  } catch (error) {
    console.error('Filter error:', error);
    sendResponse(res, error.statusCode || 500, error.message, null);
  }
};
exports.changeTaskStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const { Task } = req.tenantModels;
    const updatedTask = await taskService.changeTaskStatus(
      req.params.id,
      status,
      req.user._id,
      notes,
      req.user.org_id,
      Task
    );
    sendResponse(res, 200, 'Task status updated successfully', updatedTask);
  } catch (error) {
    sendResponse(res, error.statusCode || 500, error.message, null);
  }
};
// Get all done tasks
exports.getAllDoneTasks = async (req, res) => {
  try {
    const { Task } = req.tenantModels;
    const tasks = await taskService.fetchAllDoneTasks(req.user.org_id, Task);
    sendResponse(res, 200, 'Done tasks retrieved successfully', tasks);
  } catch (error) {
    sendResponse(res, error.statusCode || 500, error.message, null);
  }
};
// Get done tasks for specific user
exports.getDoneTasksForUser = async (req, res) => {
  const { userId } = req.query;
  const { Task } = req.tenantModels;

  if (!userId) {
    return sendResponse(res, 400, 'User ID is required', null);
  }

  try {
    const tasks = await taskService.fetchDoneTasksForUser(userId, req.user.org_id, Task);
    sendResponse(res, 200, 'Done tasks retrieved successfully', tasks);
  } catch (error) {
    sendResponse(res, error.statusCode || 500, error.message, null);
  }
};
// Get tasks assigned to a user
exports.getTasksByAssignedUser = async (req, res) => {
  try {
    const { userId } = req.query;
    const { Task } = req.tenantModels;
    if (!userId) {
      return sendResponse(res, 400, 'User ID is required', null);
    }

    const tasks = await taskService.getTasksByAssignedUser(userId, req.user.org_id, Task);
    sendResponse(res, 200, 'Assigned tasks retrieved successfully', tasks);
  } catch (error) {
    sendResponse(res, 500, 'Failed to fetch tasks', { details: error.message });
  }
};
