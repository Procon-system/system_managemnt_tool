const express = require('express');
const router = express.Router();
const resourceTypeController = require('../controllers/resourceTypeController');
const authMiddleware = require('../middlewares/auth');

router.use(authMiddleware);

router.post('/', resourceTypeController.createResourceType);
router.get('/', resourceTypeController.getResourceTypes);
router.get('/:id', resourceTypeController.getResourceTypeById);
router.put('/:id', resourceTypeController.updateResourceType);
router.delete('/:id', resourceTypeController.deleteResourceType);

module.exports = router;