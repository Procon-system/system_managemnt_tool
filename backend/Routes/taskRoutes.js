const express = require('express');
const router = express.Router();
const taskController = require('../Controllers/taskControllers');
// const authMiddleware = require('../middlewares/auth');

// Apply authentication middleware to all task routes
// router.use(authMiddleware);

router.post('/', taskController.createTask);
router.get('/', taskController.getTasksByOrganization);
router.get('/:id', taskController.getTaskById);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
router.patch('/:id/status', taskController.changeTaskStatus);

module.exports = router;