
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
    getImage,
  } = require('../Controllers/taskControllers');
const {
      authenticateUser,
      isRandomUser,
      isServicePersonal,
      isManager,
      isFreeAccess,
      isAdmin,
    } = require('../Middleware/authMiddleware');
   // const { uploadFileToGridFS } = require('../utils/uploadImage'); // Import the function

const { GridFSBucket } = require('mongodb');
const multer = require('multer');
const router = express.Router();

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

const mongoose = require('mongoose');
router.post('/create-tasks',authenticateUser,isManager,upload.single('image'),createTask);
router.get('/get-image/:id', getImage);
router.get('/get-all-tasks', getAllTasks);
router.get('/get-tasks-id/:id',authenticateUser,isServicePersonal,getTaskById);
router.put('/update-tasks/:id',authenticateUser,isServicePersonal,upload.single('image'),updateTask);
router.delete('/delete-tasks/:id', authenticateUser,isManager,deleteTask);
router.get('/get-tasks/assigned', authenticateUser,isServicePersonal,getTasksByAssignedUser);
router.get('/get-tasks/done', getAllDoneTasks);
router.get('/get-tasks/done/user',authenticateUser,isServicePersonal,getDoneTasksForUser);
router.post('/tasks/fromMachine/:machineId',authenticateUser,isFreeAccess,createTaskFromMachine);

const uploadFileToGridFS = require('../utils/uploadImage'); // Import the upload function

// Configure Multer for memory storage
// const storage = multer.memoryStorage();
// const upload = multer({ storage });

// File Upload Endpoint
router.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const uploadResult = await uploadFileToGridFS(req.file); // Call the function to upload the file
    res.status(200).json(uploadResult); // Return the success message with file metadata
  } catch (err) {
    res.status(500).json(err); // Return error if upload fails
  }
});

module.exports = router;
