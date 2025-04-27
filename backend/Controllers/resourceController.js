// const resourceService = require('../Services/resourceService');
// const { sendResponse } = require('../utils/responseHandler');

// exports.createResource = async (req, res) => {
//   try {
//     const { type, fields, displayName } = req.body;
    
//     const resourceData = {
//       type,
//       displayName, // Ensure displayName is included
//       fields,
//       organization: req.user.organization,
//       createdBy: req.user._id
//     };

   
//     const resource = await resourceService.createResource(resourceData);
//     sendResponse(res, 201, 'Resource created successfully', resource);
//   } catch (error) {
//     console.error('Error in createResource:', error);
//     sendResponse(res, 400, error.message, null);
//   }
// };
// exports.getResourceById = async (req, res) => {
//   try {
//     const resource = await resourceService.getResourceById(
//       req.params.id,
//       req.user.organization
//     );
    
//     if (!resource) {
//       return sendResponse(res, 404, 'Resource not found', null);
//     }
    
//     sendResponse(res, 200, 'Resource retrieved successfully', resource);
//   } catch (error) {
//     sendResponse(res, 500, error.message, null);
//   }
// };

// exports.getResourcesByType = async (req, res) => {
//   try {
//     const { page = 1, limit = 10 } = req.query;
//     const resources = await resourceService.getResourcesByType(
//       req.params.typeId,
//       req.user.organization,
//       { page, limit }
//     );
    
//     sendResponse(res, 200, 'Resources retrieved successfully', resources);
//   } catch (error) {
//     sendResponse(res, 500, error.message, null);
//   }
// };

// exports.updateResource = async (req, res) => {
//   try {
//     const updatedResource = await resourceService.updateResource(
//       req.params.id,
//       req.body,
//       req.user.organization
//     );
    
//     sendResponse(res, 200, 'Resource updated successfully', updatedResource);
//   } catch (error) {
//     sendResponse(res, 500, error.message, null);
//   }
// };

// exports.deleteResource = async (req, res) => {
//   try {
//     await resourceService.deleteResource(
//       req.params.id,
//       req.user.organization
//     );
    
//     sendResponse(res, 200, 'Resource deleted successfully', null);
//   } catch (error) {
//     sendResponse(res, 500, error.message, null);
//   }
// };
const resourceService = require('../Services/resourceService');
const { sendResponse } = require('../utils/responseHandler');
const { 
  getFromCache, 
  setToCache, 
  deleteFromCache, 
  clearPattern,
  generateCacheKey
} = require('../redisUtils');

// Cache TTL configuration
const CACHE_TTL = {
  RESOURCE: 3600, // 1 hour for individual resources
  RESOURCE_LIST: 1800, // 30 minutes for resource lists
  DEFAULT: 1200 // 20 minutes default
};

exports.createResource = async (req, res) => {
  try {
    const { type, fields, displayName } = req.body;
    
    const resourceData = {
      type,
      displayName,
      fields,
      organization: req.user.organization,
      createdBy: req.user._id
    };

    const resource = await resourceService.createResource(resourceData);
    
    // Clear relevant cache entries
    await Promise.all([
      clearPattern(`resource:type:${type}:org:${req.user.organization}*`),
      clearPattern(`resources:org:${req.user.organization}*`)
    ]);
    console.log(`[Cache] Cleared resource caches after creation`);

    sendResponse(res, 201, 'Resource created successfully', resource);
  } catch (error) {
    console.error('Error in createResource:', error);
    sendResponse(res, 400, error.message, null);
  }
};

exports.getResourceById = async (req, res) => {
  try {
    const resourceId = req.params.id;
    const orgId = req.user.organization;
    const cacheKey = generateCacheKey('resource', orgId, { id: resourceId });

    // Try cache first
    const cachedResource = await getFromCache(cacheKey);
    if (cachedResource) {
      console.log(`[Cache] Hit for resource ${resourceId}`);
      return sendResponse(res, 200, 'Resource retrieved from cache', cachedResource);
    }

    const resource = await resourceService.getResourceById(resourceId, orgId);
    
    if (!resource) {
      return sendResponse(res, 404, 'Resource not found', null);
    }
    
    // Cache the result
    await setToCache(cacheKey, resource, CACHE_TTL.RESOURCE);
    console.log(`[Cache] Set cache for resource ${resourceId}`);
    
    sendResponse(res, 200, 'Resource retrieved successfully', resource);
  } catch (error) {
    sendResponse(res, 500, error.message, null);
  }
};

exports.getResourcesByType = async (req, res) => {
  try {
    const typeId = req.params.typeId;
    const orgId = req.user.organization;
    const { page = 1, limit = 10 } = req.query;
    const cacheKey = generateCacheKey('resource:type', orgId, { 
      typeId, 
      page, 
      limit 
    });

    // Try cache first
    const cachedResources = await getFromCache(cacheKey);
    if (cachedResources) {
      console.log(`[Cache] Hit for resources of type ${typeId}, page ${page}`);
      return sendResponse(res, 200, 'Resources retrieved from cache', cachedResources);
    }

    const resources = await resourceService.getResourcesByType(
      typeId,
      orgId,
      { page, limit }
    );
    
    // Cache the results
    await setToCache(cacheKey, resources, CACHE_TTL.RESOURCE_LIST);
    console.log(`[Cache] Set cache for resources of type ${typeId}, page ${page}`);
    
    sendResponse(res, 200, 'Resources retrieved successfully', resources);
  } catch (error) {
    sendResponse(res, 500, error.message, null);
  }
};

exports.updateResource = async (req, res) => {
  try {
    const resourceId = req.params.id;
    const orgId = req.user.organization;
    const resource = await resourceService.getResourceById(resourceId, orgId);

    const updatedResource = await resourceService.updateResource(
      resourceId,
      req.body,
      orgId
    );
    
    // Clear relevant cache entries
    await Promise.all([
      deleteFromCache(generateCacheKey('resource', orgId, { id: resourceId })),
      clearPattern(`resource:type:${resource.type}:org:${orgId}*`),
      clearPattern(`resources:org:${orgId}*`)
    ]);
    console.log(`[Cache] Cleared cache for updated resource ${resourceId}`);

    sendResponse(res, 200, 'Resource updated successfully', updatedResource);
  } catch (error) {
    sendResponse(res, 500, error.message, null);
  }
};

exports.deleteResource = async (req, res) => {
  try {
    const resourceId = req.params.id;
    const orgId = req.user.organization;
    const resource = await resourceService.getResourceById(resourceId, orgId);

    await resourceService.deleteResource(resourceId, orgId);
    
    // Clear relevant cache entries
    await Promise.all([
      deleteFromCache(generateCacheKey('resource', orgId, { id: resourceId })),
      clearPattern(`resource:type:${resource.type}:org:${orgId}*`),
      clearPattern(`resources:org:${orgId}*`)
    ]);
    console.log(`[Cache] Cleared cache for deleted resource ${resourceId}`);

    sendResponse(res, 200, 'Resource deleted successfully', null);
  } catch (error) {
    sendResponse(res, 500, error.message, null);
  }
};