const express = require('express');
const router = express.Router();
const resourceTypeController = require('../Controllers/resourceTypeController');
const { authenticateUser, authorize } = require('../Middleware/authMiddleware');
// Apply authentication to all routes
router.use(authenticateUser);

// Routes with role-based authorization
router.post('/', authorize([5]), resourceTypeController.createResourceType); // Only admin (level 5)
router.get('/', authorize([3, 4, 5]), resourceTypeController.getResourceTypes); // Manager+ (levels 3-5)
router.get('/:id', authorize([3, 4, 5]), resourceTypeController.getResourceTypeById);
router.put('/:id', authorize([5]), resourceTypeController.updateResourceType); // Only admin
router.delete('/:id', authorize([5]), resourceTypeController.deleteResourceType); // Only admin

module.exports = router;