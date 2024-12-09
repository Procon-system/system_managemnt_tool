
const { db } = require('../config/couchdb'); // Assuming the connection file is `couchConnection.js`
const TaskModel = require('../Models/TaskSchema'); // Import the TaskModel schema
const { saveAttachment } = require('./imageService');

/**
 * Format a task based on the TaskModel schema.
 * This ensures all tasks conform to the expected structure.
 */
const formatTask = (taskData) => {
  const formattedTask = { ...TaskModel, ...taskData }; // Merge defaults with provided data
  formattedTask.created_at = formattedTask.created_at || new Date().toISOString(); // Auto-set creation time
  formattedTask.updated_at = new Date().toISOString(); // Auto-set update time
  return formattedTask;
};

/**
 * Create a new task in CouchDB and save the image as an attachment if provided.
 * @param {Object} taskData - Data for the task document.
 * @param {Object|null} file - File object from Multer (if any).
 */
const createTask = async (taskData, file) => {
  try {
    // Save the task document in CouchDB
    await db.insert(taskData);

    // If a file is provided, save it as an attachment
    if (file) {
      const attachmentResponse = await saveAttachment(
        taskData._id,
        file.buffer,
        file.originalname,
        file.mimetype
      );

      // Update the task with the attachment info (optional)
      taskData.image = file.originalname; // Or some meaningful identifier
      await db.insert({ ...taskData, _rev: attachmentResponse.rev });
    }

    return { message: "Task created successfully", taskId: taskData._id };
  } catch (error) {
    throw new Error(`Failed to create task: ${error.message}`);
  }
};

const getAllTasks = async () => {
  try {
    const result = await db.find({
      selector: {
        type: 'task',               // Match documents with type 'task'
        status: { $ne: 'done' },    // Exclude 'done' tasks
      },
      sort: [{ updated_at: 'desc' }], // Sort by most recent update
    });
    return result.docs;
  } catch (error) {
    throw new Error(`Failed to fetch tasks: ${error.message}`);
  }
};
/**
 * Fetch a task by its ID.
 */
const getTaskById = async (id) => {
  try {
    const task = await db.get(id);
    return task;
  } catch (error) {
    throw new Error(`Failed to fetch task by ID: ${error.message}`);
  }
};

/**
 * Update an existing task by ID.
 */
const updateTask = async (id, updateData) => {
  try {
    // Fetch the latest task to ensure the `_rev` is current
    const existingTask = await db.get(id);

    // Merge updates with the existing task
    const updatedTask = {
      ...existingTask,
      ...updateData,
      updated_at: new Date().toISOString(),
    };

    // Save the updated task
    const response = await db.insert(updatedTask);
    return { ...updatedTask, _rev: response.rev }; // Return updated task with new `_rev`
  } catch (error) {
    throw new Error(`Failed to update task: ${error.message}`);
  }
};

/**
 * Delete a task by ID.
 */
const deleteTask = async (id) => {
  try {
    const task = await db.get(id); // Fetch task to get `_rev`
    const response = await db.destroy(id, task._rev);
    return response;
  } catch (error) {
    throw new Error(`Failed to delete task: ${error.message}`);
  }
};

/**
 * Fetch tasks assigned to a specific user.
 */
const getTasksByAssignedUser = async (userId) => {
  try {
    const result = await db.find({
      selector: {
        type: TaskModel.type,
        assigned_to: { $elemMatch: { $eq: userId } }, // Check if userId is in the array
        status: { $ne: 'done' },
      },
    });
    return result.docs;
  } catch (error) {
    throw new Error(`Failed to fetch tasks for user: ${error.message}`);
  }
};

/**
 * Fetch all 'done' tasks.
 */
const fetchAllDoneTasks = async () => {
  try {
    const result = await db.find({
      selector: {
        type: TaskModel.type,
        status: 'done',
      },
    });
    return result.docs;
  } catch (error) {
    throw new Error(`Failed to fetch done tasks: ${error.message}`);
  }
};

/**
 * Fetch 'done' tasks for a specific user.
 */
const fetchDoneTasksForUser = async (userId) => {
  try {
    const result = await db.find({
      selector: {
        type: TaskModel.type,
        status: 'done',
        assigned_to: { $elemMatch: { $eq: userId } },
      },
    });
    return result.docs;
  } catch (error) {
    throw new Error(`Failed to fetch done tasks for user: ${error.message}`);
  }
};

/**
 * Fetch an image attachment by task ID.
 */
const fetchImage = async (taskId) => {
  try {
    const task = await db.get(taskId); // Fetch the task document

    if (task._attachments) {
      // Get all attachment keys (image names)
      const attachmentKeys = Object.keys(task._attachments);

      if (attachmentKeys.length === 0) {
        throw new Error('No attachments found for this task');
      }

      // Assume the latest image is the last one added (or use a naming convention to identify it)
      const latestImageName = attachmentKeys[attachmentKeys.length - 1 ];

      // Fetch the attachment based on whether it's a stub
      const attachmentDetails = task._attachments[latestImageName];
      if (attachmentDetails.stub) {
        console.log("Attachment is a stub, fetching the full attachment...");
        const attachment = await db.attachment.get(taskId, latestImageName, { rev: task._rev }); // Fetch full attachment
        return { buffer: attachment, name: latestImageName }; // Return the image buffer and name
      } else {
        const buffer = await db.attachment.get(taskId, latestImageName); // Fetch as usual
        return { buffer, name: latestImageName }; // Return the image buffer and name
      }
    } else {
      throw new Error('No attachments found for this task');
    }
  } catch (error) {
    console.error('Error fetching image:', error.message);
    throw new Error(`Failed to fetch image: ${error.message}`);
  }
};

const getImage = async (req, res) => {
  try {
    const taskId = req.params.id; // Get task ID from the request
    const { buffer, name } = await fetchImage(taskId); // Fetch the latest image buffer and name

    // Determine the content type based on the file extension (basic example)
    const extension = name.split('.').pop().toLowerCase();
    const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg'; // Add more cases as needed

    // Set the appropriate content-type for the image
    res.setHeader('Content-Type', mimeType);

    // Send the image buffer in the response
    res.send(buffer);
  } catch (error) {
    console.error('Error fetching image:', error.message);
    res.status(500).json({ error: 'Failed to fetch image', details: error.message });
  }
};

/**
 * Create a task linked to a specific machine.
 */
const createTaskFromMachine = async (machineId, taskData) => {
  try {
    const task = formatTask({ ...taskData, machine_id: machineId });
    const response = await db.insert(task);
    return response;
  } catch (error) {
    throw new Error(`Failed to create task for machine: ${error.message}`);
  }
};

module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getImage,
  fetchAllDoneTasks,
  fetchDoneTasksForUser,
  getTasksByAssignedUser,
  createTaskFromMachine,
};
