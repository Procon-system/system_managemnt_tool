const Task = require('../Models/TaskSchema');
const Resource = require('../Models/ResourceSchema');
const { validateTaskData } = require('../utils/validators');

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

exports.createRecurringTasks = async ({ baseTask, frequency, endDate }) => {
  // First create the root task
  const rootTask = await this.createTask({
    ...baseTask,
    isRecurringRoot: true
  });
  
  // Generate recurring instances
  const recurringInstances = generateRecurringInstances(
    { ...baseTask, _id: rootTask._id },
    frequency,
    endDate
  );
  
  // Save all instances
  const createdInstances = await Task.insertMany(recurringInstances);
  
  return [rootTask, ...createdInstances];
};

exports.createTask = async (taskData) => {
  // Validate task data
  await validateTaskData(taskData);
  
  // Verify all referenced resources exist
  if (taskData.resources && taskData.resources.length > 0) {
    const resourceIds = taskData.resources.map(r => r.resource);
    const resources = await Resource.find({
      _id: { $in: resourceIds },
      organization: taskData.organization
    });
    
    if (resources.length !== resourceIds.length) {
      throw { 
        message: 'One or more referenced resources not found',
        statusCode: 400
      };
    }
  }
  
  const task = new Task(taskData);
  return await task.save();
};

exports.getTaskById = async (taskId, organizationId) => {
  const task = await Task.findOne({
    _id: taskId,
    organization: organizationId
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

exports.updateTask = async (taskId, updateData, organizationId) => {
  // Prevent changing organization or createdBy
  if (updateData.organization || updateData.createdBy) {
    throw { 
      message: 'Cannot change task organization or creator',
      statusCode: 400
    };
  }
  
  const task = await Task.findOneAndUpdate(
    { _id: taskId, organization: organizationId },
    updateData,
    { new: true, runValidators: true }
  )
    .populate('resources.resource')
    .populate('assignments.user');
    
  if (!task) {
    throw { message: 'Task not found', statusCode: 404 };
  }
  
  return task;
};

exports.deleteTask = async (taskId, organizationId) => {
  const task = await Task.findOneAndDelete({
    _id: taskId,
    organization: organizationId
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

exports.getTasksByOrganization = async (organizationId, options = {}) => {
  const { page = 1, limit = 10 } = options; // Only get pagination
  
  const tasks = await Task.find({ organization: organizationId })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate({
      path: 'resources.resource',
      populate: {
        path: 'type',
        model: 'ResourceType',
        select: 'name icon color' // Only include these fields
      }
    })
    .populate('assignments.user')
    .sort({ 'schedule.start': 1 });
    
  const count = await Task.countDocuments({ organization: organizationId });
  
  return {
    tasks,
    total: count,
    pages: Math.ceil(count / limit),
    currentPage: page
  };
};

exports.changeTaskStatus = async (taskId, newStatus, changedBy, notes, organizationId) => {
  const task = await Task.findOne({ _id: taskId, organization: organizationId });
  
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