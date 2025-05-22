const resourceService = require('../Services/resourceService');
const { sendResponse } = require('../utils/responseHandler');

exports.createResource = async (req, res) => {
  try {
    const { type, fields, displayName } = req.body;
    const orgId = req.user.org_id;

    const resourceData = {
      type,
      displayName,
      fields,
      organization: orgId,
      createdBy: req.user._id
    };

    const { Resource, ResourceType } = req.tenantModels;
    const resource = await resourceService.createResource(resourceData, Resource, ResourceType);

    await req.tenantCache.flush();
    console.log(`[CACHE][FLUSH] All resource cache flushed for org: ${orgId}`);

    sendResponse(res, 201, 'Resource created successfully', resource);
  } catch (error) {
    console.error('Error in createResource:', error);
    sendResponse(res, 400, error.message, null);
  }
};


exports.getResourceById = async (req, res) => {
  try {
    const resourceId = req.params.id;
    const orgId = req.user.org_id;

    const { Resource } = req.tenantModels;
    const cache = req.tenantCache;

    const cacheKey = `resource:${resourceId}`;
    const cached = await cache.get(cacheKey);

    if (cached) {
      console.log(`[CACHE][HIT] ${cacheKey} (org: ${orgId})`);
      return sendResponse(res, 200, 'Resource retrieved from cache', JSON.parse(cached));
    }

    console.log(`[CACHE][MISS] ${cacheKey} (org: ${orgId})`);
    const resource = await resourceService.getResourceById(resourceId, orgId, Resource);
    if (!resource) return sendResponse(res, 404, 'Resource not found', null);

    await cache.set(cacheKey, JSON.stringify(resource), { expiration: 300 });
    console.log(`[CACHE][SET] ${cacheKey} (TTL: 300s)`);

    sendResponse(res, 200, 'Resource retrieved successfully', resource);
  } catch (error) {
    sendResponse(res, 500, error.message, null);
  }
};

exports.getResourcesByType = async (req, res) => {
  try {
    const typeId = req.params.typeId;
    const orgId = req.user.org_id;
    const { page = 1, limit = 10 } = req.query;
    const { Resource } = req.tenantModels;
    const cache = req.tenantCache;

    const cacheKey = `resources:type:${typeId}:page:${page}:limit:${limit}`;
    const cached = await cache.get(cacheKey);

    if (cached) {
      console.log(`[CACHE][HIT] ${cacheKey} (org: ${orgId})`);
      return sendResponse(res, 200, 'Resources retrieved from cache', JSON.parse(cached));
    }

    console.log(`[CACHE][MISS] ${cacheKey} (org: ${orgId})`);
    const resources = await resourceService.getResourcesByType(typeId, orgId, { page, limit }, Resource);
    await cache.set(cacheKey, JSON.stringify(resources), { expiration: 300 });
    console.log(`[CACHE][SET] ${cacheKey} (TTL: 300s)`);

    sendResponse(res, 200, 'Resources retrieved successfully', resources);
  } catch (error) {
    sendResponse(res, 500, error.message, null);
  }
};

exports.updateResource = async (req, res) => {
  try {
    const resourceId = req.params.id;
    const orgId = req.user.org_id;
    const { Resource } = req.tenantModels;

    const resource = await resourceService.getResourceById(resourceId, orgId, Resource);
    if (!resource) return sendResponse(res, 404, 'Resource not found', null);

    const updatedResource = await resourceService.updateResource(resourceId, req.body, orgId, Resource);

    const cacheKey = `resource:${resourceId}`;
    await req.tenantCache.del(cacheKey);
    console.log(`[CACHE][DEL] ${cacheKey} after update`);

    sendResponse(res, 200, 'Resource updated successfully', updatedResource);
  } catch (error) {
    sendResponse(res, 500, error.message, null);
  }
};

exports.deleteResource = async (req, res) => {
  try {
    const resourceId = req.params.id;
    const orgId = req.user.org_id;
    const { Resource } = req.tenantModels;

    const resource = await resourceService.getResourceById(resourceId, orgId, Resource);
    if (!resource) return sendResponse(res, 404, 'Resource not found', null);

    await resourceService.deleteResource(resourceId, orgId, Resource);

    const cacheKey = `resource:${resourceId}`;
    await req.tenantCache.del(cacheKey);
    console.log(`[CACHE][DEL] ${cacheKey} after deletion`);

    sendResponse(res, 200, 'Resource deleted successfully', null);
  } catch (error) {
    sendResponse(res, 500, error.message, null);
  }
};
