const machineService = require('../Services/machineServices'); // Adjust path as needed
let io; // Variable to hold the Socket.IO instance

// Setter to allow server.js to pass the io instance
const setMachineSocketIoInstance = (ioInstance) => {
  io = ioInstance;
};
const createMachine = async (req, res) => {
  try {
    const machineData = {
      ...req.body,
      type: 'machine', // Explicitly set the document type
    };

    const newMachine = await machineService.createMachine(machineData);
    res.status(201).json(newMachine);
      // Emit the materialCreated event
      console.log("newMachine",newMachine)
      if (io) {
          io.emit('machineCreated',  {
          newMachine: newMachine
        }); // Notify all connected clients
        console.log('Machine created and event emitted:', newMachine);

       } else {
        console.error("Socket.IO instance is not set in materialController");
      }
  } catch (error) {
    res.status(400).json({ error: 'Failed to create machine', details: error.message });
  }
};

const getAllMachines = async (req, res) => {
  try {
    const machines = await machineService.getAllMachines();
    console.log("machines",machines)
    res.status(200).json(machines);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch machines', details: error.message });
  }
};

const getMachineById = async (req, res) => {
  try {
    const machine = await machineService.getMachineById(req.params.id);
    if (!machine || machine.type !== 'machine') { // Ensure it's a machine document
      return res.status(404).json({ error: 'Machine not found' });
    }
    res.status(200).json(machine);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch machine', details: error.message });
  }
};

const updateMachine = async (req, res) => {
  try {
    const updatedData = {
      ...req.body,
      updated_at: new Date().toISOString(), // Update timestamp
    };

    const updatedMachine = await machineService.updateMachine(req.params.id, updatedData);
    if (!updatedMachine || updatedMachine.type !== 'machine') { // Ensure it's a machine document
      return res.status(404).json({ error: 'Machine not found' });
    }
    res.status(200).json(updatedMachine);

    // Emit the materialUpdated event
    if (io) {
      io.emit('machineUpdated', {
        machineId: updatedMachine._id,
        updatedData: updatedMachine
      }); // Notify all connected clients
      console.log('Machine updated and event emitted:', updatedMachine);
    }
  } catch (error) {
    res.status(400).json({ error: 'Failed to update machine', details: error.message });
  }
};

const deleteMachine = async (req, res) => {
  try {
    const deletedMachine = await machineService.deleteMachine(req.params.id);
    console.log('Deleted machine:', deletedMachine);
    if (!deletedMachine) { // Ensure it's a machine document
      return res.status(404).json({ error: 'Machine not found' });
    }
    res.status(200).json({ message: 'Machine deleted successfully' });
    if (io) {
      
      io.emit('machineDeleted', req.params.id);
      console.log('Machine deleted and event emitted:', req.params.id);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete machine', details: error.message });
  }
};

module.exports = {
  createMachine,
  getAllMachines,
  getMachineById,
  updateMachine,
  deleteMachine,
  setMachineSocketIoInstance
};
