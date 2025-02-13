
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
    bulkUpdateTasks,
    getDoneTasksForUser,
    deleteBulkTasks,
  } = require('../Controllers/taskControllers');
  const {
    getImages
  } = require('../Services/taskServices')
const {
      authenticateUser,
      isServicePersonal,
      isManager,
      isFreeAccess,
    } = require('../Middleware/authMiddleware');
 const upload = require('../utils/uploadImage'); // Multer middleware
const router = express.Router();
router.post('/create-tasks',authenticateUser,isManager,upload.single('image'),createTask);
router.get('/get-images/:id', getImages);
router.get('/get-all-tasks', getAllTasks);
router.get('/get-tasks-id/:id',authenticateUser,isServicePersonal,getTaskById);
router.put('/update-tasks/:id',upload.array('images', 5),updateTask);
router.put('/bulk-update',authenticateUser,isManager,bulkUpdateTasks);
router.delete('/delete-tasks/:id', authenticateUser,isManager,deleteTask);
router.delete('/bulk-delete', deleteBulkTasks);
router.get('/get-tasks/assigned', authenticateUser,isServicePersonal,getTasksByAssignedUser);
router.get('/get-tasks/done',getAllDoneTasks);
router.get('/get-tasks/done/user',authenticateUser,isServicePersonal,getDoneTasksForUser);
router.post('/tasks/fromMachine/:machineId',authenticateUser,isFreeAccess,createTaskFromMachine);
module.exports = router;
