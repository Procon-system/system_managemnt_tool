
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
      authenticateUser,
      isRandomUser,
      isServicePersonal,
      isManager,
      isFreeAccess,
      isAdmin,
    } = require('../Middleware/authMiddleware');
    
const router = express.Router();
const mongoose = require('mongoose');
router.post('/create-tasks',authenticateUser,isManager,createTask);
router.get('/get-all-tasks', getAllTasks);
router.get('/get-tasks-id/:id',authenticateUser,isServicePersonal,getTaskById);
router.put('/update-tasks/:id',authenticateUser,isServicePersonal,updateTask);
router.delete('/delete-tasks/:id', authenticateUser,isManager,deleteTask);
router.get('/get-tasks/assigned', authenticateUser,isServicePersonal,getTasksByAssignedUser);
router.get('/get-tasks/done', getAllDoneTasks);
router.get('/get-tasks/done/user',authenticateUser,isServicePersonal,getDoneTasksForUser);
router.post('/tasks/fromMachine/:machineId',authenticateUser,isFreeAccess,createTaskFromMachine);
// router.post('/upload', (req, res) => {
//   let storage;
//   try {
//     storage = getStorage();
//     console.log("Retrieved storage:", storage);
//   } catch (error) {
//     console.error('Storage not initialized:', error);
//     return res.status(500).json({ error: 'GridFS storage is not initialized yet' });
//   }

//   const upload = multer({ storage }).single('image');

//   console.log('Starting upload middleware...');
//   upload(req, res, (err) => {
//     console.log('Upload middleware completed'); // Ensure this gets logged
  
//     if (err) {
//       console.error('Error during upload:', err);
//       return res.status(500).json({ error: 'File upload failed', details: err.message });
//     }
  
//     if (!req.file) {
//       console.error('No file received during upload');
//       return res.status(400).json({ error: 'No file uploaded' });
//     }
  
//     console.log('Uploaded file metadata:', req.file);
//     res.status(200).json({
//       message: 'File uploaded successfully',
//       file: req.file,
//     });
//   });
  
// });
const { GridFSBucket } = require('mongodb');

const multer = require('multer');

// Set up multer storage (if needed, adjust for memory or other storage options)
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
 console.log("file",req.file)
  const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'fs' });
  const uploadStream = bucket.openUploadStream(req.file.originalname);

  // Use multer memory buffer stream for the upload
  const stream = require('stream');
  const readableStream = new stream.PassThrough();
  readableStream.end(req.file.buffer);

  readableStream
    .pipe(uploadStream)
    .on('error', (err) => {
      console.error('GridFS upload error:', err);
      res.status(500).json({ error: 'File upload failed', details: err.message });
    })
    .on('finish', (file) => {
      console.log('Uploaded file:', file);
      res.status(200).json({ message: 'File uploaded successfully', file });
    });
});


module.exports = router;
