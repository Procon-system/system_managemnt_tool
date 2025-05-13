const Task = require('../Models/TaskSchema');
const Resource = require('../Models/ResourceSchema');
const { validateTaskData } = require('../utils/validators');
const mongoose = require('mongoose');
const generateRecurringInstances = (baseTask, frequency, endDate) => {
  const tasks = [];
  let currentStart = new Date(baseTask.schedule.start);
  let currentEnd = new Date(baseTask.schedule.end);
  const periodEnd = new Date(endDate);
  
  // Calculate duration of the original task
  const durationMs = currentEnd - currentStart;
  
  while (currentStart <= periodEnd) {
    if (currentStart > new Date(baseTask.schedule.start)) {
      const taskClone = {
        ...baseTask,
        _id: undefined, // Let MongoDB generate new IDs
        schedule: {
          start: new Date(currentStart),
          end: new Date(currentEnd),
          timezone: baseTask.schedule.timezone
        },
        isRecurringInstance: true,
        rootTask: baseTask._id || null
      };
      tasks.push(taskClone);
    }
    
    // Increment dates based on frequency
    switch (frequency.toLowerCase()) {
      case 'daily':
        currentStart.setDate(currentStart.getDate() + 1);
        currentEnd = new Date(currentStart.getTime() + durationMs);
        break;
      case 'weekly':
        currentStart.setDate(currentStart.getDate() + 7);
        currentEnd = new Date(currentStart.getTime() + durationMs);
        break;
      case 'monthly':
        currentStart.setMonth(currentStart.getMonth() + 1);
        currentEnd = new Date(currentStart.getTime() + durationMs);
        break;
      case 'yearly':
        currentStart.setFullYear(currentStart.getFullYear() + 1);
        currentEnd = new Date(currentStart.getTime() + durationMs);
        break;
      default:
        // Handle custom intervals like "every 2 weeks"
        const interval = parseInt(frequency.match(/\d+/)?.[0]) || 1;
        if (frequency.includes('week')) {
          currentStart.setDate(currentStart.getDate() + 7 * interval);
        } else if (frequency.includes('month')) {
          currentStart.setMonth(currentStart.getMonth() + interval);
        }
        currentEnd = new Date(currentStart.getTime() + durationMs);
    }
  }
  
  return tasks;
};
exports.createRecurringTasks = async ({ baseTask, frequency, endDate, TaskModel, ResourceModel }) => {
  // First create the root task
  const rootTask = await exports.createTask(baseTask, TaskModel, ResourceModel); // ✅ FIXED

  // Generate recurring instances
  const recurringInstances = generateRecurringInstances(
    { ...baseTask, _id: rootTask._id },
    frequency,
    endDate
  );

  // Save all instances
  const createdInstances = await TaskModel.insertMany(recurringInstances);

  return [rootTask, ...createdInstances];
};

// Simplified createTask for single tasks
exports.createTask = async (taskData, TaskModel, ResourceModel) => {
  try {
  
    // Basic validation
    if (!taskData.title?.trim()) {
      throw { statusCode: 400, message: 'Title is required' };
    }

    // Validate date consistency
    const startDate = new Date(taskData.schedule.start);
    const endDate = new Date(taskData.schedule.end);
    
    if (startDate >= endDate) {
      throw {
        message: 'End time must be after start time',
        statusCode: 400
      };
    }

    // Create task without transaction
    const task = new TaskModel({
      ...taskData,
      isRecurringRoot: false,
      isRecurringInstance: false
    });

    // Validate resources if they exist
    if (taskData.resources?.length > 0) {
      const resourceIds = taskData.resources.map(r => r.resource);
      const existingResources = await ResourceModel.countDocuments({
        _id: { $in: resourceIds },
        organization: taskData.organization
      });

      if (existingResources !== resourceIds.length) {
        throw { statusCode: 404, message: 'Some resources not found' };
      }
    }

    const savedTask = await task.save();
    return savedTask;

  } catch (error) {
    console.error('Error in task service:', error);
    throw error;
  }
};
exports.getTaskById = async (taskId, TaskModel) => {
  const task = await TaskModel.findOne({
    _id: taskId,
    
  })
    .populate('resources.resource')
    .populate('assignments.user')
    .populate('assignments.team')
    .populate('dependencies.task')
    .populate('createdBy', 'first_name last_name email');
    
  if (!task) {
    throw { message: 'Task not found', statusCode: 404 };
  }
  
  return task;
};

exports.updateTask = async (taskId, updateData, TaskModel) => {
  // Prevent changing organization or createdBy
  if (updateData.organization || updateData.createdBy) {
    throw { 
      message: 'Cannot change task organization or creator',
      statusCode: 400
    };
  }
  
  const task = await TaskModel.findOneAndUpdate(
    { _id: taskId },
    updateData,
    { new: true, runValidators: true }
  )
  .populate({
    path: 'resources.resource',
    populate: {
      path: 'type',
      model: 'ResourceType',
      select: 'name icon color'
    }
  })
  .populate({
    path: 'assignments.user',
    select: 'first_name last_name email avatar'
  })
    
  if (!task) {
    throw { message: 'Task not found', statusCode: 404 };
  }
  
  return task;
};

exports.deleteTask = async (taskId, TaskModel) => {
  const task = await TaskModel.findOneAndDelete({
    _id: taskId,
    
  });
  
  if (!task) {
    throw { message: 'Task not found', statusCode: 404 };
  }
  
  // Optional: Clean up any task references
  await Task.updateMany(
    { 'dependencies.task': taskId },
    { $pull: { dependencies: { task: taskId } } }
  );
};

exports.getTasksByOrganization = async (TaskModel, options = {}) => {
  const { page = 1, limit = 100 } = options;
  
  const tasks = await TaskModel.find({ 
    
    status: { $ne: 'done' } // Exclude done tasks
  })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate({
      path: 'resources.resource',
      populate: {
        path: 'type',
        model: 'ResourceType',
        select: 'name icon color'
      }
    })
    .populate({
      path: 'assignments.user',
      select: 'first_name last_name email avatar'
    })
    
  const count = await TaskModel.countDocuments({ 
    
    status: { $ne: 'done' } // Consistent count query
  });
  
  return {
    tasks,
    total: count,
    pages: Math.ceil(count / limit),
    currentPage: page
  };
};

exports.filterTasksByOrganization = async (organizationId,TaskModel, options = {}) => {
  const { page = 1, limit = 100, filters = {} } = options;
 
  // Base query with organization
  const query = { organization: new mongoose.Types.ObjectId(organizationId) };
  
  // Apply filters
  if (filters && Object.keys(filters).length > 0) {
    // ID filter
    if (filters._id) {
      query._id = new mongoose.Types.ObjectId(filters._id);
    }
    // if (filters.resource) {
    //   // Handle both single resource and array of resources
    //   const resourceIds = Array.isArray(filters.resource) 
    //     ? filters.resource.map(id => new mongoose.Types.ObjectId(id))
    //     : [new mongoose.Types.ObjectId(filters.resource)];
    
    //   query.resources = {
    //     $elemMatch: {
    //       resource: { $in: resourceIds }
    //     }
    //   };
    // }
    if (filters.resource) {
      const resourceIds = Array.isArray(filters.resource) 
        ? filters.resource.map(id => new mongoose.Types.ObjectId(id))
        : [new mongoose.Types.ObjectId(filters.resource)];
  
      // For intersection (ALL resources must exist)
      query.$and = resourceIds.map(resourceId => ({
        resources: {
          $elemMatch: {
            resource: resourceId,
            // Optional additional conditions
            ...(filters.resourceRelationship && { 
              relationshipType: filters.resourceRelationship 
            }),
            ...(filters.hasRequiredResources !== undefined && { 
              required: filters.hasRequiredResources 
            })
          }
        }
      }));
    }
    // For combined resource filters with multiple resources
    if (filters.resource && (filters.resourceRelationship || filters.hasRequiredResources !== undefined)) {
      const resourceConditions = {
        resource: { 
          $in: Array.isArray(filters.resource)
            ? filters.resource.map(id => new mongoose.Types.ObjectId(id))
            : [new mongoose.Types.ObjectId(filters.resource)]
        }
      };
    
      if (filters.resourceRelationship) {
        resourceConditions.relationshipType = filters.resourceRelationship;
      }
    
      if (filters.hasRequiredResources !== undefined) {
        resourceConditions.required = filters.hasRequiredResources;
      }
    
      query.resources = { $elemMatch: resourceConditions };
    }

    // Status filter
    if (filters.status) {
      query.status = filters.status;
    }
    
    // Priority filter
    if (filters.priority) {
      query.priority = filters.priority;
    }
    
    // Visibility filter
    if (filters.visibility) {
      query.visibility = filters.visibility;
    }
    
    // Created by filter
    if (filters.createdBy) {
      query.createdBy = new mongoose.Types.ObjectId(filters.createdBy);
    }
    
    // Date range filters
    if (filters.startDate || filters.endDate) {
      query['schedule.start'] = {};
      if (filters.startDate) {
        query['schedule.start'].$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query['schedule.start'].$lte = new Date(filters.endDate);
      }
    }
    
    // Due date filter
    if (filters.dueDate) {
      query['schedule.end'] = { $lte: new Date(filters.dueDate) };
    }
    
    // Assigned user filter
    if (filters.assignedTo) {
      query['assignments.user'] = new mongoose.Types.ObjectId(filters.assignedTo);
    }
    
    // Team filter
    if (filters.team) {
      query['assignments.team'] = new mongoose.Types.ObjectId(filters.team);
    }
    
    // Assignment role filter
    if (filters.role) {
      query['assignments.role'] = filters.role;
    }
    
    // Empty assignments filter
    if (filters.hasAssignments === false) {
      query.assignments = { $size: 0 };
    } else if (filters.hasAssignments === true) {
      query.assignments = { $not: { $size: 0 } };
    }
  
    // Empty resources filter
    if (filters.hasResources === false) {
      query.resources = { $size: 0 };
    } else if (filters.hasResources === true) {
      query.resources = { $not: { $size: 0 } };
    }
    // Tag filter
    if (filters.tags) {
      const tags = Array.isArray(filters.tags) ? filters.tags : [filters.tags];
      query.tags = { $all: tags.map(tag => tag.toLowerCase()) };
    }
    
    // Task period filter
    if (filters.task_period) {
      query.task_period = filters.task_period;
    }
    
    // Repeat frequency filter
    if (filters.repeat_frequency) {
      query.repeat_frequency = filters.repeat_frequency;
    }
    
    // Color code filter
    if (filters.color_code) {
      query.color_code = filters.color_code;
    }
    
    // Text search (title or notes)
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { notes: { $regex: filters.search, $options: 'i' } }
      ];
    }
    
    // Dependencies filter
    if (filters.hasDependencies === true) {
      query.dependencies = { $not: { $size: 0 } };
    } else if (filters.hasDependencies === false) {
      query.dependencies = { $size: 0 };
    }
    
    // Specific dependency filter
    if (filters.dependencyTask) {
      query['dependencies.task'] = new mongoose.Types.ObjectId(filters.dependencyTask);
    }
  }

  try {
    const [tasks, count] = await Promise.all([
      TaskModel.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate([
          {
            path: 'resources.resource',
            populate: { path: 'type', select: 'name icon color' }
          },
          {
            path: 'assignments.user',
            select: 'first_name last_name email avatar'
          },
          {
            path: 'assignments.team',
            select: 'name'
          },
          {
            path: 'dependencies.task',
            select: 'title status'
          }
        ])
        .sort({ 'schedule.start': 1 })
        .lean(),
        TaskModel.countDocuments(query)
    ]);

    console.log(`Found ${tasks.length} matching tasks`);
    return {
      tasks,
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: page
    };
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};
exports.changeTaskStatus = async (taskId, newStatus, changedBy, notes, TaskModel) => {
  const task = await TaskModel.findOne({ _id: taskId, organization: organizationId });
  
  if (!task) {
    throw { message: 'Task not found', statusCode: 404 };
  }
  
  // Add to status history
  task.status.history.push({
    status: task.status.current,
    changedAt: new Date(),
    changedBy: changedBy,
    notes: notes || ''
  });
  
  // Update current status
  task.status.current = newStatus;
  
  return await task.save();
};

exports.fetchAllDoneTasks = async (organizationId,TaskModel) => {
  const tasks = await TaskModel.find({
    organization: organizationId,
    status: 'done'
  })
    .populate({
      path: 'resources.resource',
      populate: {
        path: 'type',
        model: 'ResourceType',
        select: 'name icon color'
      }
    })
    .populate('assignments.user')
    .sort({ completedAt: -1 });

 

  return tasks;
};

exports.fetchDoneTasksForUser = async (userId, organizationId,TaskModel) => {
  const tasks = await TaskModel.find({
    assignee: userId,
    organization: organizationId,
    status: 'done'
  })
    .populate({
      path: 'resources.resource',
      populate: {
        path: 'type',
        model: 'ResourceType',
        select: 'name icon color'
      }
    })
    .populate('assignments.user')
    .sort({ completedAt: -1 });

 

  return tasks;
};

exports.getTasksByAssignedUser = async (userId, organizationId,TaskModel) => {
  return await TaskModel.find({
    assignee: userId,
    organization: organizationId
  })
    .populate({
      path: 'resources.resource',
      populate: {
        path: 'type',
        model: 'ResourceType',
        select: 'name icon color'
      }
    })
    .populate('assignments.user')
    .populate('project', 'name')
    .sort({ dueDate: 1 });
};