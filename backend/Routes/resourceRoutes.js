const express = require('express');
const router = express.Router();
const resourceController = require('../Controllers/resourceController');
const { authenticateUser, authorize } = require('../Middleware/authMiddleware');
// Apply authentication to all routes
router.use(authenticateUser);

router.post('/', authorize([3, 4, 5]),resourceController.createResource);
router.get('/type/:typeId',authorize([3, 4, 5]), resourceController.getResourcesByType);
router.get('/:id', authorize([3, 4, 5]),resourceController.getResourceById);
router.put('/:id',authorize([3, 4, 5]), resourceController.updateResource);
router.delete('/:id',authorize([3, 4, 5]), resourceController.deleteResource);

module.exports = router;