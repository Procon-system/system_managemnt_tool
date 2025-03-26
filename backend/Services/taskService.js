const Task = require('../Models/TaskSchema');
const Resource = require('../Models/ResourceSchema');
const { validateTaskData } = require('../utils/validators');

exports.createTask = async (taskData) => {
  await validateTaskData(taskData);
  
  // Verify all referenced resources exist
  if (taskData.relatedResources && taskData.relatedResources.length > 0) {
    const resourceIds = taskData.relatedResources.map(r => r.resource);
    const resources = await Resource.find({
      _id: { $in: resourceIds },
      organization: taskData.organization
    });
    
    if (resources.length !== resourceIds.length) {
      throw new Error('One or more referenced resources not found');
    }
  }
  
  const task = new Task(taskData);
  return await task.save();
};

exports.getTaskById = async (taskId, organizationId) => {
  return await Task.findOne({
    _id: taskId,
    organization: organizationId
  })
    .populate('relatedResources.resource')
    .populate('assignedUsers.user')
    .populate('assignedTeams')
    .populate('createdBy', 'first_name last_name email');
};

exports.updateTask = async (taskId, updateData, organizationId) => {
  const task = await Task.findOneAndUpdate(
    { _id: taskId, organization: organizationId },
    updateData,
    { new: true, runValidators: true }
  ).populate('relatedResources.resource');
  
  if (!task) {
    throw new Error('Task not found');
  }
  
  return task;
};

exports.deleteTask = async (taskId, organizationId) => {
  const task = await Task.findOneAndDelete({
    _id: taskId,
    organization: organizationId
  });
  
  if (!task) {
    throw new Error('Task not found');
  }
};

exports.getTasksByOrganization = async (organizationId, options = {}) => {
  const { page, limit, status, resourceId } = options;
  
  const query = { organization: organizationId };
  
  if (status) {
    query['status.current'] = status;
  }
  
  if (resourceId) {
    query['relatedResources.resource'] = resourceId;
  }
  
  const tasks = await Task.find(query)
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('relatedResources.resource')
    .populate('createdBy', 'first_name last_name');
    
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
    throw new Error('Task not found');
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