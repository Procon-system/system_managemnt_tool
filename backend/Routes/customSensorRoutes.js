const express = require('express');
const router = express.Router();

const {
  getSourceSensors,
  createCustomSensor,
  getCustomSensors,
  getCustomSensorData,
  getCustomSensorLatest,
  updateCustomSensor,
  deleteCustomSensor,
} = require('../Controllers/customSensorController');

// Existing raw MQTT sensors/tags for dropdown
router.get('/sources', getSourceSensors);

// Custom/virtual sensors
router.post('/', createCustomSensor);
router.get('/', getCustomSensors);
router.get('/:id/data', getCustomSensorData);
router.get('/:id/latest', getCustomSensorLatest);
router.put('/:id', updateCustomSensor);
router.delete('/:id', deleteCustomSensor);

module.exports = router;