// const facilityService = require('../Services/facilityServices');

// let io; // Variable to hold the Socket.IO instance

// // Setter to allow server.js to pass the io instance
// const setFacilitySocketIoInstance = (ioInstance) => {
//   io = ioInstance;
// };

// // Create a Facility
// const createFacility = async (req, res) => {
//   try {
//     const newFacility = await facilityService.createFacility(req.body);
//     res.status(201).json(newFacility);
//     // Emit the facilityCreated event
//     if (io) {
//       console.log("About to emit facilityCreated event:", newFacility);
//       io.emit('facilityCreated', {
//         newFacility: newFacility
//       });
//       console.log('Facility created and event emitted:', newFacility);
//     } else {
//       console.error("Socket.IO instance is not set in facilityController");
//     }
//   } catch (error) {
//     res.status(400).json({ error: 'Failed to create facility', details: error.message });
//   }
// };

// // Get all Facilities
// const getAllFacilities = async (req, res) => {
//   try {
//     const facilities = await facilityService.getAllFacilities();
//     res.status(200).json(facilities);
//   } catch (error) {
//     res.status(400).json({ error: 'Failed to get all facilities', details: error.message });
//   }
// };

// // Get a Facility by ID
// const getFacilityById = async (req, res) => {
//   try {
//     const facility = await facilityService.getFacilityById(req.params.id);
//     if (!facility) {
//       return res.status(404).json({ error: 'Facility not found' });
//     }
//     res.status(200).json(facility);
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to get facility', details: error.message });
//   }
// };

// // Update a Facility
// const updateFacility = async (req, res) => {
//   try {
//     const updatedFacility = await facilityService.updateFacilityById(req.params.id, req.body);
//     if (!updatedFacility) {
//       return res.status(404).json({ error: 'Facility not found' });
//     }
//     res.status(200).json(updatedFacility);
//     // Emit the facilityUpdated event
//     if (io) {
//       io.emit('facilityUpdated', {
//         facilityId: updatedFacility._id,
//         updatedData: updatedFacility
//       });
//       console.log('Facility updated and event emitted:', updatedFacility);
//     }
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to update facility', details: error.message });
//   }
// };

// // Delete a Facility
// const deleteFacility = async (req, res) => {
//   try {
//     const deletedFacility = await facilityService.deleteFacilityById(req.params.id);
//     if (!deletedFacility) {
//       return res.status(404).json({ error: 'Facility not found' });
//     }
//     res.status(200).json({ message: 'Facility deleted successfully' });
//     // Emit the facilityDeleted event
//     if (io) {
//       io.emit('facilityDeleted', req.params.id);
//       console.log('Facility deleted and event emitted:', req.params.id);
//     }
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to delete facility', details: error.message });
//   }
// };

// module.exports = {
//   createFacility,
//   getAllFacilities,
//   getFacilityById,
//   updateFacility,
//   deleteFacility,
//   setFacilitySocketIoInstance
// };
const facilityService = require('../Services/facilityServices');
const { redisClient } = require('../redisClient'); // Ensure Redis client is imported
let io = null;

// Setter to allow server.js to pass the io instance
const setFacilitySocketIoInstance = (ioInstance) => {
  io = ioInstance;
};

// Create a Facility
const createFacility = async (req, res) => {
  try {
    const newFacility = await facilityService.createFacility(req.body);

    // Invalidate the cache for all facilities
    await redisClient.del('facilities');
    console.log('Cache cleared after facility creation');

    // Emit the facilityCreated event
    if (io) {
      console.log("About to emit facilityCreated event:", newFacility);
      io.emit('facilityCreated', { newFacility });
      console.log('Facility created and event emitted:', newFacility);
    } else {
      console.error("Socket.IO instance is not set in facilityController");
    }

    res.status(201).json(newFacility);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create facility', details: error.message });
  }
};

// Get all Facilities
const getAllFacilities = async (req, res) => {
  try {
    const cacheKey = 'facilities';
    const cachedFacilities = await redisClient.get(cacheKey);

    if (cachedFacilities) {
      console.log('✅ Returning cached facilities');
      return res.status(200).json(JSON.parse(cachedFacilities));
    }

    // Fetch fresh data from the database
    const facilities = await facilityService.getAllFacilities();
    console.log('Fetched facilities from DB:', facilities);

    // Cache the data for 5 minutes (300 seconds)
    await redisClient.setEx(cacheKey, 300, JSON.stringify(facilities));
    console.log('Cache populated with fresh facilities data');

    res.status(200).json(facilities);
  } catch (error) {
    res.status(400).json({ error: 'Failed to get all facilities', details: error.message });
  }
};

// Get a Facility by ID
const getFacilityById = async (req, res) => {
  try {
    const facilityId = req.params.id;
    const cacheKey = `facility:${facilityId}`;
    const cachedFacility = await redisClient.get(cacheKey);

    if (cachedFacility) {
      console.log(`✅ Returning cached facility: ${facilityId}`);
      return res.status(200).json(JSON.parse(cachedFacility));
    }

    // Fetch fresh data from the database
    const facility = await facilityService.getFacilityById(facilityId);
    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    // Cache the data for 5 minutes (300 seconds)
    await redisClient.setEx(cacheKey, 300, JSON.stringify(facility));
    console.log(`Cache populated with fresh facility data for ID: ${facilityId}`);

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

    // Invalidate the cache for all facilities and the specific facility
    await redisClient.del('facilities');
    await redisClient.del(`facility:${req.params.id}`);
    console.log('Cache cleared after facility update');

    // Emit the facilityUpdated event
    if (io) {
      io.emit('facilityUpdated', {
        facilityId: updatedFacility._id,
        updatedData: updatedFacility
      });
      console.log('Facility updated and event emitted:', updatedFacility);
    }

    res.status(200).json(updatedFacility);
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

    // Invalidate the cache for all facilities and the specific facility
    await redisClient.del('facilities');
    await redisClient.del(`facility:${req.params.id}`);
    console.log('Cache cleared after facility deletion');

    // Emit the facilityDeleted event
    if (io) {
      io.emit('facilityDeleted', req.params.id);
      console.log('Facility deleted and event emitted:', req.params.id);
    }

    res.status(200).json({ message: 'Facility deleted successfully' });
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