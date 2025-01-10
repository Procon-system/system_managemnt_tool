const MachineModel = require('../Models/MachineSchema'); 
const {db} = require('../config/couchdb'); // Import CouchDB instance
const createMachine = async (machineData) => {
  try {
    const newMachine = {
      type: 'machine', // Add document type
      machine_name: machineData.machine_name,
      machine_type: machineData.machine_type,
      facility: machineData.facility,
      _id: `machine:${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
     const response = await db.insert(newMachine);
    if (!response || !response.ok) {
      throw new Error('Failed to save created material to the database');
    }
    console.log("response",response)
    return newMachine;
  } catch (error) {
    throw new Error(`Error creating machine: ${error.message}`);
  }
};

const getAllMachines = async () => {
  try {
    // Step 1: Fetch all machine documents
    const result = await db.find({
      selector: { type: 'machine' }, // Only fetch machine documents
    });

    const machines = result.docs;

    // Step 2: Extract unique facility IDs
    const facilityIds = new Set();
    machines.forEach(machine => {
      if (machine.facility) {
        facilityIds.add(machine.facility);
      }
    });
 
    // Step 3: Fetch related facilities
    const facilities = await fetchDocuments([...facilityIds], 'facility');

    // Step 4: Map facilities by ID for quick lookup
    const facilityMap = facilities.reduce((map, facility) => {
      map[facility._id] = {
        location: facility.location,
        ...facility // Include additional fields if needed
      };
      return map;
    }, {});

    // Step 5: Populate machines with facility details
    const populatedMachines = machines.map(machine => ({
      _id: machine._id,
      machine_name: machine.machine_name,
      machine_type: machine.machine_type,
      facility: facilityMap[machine.facility] || {
        name: "Unknown Facility",
        location: "Not Available",
      }, // Include facility details or default values if not found
    }));

    return populatedMachines; // Step 6: Return the structured data
  } catch (error) {
    throw new Error(`Failed to fetch machines: ${error.message}`);
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
    if (!response || !response.ok) {
      throw new Error('Failed to save updated material to the database');
    }

    // Step 5: Return the fully updated machine object
    return updatedMachine; 
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
const fetchDocuments = async (ids, type) => {
  try {
    const result = await db.find({
      selector: {
        _id: { $in: ids },
        type,
      },
    });
    return result.docs;
  } catch (error) {
    throw new Error(`Failed to fetch ${type} documents: ${error.message}`);
  }
};

module.exports = {
  createMachine,
  getAllMachines,
  getMachineById,
  updateMachine,
  deleteMachine,
};
