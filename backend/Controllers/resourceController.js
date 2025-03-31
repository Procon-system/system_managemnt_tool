const resourceService = require('../Services/resourceService');
const { sendResponse } = require('../utils/responseHandler');

exports.createResource = async (req, res) => {
  try {
    const { type, fields, displayName } = req.body;
    
    const resourceData = {
      type,
      displayName, // Ensure displayName is included
      fields,
      organization: req.user.organization,
      createdBy: req.user._id
    };

    console.log("Processing resource creation with data:", resourceData);

    const resource = await resourceService.createResource(resourceData);
    sendResponse(res, 201, 'Resource created successfully', resource);
  } catch (error) {
    console.error('Error in createResource:', error);
    sendResponse(res, 400, error.message, null);
  }
};
exports.getResourceById = async (req, res) => {
  try {
    const resource = await resourceService.getResourceById(
      req.params.id,
      req.user.organization
    );
    
    if (!resource) {
      return sendResponse(res, 404, 'Resource not found', null);
    }
    
    sendResponse(res, 200, 'Resource retrieved successfully', resource);
  } catch (error) {
    sendResponse(res, 500, error.message, null);
  }
};

exports.getResourcesByType = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const resources = await resourceService.getResourcesByType(
      req.params.typeId,
      req.user.organization,
      { page, limit }
    );
    
    sendResponse(res, 200, 'Resources retrieved successfully', resources);
  } catch (error) {
    sendResponse(res, 500, error.message, null);
  }
};

exports.updateResource = async (req, res) => {
  try {
    const updatedResource = await resourceService.updateResource(
      req.params.id,
      req.body,
      req.user.organization
    );
    
    sendResponse(res, 200, 'Resource updated successfully', updatedResource);
  } catch (error) {
    sendResponse(res, 500, error.message, null);
  }
};

exports.deleteResource = async (req, res) => {
  try {
    await resourceService.deleteResource(
      req.params.id,
      req.user.organization
    );
    
    sendResponse(res, 200, 'Resource deleted successfully', null);
  } catch (error) {
    sendResponse(res, 500, error.message, null);
  }
};