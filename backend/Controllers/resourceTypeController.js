
// const resourceTypeService = require('../Services/resourceTypeService');
// const { sendResponse } = require('../utils/responseHandler');

// let io;

// exports.setResourceTypeSocketIoInstance = (ioInstance) => {
//   io = ioInstance;
// };


// exports.createResourceType = async (req, res) => {
//   try {
//     const typeData = req.body;
  
//     const tenantId = req.user.org_id;
//     typeData.organization = tenantId;
    
//     // Validation
//     if (!typeData.fieldDefinitions?.length) {
//       throw new Error('At least one field definition is required');
//     }

//     const fieldNames = typeData.fieldDefinitions.map(f => f.fieldName);
//     if (new Set(fieldNames).size !== fieldNames.length) {
//       throw new Error('Field names must be unique within a resource type');
//     }

//     // Create the resource type
//     const { ResourceType } = req.tenantModels;
   
//     const resourceType = await resourceTypeService.createResourceType(typeData, ResourceType);

//     // Send response immediately
//     sendResponse(res, 201, 'Resource type created successfully', resourceType);
//   } catch (error) {
//     console.error('Error in createResourceType:', error);
//     sendResponse(res, error.statusCode || 500, error.message, null);
//   }
// };
// exports.getResourceTypes = async (req, res) => {
//   try {
//     const orgId = req.user.org_id;
//     const { ResourceType } = req.tenantModels;
//     const resourceTypes = await resourceTypeService.getResourceTypes(ResourceType);

//     sendResponse(res, 200, 'Resource types retrieved successfully', resourceTypes);
//   } catch (error) {
//     sendResponse(res, 500, error.message, null);
//   }
// };

// exports.getResourceTypeById = async (req, res) => {
//   try {
//     const orgId = req.user.org_id;
//     const typeId = req.params.id;
    
//     const { ResourceType } = req.tenantModels;
//     const resourceType = await resourceTypeService.getResourceTypeById(typeId, ResourceType);
//     if (!resourceType) return sendResponse(res, 404, 'Resource type not found', null);

//     sendResponse(res, 200, 'Resource type retrieved successfully', resourceType);
//   } catch (error) {
//     sendResponse(res, 500, error.message, null);
//   }
// };

// exports.updateResourceType = async (req, res) => {
//   try {
//     const orgId = req.user.org_id;
//     const typeId = req.params.id;
//     const { ResourceType } = req.tenantModels;
//     const updatedType = await resourceTypeService.updateResourceType(typeId, req.body, ResourceType);
    
//     sendResponse(res, 200, 'Resource type updated successfully', updatedType);
//   } catch (error) {
//     sendResponse(res, 500, error.message, null);
//   }
// };

// exports.deleteResourceType = async (req, res) => {
//   try {
//     const orgId = req.user.org_id;
//     const typeId = req.params.id;

//     const { ResourceType, Resource } = req.tenantModels;
//     await resourceTypeService.deleteResourceType(typeId, ResourceType, Resource);
    
//     sendResponse(res, 200, 'Resource type deleted successfully', null);
//   } catch (error) {
//     sendResponse(res, 500, error.message, null);
//   }
// };
const resourceTypeService = require('../Services/resourceTypeService');
const { sendResponse } = require('../utils/responseHandler');

let io;

exports.setResourceTypeSocketIoInstance = (ioInstance) => {
  io = ioInstance;
};

exports.createResourceType = async (req, res) => {
  try {
    const typeData = req.body;
    const tenantId = req.user.org_id;
    const cache = req.tenantCache;

    typeData.organization = tenantId;

    if (!typeData.fieldDefinitions?.length) {
      throw new Error('At least one field definition is required');
    }

    const fieldNames = typeData.fieldDefinitions.map(f => f.fieldName);
    if (new Set(fieldNames).size !== fieldNames.length) {
      throw new Error('Field names must be unique within a resource type');
    }

    const { ResourceType } = req.tenantModels;
    const resourceType = await resourceTypeService.createResourceType(typeData, ResourceType);

    // Invalidate cached list
    await cache.del(`resourceTypes:${tenantId}`);
    console.log(`[CACHE][DEL] resourceTypes:${tenantId} after create`);

    sendResponse(res, 201, 'Resource type created successfully', resourceType);
  } catch (error) {
    console.error('Error in createResourceType:', error);
    sendResponse(res, error.statusCode || 500, error.message, null);
  }
};

exports.getResourceTypes = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { ResourceType } = req.tenantModels;
    const cache = req.tenantCache;

    const cacheKey = `resourceTypes:${orgId}`;
    const cached = await cache.get(cacheKey);

    if (cached) {
      console.log(`[CACHE][HIT] ${cacheKey}`);
      return sendResponse(res, 200, 'Resource types retrieved from cache', JSON.parse(cached));
    }

    console.log(`[CACHE][MISS] ${cacheKey}`);
    const resourceTypes = await resourceTypeService.getResourceTypes(ResourceType);
    await cache.set(cacheKey, JSON.stringify(resourceTypes), { expiration: 300 });
    console.log(`[CACHE][SET] ${cacheKey} (TTL: 300s)`);

    sendResponse(res, 200, 'Resource types retrieved successfully', resourceTypes);
  } catch (error) {
    sendResponse(res, 500, error.message, null);
  }
};

exports.getResourceTypeById = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const typeId = req.params.id;
    const cache = req.tenantCache;
    const { ResourceType } = req.tenantModels;

    const cacheKey = `resourceType:${typeId}`;
    const cached = await cache.get(cacheKey);

    if (cached) {
      console.log(`[CACHE][HIT] ${cacheKey}`);
      return sendResponse(res, 200, 'Resource type retrieved from cache', JSON.parse(cached));
    }

    console.log(`[CACHE][MISS] ${cacheKey}`);
    const resourceType = await resourceTypeService.getResourceTypeById(typeId, ResourceType);
    if (!resourceType) return sendResponse(res, 404, 'Resource type not found', null);

    await cache.set(cacheKey, JSON.stringify(resourceType), { expiration: 300 });
    console.log(`[CACHE][SET] ${cacheKey} (TTL: 300s)`);

    sendResponse(res, 200, 'Resource type retrieved successfully', resourceType);
  } catch (error) {
    sendResponse(res, 500, error.message, null);
  }
};

exports.updateResourceType = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const typeId = req.params.id;
    const cache = req.tenantCache;
    const { ResourceType } = req.tenantModels;

    const updatedType = await resourceTypeService.updateResourceType(typeId, req.body, ResourceType);

    // Invalidate cache
    await cache.del(`resourceType:${typeId}`);
    await cache.del(`resourceTypes:${orgId}`);
    console.log(`[CACHE][DEL] resourceType:${typeId} and resourceTypes:${orgId} after update`);

    sendResponse(res, 200, 'Resource type updated successfully', updatedType);
  } catch (error) {
    sendResponse(res, 500, error.message, null);
  }
};

exports.deleteResourceType = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const typeId = req.params.id;
    const cache = req.tenantCache;
    const { ResourceType, Resource } = req.tenantModels;

    await resourceTypeService.deleteResourceType(typeId, ResourceType, Resource);

    // Invalidate cache
    await cache.del(`resourceType:${typeId}`);
    await cache.del(`resourceTypes:${orgId}`);
    console.log(`[CACHE][DEL] resourceType:${typeId} and resourceTypes:${orgId} after delete`);

    sendResponse(res, 200, 'Resource type deleted successfully', null);
  } catch (error) {
    sendResponse(res, 500, error.message, null);
  }
};
