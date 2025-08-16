const express = require('express');
const router = express.Router();
const organizationController = require('../Controllers/organizationController');

// Admin-only routes
router.post('/', organizationController.createOrganization);
router.get('/', organizationController.getAllOrganizations);
router.get('/:id', organizationController.getOrganization);
router.put('/:id',  organizationController.updateOrganization);
router.delete('/:id', organizationController.deleteOrganization);
router.get('/me',  organizationController.getMyOrganization);
router.put('/me/settings', organizationController.updateMyOrganizationSettings);
router.put('/me/subscription', organizationController.updateMySubscription);

module.exports = router;