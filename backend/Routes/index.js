const express = require('express');
const router = express.Router();
const taskRoutes = require('./taskRoutes');
const resourceRoutes = require('./resourceRoutes');
const resourceTypeRoutes = require('./resourceTypeRoutes');
const organizationRoutes = require('./organizationRoutes')
const authRoutes = require('./authRoutes');
const teamRoutes =require('./teamRoutes');
router.use('/tasks', taskRoutes);
router.use('/team',teamRoutes);
router.use('/resources', resourceRoutes);
router.use('/resource-types', resourceTypeRoutes);
router.use('/auth', authRoutes);
router.use('/organization', organizationRoutes);

module.exports = router;