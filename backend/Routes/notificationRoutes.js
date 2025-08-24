// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../Controllers/notificationController');
router.get('/', notificationController.getUserNotifications);
router.patch('/read', notificationController.markNotificationsRead);
router.post('/register-push-token', async (req, res) => {
    try {
      const { PushToken } = req.tenantModels;
      const { token, platform } = req.body;
  console.log("token, platform ",token, platform )
  console.log("req.tenantModels",req.tenantModels)
      if (!token) return res.status(400).json({ success: false, message: 'token required' });
  
      const doc = await PushToken.findOneAndUpdate(
        { token },
        { 
          token,
          platform: platform || 'unknown',
          user: req.user._id,
          organization: req.user.org_id,
          lastSeenAt: new Date(),
        },
        { upsert: true, new: true }
      );
  
      res.json({ success: true, data: { id: doc._id, token: doc.token } });
    } catch (err) {
      console.error('register-push-token error', err);
      res.status(500).json({ success: false, message: 'failed to save token' });
    }
  });
  
  module.exports = router;
module.exports = router;
