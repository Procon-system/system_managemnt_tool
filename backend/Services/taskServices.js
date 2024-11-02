
const Task = require('../Models/TaskSchema'); 

const createTask = async (taskData) => {
  const task = new Task(taskData);
  return await task.save();
};

const getAllTasks = async () => {
  return await Task.find().populate('facility machine assigned_to created_by tools materials');
};

const getTaskById = async (id) => {
  return await Task.findById(id).populate('facility machine assigned_to created_by tools materials');
};

const updateTask = async (id, updateData) => {
  return await Task.findByIdAndUpdate(id, updateData, { new: true });
};

const deleteTask = async (id) => {
  return await Task.findByIdAndDelete(id);
};

const createTaskFromMachine = async (machineId, taskData) => {
  const task = new Task({ machine: machineId, ...taskData });
  return await task.save();
};

module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  createTaskFromMachine,
};
