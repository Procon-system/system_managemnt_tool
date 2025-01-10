const facilityService = require('../Services/facilityServices');

let io; // Variable to hold the Socket.IO instance

// Setter to allow server.js to pass the io instance
const setFacilitySocketIoInstance = (ioInstance) => {
  io = ioInstance;
};

// Create a Facility
const createFacility = async (req, res) => {
  try {
    const newFacility = await facilityService.createFacility(req.body);
    res.status(201).json(newFacility);
    // Emit the facilityCreated event
    if (io) {
      console.log("About to emit facilityCreated event:", newFacility);
      io.emit('facilityCreated', {
        newFacility: newFacility
      });
      console.log('Facility created and event emitted:', newFacility);
    } else {
      console.error("Socket.IO instance is not set in facilityController");
    }
  } catch (error) {
    res.status(400).json({ error: 'Failed to create facility', details: error.message });
  }
};

// Get all Facilities
const getAllFacilities = async (req, res) => {
  try {
    const facilities = await facilityService.getAllFacilities();
    res.status(200).json(facilities);
  } catch (error) {
    res.status(400).json({ error: 'Failed to get all facilities', details: error.message });
  }
};

// Get a Facility by ID
const getFacilityById = async (req, res) => {
  try {
    const facility = await facilityService.getFacilityById(req.params.id);
    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' });
    }
    res.status(200).json(facility);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get facility', details: error.message });
  }
};

// Update a Facility
const updateFacility = async (req, res) => {
  try {
    const updatedFacility = await facilityService.updateFacilityById(req.params.id, req.body);
    if (!updatedFacility) {
      return res.status(404).json({ error: 'Facility not found' });
    }
    res.status(200).json(updatedFacility);
    // Emit the facilityUpdated event
    if (io) {
      io.emit('facilityUpdated', {
        facilityId: updatedFacility._id,
        updatedData: updatedFacility
      });
      console.log('Facility updated and event emitted:', updatedFacility);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update facility', details: error.message });
  }
};

// Delete a Facility
const deleteFacility = async (req, res) => {
  try {
    const deletedFacility = await facilityService.deleteFacilityById(req.params.id);
    if (!deletedFacility) {
      return res.status(404).json({ error: 'Facility not found' });
    }
    res.status(200).json({ message: 'Facility deleted successfully' });
    // Emit the facilityDeleted event
    if (io) {
      io.emit('facilityDeleted', req.params.id);
      console.log('Facility deleted and event emitted:', req.params.id);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete facility', details: error.message });
  }
};

module.exports = {
  createFacility,
  getAllFacilities,
  getFacilityById,
  updateFacility,
  deleteFacility,
  setFacilitySocketIoInstance
};
