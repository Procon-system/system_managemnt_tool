
const express = require('express');
const { 
    createTask,
    getAllTasks,
    getTaskById,
    updateTask,
    deleteTask,
    createTaskFromMachine,
    getTasksByAssignedUser,
    getAllDoneTasks,
    getDoneTasksForUser,
  } = require('../Controllers/taskControllers');
  const {
    getImage
  } = require('../Services/taskServices')
const {
      authenticateUser,
      isRandomUser,
      isServicePersonal,
      isManager,
      isFreeAccess,
      isAdmin,
    } = require('../Middleware/authMiddleware');
 const upload = require('../utils/uploadImage'); // Multer middleware
const router = express.Router();
// router.post('/create-tasks',authenticateUser,isManager,upload.single('image'),createTask);
// router.get('/get-image/:id', getImage);
// router.get('/get-all-tasks', getAllTasks);
// router.get('/get-tasks-id/:id',authenticateUser,isServicePersonal,getTaskById);
// router.put('/update-tasks/:id',authenticateUser,isServicePersonal,upload.single('image'),updateTask);
// router.delete('/delete-tasks/:id', authenticateUser,isManager,deleteTask);
// router.get('/get-tasks/assigned', authenticateUser,isServicePersonal,getTasksByAssignedUser);
// router.get('/get-tasks/done', getAllDoneTasks);
// router.get('/get-tasks/done/user',authenticateUser,isServicePersonal,getDoneTasksForUser);
// router.post('/tasks/fromMachine/:machineId',authenticateUser,isFreeAccess,createTaskFromMachine);
router.post('/create-tasks',authenticateUser,isManager,upload.single('image'),createTask);
router.get('/get-image/:id', getImage);
router.get('/get-all-tasks', getAllTasks);
router.get('/get-tasks-id/:id',authenticateUser,isServicePersonal,getTaskById);
router.put('/update-tasks/:id',authenticateUser,isServicePersonal,upload.single('image'),updateTask);
router.delete('/delete-tasks/:id', authenticateUser,isManager,deleteTask);
router.get('/get-tasks/assigned', authenticateUser,isServicePersonal,getTasksByAssignedUser);
router.get('/get-tasks/done',getAllDoneTasks);
router.get('/get-tasks/done/user',authenticateUser,isServicePersonal,getDoneTasksForUser);
router.post('/tasks/fromMachine/:machineId',authenticateUser,isFreeAccess,createTaskFromMachine);
module.exports = router;
