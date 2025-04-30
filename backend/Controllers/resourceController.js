
const resourceService = require('../Services/resourceService');
const { sendResponse } = require('../utils/responseHandler');
const { 
  getFromCache, 
  setToCache, 
  deleteFromCache, 
  clearPattern,
  generateCacheKey
} = require('../redisUtils');

const CACHE_TTL = {
  RESOURCE: 3600,
  RESOURCE_LIST: 1800,
  DEFAULT: 1200
};

async function invalidateResourceCaches(orgId, resourceId = null, resourceType = null) {
  try {
    const patterns = [
      `resource:*:org:${orgId}*`,
      `resources:org:${orgId}*`,
      `resource:type:*:org:${orgId}*`
    ];

    // Add specific resource invalidation if ID exists
    if (resourceId) {
      patterns.push(`resource:${resourceId}:org:${orgId}*`);
    }

    // Add type-specific invalidation if type exists
    if (resourceType) {
      patterns.push(`resource:type:${resourceType}:org:${orgId}*`);
    }

    // Execute in parallel with timeout
    await Promise.race([
      Promise.all(patterns.map(pattern => clearPattern(pattern))),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Cache invalidation timeout')), 2000))
    ]);
    
    console.log(`Cache invalidated for ${patterns.length} patterns`);
  } catch (err) {
    console.error('Partial cache invalidation completed with errors:', err.message);
    // Swallow error to prevent blocking main operation
  }
}


exports.createResource = async (req, res) => {
  try {
    const { type, fields, displayName } = req.body;
    const orgId = req.user.organization;

    const resourceData = {
      type,
      displayName,
      fields,
      organization: orgId,
      createdBy: req.user._id
    };

    // 1. Create the resource (critical operation)
    const resource = await resourceService.createResource(resourceData);

    // 2. Cache invalidation (fire-and-forget with error handling)
    // invalidateResourceCaches(orgId, null, type)
    //   .catch(err => console.error('Cache invalidation error:', err));

    // 3. Send response immediately
    sendResponse(res, 201, 'Resource created successfully', resource);
    
    // 4. Optional: Log completion
    console.log('Resource creation completed for org:', orgId);
  } catch (error) {
    // 5. Ensure errors are properly handled
    console.error('Error in createResource:', error);
    sendResponse(res, 400, error.message, null);
  }
};


exports.getResourceById = async (req, res) => {
  try {
    const resourceId = req.params.id;
    const orgId = req.user.organization;
    const cacheKey = generateCacheKey('resource', orgId, { id: resourceId });

    const cachedResource = await getFromCache(cacheKey);
    if (cachedResource) {
      console.log(`[Cache] Hit for resource ${resourceId}`);
      return sendResponse(res, 200, 'Resource retrieved from cache', cachedResource);
    }

    const resource = await resourceService.getResourceById(resourceId, orgId);
    if (!resource) return sendResponse(res, 404, 'Resource not found', null);

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

    // const cacheKey = generateCacheKey('resource:type', orgId, { typeId, page, limit });

    // const cachedResources = await getFromCache(cacheKey);
    // if (cachedResources) {
    //   console.log(`[Cache] Hit for resources of type ${typeId}, page ${page}`);
    //   return sendResponse(res, 200, 'Resources retrieved from cache', cachedResources);
    // }

    const resources = await resourceService.getResourcesByType(typeId, orgId, { page, limit });

    // await setToCache(cacheKey, resources, CACHE_TTL.RESOURCE_LIST);
    // console.log(`[Cache] Set cache for resources of type ${typeId}, page ${page}`);

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
    if (!resource) return sendResponse(res, 404, 'Resource not found', null);

    const updatedResource = await resourceService.updateResource(resourceId, req.body, orgId);

    // await invalidateResourceCaches(orgId, resourceId, resource.type);
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
    if (!resource) return sendResponse(res, 404, 'Resource not found', null);

    await resourceService.deleteResource(resourceId, orgId);

    // await invalidateResourceCaches(orgId, resourceId, resource.type);
    sendResponse(res, 200, 'Resource deleted successfully', null);
  } catch (error) {
    sendResponse(res, 500, error.message, null);
  }
};
