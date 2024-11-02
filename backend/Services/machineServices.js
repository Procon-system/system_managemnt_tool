
const Machine = require('../Models/MachineSchema'); 

const createMachine = async (machineData) => {
  const machine = new Machine(machineData);
  return await machine.save();
};

const getAllMachines = async () => {
  return await Machine.find().populate('facility');
};

const getMachineById = async (id) => {
  return await Machine.findById(id).populate('facility');
};

const updateMachine = async (id, updateData) => {
  return await Machine.findByIdAndUpdate(id, updateData, { new: true });
};

const deleteMachine = async (id) => {
  return await Machine.findByIdAndDelete(id);
};

module.exports = {
  createMachine,
  getAllMachines,
  getMachineById,
  updateMachine,
  deleteMachine,
};
