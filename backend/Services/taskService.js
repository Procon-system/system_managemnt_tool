const Task = require('../Models/TaskSchema');
const Resource = require('../Models/ResourceSchema');
const { validateTaskData } = require('../utils/validators');

exports.createTask = async (taskData) => {
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
  const { page = 1, limit = 10, status, resourceId, teamId, period } = options;
  
  const query = { organization: organizationId };
  
  if (status) query.status = status;
  if (resourceId) query['resources.resource'] = resourceId;
  if (teamId) query['assignments.team'] = teamId;
  if (period) query.task_period = period;
  
  const tasks = await Task.find(query)
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('resources.resource')
    .populate('assignments.user')
    .sort({ 'schedule.start': 1 });
    
  const count = await Task.countDocuments(query);
  
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