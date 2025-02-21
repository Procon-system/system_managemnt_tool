
const { db } = require('../config/couchdb'); // Assuming the connection file is `couchConnection.js`
const TaskModel = require('../Models/TaskSchema'); // Import the TaskModel schema
const { saveAttachment } = require('./imageService');
const getColorForStatus =require('../utils/getColorForStatus');
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
    console.log("errro",error)
    throw new Error(`Failed to create task: ${error.message}`);
  }
};

const getAllTasks = async (batchSize = 20) => {
  try {
    let allTasks = [];
    let lastUpdatedAt = null;

    while (true) {
      // Step 1: Fetch a batch of tasks
      const query = {
        selector: {
          type: 'task',
          status: { $ne: 'done' },
          ...(lastUpdatedAt && { updated_at: { $lt: lastUpdatedAt } }) // Fetch older tasks
        },
        sort: [{ updated_at: 'desc' }],
        limit: batchSize,
      };

      const result = await db.find(query);
      const tasks = result.docs;

      if (tasks.length === 0) break; // Stop when no more tasks

      allTasks = allTasks.concat(tasks);
      lastUpdatedAt = tasks[tasks.length - 1].updated_at; // Update last timestamp for next batch
    }

    console.log(`Fetched ${allTasks.length} tasks`);

    // Step 2: Extract unique IDs for related entities
    const userIds = new Set();
    const toolIds = new Set();
    const materialIds = new Set();

    allTasks.forEach((task) => {
      if (Array.isArray(task.assigned_to)) task.assigned_to.forEach((id) => userIds.add(id));
      if (Array.isArray(task.tools)) task.tools.forEach((id) => toolIds.add(id));
      if (Array.isArray(task.materials)) task.materials.forEach((id) => materialIds.add(id));
    });

    // Step 3: Fetch related data in batches (instead of per ID)
    const [users, tools, materials] = await Promise.all([
      userIds.size ? fetchDocuments([...userIds], 'user') : Promise.resolve([]),
      toolIds.size ? fetchDocuments([...toolIds], 'tool') : Promise.resolve([]),
      materialIds.size ? fetchDocuments([...materialIds], 'material') : Promise.resolve([]),
    ]);

    // Step 4: Map related documents by ID
    const userMap = Object.fromEntries(users.map((user) => [user._id, user]));
    const toolMap = Object.fromEntries(tools.map((tool) => [tool._id, tool]));
    const materialMap = Object.fromEntries(materials.map((material) => [material._id, material]));

    // Step 5: Populate tasks with related data
    const populatedTasks = allTasks.map((task) => ({
      ...task,
      assigned_to: Array.isArray(task.assigned_to) ? task.assigned_to.map((id) => userMap[id] || {}) : [],
      tools: Array.isArray(task.tools) ? task.tools.map((id) => toolMap[id] || {}) : [],
      materials: Array.isArray(task.materials) ? task.materials.map((id) => materialMap[id] || {}) : [],
    }));

    return populatedTasks;
  } catch (error) {
    throw new Error(`Failed to fetch tasks: ${error.message}`);
  }
};

const fetchDocuments = async (ids, type) => {
  try {
    if (!ids || ids.length === 0) return []; // Prevent empty queries

    const result = await db.find({
      selector: {
        type: type,
        _id: { $in: ids.filter(Boolean) }, // Ensure valid IDs
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
const updateTask = async (id, updateData, res) => {
  try {
    console.log("Updated Data:", updateData);

    // Fetch the existing task to ensure the _rev is current
    const existingTask = await db.get(id);
    if (!existingTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Ensure assigned_to, tools, and materials are arrays (parse if needed)
    const parseIfString = (data) => {
      try {
        return typeof data === "string" ? JSON.parse(data) : data;
      } catch (error) {
        console.error("Error parsing data:", data);
        return [];
      }
    };

    const updatedTask = {
      ...existingTask,
      ...updateData,
      assigned_to: parseIfString(updateData.assigned_to || existingTask.assigned_to),
      tools: parseIfString(updateData.tools || existingTask.tools),
      materials: parseIfString(updateData.materials || existingTask.materials),
      images: updateData.images || existingTask.images || [], // Ensure images array is preserved
      _id: existingTask._id, // Ensure _id is preserved
      updated_at: new Date().toISOString(),
    };

    // If task is marked as "done", increment material count
    if (updatedTask.status === "done" && updatedTask.materials.length > 0) {
      await incrementMaterialCount(updatedTask.materials);
    }

    // Save the updated task
    const response = await db.insert(updatedTask);

    // Return the updated task
    res.status(200).json({
      message: "Task updated successfully",
      task: { ...updatedTask, _rev: response.rev },
    });
  } catch (error) {
    console.error("Error performing task update:", error);
    res.status(500).json({
      error: "Failed to update task",
      details: error.message,
    });
  }
};

const bulkUpdateTasks = async (taskUpdates) => {
  const results = [];

  for (const { id, updateData } of taskUpdates) {
    try {
      // Fetch the existing task
      const existingTask = await db.get(id);

      if (!existingTask) {
        results.push({ id, status: 'failed', message: 'Task not found' });
        continue;
      }

      // Handle status change logic
      if (updateData.status) {
        updateData.color_code = getColorForStatus(updateData.status);

        if (updateData.status === 'done' && existingTask.materials) {
          await incrementMaterialCount(existingTask.materials);
        }
      }

      // Merge updates with the existing task
      const updatedTask = {
        ...existingTask,
        ...updateData,
        _id: existingTask._id,
        updated_at: new Date().toISOString(),
      };

      // Save the updated task
      const response = await db.insert(updatedTask);

      results.push({ id, status: 'success', updatedTask: { ...updatedTask, _rev: response.rev } });
    } catch (error) {
      console.error(`Error updating task with ID ${id}:`, error.message);
      results.push({ id, status: 'failed', message: error.message });
    }
  }

  return results;
};

const deleteTask = async (id) => {
  try {
    const task = await db.get(id); // Fetch the task to get `_rev`
    await db.destroy(id, task._rev); // Delete the task
    return { id, message: 'Task deleted successfully' }; // Return ID and message
  } catch (error) {
    throw new Error(`Failed to delete task: ${error.message}`);
  }
};
const deleteBulkTasks = async (ids) => {
  try {
    // Fetch documents to get their current `_rev` values
    const tasksToDelete = await Promise.all(
      ids.map(async (id) => {
        const doc = await db.get(id); // Retrieve document
        return { ...doc, _deleted: true }; // Mark document for deletion
      })
    );

    // Use the `_bulk_docs` method to delete documents
    const result = await db.bulkDocs(tasksToDelete);

    // Filter results for success and failures
    const deletedIds = result.filter((r) => r.ok).map((r) => r.id);
    const errors = result.filter((r) => !r.ok);

    return {
      message: 'Bulk deletion completed',
      deleted: deletedIds,
      errors
    };
  } catch (error) {
    throw new Error(`Failed to delete tasks: ${error.message}`);
  }
};

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

const fetchImages = async (taskId) => {
  try {
    const task = await db.get(taskId); // Fetch the task document

    if (!task._attachments) {
      throw new Error('No attachments found for this task');
    }

    // Get all attachment keys (image names)
    const attachmentKeys = Object.keys(task._attachments);

    if (attachmentKeys.length === 0) {
      throw new Error('No attachments found for this task');
    }

    // Fetch all attachments
    const images = await Promise.all(
      attachmentKeys.map(async (imageName) => {
        const attachmentDetails = task._attachments[imageName];

        if (attachmentDetails.stub) {
          console.log(`Fetching full attachment for ${imageName}...`);
          const buffer = await db.attachment.get(taskId, imageName, { rev: task._rev });
          return { buffer, name: imageName };
        } else {
          const buffer = await db.attachment.get(taskId, imageName);
          return { buffer, name: imageName };
        }
      })
    );
 
    return images; // Return an array of images

  } catch (error) {
    console.error('Error fetching images:', error.message);
    throw new Error(`Failed to fetch images: ${error.message}`);
  }
};

const getImages = async (req, res) => {
  try {
    const taskId = req.params.id; // Get task ID from request
    const images = await fetchImages(taskId); // Fetch all images

    if (!images || images.length === 0) {
      return res.status(404).json({ error: "No images found for this task" });
    }

    // Process images into base64 for frontend use
    const formattedImages = images.map(({ buffer, name }) => {
      const extension = name.split('.').pop().toLowerCase();
      const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg'; // Extend as needed

      return {
        name,
        mimeType,
        base64: `data:${mimeType};base64,${buffer.toString('base64')}`, // Convert to base64 for display
      };
    });
    res.json({ images: formattedImages });

  } catch (error) {
    console.error("Error fetching images:", error.message);
    res.status(500).json({ error: "Failed to fetch images", details: error.message });
  }
};

const getFilteredTasks = async (filters, limit = 50, skip = 0) => {
  try {
    let query = {
      selector: { type: "task" },
      sort: [{ updated_at: "desc" }],
      limit,
      skip
    };

    // Apply filters dynamically
    if (filters.status) query.selector.status = filters.status;

    if (filters.startDate || filters.endDate) {
      query.selector.updated_at = {};
      if (filters.startDate) query.selector.updated_at.$gte = filters.startDate;
      if (filters.endDate) query.selector.updated_at.$lte = filters.endDate;
    }

    if (filters.assignedTo) {
      query.selector.assigned_to = { $all: Array.isArray(filters.assignedTo) ? filters.assignedTo : [filters.assignedTo] };
    }

    if (filters.facility) query.selector.facility = filters.facility;

    if (filters.machine) query.selector.machine = filters.machine;

    if (filters.tools) {
      query.selector.tools = {  $all: Array.isArray(filters.tools) ? filters.tools : [filters.tools] };
    }

    if (filters.materials) {
      query.selector.materials = {  $all: Array.isArray(filters.materials) ? filters.materials : [filters.materials] };
    }

    // Fetch filtered tasks
    const result = await db.find(query);
    const filteredTasks = result.docs;

    if (filteredTasks.length === 0) return [];

    // Extract unique IDs for related entities
    const userIds = new Set();
    const toolIds = new Set();
    const materialIds = new Set();
    const facilityIds = new Set();
    const machineIds = new Set();

    filteredTasks.forEach((task) => {
      if (Array.isArray(task.assigned_to)) task.assigned_to.forEach((id) => userIds.add(id));
      if (Array.isArray(task.tools)) task.tools.forEach((id) => toolIds.add(id));
      if (Array.isArray(task.materials)) task.materials.forEach((id) => materialIds.add(id));
      if (task.facility) facilityIds.add(task.facility);
      if (task.machine) machineIds.add(task.machine);
    });

    // Fetch related data in batches
    const [users, tools, materials, facilities, machines] = await Promise.all([
      userIds.size ? fetchDocuments([...userIds], "user") : Promise.resolve([]),
      toolIds.size ? fetchDocuments([...toolIds], "tool") : Promise.resolve([]),
      materialIds.size ? fetchDocuments([...materialIds], "material") : Promise.resolve([]),
      facilityIds.size ? fetchDocuments([...facilityIds], "facility") : Promise.resolve([]),
      machineIds.size ? fetchDocuments([...machineIds], "machine") : Promise.resolve([]),
    ]);

    // Map related documents by ID
    const userMap = Object.fromEntries(users.map((user) => [user._id, user]));
    const toolMap = Object.fromEntries(tools.map((tool) => [tool._id, tool]));
    const materialMap = Object.fromEntries(materials.map((material) => [material._id, material]));
    const facilityMap = Object.fromEntries(facilities.map((facility) => [facility._id, facility]));
    const machineMap = Object.fromEntries(machines.map((machine) => [machine._id, machine]));

    // Populate tasks with related data
    const populatedTasks = filteredTasks.map((task) => ({
      ...task,
      assigned_to: Array.isArray(task.assigned_to) ? task.assigned_to.map((id) => userMap[id] || {}) : [],
      tools: Array.isArray(task.tools) ? task.tools.map((id) => toolMap[id] || {}) : [],
      materials: Array.isArray(task.materials) ? task.materials.map((id) => materialMap[id] || {}) : [],
      facility: facilityMap[task.facility] || {},
      machine: machineMap[task.machine] || {},
    }));

    return populatedTasks;
  } catch (error) {
    throw new Error(`Failed to fetch filtered tasks: ${error.message}`);
  }
};

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
  bulkUpdateTasks,
  deleteTask,
  getImages,
  fetchAllDoneTasks,
  fetchDoneTasksForUser,
  getTasksByAssignedUser,
  getFilteredTasks,
  createTaskFromMachine,
  deleteBulkTasks,
};
