
const machineService = require('../Services/machineServices'); // Adjust path as needed

const createMachine = async (req, res) => {
  try {
    const newMachine = await machineService.createMachine(req.body);
    res.status(201).json(newMachine);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create machine', details: error.message });
  }
};

const getAllMachines = async (req, res) => {
  try {
    const machines = await machineService.getAllMachines();
    res.status(200).json(machines);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch machines', details: error.message });
  }
};


const getMachineById = async (req, res) => {
  try {
    const machine = await machineService.getMachineById(req.params.id);
    if (!machine) {
      return res.status(404).json({ error: 'Machine not found' });
    }
    res.status(200).json(machine);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch machine', details: error.message });
  }
};


const updateMachine = async (req, res) => {
  try {
    const updatedMachine = await machineService.updateMachine(req.params.id, req.body);
    if (!updatedMachine) {
      return res.status(404).json({ error: 'Machine not found' });
    }
    res.status(200).json(updatedMachine);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update machine', details: error.message });
  }
};


const deleteMachine = async (req, res) => {
  try {
    const deletedMachine = await machineService.deleteMachine(req.params.id);
    if (!deletedMachine) {
      return res.status(404).json({ error: 'Machine not found' });
    }
    res.status(200).json({ message: 'Machine deleted successfully' });
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
};
