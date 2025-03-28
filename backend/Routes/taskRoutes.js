const express = require('express');
const router = express.Router();
const taskController = require('../Controllers/taskControllers');
const { authenticateUser, authorize } = require('../Middleware/authMiddleware');
// Apply authentication to all routes
router.use(authenticateUser);

router.post('/',authorize([3, 4, 5]), taskController.createTask);
router.get('/', authorize([3, 4, 5]),taskController.getTasksByOrganization);
router.get('/:id', authorize([3, 4, 5]),taskController.getTaskById);
router.put('/:id', authorize([3, 4, 5]),taskController.updateTask);
router.delete('/:id',authorize([3, 4, 5]), taskController.deleteTask);
router.patch('/:id/status', authorize([3, 4, 5]),taskController.changeTaskStatus);

module.exports = router;