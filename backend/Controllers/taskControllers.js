
const taskService = require('../Services/taskServices'); 
const User = require('../Models/UserSchema');
const Facility = require('../Models/FacilitySchema');
const Machine = require('../Models/MachineSchema');
const Tool = require('../Models/ToolsSchema');
const Material = require('../Models/MaterialsSchema');
// const { ObjectId } = require('mongodb');
const convertUuidToObjectId = require('../Helper/changeUuid');
const getColorForStatus =require('../utils/getColorForStatus');
// const uploadFileToGridFS = require('../utils/uploadImage'); // Import the upload function
const { v4: uuidv4 } = require('uuid'); // UUID for unique IDs
// const createTask = async (req, res) => {
//   try {
//     // Extract task data from the request body
//     const taskData = req.body.taskData || req.body;

//     console.log("Received task data:", taskData);

//     // Validate required fields
//     if (!taskData || !taskData.start_time || !taskData.end_time) {
//       return res.status(400).json({ error: "Missing required fields: start_time or end_time" });
//     }

//     // Convert start_time and end_time to ISO format
//     taskData.start_time = new Date(taskData.start_time).toISOString();
//     taskData.end_time = new Date(taskData.end_time).toISOString();

//     // Generate a unique ID for the task if not provided
//     if (!taskData._id) {
//       taskData._id = `task:${uuidv4()}`;
//     }

//     // Set created_by field from authenticated user
//     taskData.created_by = req.user.id;

//     // Assign default or computed color code based on status
//     taskData.color_code = getColorForStatus(taskData.status || "pending");
//      // Include only required fields for CouchDB
//     const sanitizedTaskData = {
//       _id: taskData._id,
//       type: "task",
//       title: taskData.title || "",
//       service_location: taskData.service_location || "",
//       task_period: taskData.task_period || "",
//       repeat_frequency: taskData.repeat_frequency || "",
//       status: taskData.status || "pending",
//       notes: taskData.notes || "",
//       image: taskData.image || null,
//       start_time: taskData.start_time,
//       end_time: taskData.end_time,
//       color_code: taskData.color_code,
//       alarm_enabled: taskData.alarm_enabled || false,
//       assigned_to: taskData.assigned_to || [],
//       created_by: taskData.created_by,
//       tools: taskData.tools || [],
//       materials: taskData.materials || [],
//       facility: taskData.facility, // Save only the foreign key for facility
//       machine: taskData.machine, // Save only the foreign key for machine
//       created_at: new Date().toISOString(),
//       updated_at: new Date().toISOString(),
//     };

//     // Create the new task
//     const newTask = await taskService.createTask(sanitizedTaskData);
//     res.status(201).json(newTask);
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(400).json({ error: "Failed to create task", details: error.message });
//   }
// };
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
    taskData.color_code = getColorForStatus(taskData.status || "pending");

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

    // Pass the sanitized task data and file to the service (file may be null)
    const result = await taskService.createTask(sanitizedTaskData, req.file);

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
// const getImage = async (req, res) => {
//   try {
//     // const fileId = new mongoose.Types.ObjectId(req.params.id);

//     // Call the service to fetch the image
//     const image = await taskService.fetchImage(fileId);

//     // Pipe the image data to the response
//     res.set('Content-Type', 'image/jpeg'); // Set appropriate content type
//     return res.send(image);
//   } catch (error) {
//     console.error('Error:', error);
//     res.status(error.status || 500).json({ error: error.error || 'Failed to fetch image' });
//   }
// };
// const createTask = async (req, res) => {
//   try {
//     // Check if the data is wrapped in { taskData } or is flat
//     const taskData = req.body.taskData || req.body;

//     // Log the incoming data for debugging
//     console.log("Received task data:", taskData);

//     if (!taskData || !taskData.start_time || !taskData.end_time) {
//       return res.status(400).json({ error: "Missing required fields: start_time or end_time" });
//     }

//     taskData.start_time = new Date(taskData.start_time);
//     taskData.end_time = new Date(taskData.end_time);
//     // If an image file is uploaded, handle the upload
//     // if (req.file) {
//     //   const uploadResult = await uploadFileToGridFS(req.file);
//     //   taskData.image = uploadResult.file._id; // Store the image file's ObjectId in the task
//     // }
//     // Remove any client-generated _id to let MongoDB generate it
//     delete taskData._id;
//     taskData.created_by = req.user.id;
//     if (taskData.status) {
//             taskData.color_code = getColorForStatus(taskData.status);
//           } else {
//             taskData.color_code = getColorForStatus("pending"); // Default to 'pending' if no status is provided
//           }
//    // Format task data by resolving facility, machine, tools, and materials
//   //  await formatTaskData(taskData);

//    // Create the new task with formatted data
//    const newTask = await taskService.createTask(taskData);
//    res.status(201).json(newTask);
//  } catch (error) {
//    console.error("Error:", error);
//    res.status(400).json({ error: 'Failed to create task', details: error.message });
//  }
// };
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
// const updateTask = async (req, res) => {
  
//   try {
//     const uuid = req.params.id;  // Get the UUID from the request params
//   const taskId = convertUuidToObjectId(uuid);  // Convert UUID to ObjectId

//     // Ensure the taskId is a valid ObjectId
//     if (!ObjectId.isValid(taskId)) {
//       return res.status(400).json({ error: 'Invalid task ID' });
//     }
//     const updateData = { ...req.body };

//     // If status is provided, calculate the color code
//     if (updateData.status) {
//       updateData.color_code = getColorForStatus(updateData.status);
//     }
//     // If an image file is uploaded, handle the upload and associate the file with the task
//     // if (req.file) {
//     //   // Upload the image and get the file's MongoDB ObjectId
//     //   const uploadResult = await uploadFileToGridFS(req.file);
//     //   updateData.image = uploadResult.file._id; // Associate the file's ObjectId with the task
//     // }
//     // Call the updateTask service with the valid ObjectId and update data
//     const updatedTask = await taskService.updateTask(taskId, updateData);

//     if (!updatedTask) {
//       return res.status(404).json({ error: 'Task not found' });
//     }

//     res.status(200).json(updatedTask);
//   } catch (error) {
//     console.log("er",error);
//     res.status(400).json({ error: 'Failed to update task', details: error.message });
//   }
// };
// const updateTask = async (req, res) => {
//   try {
//     const uuid = req.params.id; // Document ID

//     // Fetch the existing task from the database
//     const existingTask = await taskService.getTaskById(uuid);
//     if (!existingTask) {
//       return res.status(404).json({ error: "Task not found" });
//     }
//     console.log("exisitng task",existingTask)
//     const updateData = { ...req.body };
//     console.log("updating task",updateData);
//     // Update color_code dynamically if status is provided
//     if (updateData.status && updateData.status !== existingTask.status) {
//       updateData.color_code = getColorForStatus(updateData.status);
//     }

//     // Merge the updates while ensuring `_id` and `_rev` are preserved
//     const updatedTaskData = {
//       ...existingTask,
//       ...updateData,
//       _id: existingTask._id, // Preserve the original document ID
//       _rev: existingTask._rev, // Use the latest revision
//       updated_at: new Date().toISOString(), // Add a timestamp
//     };
//   console.log("updated",updatedTaskData);
//     // Save the updated document
//     const response = await taskService.updateTask(uuid, updatedTaskData);

//     // Respond with the updated task
//     res.status(200).json({
//       message: "Task updated successfully",
//       task: { ...updatedTaskData, _rev: response.rev }, // Ensure the new `_rev` is returned
//     });
//   } catch (error) {
//     console.error("Error updating task:", error);
//     res.status(400).json({ error: "Failed to update task", details: error.message });
//   }
// };
const multer = require('multer');
const path = require('path');
const upload = multer({
  dest: path.join(__dirname, 'uploads'), // Temporary directory for file uploads
});

const updateTask = async (req, res) => {
  try {
    const uuid = req.params.id; // Document ID

    // Check Content-Type
    const isMultipart = req.is('multipart/form-data');

    let updateData = {};

    if (isMultipart) {
      // Parse multipart/form-data
      upload.single('image')(req, res, async (err) => {
        if (err) {
          return res.status(400).json({ error: 'Failed to process file upload', details: err.message });
        }

        // Extract fields and file
        const fields = req.body;
        const file = req.file;

        updateData = { ...fields };

        if (file) {
          // Process the image (e.g., upload to GridFS, Cloudinary, or save locally)
          const imageUrl = `/uploads/${file.filename}`; // Replace with your upload logic
          updateData.image = imageUrl;
        }

        // Proceed with task update logic
        await performTaskUpdate(uuid, updateData, res);
      });
    } else {
      // Handle JSON
      updateData = { ...req.body };
      await performTaskUpdate(uuid, updateData, res);
    }
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(400).json({ error: 'Failed to update task', details: error.message });
  }
};

// Helper function to handle task updates
const performTaskUpdate = async (uuid, updateData, res) => {
  try {
    // Fetch the existing task
    const existingTask = await taskService.getTaskById(uuid);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Update color_code dynamically if status changes
    if (updateData.status && updateData.status !== existingTask.status) {
      updateData.color_code = getColorForStatus(updateData.status);
    }

    // Merge updates with the existing task
    const updatedTaskData = {
      ...existingTask,
      ...updateData,
      updated_at: new Date().toISOString(),
    };

    // Save the updated task
    const response = await taskService.updateTask(uuid, updatedTaskData);

    res.status(200).json({
      message: 'Task updated successfully',
      task: { ...updatedTaskData, _rev: response.rev },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task', details: error.message });
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
  // getImage,
  getTasksByAssignedUser,
  getAllDoneTasks,
  getDoneTasksForUser,
  createTaskFromMachine,
};
