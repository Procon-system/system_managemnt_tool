// middleware/resourceLimits.js
const ResourceType = require('../Models/ResourceTypeSchema');
const User = require('../Models/UserSchema');

async function checkResourceTypeLimit(req, res, next) {
  try {
    // Get the admin user who is making the request
    const adminUser = await User.findById(req.user._id);
    
    // If user is not admin or doesn't have limit set, skip check
    if (!adminUser || adminUser.access_level !== 5 || !adminUser.max_permitted_resource_amount) {
      return next();
    }

    // Count existing resource types for this organization
    const currentResourceTypes = await ResourceType.countDocuments({
      organization: req.user.organization
    });

    // Check if limit reached
    if (currentResourceTypes >= adminUser.max_permitted_resource_amount) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'RESOURCE_LIMIT_REACHED',
          message: 'Maximum resource type limit reached',
          details: {
            currentCount: currentResourceTypes,
            maxAllowed: adminUser.max_permitted_resource_amount,
            resourceType: 'resourceType', // You can make this dynamic if needed
            limitType: 'organization', // or 'user' depending on your logic
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
    next(error);
  }
}

module.exports = checkResourceTypeLimit;