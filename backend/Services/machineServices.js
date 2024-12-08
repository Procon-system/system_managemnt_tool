
const MachineModel = require('../Models/MachineSchema'); 
const {db} = require('../config/couchdb'); // Import CouchDB instance
const createMachine = async (machineData) => {
  try {
    const newMachine = {
      ...MachineModel,
      _id: `machine:${Date.now()}`, // Generate unique ID
      machine_name: machineData.machine_name,
      machine_type: machineData.machine_type,
      facility_id: machineData.facility_id, // Reference to Facility ID
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const response = await db.insert(newMachine);
    return response;
  } catch (error) {
    throw new Error(`Error creating machine: ${error.message}`);
  }
};
const getAllMachines = async () => {
  try {
    const response = await db.find({
      selector: { type: 'machine' }, // Fetch only machine documents
    });
// Fetch facility data for each machine
const machinesWithFacilities = await Promise.all(
  response.docs.map(async (machine) => {
    const facility = await db.get(machine.facility_id).catch(() => null); // Fetch facility or null
    return {
      ...machine,
      facility, // Include full facility data
    };
  })
);

// Remove facility_id from each machine
machinesWithFacilities.forEach((machine) => {
  delete machine.facility_id;
});
return machinesWithFacilities;
  } catch (error) {
    throw new Error(`Error retrieving machines: ${error.message}`);
  }
};
const getMachineById = async (id) => {
  try {
    // Fetch the machine document
    const machine = await db.get(id);
    if (machine.type !== 'machine') {
      throw new Error('Document is not a machine');
    }

   // Fetch the facility data
   const facility = await db.get(machine.facility_id).catch(() => null); // Handle missing facility

   if (!facility) {
     throw new Error('Facility data not found');
   }

   // Remove facility_id and include facility details instead
   const machineWithFacility = {
     ...machine,
     facility, // Include full facility data
   };

   delete machineWithFacility.facility_id; // Exclude the facility_id from the response
   return machineWithFacility;
  } catch (error) {
    throw new Error(`Error retrieving machine: ${error.message}`);
  }
};

const updateMachine = async (id, updateData) => {
  try {
    const machine = await db.get(id);

    if (machine.type !== 'machine') {
      throw new Error('Document is not a machine');
    }

    const updatedMachine = {
      ...machine,
      ...updateData,
      updated_at: new Date().toISOString(),
    };

    const response = await db.insert(updatedMachine);
    return response;
  } catch (error) {
    throw new Error(`Error updating machine: ${error.message}`);
  }
};
const deleteMachine = async (id) => {
  try {
    const machine = await db.get(id);

    if (machine.type !== 'machine') {
      throw new Error('Document is not a machine');
    }

    const response = await db.destroy(id, machine._rev);
    return response;
  } catch (error) {
    throw new Error(`Error deleting machine: ${error.message}`);
  }
};

module.exports = {
  createMachine,
  getAllMachines,
  getMachineById,
  updateMachine,
  deleteMachine,
};
