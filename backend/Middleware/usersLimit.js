// middleware/usersLimit.js
const User = require('../Models/UserSchema');

const checkUserLimit = async (req, res, next) => {
  try {
    const adminUser = await User.findById(req.user._id);
    
    if (!adminUser || adminUser.access_level !== 5 || !adminUser.max_permitted_user_amount) {
      return next();
    }

    const currentUserCount = await User.countDocuments({
      organization: adminUser.organization,
      isActive: true
    });

    if (currentUserCount >= adminUser.max_permitted_user_amount) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'USER_LIMIT_REACHED',
          message: 'Maximum user limit reached',
          details: {
            currentCount: currentUserCount,
            maxAllowed: adminUser.max_permitted_user_amount,
            resourceType: 'user',
            limitType: 'organization',
            upgradeAvailable: adminUser.subscription_type === 'free'
          },
          actions: [
            {
              label: 'Upgrade subscription',
              url: '/subscription/upgrade',
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
};

// Make sure to export the middleware
module.exports = checkUserLimit;