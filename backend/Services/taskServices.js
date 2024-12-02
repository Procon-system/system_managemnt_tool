
const Task = require('../Models/TaskSchema'); 
const { ObjectId } = require('mongodb');
const { GridFSBucket } = require('mongodb');
const mongoose = require('mongoose');
const createTask = async (taskData) => {
  
  const task = new Task(taskData);
  return await task.save();
};
const getTasksByAssignedUser = async (userId) => {
  return Task.find({
    assigned_to: { $in: [userId] }, // Check if userId is in the assigned_to array
    status: { $ne: 'done' },       // Exclude tasks with 'done' status
  });
};

/**
 * Fetch tasks by filters
 * @param {Object} filters - Query filters for fetching tasks
 * @returns {Array} - Array of tasks matching the filters
 */
const fetchTasksByFilters = async (filters = {}) => {
  try {
    const tasks = await Task.find(filters).sort({ updatedAt: -1 }); // Sort by most recent
    return tasks;
  } catch (error) {
    throw new Error('Error fetching tasks: ' + error.message);
  }
};

const fetchDoneTasksForUser = async (userId) => {
  try {
    return await fetchTasksByFilters({ status: 'done', assigned_to: userId });
  } catch (error) {
    throw new Error('Error fetching done tasks for user: ' + error.message);
  }
};

const fetchAllDoneTasks = async () => {
  try {
    return await fetchTasksByFilters({ status: 'done' });
  } catch (error) {
    throw new Error('Error fetching all done tasks: ' + error.message);
  }
}
const fetchImage = async (fileId) => {
  return new Promise((resolve, reject) => {
    const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
     console.log("image comming",bucket)
    try {
      const downloadStream = bucket.openDownloadStream(fileId);

      downloadStream.on('data', (chunk) => {
        resolve(chunk); // Resolve when data is available
      });

      downloadStream.on('error', (error) => {
        console.error('Error fetching image:', error);
        reject({ status: 404, error: 'Image not found' });
      });
    } catch (error) {
      reject({ status: 500, error: 'Failed to fetch image' });
    }
  });
};

const getAllTasks = async () => {
  try {
    const tasks = await Task.find({ status: { $ne: 'done' } })
      .populate('facility machine assigned_to created_by tools materials') // `virtuals` is already set in schema, no need to set here
      .exec();

    if (!tasks || tasks.length === 0) {
      console.log('No tasks found.');
      return;
    }

    // tasks.forEach(task => {
    //   console.log('Populated assigned_to:', task.assigned_to);
    //   console.log('Populated tools:', task.tools);
    //   console.log('Populated materials:', task.materials);
    //   console.log('Assigned Resources:', task.assigned_resources); // Should now display correctly
    // });

    return tasks;
  } catch (error) {
    console.error('Error fetching tasks:', error);
  }
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
  fetchImage,
  fetchAllDoneTasks,
  fetchDoneTasksForUser,
  getTasksByAssignedUser,
  createTaskFromMachine,
};
