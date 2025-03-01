// const materialService = require('../Services/materialServices'); // Material service layer

// let io; // Variable to hold the Socket.IO instance

// // Setter to allow server.js to pass the io instance
// const setSocketIoInstance = (ioInstance) => {
//   io = ioInstance;
// };
// // Create a new material
// const createMaterial = async (req, res) => {
//   try {
//     const newMaterial = await materialService.createMaterial(req.body);
//     res.status(201).json(newMaterial);
//      // Emit the materialCreated event
//      if (io) {
//       console.log("About to emit materialCreated event:", newMaterial);
//       io.emit('materialCreated',  {
//         // materialId: newMaterial._id,
//         newMaterial: newMaterial
//       }); // Notify all connected clients
//       console.log('Material created and event emitted:', newMaterial);
   
//       // console.log("Event material Created emitted:", newMaterial);
//     } else {
//       console.error("Socket.IO instance is not set in materialController");
//     }
    
//   } catch (error) {
//     res.status(400).json({ error: 'Failed to create material', details: error.message });
//   }
// };

// // Get all materials
// const getAllMaterials = async (req, res) => {
//   try {
//     const materials = await materialService.getAllMaterials();
//     res.status(200).json(materials);
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to fetch materials', details: error.message });
//   }
// };
// const getAllAvailableMaterials = async (req, res) => {
//   try {
//     const materials = await materialService.getAllAvailableMaterials();
//     res.status(200).json(materials);
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to fetch materials', details: error.message });
//   }
// };

// // Get a material by ID
// const getMaterialById = async (req, res) => {
//   try {
//     const material = await materialService.getMaterialById(req.params.id);
//     if (!material) {
//       return res.status(404).json({ error: 'Material not found' });
//     }
//     res.status(200).json(material);
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to fetch material', details: error.message });
//   }
// };

// // Update a material by ID
// const updateMaterial = async (req, res) => {
//   try {
//     // Call the service to update the material
//     const updatedMaterial = await materialService.updateMaterial(req.params.id, req.body);

//     if (!updatedMaterial) {
//       return res.status(404).json({ error: 'Material not found' });
//     }

//     // Send the updated material as the response
//     res.status(200).json(updatedMaterial);

//     // Emit the materialUpdated event
//     if (io) {
//       io.emit('materialUpdated', {
//         materialId: updatedMaterial._id,
//         updatedData: updatedMaterial
//       }); // Notify all connected clients
//       console.log('Material updated and event emitted:', updatedMaterial);
//     }

//   } catch (error) {
//     // Handle failure response
//     res.status(400).json({ error: 'Failed to update material', details: error.message });
//     console.error('Error in updateMaterial controller:', error.message);
//   }
// };

// // Delete a material by ID
// const deleteMaterial = async (req, res) => {
//   try {
//     const deletedMaterial = await materialService.deleteMaterial(req.params.id);
//     if (!deletedMaterial) {
//       return res.status(404).json({ error: 'Material not found' });
//     }
//     res.status(200).json({ message: 'Material deleted successfully' });
//      // Emit the materialDeleted event
//      if (io) {
      
//       io.emit('materialDeleted', req.params.id);
//       console.log('Material deleted and event emitted:', req.params.id);
//     }
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to delete material', details: error.message });
//   }
// };

// module.exports = {
//   createMaterial,
//   getAllMaterials,
//   getMaterialById,
//   updateMaterial,
//   deleteMaterial,
//   getAllAvailableMaterials,
//   setSocketIoInstance
// };
const materialService = require("../Services/materialServices"); // Material service layer
const {redisClient}= require("../redisClient"); // Redis client

let io; // Variable to hold the Socket.IO instance

// Setter to allow server.js to pass the io instance
const setSocketIoInstance = (ioInstance) => {
  io = ioInstance;
};

// ✅ Create Material (invalidate cache)
const createMaterial = async (req, res) => {
  try {
    const newMaterial = await materialService.createMaterial(req.body);

    // ✅ Invalidate cache
    await redisClient.del("materials");
    await redisClient.del("availableMaterials");

    res.status(201).json(newMaterial);

    // ✅ Emit Socket.IO event
    if (io) {
      io.emit("materialCreated", { newMaterial });
      console.log("Material created and event emitted:", newMaterial);
    }
  } catch (error) {
    res.status(400).json({ error: "Failed to create material", details: error.message });
  }
};

// ✅ Get All Materials (cache results)
const getAllMaterials = async (req, res) => {
  try {
    const cacheKey = "materials";
    const cachedMaterials = await redisClient.get(cacheKey);

    if (cachedMaterials) {
      console.log("✅ Returning cached materials");
      return res.status(200).json(JSON.parse(cachedMaterials));
    }

    const materials = await materialService.getAllMaterials();

    // ✅ Store in Redis (cache for 5 minutes)
    await redisClient.setEx(cacheKey, 300, JSON.stringify(materials));

    res.status(200).json(materials);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch materials", details: error.message });
  }
};

// ✅ Get All Available Materials (cache results)
const getAllAvailableMaterials = async (req, res) => {
  try {
    const cacheKey = "availableMaterials";
    const cachedMaterials = await redisClient.get(cacheKey);

    if (cachedMaterials) {
      console.log("✅ Returning cached available materials");
      return res.status(200).json(JSON.parse(cachedMaterials));
    }

    const materials = await materialService.getAllAvailableMaterials();

    // ✅ Store in Redis (cache for 5 minutes)
    await redisClient.setEx(cacheKey, 300, JSON.stringify(materials));

    res.status(200).json(materials);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch available materials", details: error.message });
  }
};

// ✅ Get Material by ID (cache results)
const getMaterialById = async (req, res) => {
  try {
    const materialId = req.params.id;
    const cacheKey = `material:${materialId}`;
    const cachedMaterial = await redisClient.get(cacheKey);

    if (cachedMaterial) {
      console.log(`✅ Returning cached material: ${materialId}`);
      return res.status(200).json(JSON.parse(cachedMaterial));
    }

    const material = await materialService.getMaterialById(materialId);
    if (!material) {
      return res.status(404).json({ error: "Material not found" });
    }

    // ✅ Store in Redis (cache for 5 minutes)
    await redisClient.setEx(cacheKey, 300, JSON.stringify(material));

    res.status(200).json(material);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch material", details: error.message });
  }
};

// ✅ Update Material (invalidate cache)
const updateMaterial = async (req, res) => {
  try {
    const materialId = req.params.id;

    // ✅ Update material in DB
    const updatedMaterial = await materialService.updateMaterial(materialId, req.body);
    if (!updatedMaterial) {
      return res.status(404).json({ error: "Material not found" });
    }

    // ✅ Invalidate cache
    await redisClient.del(`material:${materialId}`);
    await redisClient.del("materials");
    await redisClient.del("availableMaterials");

    res.status(200).json(updatedMaterial);

    // ✅ Emit update event via Socket.IO
    if (io) {
      io.emit("materialUpdated", { materialId, updatedData: updatedMaterial });
      console.log("Material updated and event emitted:", updatedMaterial);
    }
  } catch (error) {
    res.status(400).json({ error: "Failed to update material", details: error.message });
  }
};

// ✅ Delete Material (invalidate cache)
const deleteMaterial = async (req, res) => {
  try {
    const materialId = req.params.id;
    const deletedMaterial = await materialService.deleteMaterial(materialId);

    if (!deletedMaterial) {
      return res.status(404).json({ error: "Material not found" });
    }

    // ✅ Invalidate cache
    await redisClient.del(`material:${materialId}`);
    await redisClient.del("materials");
    await redisClient.del("availableMaterials");

    res.status(200).json({ message: "Material deleted successfully" });

    // ✅ Emit delete event via Socket.IO
    if (io) {
      io.emit("materialDeleted", materialId);
      console.log("Material deleted and event emitted:", materialId);
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to delete material", details: error.message });
  }
};

module.exports = {
  setSocketIoInstance,
  createMaterial,
  getAllMaterials,
  getAllAvailableMaterials,
  getMaterialById,
  updateMaterial,
  deleteMaterial,
};
