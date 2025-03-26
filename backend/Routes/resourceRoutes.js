const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const authMiddleware = require('../middlewares/auth');

router.use(authMiddleware);

router.post('/', resourceController.createResource);
router.get('/type/:typeId', resourceController.getResourcesByType);
router.get('/:id', resourceController.getResourceById);
router.put('/:id', resourceController.updateResource);
router.delete('/:id', resourceController.deleteResource);

module.exports = router;