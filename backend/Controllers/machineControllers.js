// const machineService = require('../Services/machineServices'); // Adjust path as needed
// let io; // Variable to hold the Socket.IO instance

// // Setter to allow server.js to pass the io instance
// const setMachineSocketIoInstance = (ioInstance) => {
//   io = ioInstance;
// };
// const createMachine = async (req, res) => {
//   try {
//     const machineData = {
//       ...req.body,
//       type: 'machine', // Explicitly set the document type
//     };

//     const newMachine = await machineService.createMachine(machineData);
//     res.status(201).json(newMachine);
//       // Emit the materialCreated event
//       console.log("newMachine",newMachine)
//       if (io) {
//           io.emit('machineCreated',  {
//           newMachine: newMachine
//         }); // Notify all connected clients
//         console.log('Machine created and event emitted:', newMachine);

//        } else {
//         console.error("Socket.IO instance is not set in materialController");
//       }
//   } catch (error) {
//     res.status(400).json({ error: 'Failed to create machine', details: error.message });
//   }
// };

// const getAllMachines = async (req, res) => {
//   try {
//     const machines = await machineService.getAllMachines();
//     console.log("machines",machines)
//     res.status(200).json(machines);
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to fetch machines', details: error.message });
//   }
// };

// const getMachineById = async (req, res) => {
//   try {
//     const machine = await machineService.getMachineById(req.params.id);
//     if (!machine || machine.type !== 'machine') { // Ensure it's a machine document
//       return res.status(404).json({ error: 'Machine not found' });
//     }
//     res.status(200).json(machine);
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to fetch machine', details: error.message });
//   }
// };

// const updateMachine = async (req, res) => {
//   try {
//     const updatedData = {
//       ...req.body,
//       updated_at: new Date().toISOString(), // Update timestamp
//     };

//     const updatedMachine = await machineService.updateMachine(req.params.id, updatedData);
//     if (!updatedMachine || updatedMachine.type !== 'machine') { // Ensure it's a machine document
//       return res.status(404).json({ error: 'Machine not found' });
//     }
//     res.status(200).json(updatedMachine);

//     // Emit the materialUpdated event
//     if (io) {
//       io.emit('machineUpdated', {
//         machineId: updatedMachine._id,
//         updatedData: updatedMachine
//       }); // Notify all connected clients
//       console.log('Machine updated and event emitted:', updatedMachine);
//     }
//   } catch (error) {
//     res.status(400).json({ error: 'Failed to update machine', details: error.message });
//   }
// };

// const deleteMachine = async (req, res) => {
//   try {
//     const deletedMachine = await machineService.deleteMachine(req.params.id);
//     console.log('Deleted machine:', deletedMachine);
//     if (!deletedMachine) { // Ensure it's a machine document
//       return res.status(404).json({ error: 'Machine not found' });
//     }
//     res.status(200).json({ message: 'Machine deleted successfully' });
//     if (io) {
      
//       io.emit('machineDeleted', req.params.id);
//       console.log('Machine deleted and event emitted:', req.params.id);
//     }
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to delete machine', details: error.message });
//   }
// };

// module.exports = {
//   createMachine,
//   getAllMachines,
//   getMachineById,
//   updateMachine,
//   deleteMachine,
//   setMachineSocketIoInstance
// };
const machineService = require("../Services/machineServices"); // Machine service layer
const {redisClient} = require("../redisClient"); // Redis client

let io; // Variable to hold the Socket.IO instance

// Setter to allow server.js to pass the io instance
const setMachineSocketIoInstance = (ioInstance) => {
  io = ioInstance;
};

// ✅ Create Machine (invalidate cache)
const createMachine = async (req, res) => {
  try {
    const machineData = {
      ...req.body,
      type: "machine", // Explicitly set the document type
    };

    const newMachine = await machineService.createMachine(machineData);
    res.status(201).json(newMachine);

    // Log before Redis operations
    console.log("Attempting to clear cache...");

    await redisClient.del("machines"); // Corrected key
    await redisClient.setEx("machines_updated", 5, "true"); // Prevent caching for 5 seconds

    // Log after Redis operations
    console.log("Cache cleared and machines_updated set.");

    // ✅ Emit event via Socket.IO
    if (io) {
      io.emit("machineCreated", { newMachine });
      console.log("Machine created and event emitted:", newMachine);
    }
  } catch (error) {
    console.error("Error in createMachine:", error);
    res.status(400).json({ error: "Failed to create machine", details: error.message });
  }
};

// ✅ Get All Machines (cache results)
const getAllMachines = async (req, res) => {
  try {
    const cacheKey = "machines";
    const cachedMachines = await redisClient.get(cacheKey);
    console.log("cachedMachines:", cachedMachines);

    if (cachedMachines) {
      console.log("✅ Returning cached machines");
      return res.status(200).json(JSON.parse(cachedMachines));
    }

    // Fetch fresh data from the database
    const machines = await machineService.getAllMachines();
    
    // Repopulate the cache
    await redisClient.setEx(cacheKey, 300, JSON.stringify(machines));
    
    res.status(200).json(machines);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch machines", details: error.message });
  }
};

// ✅ Get Machine by ID (cache results)
const getMachineById = async (req, res) => {
  try {
    const machineId = req.params.id;
    const cacheKey = `machine:${machineId}`;
    const cachedMachine = await redisClient.get(cacheKey);

    if (cachedMachine) {
      console.log(`✅ Returning cached machine: ${machineId}`);
      return res.status(200).json(JSON.parse(cachedMachine));
    }

    const machine = await machineService.getMachineById(machineId);
    if (!machine || machine.type !== "machine") {
      return res.status(404).json({ error: "Machine not found" });
    }

    // ✅ Store in Redis (cache for 5 minutes)
    await redisClient.setEx(cacheKey, 300, JSON.stringify(machine));

    res.status(200).json(machine);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch machine", details: error.message });
  }
};

// ✅ Update Machine (invalidate cache)
const updateMachine = async (req, res) => {
  try {
    const updatedData = {
      ...req.body,
      updated_at: new Date().toISOString(), // Update timestamp
    };

    const updatedMachine = await machineService.updateMachine(req.params.id, updatedData);
    if (!updatedMachine || updatedMachine.type !== "machine") {
      return res.status(404).json({ error: "Machine not found" });
    }

    // ✅ Invalidate cache
    await redisClient.del(`machine:${req.params.id}`);
    await redisClient.del("machines");

    res.status(200).json(updatedMachine);

    // ✅ Emit update event via Socket.IO
    if (io) {
      io.emit("machineUpdated", {
        machineId: updatedMachine._id,
        updatedData: updatedMachine,
      });
      console.log("Machine updated and event emitted:", updatedMachine);
    }
  } catch (error) {
    res.status(400).json({ error: "Failed to update machine", details: error.message });
  }
};

// ✅ Delete Machine (invalidate cache)
const deleteMachine = async (req, res) => {
  try {
    const deletedMachine = await machineService.deleteMachine(req.params.id);
    if (!deletedMachine) {
      return res.status(404).json({ error: "Machine not found" });
    }

    // ✅ Invalidate cache
    await redisClient.del(`machine:${req.params.id}`);
    await redisClient.del("machines");

    res.status(200).json({ message: "Machine deleted successfully" });

    // ✅ Emit delete event via Socket.IO
    if (io) {
      io.emit("machineDeleted", req.params.id);
      console.log("Machine deleted and event emitted:", req.params.id);
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to delete machine", details: error.message });
  }
};

module.exports = {
  setMachineSocketIoInstance,
  createMachine,
  getAllMachines,
  getMachineById,
  updateMachine,
  deleteMachine,
};
