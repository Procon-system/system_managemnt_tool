
const { getOrganizationDB } = require('../config/dbManager');

module.exports = async (req, res, next) => {
  try {
    // Skip middleware for auth routes
    if (req.path.startsWith('/auth')) {
      return next();
    }

    // Get orgId from:
    // - JWT token (if authenticated)
    // - Header (x-org-id)
    // - Subdomain
    const orgId = req.user?.orgId || 
                 req.headers['x-org-id'] || 
                 req.hostname.split('.')[0];

    if (!orgId) {
      return res.status(400).json({ 
        error: 'Organization context required',
        suggestions: [
          'Include X-Org-ID header',
          'Use organization subdomain',
          'Authenticate with org-scoped token'
        ]
      });
    }

    // Attach org-specific DB to request
    req.orgDB = await getOrganizationDB(orgId);
    
    // Optional: Verify organization exists
    const Organization = mongoose.model('Organization');
    const orgExists = await Organization.exists({ _id: orgId });
    
    if (!orgExists) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    next();
  } catch (error) {
    console.error('Org middleware error:', error);
    next(error);
  }
};