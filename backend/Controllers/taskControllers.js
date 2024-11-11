
const taskService = require('../Services/taskServices'); 
const User = require('../Models/UserSchema');
const Facility = require('../Models/FacilitySchema');
const Machine = require('../Models/MachineSchema');
const Tool = require('../Models/ToolsSchema');
const Material = require('../Models/MaterialsSchema');
const { ObjectId } = require('mongodb');
const convertUuidToObjectId = require('../Helper/changeUuid');
async function formatTaskData(taskData) {
  if (taskData.facility) {
    const facility = await Facility.findOne({ facility_name: taskData.facility });
    taskData.facility = facility ? facility._id : null;
  }
  
  if (taskData.machine) {
    const machine = await Machine.findOne({ machine_name: taskData.machine });
    taskData.machine = machine ? machine._id : null;
  }

  if (taskData.tools && Array.isArray(taskData.tools)) {
    const toolIds = await Promise.all(
      taskData.tools.map(async (toolName) => {
        const tool = await Tool.findOne({ tool_name: toolName });
        return tool ? tool._id : null;
      })
    );
    taskData.tools = toolIds.filter(Boolean); // Filter out null values
  }

  if (taskData.materials && Array.isArray(taskData.materials)) {
    const materialIds = await Promise.all(
      taskData.materials.map(async (materialName) => {
        const material = await Material.findOne({ material_name: materialName });
        return material ? material._id : null;
      })
    );
    taskData.materials = materialIds.filter(Boolean); // Filter out null values
  }
}
const createTask = async (req, res) => {
  try {
    const { taskData } = req.body;

    if (!taskData || !taskData.start_time || !taskData.end_time) {
      return res.status(400).json({ error: "Missing required fields: start_time or end_time" });
    }

    taskData.start_time = new Date(taskData.start_time);
    taskData.end_time = new Date(taskData.end_time);

    // Remove any client-generated _id to let MongoDB generate it
    delete taskData._id;
    console.log("user",req.user)
    taskData.created_by = req.user.id;
    console.log("id",taskData.created_by);
    const assignedUserEmail = taskData.assigned_to_email; // Assuming `assigned_to_email` is in the request body
    if (assignedUserEmail) {
      const assignedUser = await User.findOne({ email: assignedUserEmail });

      if (!assignedUser) {
        return res.status(400).json({ error: `User with email ${assignedUserEmail} not found` });
      }

      // Replace the email with the ObjectId of the assigned user
      taskData.assigned_to = assignedUser._id;
    }

   // Format task data by resolving facility, machine, tools, and materials
  //  await formatTaskData(taskData);

   // Create the new task with formatted data
   const newTask = await taskService.createTask(taskData);
   res.status(201).json(newTask);
 } catch (error) {
   console.error("Error:", error);
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
