
const resourceTypeService = require('../Services/resourceTypeService');
const { sendResponse } = require('../utils/responseHandler');
const { 
  getFromCache, 
  setToCache, 
  deleteFromCache, 
  clearPattern,
  generateCacheKey
} = require('../redisUtils');

let io;

exports.setResourceTypeSocketIoInstance = (ioInstance) => {
  io = ioInstance;
};

const CACHE_TTL = {
  SHORT: 300,
  LONG: 3600,
  DEFAULT: 1800,
  LIST: 1200,
  DETAIL: 1800,
};
const invalidateResourceTypeCaches = async (orgId, typeId = null) => {
  try {
    const patterns = [
      `resource_type:*:org:${orgId}*`,  // All resource type patterns for org
      `resource_types:org:${orgId}*`,    // Resource type lists for org
      `resources:org:${orgId}*`          // Resources that might reference this type
    ];

    const specificKeys = [];
    if (typeId) {
      // Add specific keys for precise invalidation
      specificKeys.push(
        generateCacheKey('resource_type', orgId, { id: typeId }),
        generateCacheKey('resource_type_fields', orgId, { id: typeId })
      );
    }

    // Execute all operations with timeout protection
    await Promise.race([
      Promise.all([
        ...patterns.map(pattern => clearPattern(pattern)),
        ...specificKeys.map(key => deleteFromCache(key))
      ]),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Cache invalidation timeout')), 2000)
      )
    ]);

    console.log(`[Cache] Invalidated ${patterns.length + specificKeys.length} cache entries`);
  } catch (err) {
    console.error('Cache invalidation completed with errors:', err.message);
    // Continue even if cache invalidation fails
  }
};

exports.createResourceType = async (req, res) => {
  try {
    const typeData = req.body;
    const orgId = req.user.organization;
    typeData.organization = orgId;

    // Validation
    if (!typeData.fieldDefinitions?.length) {
      throw new Error('At least one field definition is required');
    }

    const fieldNames = typeData.fieldDefinitions.map(f => f.fieldName);
    if (new Set(fieldNames).size !== fieldNames.length) {
      throw new Error('Field names must be unique within a resource type');
    }

    // Create the resource type
    const resourceType = await resourceTypeService.createResourceType(typeData);

    // Fire-and-forget cache invalidation
    invalidateResourceTypeCaches(orgId, resourceType._id)
      .catch(err => console.error('Cache invalidation error:', err));

    // Socket notification
    if (io) {
      const roomId = orgId.toString();
      io.to(roomId).emit('resourceType:created', {
        resourceType,
        message: 'New resource type created',
        createdBy: req.user._id
      });
      console.log(`[Socket] Emitted resourceType:created to room ${roomId}`);
    }

    // Send response immediately
    sendResponse(res, 201, 'Resource type created successfully', resourceType);
  } catch (error) {
    console.error('Error in createResourceType:', error);
    sendResponse(res, error.statusCode || 500, error.message, null);
  }
};
exports.getResourceTypes = async (req, res) => {
  try {
    const orgId = req.user.organization;
    const cacheKey = generateCacheKey('resource_types', orgId);

    const cachedData = await getFromCache(cacheKey);
    if (cachedData) {
      console.log(`[Cache] Hit: ${cacheKey}`);
      return sendResponse(res, 200, 'Resource types retrieved from cache', cachedData);
    }

    const resourceTypes = await resourceTypeService.getResourceTypesByOrganization(orgId);
    await setToCache(cacheKey, resourceTypes, CACHE_TTL.LIST);
    console.log(`[Cache] Set: ${cacheKey}`);

    sendResponse(res, 200, 'Resource types retrieved successfully', resourceTypes);
  } catch (error) {
    sendResponse(res, 500, error.message, null);
  }
};

exports.getResourceTypeById = async (req, res) => {
  try {
    const orgId = req.user.organization;
    const typeId = req.params.id;
    const cacheKey = generateCacheKey('resource_type', orgId, { id: typeId });

    const cachedType = await getFromCache(cacheKey);
    if (cachedType) {
      console.log(`[Cache] Hit: ${cacheKey}`);
      return sendResponse(res, 200, 'Resource type retrieved from cache', cachedType);
    }

    const resourceType = await resourceTypeService.getResourceTypeById(typeId, orgId);
    if (!resourceType) return sendResponse(res, 404, 'Resource type not found', null);

    await setToCache(cacheKey, resourceType, CACHE_TTL.DETAIL);
    console.log(`[Cache] Set: ${cacheKey}`);

    sendResponse(res, 200, 'Resource type retrieved successfully', resourceType);
  } catch (error) {
    sendResponse(res, 500, error.message, null);
  }
};

exports.updateResourceType = async (req, res) => {
  try {
    const orgId = req.user.organization;
    const typeId = req.params.id;

    const updatedType = await resourceTypeService.updateResourceType(typeId, req.body, orgId);
    await invalidateResourceTypeCaches(orgId, typeId);

    sendResponse(res, 200, 'Resource type updated successfully', updatedType);
  } catch (error) {
    sendResponse(res, 500, error.message, null);
  }
};

exports.deleteResourceType = async (req, res) => {
  try {
    const orgId = req.user.organization;
    const typeId = req.params.id;

    await resourceTypeService.deleteResourceType(typeId, orgId);
    await invalidateResourceTypeCaches(orgId, typeId);

    sendResponse(res, 200, 'Resource type deleted successfully', null);
  } catch (error) {
    sendResponse(res, 500, error.message, null);
  }
};
