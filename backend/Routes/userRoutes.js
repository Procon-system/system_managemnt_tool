const express = require('express');
const { getUsers, updateUserProfile, deleteUserAccount } = require('../Controllers/userController');
const {
    authenticateUser
  } = require('../Middleware/authMiddleware');
  
const router = express.Router();

// Route to fetch all users
router.get('/get-users', authenticateUser,getUsers);

// Route to update user profile
router.put('/update-profile/:id',authenticateUser, updateUserProfile);

// Route to delete user account
router.delete('/delete-account/:id',authenticateUser, deleteUserAccount);

module.exports = router;
