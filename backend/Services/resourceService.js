const Resource = require('../models/Resource');
const ResourceType = require('../models/ResourceType');
const Task = require('../models/Task');

exports.createResource = async (resourceData) => {
  // Verify the resource type exists and belongs to the same organization
  const resourceType = await ResourceType.findOne({
    _id: resourceData.type,
    organization: resourceData.organization
  });
  
  if (!resourceType) {
    throw new Error('Resource type not found');
  }
  
  // Validate fields against the resource type definition
  const fieldDefinitions = resourceType.fieldDefinitions;
  const fieldErrors = [];
  
  for (const def of fieldDefinitions) {
    if (def.required && !resourceData.fields.has(def.fieldName)) {
      fieldErrors.push(`Field ${def.fieldName} is required`);
    }
    
    if (resourceData.fields.has(def.fieldName)) {
      const value = resourceData.fields.get(def.fieldName);
      const typeCheck = checkFieldType(value, def.fieldType);
      
      if (!typeCheck.valid) {
        fieldErrors.push(`Field ${def.fieldName} should be ${def.fieldType}: ${typeCheck.message}`);
      }
    }
  }
  
  if (fieldErrors.length > 0) {
    throw new Error(`Field validation errors: ${fieldErrors.join(', ')}`);
  }
  
  const resource = new Resource(resourceData);
  return await resource.save();
};

function checkFieldType(value, expectedType) {
  switch (expectedType) {
    case 'string':
      return { valid: typeof value === 'string', message: 'Must be a string' };
    case 'number':
      return { valid: typeof value === 'number', message: 'Must be a number' };
    case 'boolean':
      return { valid: typeof value === 'boolean', message: 'Must be true or false' };
    case 'date':
      return { valid: value instanceof Date || !isNaN(Date.parse(value)), message: 'Must be a valid date' };
    case 'array':
      return { valid: Array.isArray(value), message: 'Must be an array' };
    case 'object':
      return { valid: typeof value === 'object' && !Array.isArray(value) && value !== null, message: 'Must be an object' };
    default:
      return { valid: true, message: '' };
  }
}

exports.getResourceById = async (resourceId, organizationId) => {
  return await Resource.findOne({
    _id: resourceId,
    organization: organizationId
  })
    .populate('type')
    .populate('createdBy', 'first_name last_name');
};

exports.getResourcesByType = async (typeId, organizationId, options = {}) => {
  const { page = 1, limit = 10 } = options;
  
  const resources = await Resource.find({
    type: typeId,
    organization: organizationId
  })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('type')
    .populate('createdBy', 'first_name last_name');
    
  const count = await Resource.countDocuments({
    type: typeId,
    organization: organizationId
  });
  
  return {
    resources,
    total: count,
    pages: Math.ceil(count / limit),
    currentPage: page
  };
};

exports.updateResource = async (resourceId, updateData, organizationId) => {
  // Don't allow changing the resource type
  if (updateData.type) {
    throw new Error('Cannot change resource type after creation');
  }
  
  const resource = await Resource.findOneAndUpdate(
    { _id: resourceId, organization: organizationId },
    updateData,
    { new: true, runValidators: true }
  ).populate('type');
  
  if (!resource) {
    throw new Error('Resource not found');
  }
  
  return resource;
};

exports.deleteResource = async (resourceId, organizationId) => {
  // Check if the resource is referenced in any tasks
  const taskCount = await Task.countDocuments({
    'relatedResources.resource': resourceId,
    organization: organizationId
  });
  
  if (taskCount > 0) {
    throw new Error('Cannot delete resource referenced in tasks');
  }
  
  const resource = await Resource.findOneAndDelete({
    _id: resourceId,
    organization: organizationId
  });
  
  if (!resource) {
    throw new Error('Resource not found');
  }
};