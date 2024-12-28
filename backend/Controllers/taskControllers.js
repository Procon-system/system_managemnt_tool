
const taskService = require('../Services/taskServices'); 
const UserModel = require('../Models/UserSchema');
const Facility = require('../Models/FacilitySchema');
const Machine = require('../Models/MachineSchema');
const Tool = require('../Models/ToolsSchema');
const Material = require('../Models/MaterialsSchema');
const { db } = require('../config/couchdb');
const upload = require('../utils/uploadImage');  // assuming multer upload setup
const { saveAttachment } = require('../Services/imageService');  // importing the saveAttachment function
const getColorForStatus =require('../utils/getColorForStatus');
const { v4: uuidv4 } = require('uuid'); // UUID for unique IDs
const {decrementMaterialCount} = require('../utils/decIncLogic');
const createTask = async (req, res) => {
  try {
    // Extract task data from the request body
    const taskData = req.body.taskData || req.body;

    console.log("Received task data:", taskData);

    // Validate required fields
    if (!taskData || !taskData.start_time || !taskData.end_time) {
      return res.status(400).json({ error: "Missing required fields: start_time or end_time" });
    }

    // Convert start_time and end_time to ISO format
    taskData.start_time = new Date(taskData.start_time).toISOString();
    taskData.end_time = new Date(taskData.end_time).toISOString();

    // Generate a unique ID for the task if not provided
    if (!taskData._id) {
      taskData._id = `task:${uuidv4()}`;
    }

    // Set created_by field from authenticated user
    taskData.created_by = req.user.id;

    // Assign default or computed color code based on status
    // if (!taskData.color_code){
      taskData.color_code = getColorForStatus(taskData.status || "pending");

    // }
    // Include only required fields for CouchDB
    const sanitizedTaskData = {
      _id: taskData._id,
      type: "task",
      title: taskData.title || "",
      service_location: taskData.service_location || "",
      task_period: taskData.task_period || "",
      repeat_frequency: taskData.repeat_frequency || "",
      status: taskData.status || "pending",
      notes: taskData.notes || "",
      image: null, // Image will be added if provided
      start_time: taskData.start_time,
      end_time: taskData.end_time,
      color_code: taskData.color_code,
      alarm_enabled: taskData.alarm_enabled || false,
      assigned_to: taskData.assigned_to || [],
      created_by: taskData.created_by,
      tools: taskData.tools || [],
      materials: taskData.materials || [],
      facility: taskData.facility, // Save only the foreign key for facility
      machine: taskData.machine, // Save only the foreign key for machine
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    console.log("sanitizedTaskData.materials",sanitizedTaskData.materials)
    // Decrement material quantities
    if (sanitizedTaskData.materials && sanitizedTaskData.materials.length > 0) {
      await decrementMaterialCount(sanitizedTaskData.materials);
    }
    // Pass the sanitized task data and file to the service (file may be null)
    const result = await taskService.createTask(sanitizedTaskData, req.file);
    console.log("created task",result);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(400).json({ error: "Failed to create task", details: error.message });
  }
};
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
    console.log(tasks);
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
    const uuid = req.params.id; // Document ID
    const isMultipart = req.is('multipart/form-data');
    let updateData = { ...req.body };
      // If status is provided, calculate the color code
    if (updateData.status) {
      updateData.color_code = getColorForStatus(updateData.status);
    }
  
    if (isMultipart) {
      // Handle file upload via multer
      upload.single('image')(req, res, async (err) => {
        if (err) {
          return res.status(400).json({ error: 'Failed to process file upload', details: err.message });
        }

        const file = req.file;

        if (file) {
          // Check if the task already has an image and remove the old one
          const task = await db.get(uuid); // Fetch the task document

          if (task.image) {
            // If there's an existing image, you may want to delete the old one
            const oldImageName = task.image.split('/').pop(); // Extract the image name from the URL
            try {
              await deleteAttachment(uuid, oldImageName); // Function to delete the old image attachment
            } catch (deleteError) {
              return res.status(500).json({ error: 'Failed to delete old image', details: deleteError.message });
            }
          }

          // Save the new image as an attachment in CouchDB
          const fileBuffer = file.buffer; // Image as Buffer
          const fileName = file.originalname;
          const mimeType = file.mimetype;

          try {
            // Save the new image as an attachment
            const attachmentResponse = await saveAttachment(uuid, fileBuffer, fileName, mimeType);

            // Get the URL or reference of the new attachment (CouchDB attachment URL)
            const imageUrl = `/path_to_attachments/${fileName}`; // Customize this URL as needed based on your CouchDB setup
            updateData.image = imageUrl; // Store the new image URL in the image field

          } catch (saveError) {
            return res.status(500).json({ error: 'Failed to save new image', details: saveError.message });
          }
        }
         
        // Proceed with updating the task document with the new image URL
        await taskService.updateTask(uuid, updateData, res);
      });
    } else {
      // Handle JSON update (no file upload)
      await taskService.updateTask(uuid, updateData, res);
    }
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(400).json({ error: 'Failed to update task', details: error.message });
  }
};
const deleteAttachment = async (uuid, fileName) => {
  try {
    // Fetch the document containing the attachment
    const taskDoc = await db.get(uuid);

    if (taskDoc._attachments && taskDoc._attachments[fileName]) {
      // Remove the attachment from the document
      delete taskDoc._attachments[fileName];

      // Update the document in the database
      const response = await db.insert(taskDoc);
      console.log(`Deleted attachment ${fileName} for task ${uuid}:`, response);
    } else {
      console.log(`Attachment ${fileName} not found for task ${uuid}`);
    }
  } catch (error) {
    throw new Error(`Failed to delete attachment ${fileName}: ${error.message}`);
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
