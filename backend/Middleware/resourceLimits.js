const mongoose = require('mongoose');

const checkResourceTypeLimit = async (req, res, next) => {
  try {
    const isGlobalAdmin = req.user?.isGlobalAdmin;

    // Get the correct User model (global DB)
    const UserModel = req.mainModels?.Superadmin;
    if (!UserModel) {
      return res.status(500).json({ success: false, message: 'User model not available' });
    }

    const adminUser = await UserModel.findById(req.user._id);
    if (!adminUser) {
      return res.status(401).json({ success: false, message: 'Admin user not found' });
    }

    // Skip limit check if not admin, no limit set, or global admin
    if (
      adminUser.access_level !== 5 || 
      !adminUser.max_permitted_resource_amount || 
      isGlobalAdmin
    ) {
      return next();
    }

    // Get tenant ResourceType model
    const ResourceTypeModel = req.tenantModels?.ResourceType || (req.tenantDB && req.tenantDB.model('ResourceType'));
    if (!ResourceTypeModel) {
      return res.status(500).json({ success: false, message: 'ResourceType model not available' });
    }

    const orgId = adminUser.organization ?? adminUser.org_id;

    const currentCount = await ResourceTypeModel.countDocuments({
      organization: orgId,
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } },
        { isDeleted: null },
      ],
    });
    

    if (currentCount >= adminUser.max_permitted_resource_amount) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'RESOURCE_LIMIT_REACHED',
          message: 'Maximum resource type limit reached',
          details: {
            currentCount,
            maxAllowed: adminUser.max_permitted_resource_amount,
            resourceType: 'resourceType',
            limitType: 'organization',
            upgradeAvailable: adminUser.subscription_type === 'free'
          },
          actions: [
            {
              label: 'Upgrade subscription',
              url: '/subscription/upgrade',
              method: 'GET'
            },
            {
              label: 'Contact support',
              url: '/contact-support',
              method: 'GET'
            }
          ]
        }
      });
    }

    next();
  } catch (error) {
    console.error('Resource type limit middleware error:', error);
    next(error);
  }
};

module.exports = checkResourceTypeLimit;
