// repositories/CouchDBTaskRepository.js
const TaskRepository = require('./TaskRepository');
const { db } = require('../config/couchdb');
const { saveAttachment } = require('../services/imageService');

class CouchDBTaskRepository extends TaskRepository {
  async createTask(taskData, file) {
    try {
      await db.insert(taskData);

      if (file) {
        const attachmentResponse = await saveAttachment(
          taskData._id,
          file.buffer,
          file.originalname,
          file.mimetype
        );

        taskData.image = file.originalname;
        await db.insert({ ...taskData, _rev: attachmentResponse.rev });
      }

      return { message: "Task created successfully", taskData };
    } catch (error) {
      console.log("error", error);
      throw new Error(`Failed to create task: ${error.message}`);
    }
  }

  async getAllTasks (batchSize = 20)  {
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
    }
    async fetchDocuments (ids, type) {
      try {
        // Validate input
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
          console.log(`No valid IDs provided for type: ${type}`);
          return [];
        }
    
        // Filter out invalid IDs
        const validIds = ids.filter((id) => id && typeof id === 'string' && id.startsWith(`${type}:`));
        if (validIds.length === 0) {
          console.log(`No valid IDs found for type: ${type}`);
          return [];
        }
    
        console.log(`Fetching ${type} documents with IDs:`, validIds);
    
        // Query the database
        const result = await db.find({
          selector: {
            type: type,
            _id: { $in: validIds }, // Use only valid IDs
          },
        });
    
        console.log(`Fetched ${result.docs.length} ${type} documents`);
        return result.docs;
      } catch (error) {
        console.error(`Error fetching ${type} documents:`, error.message);
        throw new Error(`Failed to fetch related ${type} documents: ${error.message}`);
      }
    }

  
}

module.exports = CouchDBTaskRepository;