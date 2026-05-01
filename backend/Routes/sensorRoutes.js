const express = require('express');
const router  = express.Router();
const {
  getSensors,
  getTags,
  getTagData,
  getLatestTagValue,
  getAllLatest,
} = require('../Controllers/sensorController');

router.get('/',                                       getSensors);
router.get('/all-latest',                             getAllLatest);
router.get('/:deviceId/tags',                         getTags);
router.get('/:deviceId/tags/:tagId/data',             getTagData);
router.get('/:deviceId/tags/:tagId/latest',           getLatestTagValue);

module.exports = router;
