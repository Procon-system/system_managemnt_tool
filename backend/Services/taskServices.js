
const { db } = require('../config/couchdb'); // Assuming the connection file is `couchConnection.js`
const TaskModel = require('../Models/TaskSchema'); // Import the TaskModel schema
const { saveAttachment } = require('./imageService');
const {incrementMaterialCount} = require('../utils/decIncLogic');
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

    return { message: "Task created successfully", taskData };
  } catch (error) {
    throw new Error(`Failed to create task: ${error.message}`);
  }
};
const getAllTasks = async () => {
  try {
    // Step 1: Fetch all tasks
    const result = await db.find({
      selector: {
        type: 'task',
        status: { $ne: 'done' },
      },
      sort: [{ updated_at: 'desc' }],
    });

    const tasks = result.docs;

    // Step 2: Extract unique IDs for foreign keys
    const userIds = new Set();
    const toolIds = new Set();
    const materialIds = new Set();

    tasks.forEach(task => {
      task.assigned_to?.forEach(userId => userIds.add(userId));
      task.tools?.forEach(toolId => toolIds.add(toolId));
      task.materials?.forEach(materialId => materialIds.add(materialId));
    });

    // Step 3: Fetch related documents for users, tools, and materials
    const [users, tools, materials] = await Promise.all([
      fetchDocuments([...userIds], 'user'),
      fetchDocuments([...toolIds], 'tool'),
      fetchDocuments([...materialIds], 'material')
    ]);

    // Step 4: Map related documents by ID for quick lookup
    const userMap = users.reduce((map, user) => {
      map[user._id] = user;
      return map;
    }, {});

    const toolMap = tools.reduce((map, tool) => {
      map[tool._id] = tool;
      return map;
    }, {});

    const materialMap = materials.reduce((map, material) => {
      map[material._id] = material;
      return map;
    }, {});

    // Step 5: Populate tasks with related details
    const populatedTasks = tasks.map(task => ({
      ...task,
      assigned_to: task.assigned_to?.map(userId => userMap[userId]) || [],
      tools: task.tools?.map(toolId => toolMap[toolId]) || [],
      materials: task.materials?.map(materialId => materialMap[materialId]) || [],
    }));

    return populatedTasks;
  } catch (error) {
    throw new Error(`Failed to fetch tasks: ${error.message}`);
  }
};
// Helper function to fetch related documents based on the type and ids
const fetchDocuments = async (ids, type) => {
  try {
    const result = await db.find({
      selector: {
        _id: { $in: ids },
        type: type,
      },
    });
    return result.docs;
  } catch (error) {
    throw new Error(`Failed to fetch related ${type} documents: ${error.message}`);
  }
};
/**
 * Fetch a task by its ID.
 */
const getTaskById = async (id) => {
  try {
    const task = await db.get(id);

    // Fetch related data for users, tools, and materials
    const [userIds, toolIds, materialIds] = await Promise.all([
      fetchDocuments([...(task.assigned_to || [])], 'user'),
      fetchDocuments([...(task.tools || [])], 'tool'),
      fetchDocuments([...(task.materials || [])], 'material'),
    ]);

    // Map data for easy lookup
    const userMap = userIds.reduce((map, user) => {
      map[user._id] = user;
      return map;
    }, {});

    const toolMap = toolIds.reduce((map, tool) => {
      map[tool._id] = tool;
      return map;
    }, {});

    const materialMap = materialIds.reduce((map, material) => {
      map[material._id] = material;
      return map;
    }, {});

    // Populate task with related details
    return {
      ...task,
      assigned_to: task.assigned_to?.map(userId => userMap[userId]) || [],
      tools: task.tools?.map(toolId => toolMap[toolId]) || [],
      materials: task.materials?.map(materialId => materialMap[materialId]) || [],
    };
  } catch (error) {
    throw new Error(`Failed to fetch task by ID: ${error.message}`);
  }
};
/**
 * Update an existing task by ID.
 */
const updateTask = async (id, updateData, res) => {
  try {
    // Fetch the existing task to ensure the _rev is current
    const existingTask = await db.get(id);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }
    if (updateData.status === "done" && existingTask.materials) {
          await incrementMaterialCount(existingTask.materials); // Increment the material count
        }
    // Merge the updates with the existing task
    const updatedTask = {
      ...existingTask,
      ...updateData,
      _id: existingTask._id, // Ensure _id is preserved
      updated_at: new Date().toISOString(),
    };
    // Save the updated task
    const response = await db.insert(updatedTask);

    // Return the updated task
    res.status(200).json({
      message: 'Task updated successfully',
      task: { ...updatedTask, _rev: response.rev },
    });
  } catch (error) {
    console.error('Error performing task update:', error);
    res.status(500).json({ error: 'Failed to update task', details: error.message });
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
        type: 'task',
        assigned_to: { $elemMatch: { $eq: userId } },
        status: { $ne: 'done' },
      },
    });
    const tasks = result.docs;

    // Step 1: Extract unique IDs for tools and materials across all tasks
    const toolIds = new Set();
    const materialIds = new Set();
    const userIds = new Set();
    
    tasks.forEach(task => {
      task.assigned_to?.forEach(userId => userIds.add(userId));
      task.tools?.forEach(toolId => toolIds.add(toolId));
      task.materials?.forEach(materialId => materialIds.add(materialId));
    });

    // Step 2: Fetch related documents for tools and materials
    const [users,tools, materials] = await Promise.all([
      fetchDocuments([...userIds], 'user'),
      fetchDocuments([...toolIds], 'tool'),
      fetchDocuments([...materialIds], 'material')
    ]);

    // Step 3: Map related documents by ID for quick lookup
    const userMap = users.reduce((map, user) => {
      map[user._id] = user;
      return map;
    }, {});

    const toolMap = tools.reduce((map, tool) => {
      map[tool._id] = tool;
      return map;
    }, {});

    const materialMap = materials.reduce((map, material) => {
      map[material._id] = material;
      return map;
    }, {});

    // Step 4: Populate tasks with related tools and materials data
    return tasks.map(task => ({
      ...task,
      assigned_to: task.assigned_to?.map(userId => userMap[userId]).filter(user => user) || [],
      tools: task.tools?.map(toolId => toolMap[toolId]).filter(tool => tool) || [],
      materials: task.materials?.map(materialId => materialMap[materialId]).filter(material => material) || [],
    }));
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
        type: 'task',
        status: 'done',
      },
    });
    const tasks = result.docs;

    // Step 1: Extract IDs for related documents (users, tools, and materials)
    const userIds = new Set();
    const toolIds = new Set();
    const materialIds = new Set();

    tasks.forEach(task => {
      task.assigned_to?.forEach(userId => userIds.add(userId));
      task.tools?.forEach(toolId => toolIds.add(toolId));
      task.materials?.forEach(materialId => materialIds.add(materialId));
    });

    // Step 2: Fetch related documents
    const [users, tools, materials] = await Promise.all([
      fetchDocuments([...userIds], 'user'),
      fetchDocuments([...toolIds], 'tool'),
      fetchDocuments([...materialIds], 'material')
    ]);

    // Step 3: Map related documents by ID
    const userMap = users.reduce((map, user) => {
      map[user._id] = user;
      return map;
    }, {});

    const toolMap = tools.reduce((map, tool) => {
      map[tool._id] = tool;
      return map;
    }, {});

    const materialMap = materials.reduce((map, material) => {
      map[material._id] = material;
      return map;
    }, {});

    // Step 4: Populate tasks with related data
    return tasks.map(task => ({
      ...task,
      assigned_to: task.assigned_to?.map(userId => userMap[userId]).filter(user => user) || [],
      tools: task.tools?.map(toolId => toolMap[toolId]).filter(tool => tool) || [],
      materials: task.materials?.map(materialId => materialMap[materialId]).filter(material => material) || [],
    }));
  } catch (error) {
    throw new Error(`Failed to fetch done tasks: ${error.message}`);
  }
};
/**
 * Fetch 'done' tasks for a specific user.
 */
const fetchDoneTasksForUser = async (userId) => {
  try {
    // Step 1: Fetch 'done' tasks for the user
    const result = await db.find({
      selector: {
        type: TaskModel.type,
        status: 'done',
        assigned_to: { $elemMatch: { $eq: userId } },
      },
    });

    const tasks = result.docs;

    // Step 2: Extract unique IDs for related documents (tools and materials)
    const toolIds = new Set();
    const materialIds = new Set();
    const userIds = new Set();

    tasks.forEach(task => {
      task.assigned_to?.forEach(userId => userIds.add(userId));
      task.tools?.forEach(toolId => toolIds.add(toolId));
      task.materials?.forEach(materialId => materialIds.add(materialId));
    });

    // Step 3: Fetch related documents (tools and materials)
    const [users,tools, materials] = await Promise.all([
      fetchDocuments([...userIds], 'user'),
      fetchDocuments([...toolIds], 'tool'),
      fetchDocuments([...materialIds], 'material'),
    ]);

    // Step 4: Map related documents by ID for quick lookup
    const userMap = users.reduce((map, user) => {
      map[user._id] = user;
      return map;
    }, {});

    const toolMap = tools.reduce((map, tool) => {
      map[tool._id] = tool;
      return map;
    }, {});

    const materialMap = materials.reduce((map, material) => {
      map[material._id] = material;
      return map;
    }, {});

    // Step 5: Populate tasks with related tools and materials data
    const populatedTasks = tasks.map(task => ({
      ...task,
      assigned_to: task.assigned_to?.map(userId => userMap[userId]).filter(user => user) || [],
      tools: task.tools?.map(toolId => toolMap[toolId]).filter(tool => tool) || [],
      materials: task.materials?.map(materialId => materialMap[materialId]).filter(material => material) || [],
    }));

    return populatedTasks;
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
