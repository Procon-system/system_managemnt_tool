const { GridFsStorage } = require('multer-gridfs-storage');
const mongoose = require('mongoose');

let storage;

function initializeStorage() {
  if (!storage) {
    if (!mongoose.connection || !mongoose.connection.db) {
      console.error('MongoDB connection not established properly.');
      return;
    }

    console.log("MongoDB Connection Details:", mongoose.connection.readyState); // Log connection state
    
    storage = new GridFsStorage({
      db: mongoose.connection.db,
      file: (req, file) => {
        console.log("Processing file for GridFS:", file);
        if (!file.originalname || !file.mimetype) {
          throw new Error('File metadata is invalid');
        }
        return {
          bucketName: 'fs',
          filename: file.originalname,
        };
      },
    }).on('connection', () => {
      console.log('GridFS storage connection established');
    }).on('connectionFailed', (err) => {
      console.error('GridFS connection failed:', err);
    });
    
    storage.on('connection', () => {
      console.log('GridFS storage connection established');
    });

    storage.on('connectionFailed', (err) => {
      console.error('GridFS connection failed:', err);
    });
  }
}

module.exports = {
  initializeStorage,
  getStorage: () => {
    if (!storage) {
      throw new Error('GridFS storage is not initialized yet');
    }
    return storage;
  },
};
