
const express = require('express');
const taskController = require('../Controllers/taskControllers'); // Adjust path as needed
const router = express.Router();
const authenticateUser = require('../Middleware/authMiddleware');

router.post('/create-tasks',authenticateUser, taskController.createTask);
router.get('/get-all-tasks', taskController.getAllTasks);
router.get('/get-tasks-id/:id', taskController.getTaskById);
router.put('/update-tasks/:id', taskController.updateTask);
router.delete('/delete-tasks/:id', taskController.deleteTask);
router.post('/tasks/fromMachine/:machineId', taskController.createTaskFromMachine);

module.exports = router;
