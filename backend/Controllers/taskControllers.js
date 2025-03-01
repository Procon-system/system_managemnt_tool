
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
const generateRecurringTasksWithinPeriod = require('../Helper/recurringFunction');
const calculateTaskPeriod = require('../Helper/taskPeriodCalc');
const crypto = require("crypto");
let io; // Variable to hold the Socket.IO instance
const { redisClient } = require("../redisClient");
// Setter to allow server.js to pass the io instance
const setTaskSocketIoInstance = (ioInstance) => {
  io = ioInstance;
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
const createTask = async (req, res) => {
  try {
    // Step 1: Extract and validate task data
    const taskData = req.body.taskData || req.body;
    console.log("Received task data:", taskData);

    if (!taskData || !taskData.start_time || !taskData.end_time || !taskData.task_period) {
      return res.status(400).json({
        error: "Missing required fields: start_time, end_time, or task_period",
      });
    }
// Calculate task_period if given in user-friendly format
try {
  taskData.task_period = calculateTaskPeriod(taskData.start_time, taskData.task_period);
  console.log(" taskData.task_period", taskData.task_period)
} catch (err) {
  return res.status(400).json({ error: err.message });
}
    // Step 2: Normalize input data
    taskData.start_time = new Date(taskData.start_time).toISOString();
    taskData.end_time = new Date(taskData.end_time).toISOString();
    const taskPeriodEnd = new Date(taskData.task_period).toISOString();

    taskData._id = taskData._id || `task:${uuidv4()}`;
    taskData.created_by = req.user.id;
    taskData.color_code = getColorForStatus(taskData.status || "pending");
    taskData.repeat_frequency = taskData.repeat_frequency || "none";

    // Step 3: Prepare the base task
    const baseTask = {
      _id: taskData._id,
      type: "task",
      title: taskData.title || "",
      service_location: taskData.service_location || "",
      task_period: taskPeriodEnd,
      repeat_frequency: taskData.repeat_frequency,
      status: taskData.status || "pending",
      notes: taskData.notes || "",
      images: taskData.images || [],  
      start_time: taskData.start_time,
      end_time: taskData.end_time,
      color_code: taskData.color_code,
      alarm_enabled: taskData.alarm_enabled || false,
      assigned_to: taskData.assigned_to || [],
      created_by: taskData.created_by,
      tools: taskData.tools || [],
      materials: taskData.materials || [],
      facility: taskData.facility,
      machine: taskData.machine,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

   

    // Step 4: Decrement material quantities if applicable
    if (baseTask.materials && baseTask.materials.length > 0) {
      await decrementMaterialCount(baseTask.materials);
    }

    // Step 5: Generate tasks (base + recurring)
    let tasksToCreate = [baseTask];

    if (taskData.repeat_frequency.toLowerCase() !== "none") {
      const recurringTasks = generateRecurringTasksWithinPeriod(
        baseTask,
        taskData.repeat_frequency,
        taskPeriodEnd
      );
      tasksToCreate = [...tasksToCreate, ...recurringTasks];
    }

    // Step 6: Save all tasks in one go
    const results = await Promise.all(
      tasksToCreate.map((task) => taskService.createTask(task, req.file))
    );
    // 🔴 **Invalidate Redis Cache after creating tasks**
    await redisClient.del("tasks");
 // ✅ Get all cached query keys
 const cachedKeys = await redisClient.sMembers("task_cache_keys");
    
 if (cachedKeys.length > 0) {
   console.log("♻️ Clearing cached filtered task queries...");
   
   // ✅ Force delete all cache keys
   await Promise.all(cachedKeys.map((key) => redisClient.del(key)));

   // ✅ Clear cache tracking set
   await redisClient.del("task_cache_keys");
 }
    // Step 7: Emit socket events for all created tasks
    if (io) {
      results.forEach((result) => {
        io.emit("taskCreated", { newTask: result.taskData });
      });
      console.log("Tasks created and events emitted:", results.map((r) => r.taskData));
    } else {
      console.error("Socket.IO instance is not set in taskController");
    }

    res.status(201).json({ message: "Tasks created successfully", results });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(400).json({ error: "Failed to create task", details: error.message });
  }
};
const getAllDoneTasks = async (req, res) => {
  try {
    const cacheKey = "doneTasks"; // Redis key for caching
    const cachedTasks = await redisClient.get(cacheKey);

    if (cachedTasks) {
      console.log("✅ Returning done tasks from cache");
      return res.status(200).json(JSON.parse(cachedTasks));
    }

    const tasks = await taskService.fetchAllDoneTasks();
    console.log("🔄 Fetching tasks from database");
    // ✅ Store result in Redis (Expire in 10 minutes)
    await redisClient.setEx(cacheKey, 600, JSON.stringify(tasks));

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// ✅ Get done tasks for a specific user (with Redis cache)
const getDoneTasksForUser = async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const cacheKey = `doneTasks:${userId}`;
    const cachedTasks = await redisClient.get(cacheKey);

    if (cachedTasks) {
      console.log(`✅ Returning cached done tasks for user ${userId}`);
      return res.status(200).json(JSON.parse(cachedTasks));
    }

    const tasks = await taskService.fetchDoneTasksForUser(userId);
    console.log("🔄 Fetching tasks from database");

    await redisClient.setEx(cacheKey, 600, JSON.stringify(tasks));

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// ✅ Get tasks assigned to a user (with Redis cache)
const getTasksByAssignedUser = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const cacheKey = `assignedTasks:${userId}`;
    const cachedTasks = await redisClient.get(cacheKey);

    if (cachedTasks) {
      console.log(`✅ Returning cached assigned tasks for user ${userId}`);
      return res.status(200).json(JSON.parse(cachedTasks));
    }

    const tasks = await taskService.getTasksByAssignedUser(userId);
    console.log("🔄 Fetching tasks from database");

    if (tasks.length === 0) {
      return res.status(404).json({ message: "No tasks found for the given user" });
    }

    await redisClient.setEx(cacheKey, 600, JSON.stringify(tasks));

    return res.status(200).json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error.message);
    return res.status(500).json({ error: "Failed to fetch tasks", details: error.message });
  }
};
// ✅ Get task by ID (with Redis cache)
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `task:${id}`;
    const cachedTask = await redisClient.get(cacheKey);

    if (cachedTask) {
      console.log(`✅ Returning cached task ID ${id}`);
      return res.status(200).json(JSON.parse(cachedTask));
    }

    const task = await taskService.getTaskById(id);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    await redisClient.setEx(cacheKey, 600, JSON.stringify(task));

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch task", details: error.message });
  }
};
const getAllTasks = async (req, res) => {
  try {
    // 🔹 Check if tasks are in Redis cache
    const cachedTasks = await redisClient.get("tasks");

    if (cachedTasks) {
      console.log("✅ Returning tasks from cache");
      return res.status(200).json(JSON.parse(cachedTasks));
    }

    // 🔹 Fetch tasks from database if not cached
    const tasks = await taskService.getAllTasks();
    console.log("🔄 Fetching tasks from database");

    // 🔹 Store in Redis with expiration (e.g., 10 minutes)
    await redisClient.setEx("tasks", 600, JSON.stringify(tasks));

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tasks", details: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const uuid = req.params.id;
    const isMultipart = req.is("multipart/form-data");
    let updateData = { ...req.body };
    // If status is provided, calculate the color code
    if (updateData.status) {
      updateData.color_code = getColorForStatus(updateData.status);
    }


    // ✅ Retry mechanism for handling document update conflicts
    const retryOperation = async (operation, retries = 3, delay = 100) => {
      for (let i = 0; i < retries; i++) {
        try {
          return await operation();
        } catch (error) {
          if (error.status !== 409) throw error; // Retry only on conflict errors
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
      throw new Error("Max retries reached due to document update conflicts");
    };

    // ✅ Perform the update operation with retries
    const response = await retryOperation(async () => {
      let task = await db.get(uuid); // Always fetch the latest document revision
      if (!task) {
        throw new Error("Task not found");
      }

      let existingImages = Array.isArray(task.images) ? task.images : [];
      let imagesToKeep = [];

      if (isMultipart && req.files && req.files.length > 0) {
        const newImages = [];

        // ✅ Parse `keptImages`
        try {
          imagesToKeep = JSON.parse(updateData.keptImages || "[]");
        } catch (parseError) {
          throw new Error("Invalid keptImages format");
        }

        // ✅ Determine images to delete
        const imagesToDelete = existingImages.filter(
          (img) => !imagesToKeep.some((keepImg) => keepImg.name === img.name)
        );

        // ✅ Delete images and update the document in a **single save**
        task = await deleteAttachments(uuid, imagesToDelete, task);

        // ✅ Upload new images
        for (const file of req.files) {
          try {
            const fileBuffer = file.buffer;
            const fileName = file.originalname;
            const mimeType = file.mimetype;

            await saveAttachment(uuid, fileBuffer, fileName, mimeType);
            newImages.push({ name: fileName, mimeType });
          } catch (saveError) {
            throw new Error(`Failed to save image: ${saveError.message}`);
          }
        }

        // ✅ Merge new images with kept images
        updateData.images = [...imagesToKeep, ...newImages];
      } else {
        updateData.images = existingImages;
      }
      await taskService.updateTask(uuid, updateData, res);
    });
    // ✅ Invalidate Redis cache for this task
    await redisClient.del(`task:${uuid}`);
    await redisClient.del("tasks");

    // ✅ Get all cached query keys
    const cachedKeys = await redisClient.sMembers("task_cache_keys");
    
    if (cachedKeys.length > 0) {
      console.log("♻️ Clearing cached filtered task queries...");
      
      // ✅ Force delete all cache keys
      await Promise.all(cachedKeys.map((key) => redisClient.del(key)));

      // ✅ Clear cache tracking set
      await redisClient.del("task_cache_keys");
    }
    // res.status(200).json({ message: "Task updated successfully" });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({
      error: "Failed to update task",
      details: error.message,
    });
  }
};
const deleteAttachments = async (uuid, imagesToDelete, task) => {
  try {
    // ✅ Ensure we fetch the latest document revision
    let latestTask = await db.get(uuid);

    // ✅ Ensure `images` is always an array
    latestTask.images = Array.isArray(latestTask.images) ? latestTask.images : [];

    // ✅ Remove attachments in-memory before saving
    imagesToDelete.forEach((image) => {
      const fileName = image.name || image.split("/").pop();
      if (latestTask._attachments && latestTask._attachments[fileName]) {
        delete latestTask._attachments[fileName];
      }
    });

    // ✅ Safely filter images
    latestTask.images = latestTask.images.filter(
      (img) => !imagesToDelete.some((deleted) => deleted.name === img.name)
    );

    // ✅ Save the updated document with the latest `_rev`
    const response = await db.insert(latestTask);

    console.log(`✅ Successfully deleted attachments and updated task ${uuid}`);
    return response;
  } catch (error) {
    console.error(`❌ Failed to delete attachments:`, error.message);
    throw new Error(`Failed to delete attachments: ${error.message}`);
  }
};
const bulkUpdateTasks = async (req, res) => {
  try {
    const { taskUpdates } = req.body; // Array of updates
   console.log("req.body",req.body)
    if (!Array.isArray(taskUpdates) || taskUpdates.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty taskUpdates array' });
    }

    const results = await taskService.bulkUpdateTasks(taskUpdates);
    // ✅ Invalidate Redis cache for all updated tasks
    for (const task of taskUpdates) {
      await redisClient.del(`task:${task.id}`);
    }
    await redisClient.del("tasks");
 // ✅ Get all cached query keys
 const cachedKeys = await redisClient.sMembers("task_cache_keys");
    
 if (cachedKeys.length > 0) {
   console.log("♻️ Clearing cached filtered task queries...");
   
   // ✅ Force delete all cache keys
   await Promise.all(cachedKeys.map((key) => redisClient.del(key)));

   // ✅ Clear cache tracking set
   await redisClient.del("task_cache_keys");
 }
      // Emit socket event for task updates
      if (io) {
        io.emit('tasksUpdated', {
          updatedTasks: results
        });
        console.log('Tasks updated and event emitted:', results);
      }
    res.status(200).json({
      message: 'Bulk update completed',
      results,
    });
  } catch (error) {
    console.error('Error in bulkUpdateTasks controller:', error.message);
    res.status(500).json({ error: 'Failed to perform bulk update', details: error.message });
  }
};
const deleteTask = async (req, res) => {
  try {
    const result = await taskService.deleteTask(req.params.id); // Get the deleted task result
    if (!result) {
      return res.status(404).json({ error: 'Task not found' });
    }
    // ✅ Invalidate Redis cache for this task and task list
    await redisClient.del(`task:${taskId}`);
    await redisClient.del("tasks");
      // ✅ Get all cached query keys
    const cachedKeys = await redisClient.sMembers("task_cache_keys");
    
    if (cachedKeys.length > 0) {
      console.log("♻️ Clearing cached filtered task queries...");
      
      // ✅ Force delete all cache keys
      await Promise.all(cachedKeys.map((key) => redisClient.del(key)));

      // ✅ Clear cache tracking set
      await redisClient.del("task_cache_keys");
    }
    res.status(200).json(result); // Return both ID and message
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task', details: error.message });
  }
};
const deleteBulkTasks = async (req, res) => {
  try {
    const { ids } = req.body; // Extract the array of IDs from the request body

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Invalid request, provide an array of IDs' });
    }

    const result = await taskService.deleteBulkTasks(ids); // Call the service with the array of IDs

    res.status(200).json(result); // Return the result
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete tasks', details: error.message });
  }
};

const generateCacheKey = (filters) => {
  return Object.entries(filters)
    .filter(([_, value]) => value) // Remove empty filters
    .map(([key, value]) => `${key}:${Array.isArray(value) ? value.join(",") : value}`)
    .join(":");
};
const getFilteredTasks = async (req, res) => {
  try {
    const { status, startDate, endDate, assignedTo, facility, machine, tools, materials, limit = 50, page = 1 } = req.query;
    const filters = { status, startDate, endDate, assignedTo, facility, machine, tools, materials };
    
    const taskLimit = Math.min(parseInt(limit, 10) || 50, 100);
    const skip = (parseInt(page, 10) - 1) * taskLimit;

    const mainCacheKey = `tasks:${generateCacheKey(filters)}:limit${taskLimit}:page${page}`;

    // ✅ Store the cache key so it can be invalidated later
    await redisClient.sAdd("task_cache_keys", mainCacheKey);

    // ✅ Check if full query is cached
    const cachedTasks = await redisClient.get(mainCacheKey);
    if (cachedTasks) {
      console.log("✅ Returning cached tasks:", mainCacheKey);
      return res.status(200).json(JSON.parse(cachedTasks));
    }

    // ✅ Check partial filter caches
    let cachedResults = [];
    let missingFilters = [];

    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue;
      const subCacheKey = `tasks:${key}:${Array.isArray(value) ? value.join(",") : value}`;
      const cachedData = await redisClient.get(subCacheKey);

      if (cachedData) {
        cachedResults.push(...JSON.parse(cachedData));
      } else {
        missingFilters.push(key);
      }

      // ✅ Store partial cache keys for invalidation
      await redisClient.sAdd("task_cache_keys", subCacheKey);
    }

    // ✅ Fetch missing filters from database
    let fetchedTasks = [];
    if (missingFilters.length > 0) {
      console.log("🔄 Fetching missing filters from database:", missingFilters);
      fetchedTasks = await taskService.getFilteredTasks(filters, taskLimit, skip);

      // ✅ Store fetched data in individual caches
      for (const key of missingFilters) {
        const subCacheKey = `tasks:${key}:${filters[key]}`;
        await redisClient.setEx(subCacheKey, 300, JSON.stringify(fetchedTasks));
        await redisClient.sAdd("task_cache_keys", subCacheKey);
      }
    }

    // ✅ Merge cached + fetched results
    const mergedTasks = [...cachedResults, ...fetchedTasks].reduce((acc, task) => {
      acc.set(task._id, task);
      return acc;
    }, new Map());

    const finalTasks = Array.from(mergedTasks.values());

    // ✅ Cache the final merged result
    await redisClient.setEx(mainCacheKey, 300, JSON.stringify(finalTasks));

    res.status(200).json(finalTasks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch filtered tasks", details: error.message });
  }
};

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
  bulkUpdateTasks,
  deleteTask,
  deleteBulkTasks,
  getTasksByAssignedUser,
  getAllDoneTasks,
  getDoneTasksForUser,
  createTaskFromMachine,
  getFilteredTasks,
  setTaskSocketIoInstance 
};
