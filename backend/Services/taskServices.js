
// const Task = require('../Models/TaskSchema'); 
// const { ObjectId } = require('mongodb');
// const { GridFSBucket } = require('mongodb');
// const mongoose = require('mongoose');
// const createTask = async (taskData) => {
  
//   const task = new Task(taskData);
//   return await task.save();
// };
// const getTasksByAssignedUser = async (userId) => {
//   return Task.find({
//     assigned_to: { $in: [userId] }, // Check if userId is in the assigned_to array
//     status: { $ne: 'done' },       // Exclude tasks with 'done' status
//   });
// };

// const fetchTasksByFilters = async (filters = {}) => {
//   try {
//     const tasks = await Task.find(filters).sort({ updatedAt: -1 }); // Sort by most recent
//     return tasks;
//   } catch (error) {
//     throw new Error('Error fetching tasks: ' + error.message);
//   }
// };

// const fetchDoneTasksForUser = async (userId) => {
//   try {
//     return await fetchTasksByFilters({ status: 'done', assigned_to: userId });
//   } catch (error) {
//     throw new Error('Error fetching done tasks for user: ' + error.message);
//   }
// };

// const fetchAllDoneTasks = async () => {
//   try {
//     return await fetchTasksByFilters({ status: 'done' });
//   } catch (error) {
//     throw new Error('Error fetching all done tasks: ' + error.message);
//   }
// }
// const fetchImage = async (fileId) => {
//   return new Promise((resolve, reject) => {
//     const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
//      console.log("image comming",bucket)
//     try {
//       const downloadStream = bucket.openDownloadStream(fileId);

//       downloadStream.on('data', (chunk) => {
//         resolve(chunk); // Resolve when data is available
//       });

//       downloadStream.on('error', (error) => {
//         console.error('Error fetching image:', error);
//         reject({ status: 404, error: 'Image not found' });
//       });
//     } catch (error) {
//       reject({ status: 500, error: 'Failed to fetch image' });
//     }
//   });
// };

// const getAllTasks = async () => {
//   try {
//     const tasks = await Task.find({ status: { $ne: 'done' } })
//       .populate('facility machine assigned_to created_by tools materials') // `virtuals` is already set in schema, no need to set here
//       .exec();

//     if (!tasks || tasks.length === 0) {
//       console.log('No tasks found.');
//       return;
//     }

//     return tasks;
//   } catch (error) {
//     console.error('Error fetching tasks:', error);
//   }
// };

// const getTaskById = async (id) => {
//   return await Task.findById(id).populate('facility machine assigned_to created_by tools materials');
// };

// const updateTask = async (id, updateData) => {
//    // Cast the id to ObjectId if it's not already
//    const objectId = ObjectId.isValid(id) ? new ObjectId(id) : id;

//    // Proceed with the update
//    return await Task.findByIdAndUpdate(objectId, updateData, { new: true });
//  };

// const deleteTask = async (id) => {
//   return await Task.findByIdAndDelete(id);
// };

// const createTaskFromMachine = async (machineId, taskData) => {
//   const task = new Task({ machine: machineId, ...taskData });
//   return await task.save();
// };

// module.exports = {
//   createTask,
//   getAllTasks,
//   getTaskById,
//   updateTask,
//   deleteTask,
//   fetchImage,
//   fetchAllDoneTasks,
//   fetchDoneTasksForUser,
//   getTasksByAssignedUser,
//   createTaskFromMachine,
// };
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

// /**
//  * Create a new task in CouchDB.
//  * @param {Object} taskData - Data for the task document.
//  * @param {Object} file - File object from Multer (if any).
//  */
// const createTask = async (taskData, file) => {
//   try {
//     // Generate a unique task ID if not provided
//     const taskId = taskData._id || `task:${uuidv4()}`;

//     // Create the initial task document
//     const taskDoc = {
//       ...taskData,
//       _id: taskId,
//       type: 'task',
//       created_at: new Date().toISOString(),
//       updated_at: new Date().toISOString(),
//     };

//     // Save the task document to CouchDB
//     await db.insert(taskDoc);

//     // If a file is provided, save it as an attachment
//     if (file) {
//       await saveAttachment(taskId, file.buffer, file.originalname, file.mimetype);
//     }

//     return { message: 'Task created successfully', taskId };
//   } catch (error) {
//     throw new Error(`Failed to create task: ${error.message}`);
//   }
// };

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
/**
 * Create a new task in CouchDB.
 */
// const createTask = async (taskData) => {
//   try {
//     const task = formatTask(taskData);
//     const response = await db.insert(task);
//     return response;
//   } catch (error) {
//     throw new Error(`Failed to create task: ${error.message}`);
//   }
// };

/**
 * Fetch all tasks except those marked as 'done'.
 */
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
        assigned_to: userId,
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
    const buffer = await db.attachment.get(taskId, 'image');
    return buffer; // Return image data as a buffer
  } catch (error) {
    throw new Error(`Failed to fetch image: ${error.message}`);
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
  fetchImage,
  fetchAllDoneTasks,
  fetchDoneTasksForUser,
  getTasksByAssignedUser,
  createTaskFromMachine,
};
