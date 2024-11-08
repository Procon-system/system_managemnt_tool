
const Task = require('../Models/TaskSchema'); 
const { ObjectId } = require('mongodb');
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
   // Cast the id to ObjectId if it's not already
   const objectId = ObjectId.isValid(id) ? new ObjectId(id) : id;

   // Proceed with the update
   return await Task.findByIdAndUpdate(objectId, updateData, { new: true });
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
