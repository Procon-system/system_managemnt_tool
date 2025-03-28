const resourceTypeService = require('../Services/resourceTypeService');
const { sendResponse } = require('../utils/responseHandler');

exports.createResourceType = async (req, res) => {
  try {
    const typeData = req.body;
    typeData.organization = req.user.organization;
    
    const resourceType = await resourceTypeService.createResourceType(typeData);
    sendResponse(res, 201, 'Resource type created successfully', resourceType);
  } catch (error) {
    sendResponse(res, 500, error.message, null);
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