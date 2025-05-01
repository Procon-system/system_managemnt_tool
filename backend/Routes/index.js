const express = require('express');
const router = express.Router();
const orgMiddleware = require('../Middleware/orgMiddleware'); // Add this line

// Apply organization middleware to ALL routes
router.use(orgMiddleware);

// Your existing route imports
const taskRoutes = require('./taskRoutes');
const resourceRoutes = require('./resourceRoutes');
const resourceTypeRoutes = require('./resourceTypeRoutes');
// const organizationRoutes = require('./organizationRoutes');
const authRoutes = require('./authRoutes');
const teamRoutes = require('./teamRoutes');
const userRoutes = require('./userRoutes');

// Your existing route mounting
router.use('/tasks', taskRoutes);
router.use('/team', teamRoutes);
router.use('/resources', resourceRoutes);
router.use('/resource-types', resourceTypeRoutes);
router.use('/auth', authRoutes);
// router.use('/organization', organizationRoutes);
router.use('/users', userRoutes);

module.exports = router;