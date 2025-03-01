// const toolService = require('../Services/toolServices'); 
// let io = null;

// // Set up Socket.IO instance
// const setToolSocketIoInstance = (ioInstance) => {
//   io = ioInstance;
// };

// // Create a new tool
// const createTool = async (req, res) => {
//   try {
//     const newTool = await toolService.createTool(req.body);
    
//     // Emit socket event for tool creation
//     if (io) {
//       io.emit('toolCreated', { newTool });
//       console.log('Tool created event emitted:', newTool);
//     } else {
//       console.warn('Socket.IO instance not set in toolController');
//     }

//     res.status(201).json(newTool);
//   } catch (error) {
//     console.log("Error creating tool:", error);
//     res.status(400).json({ error: 'Failed to create tool', details: error.message });
//   }
// };

// // Get all tools
// const getAllTools = async (req, res) => {
//   try {
//     const tools = await toolService.getAllTools();
//     res.status(200).json(tools);
//   } catch (error) {
//     console.error("Error fetching tools:", error);
//     res.status(500).json({ error: 'Failed to fetch tools', details: error.message });
//   }
// };

// // Get tool by ID
// const getToolById = async (req, res) => {
//   try {
//     const tool = await toolService.getToolById(req.params.id);
//     if (!tool) {
//       return res.status(404).json({ error: 'Tool not found' });
//     }
//     res.status(200).json(tool);
//   } catch (error) {
//     console.error("Error fetching tool:", error);
//     res.status(500).json({ error: 'Failed to fetch tool', details: error.message });
//   }
// };

// // Update tool by ID
// const updateTool = async (req, res) => {
//   try {
//     const updatedTool = await toolService.updateTool(req.params.id, req.body);
//     if (!updatedTool) {
//       return res.status(404).json({ error: 'Tool not found' });
//     }
//     // Emit socket event for tool update
//     if (io) {
//       io.emit('toolUpdated', updatedTool);
//       console.log('Tool updated event emitted:', updatedTool);
//     }

//     res.status(200).json(updatedTool);
//   } catch (error) {
//     console.error("Error updating tool:", error);
//     res.status(400).json({ error: 'Failed to update tool', details: error.message });
//   }
// };

// // Delete tool by ID
// const deleteTool = async (req, res) => {
//   try {
//     const deletedTool = await toolService.deleteTool(req.params.id);
//     if (!deletedTool) {
//       return res.status(404).json({ error: 'Tool not found' });
//     }

//     // Emit socket event for tool deletion
//     if (io) {
//       io.emit('toolDeleted', req.params.id);
//       console.log('Tool deleted event emitted:', req.params.id);
//     }

//     res.status(200).json({ message: 'Tool deleted successfully' });
//   } catch (error) {
//     console.error("Error deleting tool:", error);
//     res.status(500).json({ error: 'Failed to delete tool', details: error.message });
//   }
// };

// module.exports = {
//   createTool,
//   getAllTools,
//   getToolById,
//   updateTool,
//   deleteTool,
//   setToolSocketIoInstance
// };
const toolService = require('../Services/toolServices');
const { redisClient } = require('../redisClient'); // Ensure Redis client is imported
let io = null;

// Set up Socket.IO instance
const setToolSocketIoInstance = (ioInstance) => {
  io = ioInstance;
};

// Create a new tool
const createTool = async (req, res) => {
  try {
    const newTool = await toolService.createTool(req.body);

    // Invalidate the cache for all tools
    await redisClient.del('tools');
    console.log('Cache cleared after tool creation');

    // Emit socket event for tool creation
    if (io) {
      io.emit('toolCreated', { newTool });
      console.log('Tool created event emitted:', newTool);
    } else {
      console.warn('Socket.IO instance not set in toolController');
    }

    res.status(201).json(newTool);
  } catch (error) {
    console.log("Error creating tool:", error);
    res.status(400).json({ error: 'Failed to create tool', details: error.message });
  }
};

// Get all tools
const getAllTools = async (req, res) => {
  try {
    const cacheKey = 'tools';
    const cachedTools = await redisClient.get(cacheKey);

    if (cachedTools) {
      console.log('✅ Returning cached tools');
      return res.status(200).json(JSON.parse(cachedTools));
    }

    // Fetch fresh data from the database
    const tools = await toolService.getAllTools();
    console.log('Fetched tools from DB:', tools);

    // Cache the data for 5 minutes (300 seconds)
    await redisClient.setEx(cacheKey, 300, JSON.stringify(tools));
    console.log('Cache populated with fresh tools data');

    res.status(200).json(tools);
  } catch (error) {
    console.error("Error fetching tools:", error);
    res.status(500).json({ error: 'Failed to fetch tools', details: error.message });
  }
};

// Get tool by ID
const getToolById = async (req, res) => {
  try {
    const toolId = req.params.id;
    const cacheKey = `tool:${toolId}`;
    const cachedTool = await redisClient.get(cacheKey);

    if (cachedTool) {
      console.log(`✅ Returning cached tool: ${toolId}`);
      return res.status(200).json(JSON.parse(cachedTool));
    }

    // Fetch fresh data from the database
    const tool = await toolService.getToolById(toolId);
    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    // Cache the data for 5 minutes (300 seconds)
    await redisClient.setEx(cacheKey, 300, JSON.stringify(tool));
    console.log(`Cache populated with fresh tool data for ID: ${toolId}`);

    res.status(200).json(tool);
  } catch (error) {
    console.error("Error fetching tool:", error);
    res.status(500).json({ error: 'Failed to fetch tool', details: error.message });
  }
};

// Update tool by ID
const updateTool = async (req, res) => {
  try {
    const updatedTool = await toolService.updateTool(req.params.id, req.body);
    if (!updatedTool) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    // Invalidate the cache for all tools and the specific tool
    await redisClient.del('tools');
    await redisClient.del(`tool:${req.params.id}`);
    console.log('Cache cleared after tool update');

    // Emit socket event for tool update
    if (io) {
      io.emit('toolUpdated', updatedTool);
      console.log('Tool updated event emitted:', updatedTool);
    }

    res.status(200).json(updatedTool);
  } catch (error) {
    console.error("Error updating tool:", error);
    res.status(400).json({ error: 'Failed to update tool', details: error.message });
  }
};

// Delete tool by ID
const deleteTool = async (req, res) => {
  try {
    const deletedTool = await toolService.deleteTool(req.params.id);
    if (!deletedTool) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    // Invalidate the cache for all tools and the specific tool
    await redisClient.del('tools');
    await redisClient.del(`tool:${req.params.id}`);
    console.log('Cache cleared after tool deletion');

    // Emit socket event for tool deletion
    if (io) {
      io.emit('toolDeleted', req.params.id);
      console.log('Tool deleted event emitted:', req.params.id);
    }

    res.status(200).json({ message: 'Tool deleted successfully' });
  } catch (error) {
    console.error("Error deleting tool:", error);
    res.status(500).json({ error: 'Failed to delete tool', details: error.message });
  }
};

module.exports = {
  createTool,
  getAllTools,
  getToolById,
  updateTool,
  deleteTool,
  setToolSocketIoInstance
};