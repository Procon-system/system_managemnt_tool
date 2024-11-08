
const taskService = require('../Services/taskServices'); 
const User = require('../Models/UserSchema');
const { ObjectId } = require('mongodb');
const convertUuidToObjectId = require('../Helper/changeUuid');
const createTask = async (req, res) => {
  try {
    const {taskData } = req.body;
    // const user = await User.findOne({ personal_number });
    // console.log("err",personal_number);
    // if (!user) {
    //   return res.status(404).json({ error: 'User not found' });
    // }
    // taskData.assigned_user = user._id;
    console.log("Full request body:", req.body); // Check if taskData is inside req.body
   
    if (!taskData || !taskData.start_time || !taskData.end_time) {
      return res.status(400).json({ error: "Missing required fields: start_time or end_time" });
    }
    console.log("Request body:", req.body);

    taskData.start_time = new Date(taskData.start_time);  // Convert to Date object
    taskData.end_time = new Date(taskData.end_time);      // Convert to Date object

    const newTask = await taskService.createTask(taskData);
    res.status(201).json(newTask);
  }  catch (error) {
    console.log("err",error);
    res.status(400).json({ error: 'Failed to create task', details: error.message });
  }
};

const getAllTasks = async (req, res) => {
  try {
    const tasks = await taskService.getAllTasks();
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks', details: error.message });
  }
};

const getTaskById = async (req, res) => {
  try {
    const task = await taskService.getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch task', details: error.message });
  }
};
// const convertUuidToObjectId = (uuid) => {
//   // UUID format: 123e4567-e89b-12d3-a456-426614174000
//   const buffer = Buffer.from(uuid.replace(/-/g, ''), 'hex'); // Remove dashes from UUID and convert to Buffer
//   return new ObjectId(buffer); // Create an ObjectId from the buffer
// };

const updateTask = async (req, res) => {
  
  try {
    const uuid = req.params.id;  // Get the UUID from the request params
  const taskId = convertUuidToObjectId(uuid);  // Convert UUID to ObjectId

    // Ensure the taskId is a valid ObjectId
    if (!ObjectId.isValid(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    // Call the updateTask service with the valid ObjectId
    const updatedTask = await taskService.updateTask(taskId, req.body);
    
    if (!updatedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.status(200).json(updatedTask);
  } catch (error) {
    console.log("er",error);
    res.status(400).json({ error: 'Failed to update task', details: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const deletedTask = await taskService.deleteTask(req.params.id);
    if (!deletedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task', details: error.message });
  }
};

// Create a task from a machine object
const createTaskFromMachine = async (req, res) => {
  try {
    const machineId = req.params.machineId;
    const taskData = req.body;
    const newTask = await taskService.createTaskFromMachine(machineId, taskData);
    res.status(201).json(newTask);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create task from machine', details: error.message });
  }
};

module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  createTaskFromMachine,
};
