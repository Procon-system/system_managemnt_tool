// const express = require('express');
// const router = express.Router();
// const orgMiddleware = require('../Middleware/orgMiddleware'); // Add this line

// // Apply organization middleware to ALL routes
// router.use(orgMiddleware);

// // Your existing route imports
// const taskRoutes = require('./taskRoutes');
// const resourceRoutes = require('./resourceRoutes');
// const resourceTypeRoutes = require('./resourceTypeRoutes');
// // const organizationRoutes = require('./organizationRoutes');
// const authRoutes = require('./authRoutes');
// const teamRoutes = require('./teamRoutes');
// const userRoutes = require('./userRoutes');

// // Your existing route mounting
// router.use('/tasks', taskRoutes);
// router.use('/team', teamRoutes);
// router.use('/resources', resourceRoutes);
// router.use('/resource-types', resourceTypeRoutes);
// router.use('/auth', authRoutes);
// // router.use('/organization', organizationRoutes);
// router.use('/users', userRoutes);

// module.exports = router;
const express = require('express');
const router = express.Router();

const taskRoutes = require('./taskRoutes');
const resourceRoutes = require('./resourceRoutes');
const resourceTypeRoutes = require('./resourceTypeRoutes');
const authRoutes = require('./authRoutes');
const teamRoutes = require('./teamRoutes');
const userRoutes = require('./userRoutes');

const { authenticateUser } = require('../Middleware/authMiddleware');
const orgMiddleware = require('../Middleware/orgMiddleware');

// ✅ PUBLIC routes (no token/org needed)
router.use('/auth', authRoutes);

// ✅ PROTECTED routes (require auth + org)
router.use('/tasks', authenticateUser, orgMiddleware, taskRoutes);
router.use('/team', authenticateUser, orgMiddleware, teamRoutes);
router.use('/resources', authenticateUser, orgMiddleware, resourceRoutes);
router.use('/resource-types', authenticateUser, orgMiddleware, resourceTypeRoutes);
router.use('/users', authenticateUser, orgMiddleware, userRoutes);

module.exports = router;
