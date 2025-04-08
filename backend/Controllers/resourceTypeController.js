const resourceTypeService = require('../Services/resourceTypeService');
const { sendResponse } = require('../utils/responseHandler');
exports.setResourceTypeSocketIoInstance = (ioInstance) => {
  io = ioInstance;
};

// exports.createResourceType = async (req, res) => {
//   try {
//     const typeData = req.body;
//     typeData.organization = req.user.organization;
//     const resourceType = await resourceTypeService.createResourceType(typeData);
//     sendResponse(res, 201, 'Resource type created successfully', resourceType);
//   } catch (error) {
//     sendResponse(res, 500, error.message, null);
//   }
// };
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
    const resourceTypes = await resourceTypeService.getResourceTypesByOrganization(
      req.user.organization
    );
    sendResponse(res, 200, 'Resource types retrieved successfully', resourceTypes);
  } catch (error) {
    sendResponse(res, 500, error.message, null);
  }
};

exports.getResourceTypeById = async (req, res) => {
  try {
    const resourceType = await resourceTypeService.getResourceTypeById(
      req.params.id,
      req.user.organization
    );
    
    if (!resourceType) {
      return sendResponse(res, 404, 'Resource type not found', null);
    }
    
    sendResponse(res, 200, 'Resource type retrieved successfully', resourceType);
  } catch (error) {
    sendResponse(res, 500, error.message, null);
  }
};

exports.updateResourceType = async (req, res) => {
  try {
    const updatedType = await resourceTypeService.updateResourceType(
      req.params.id,
      req.body,
      req.user.organization
    );
    
    sendResponse(res, 200, 'Resource type updated successfully', updatedType);
  } catch (error) {
    sendResponse(res, 500, error.message, null);
  }
};

exports.deleteResourceType = async (req, res) => {
  try {
    await resourceTypeService.deleteResourceType(
      req.params.id,
      req.user.organization
    );
    
    sendResponse(res, 200, 'Resource type deleted successfully', null);
  } catch (error) {
    sendResponse(res, 500, error.message, null);
  }
};