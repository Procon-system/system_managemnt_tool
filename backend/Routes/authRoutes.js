// routes/authRoutes.js
const checkUserLimit  = require('../Middleware/usersLimit');

const express = require('express');
const { 
    registerController,loginController,logoutController,
    confirmEmailController,
  forgotPasswordController,
  resetPasswordController
} = require('../Controllers/authController');

const { authenticateUser, authorize } = require('../Middleware/authMiddleware');

const router = express.Router();

router.post('/register', authenticateUser,authorize([5]),checkUserLimit ,registerController);
router.post('/login', loginController);
router.post('/logout', logoutController);
router.post('/confirm-email/:confirmationCode',confirmEmailController);
router.post('/forgot-password',forgotPasswordController);
router.post('/reset-password/:id/:token', resetPasswordController);

module.exports = router;
