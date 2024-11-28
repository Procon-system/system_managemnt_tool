// utils/uploadImage.js

const { GridFSBucket } = require('mongodb');
const mongoose = require('mongoose');
const stream = require('stream');

// Function to handle file upload
// const uploadFileToGridFS = (file) => {
//   console.log("file",file);
//   return new Promise((resolve, reject) => {
//     try {
//       const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
//       const uploadStream = bucket.openUploadStream(file.originalname);

//       const readableStream = new stream.PassThrough();
//       readableStream.end(file.buffer);

//       readableStream
//         .pipe(uploadStream)
//         .on('error', (err) => {
//           console.error('GridFS upload error:', err);
//           reject({ error: 'File upload failed', details: err.message });
//         })
//         .on('finish', (file) => {
//           console.log('Uploaded file:', file);
//           resolve({ message: 'File uploaded successfully', file });
//         });
//     } catch (err) {
//       console.error('Error during file upload:', err);
//       reject({ error: 'An error occurred during file upload', details: err.message });
//     }
//   });
const uploadFileToGridFS = (file) => {
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
        .on('finish', (uploadedFile) => {
          // Make sure the file metadata includes _id
          console.log('Uploaded file:', uploadedFile);
          resolve({
            message: 'File uploaded successfully',
            file: uploadedFile, // Ensure this contains file metadata, especially _id
          });
        });
    } catch (err) {
      console.error('Error during file upload:', err);
      reject({ error: 'An error occurred during file upload', details: err.message });
    }
  });
};


module.exports = uploadFileToGridFS;
