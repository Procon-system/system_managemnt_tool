const express = require('express');
const router = express.Router();

const {
  createSensor,
  addTagToSensor,
  updateSensor,
  updateTag,
  getSensors,
  getTags,
  getTagData,
  getLatestTagValue,
  getAllLatest,
} = require('../Controllers/sensorController');

// Manager/admin creation routes
router.post('/', createSensor);
router.put('/:deviceId', updateSensor);
router.post('/:deviceId/tags', addTagToSensor);
router.put('/:deviceId/tags/:tagId', updateTag);

// Read routes
router.get('/', getSensors);
router.get('/all-latest', getAllLatest);
router.get('/:deviceId/tags', getTags);
router.get('/:deviceId/tags/:tagId/data', getTagData);
router.get('/:deviceId/tags/:tagId/latest', getLatestTagValue);

module.exports = router;