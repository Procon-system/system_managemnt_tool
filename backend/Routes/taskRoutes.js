const express = require('express');
const router = express.Router();
const taskController = require('../Controllers/taskControllers');
const { authenticateUser, authorize } = require('../Middleware/authMiddleware');
const multer = require('multer');
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Apply authentication to all routes
router.use(authenticateUser);

router.post('/',authorize([3, 4, 5]), taskController.createTask);
router.get('/', authorize([1, 2, 3, 4, 5]),taskController.getTasksByOrganization);
router.get('/:id', authorize([2,3, 4, 5]),taskController.getTaskById);
router.put('/:id',upload.array('images', 5),authorize([3, 4, 5]),taskController.updateTask);
router.delete('/:id',authorize([3, 4, 5]), taskController.deleteTask);
router.patch('/:id/status', authorize([2,3, 4, 5]),taskController.changeTaskStatus);
router.post('/filter', authorize([ 2, 3, 4, 5]), taskController.filterTasksByOrganization);
router.get('/done/all', authorize([2, 3, 4, 5]), taskController.getAllDoneTasks);
router.get('/done/user', authorize([2, 3, 4, 5]), taskController.getDoneTasksForUser);
router.get('/assigned/user', authorize([2, 3, 4, 5]), taskController.getTasksByAssignedUser);
router.get('/image/:fileId', async (req, res) => {
    try {
      const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
      const fileId = new mongoose.Types.ObjectId(req.params.fileId);
  
      // Check if file exists
      const file = await bucket.find({ _id: fileId }).next();
      if (!file) {
        return res.status(404).json({ success: false, message: "Image not found" });
      }
  
      // Set Content-Type dynamically (e.g., image/jpeg, image/png)
      res.set('Content-Type', file.contentType || 'image/jpeg');
  
      // Stream the image to the client
      const downloadStream = bucket.openDownloadStream(fileId);
      downloadStream.pipe(res);
    } catch (error) {
        console.log("error",error)
      console.error("Error fetching image:", error);
      res.status(500).json({ success: false, message: "Failed to fetch image" });
    }
  });
  // routes/taskRoutes.js
router.get('/images/bulk', async (req, res) => {
    try {
      const { fileIds } = req.query; // Expects ?fileIds=id1,id2,id3
      console.log("fileIds",fileIds)
      const ids = fileIds.split(',').map(id => new mongoose.Types.ObjectId(id));
  
      const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
      const files = await bucket.find({ _id: { $in: ids } }).toArray();
  
      // Return metadata (frontend will fetch each image separately)
      res.status(200).json({
        success: true,
        data: files.map(file => ({
          fileId: file._id,
          contentType: file.contentType,
          filename: file.filename
        }))
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch images" });
    }
  });
module.exports = router;