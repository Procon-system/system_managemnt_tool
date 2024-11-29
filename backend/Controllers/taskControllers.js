
const taskService = require('../Services/taskServices'); 
const User = require('../Models/UserSchema');
const Facility = require('../Models/FacilitySchema');
const Machine = require('../Models/MachineSchema');
const Tool = require('../Models/ToolsSchema');
const Material = require('../Models/MaterialsSchema');
const { ObjectId } = require('mongodb');
const convertUuidToObjectId = require('../Helper/changeUuid');
const uploadImage = require('../utils/uploadImage'); // Import the uploadImage utility
const getColorForStatus =require('../utils/getColorForStatus');
const uploadFileToGridFS = require('../utils/uploadImage'); // Import the upload function
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
     console.log("task data",taskData);
    if (!taskData || !taskData.start_time || !taskData.end_time) {
      return res.status(400).json({ error: "Missing required fields: start_time or end_time" });
    }

    taskData.start_time = new Date(taskData.start_time);
    taskData.end_time = new Date(taskData.end_time);
    // If an image file is uploaded, handle the upload
    if (req.file) {
      const uploadResult = await uploadFileToGridFS(req.file);
      taskData.image = uploadResult.file._id; // Store the image file's ObjectId in the task
    }
    // Remove any client-generated _id to let MongoDB generate it
    delete taskData._id;
    taskData.created_by = req.user.id;
    if (taskData.status) {
            taskData.color_code = getColorForStatus(taskData.status);
          } else {
            taskData.color_code = getColorForStatus("pending"); // Default to 'pending' if no status is provided
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
const getAllDoneTasks = async (req, res) => {
  try {
    const tasks = await taskService.fetchAllDoneTasks();
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getDoneTasksForUser = async (req, res) => {
  const {userId} = req.query; // Extract user ID from query parameters
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const tasks = await taskService.fetchDoneTasksForUser(userId);
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
const getTasksByAssignedUser = async (req, res) => {
  try {
    const { userId } = req.query; // Get userId from query parameters

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Fetch tasks assigned to the specified user
    const tasks = await taskService.getTasksByAssignedUser(userId);

    if (tasks.length === 0) {
      return res.status(404).json({ message: 'No tasks found for the given user' });
    }

    return res.status(200).json(tasks); // Send the tasks to the client
  } catch (error) {
    console.error('Error fetching tasks:', error.message);
    return res.status(500).json({ error: 'Failed to fetch tasks', details: error.message });
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
    const updateData = { ...req.body };

    // If status is provided, calculate the color code
    if (updateData.status) {
      updateData.color_code = getColorForStatus(updateData.status);
    }
    // If an image file is uploaded, handle the upload and associate the file with the task
    if (req.file) {
      // Upload the image and get the file's MongoDB ObjectId
      const uploadResult = await uploadFileToGridFS(req.file);
      updateData.image = uploadResult.file._id; // Associate the file's ObjectId with the task
    }
    // Call the updateTask service with the valid ObjectId and update data
    const updatedTask = await taskService.updateTask(taskId, updateData);

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
  getTasksByAssignedUser,
  getAllDoneTasks,
  getDoneTasksForUser,
  createTaskFromMachine,
};
