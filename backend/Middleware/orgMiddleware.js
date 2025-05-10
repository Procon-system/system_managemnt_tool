
// const { getOrganizationDB } = require('../config/dbManager');
// const mongoose = require('mongoose');

// module.exports = async (req, res, next) => {
//   try {
//     console.log("middleware",req.user)
//     // Skip middleware for auth routes
//     if (req.path.startsWith('/auth/login')) {
//       return next();
//     }

//     // Get orgId from:
//     // - JWT token (if authenticated)
//     // - Header (x-org-id)
//     // - Subdomain
//     const orgId = req.user?.org_id ||  req.tenantId ||
//                  req.headers['x-org-id'] || 
//                  req.hostname.split('.')[0];

//     if (!orgId) {
//       return res.status(400).json({ 
//         error: 'Organization context required',
//         suggestions: [
//           'Include X-Org-ID header',
//           'Use organization subdomain',
//           'Authenticate with org-scoped token'
//         ]
//       });
//     }
//     const tenantDB = await getOrganizationDB(orgId);

//     // Attach to request
//     req.tenantDB = tenantDB;
//     req.orgDB = tenantDB;
//     req.tenantModels = {
//       User: tenantDB.model('User'),
//       // Add other models here if needed (e.g., Role, Project, etc.)
//     };

   
//     // Optional: Verify organization exists
//     const Organization = mongoose.model('Organization');
//     const orgExists = await Organization.exists({ _id: orgId });
    
//     if (!orgExists) {
//       return res.status(404).json({ error: 'Organization not found' });
//     }

//     next();
//   } catch (error) {
//     console.error('Org middleware error:', error);
//     next(error);
//   }
// };
// middleware/tenantResolver.js

const { getOrganizationDB } = require('../config/dbManager');
const mongoose = require('mongoose');

module.exports = async (req, res, next) => {
  try {
    // Skip middleware for public/auth routes
    if (req.path.startsWith('/auth/login') || req.path.startsWith('/public')) {
      return next();
    }

    // Determine organization ID (tenant context)
    const orgId = 
      req.user?.org_id ||
      req.tenantId ||
      req.headers['x-org-id'] ||
      req.hostname.split('.')[0]; // for subdomain-based tenancy

    if (!orgId) {
      return res.status(400).json({ 
        success: false,
        error: 'Organization context required',
        suggestions: [
          'Include X-Org-ID header',
          'Use subdomain-based routing',
          'Authenticate with org-scoped token'
        ]
      });
    }

    // Get tenant database
    const tenantDB = await getOrganizationDB(orgId);
    req.tenantDB = tenantDB;

    // Attach commonly used tenant models
    req.tenantModels = {
      User: tenantDB.model('User'),
      ResourceType: tenantDB.model('ResourceType'),
      Resource: tenantDB.model('Resource'),
      Task: tenantDB.model('Task'),
      Team: tenantDB.model('Team'),
      // Add others as needed
    };

    // Optionally validate that the organization exists globally
    const Organization = mongoose.model('Organization');
    const exists = await Organization.exists({ _id: orgId });

    if (!exists) {
      return res.status(404).json({ 
        success: false,
        error: 'Organization not found' 
      });
    }

    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    next(error);
  }
};
