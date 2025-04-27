const resourceTypeService = require('../Services/resourceTypeService');
const { sendResponse } = require('../utils/responseHandler');
const { 
  getFromCache, 
  setToCache, 
  deleteFromCache, 
  clearPattern,
  generateCacheKey,
  ogs 
} = require('../redisUtils');

let io; // Socket.io instance

exports.setResourceTypeSocketIoInstance = (ioInstance) => {
  io = ioInstance;
};

// Cache TTL configuration
const CACHE_TTL = {
  SHORT: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DEFAULT: 1800 // 30 minutes
};

exports.createResourceType = async (req, res) => {
  try {
    const typeData = req.body;
    typeData.organization = req.user.organization;
    
    // Validate field definitions
    if (!typeData.fieldDefinitions || typeData.fieldDefinitions.length === 0) {
      throw new Error('At least one field definition is required');
    }
    
    const fieldNames = typeData.fieldDefinitions.map(f => f.fieldName);
    if (new Set(fieldNames).size !== fieldNames.length) {
      throw new Error('Field names must be unique within a resource type');
    }

    const resourceType = await resourceTypeService.createResourceType(typeData);
     // Clear relevant cache entries
     await clearPattern(`resource_types:org:${req.user.organization}*`);
     console.log(`[Cache] Cleared resource types cache for org ${req.user.organization}`);
    
    // Emit socket event to organization room
    if (io) {
      const roomId = req.user.organization.toString();
      io.to(roomId).emit('resourceType:created', {
        resourceType,
        message: 'New resource type created',
        createdBy: req.user._id
      });
      console.log(`[Socket] Emitted resourceType:created to room ${roomId}`);
    }

    sendResponse(res, 201, 'Resource type created successfully', resourceType);
  } catch (error) {
    sendResponse(res, error.statusCode || 500, error.message, null);
  }
};
exports.getResourceTypes = async (req, res) => {
  try { 
    const orgId = req.user.organization;
    const cacheKey = generateCacheKey('resource_types', orgId);

    // Try cache first
    const cachedData = await getFromCache(cacheKey);
    if (cachedData) {
      console.log(`[Cache] Hit for resource types in org ${orgId}`);
      return sendResponse(res, 200, 'Resource types retrieved from cache', cachedData);
    }
    const resourceTypes = await resourceTypeService.getResourceTypesByOrganization(
      req.user.organization
    );
    // Cache the results
    await setToCache(cacheKey, resourceTypes, CACHE_TTL.LIST);
    console.log(`[Cache] Set resource types cache for org ${orgId}`);
    
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

    // Try cache first
    const cachedType = await getFromCache(cacheKey);
    if (cachedType) {
      console.log(`[Cache] Hit for resource type ${typeId}`);
      return sendResponse(res, 200, 'Resource type retrieved from cache', cachedType);
    }

    const resourceType = await resourceTypeService.getResourceTypeById(typeId, orgId);
    
    if (!resourceType) {
      return sendResponse(res, 404, 'Resource type not found', null);
    }
    
    // Cache the result
    await setToCache(cacheKey, resourceType, CACHE_TTL.DETAIL);
    console.log(`[Cache] Set cache for resource type ${typeId}`);
    
    sendResponse(res, 200, 'Resource type retrieved successfully', resourceType);
  } catch (error) {
    sendResponse(res, 500, error.message, null);
  }
};


exports.updateResourceType = async (req, res) => {
  try {
    const orgId = req.user.organization;
    const typeId = req.params.id;

    const updatedType = await resourceTypeService.updateResourceType(
      typeId,
      req.body,
      orgId
    );
    
    // Clear relevant cache entries
    await Promise.all([
      deleteFromCache(generateCacheKey('resource_type', orgId, { id: typeId })),
      clearPattern(`resource_types:org:${orgId}*`)
    ]);
    console.log(`[Cache] Cleared cache for updated resource type ${typeId}`);
    
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
    
    // Clear relevant cache entries
    await Promise.all([
      deleteFromCache(generateCacheKey('resource_type', orgId, { id: typeId })),
      clearPattern(`resource_types:org:${orgId}*`)
    ]);
    console.log(`[Cache] Cleared cache for deleted resource type ${typeId}`);
    
    sendResponse(res, 200, 'Resource type deleted successfully', null);
  } catch (error) {
    sendResponse(res, 500, error.message, null);
  }
};