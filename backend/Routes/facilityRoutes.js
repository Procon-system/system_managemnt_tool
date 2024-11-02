
const express = require('express');
const facilityController = require('../Controllers/facilityControllers'); // Adjust path as needed

const router = express.Router();

router.post('/create-facility', facilityController.createFacility);
router.get('/get-all-facility', facilityController.getAllFacilities);
router.get('/get-facility-id/:id', facilityController.getFacilitiesById);
router.put('/update-facility/:id', facilityController.updateFacility);
router.delete('/delete-facility/:id', facilityController.deleteFacility);

module.exports = router;
