
const express = require('express');
const router = express.Router();

const taskRoutes = require('./taskRoutes');
const resourceRoutes = require('./resourceRoutes');
const resourceTypeRoutes = require('./resourceTypeRoutes');
const authRoutes = require('./authRoutes');
const teamRoutes = require('./teamRoutes');
const userRoutes = require('./userRoutes');
const notificationRoutes = require('./notificationRoutes');
const clientAssetRoutes = require('./clientAssetRoutes');
const reportRoutes = require('./reportRoutes');
const sensorRoutes = require('./sensorRoutes');
const { authenticateUser } = require('../Middleware/authMiddleware');
const orgMiddleware = require('../Middleware/orgMiddleware');

// ✅ PUBLIC routes (no token/org needed)
router.use('/auth', authRoutes);

// ✅ PROTECTED routes (require auth + org)
router.use('/tasks',authenticateUser, orgMiddleware, taskRoutes);
router.use('/team', authenticateUser, orgMiddleware, teamRoutes);
router.use('/resources', authenticateUser, orgMiddleware, resourceRoutes);
router.use('/resource-types', authenticateUser, orgMiddleware, resourceTypeRoutes);
router.use('/users', authenticateUser, orgMiddleware, userRoutes);
router.use('/notifications', authenticateUser, orgMiddleware, notificationRoutes);
router.use('/client-assets', authenticateUser, orgMiddleware, clientAssetRoutes);
router.use('/reports', authenticateUser, orgMiddleware, reportRoutes);
router.use('/sensors', authenticateUser, orgMiddleware, sensorRoutes);
module.exports = router;
