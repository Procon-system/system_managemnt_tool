// utils/uploadImage.js

const { GridFSBucket } = require('mongodb');
const mongoose = require('mongoose');
const stream = require('stream');
const uploadFileToGridFS = (file) => {
  console.log("file upload",file);
  if (!file || !file.buffer) {
    console.error("File is undefined or missing buffer");
    return Promise.reject({ error: "Invalid file input" });
  }

  return new Promise((resolve, reject) => {
    try {
      const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
      const uploadStream = bucket.openUploadStream(file.originalname);

      const readableStream = new stream.PassThrough();
      readableStream.end(file.buffer);

      readableStream
        .pipe(uploadStream)
        .on('error', (err) => {
          console.error('GridFS upload error:', err);
          reject({ error: 'File upload failed', details: err.message });
        })
        .on('finish', () => {
          // Use the id from the uploadStream instance
          const uploadedFileId = uploadStream.id;
          console.log('Uploaded file ID:', uploadedFileId);
          resolve({
            message: 'File uploaded successfully',
            file: { _id: uploadedFileId }, // Return the _id as expected
          });
        });
    } catch (err) {
      console.error('Error during file upload:', err);
      reject({ error: 'An error occurred during file upload', details: err.message });
    }
  });
};


module.exports = uploadFileToGridFS;
