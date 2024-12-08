
const express = require('express');
const facilityController = require('../Controllers/facilityControllers'); // Adjust path as needed
const {
    authenticateUser,
    isRandomUser,
    isServicePersonal,
    isManager,
    isFreeAccess,
    isAdmin,
  } = require('../Middleware/authMiddleware');
  
const router = express.Router();

// router.post('/create-facility',  authenticateUser,isFreeAccess,facilityController.createFacility);
// router.get('/get-all-facility', authenticateUser,isServicePersonal,facilityController.getAllFacilities);
// router.get('/get-facility-id/:id', authenticateUser,isServicePersonal,facilityController.getFacilitiesById);
// router.put('/update-facility/:id',  authenticateUser,isFreeAccess,facilityController.updateFacility);
// router.delete('/delete-facility/:id', authenticateUser,isFreeAccess,facilityController.deleteFacility);
router.post('/create-facility',  facilityController.createFacility);
router.get('/get-all-facility', facilityController.getAllFacilities);
router.get('/get-facility-id/:id',facilityController.getFacilityById);
router.put('/update-facility/:id',  facilityController.updateFacility);
router.delete('/delete-facility/:id', facilityController.deleteFacility);

module.exports = router;
