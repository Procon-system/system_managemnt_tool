const Resource = require('../Models/ResourceSchema');
const ResourceType = require('../Models/ResourceTypeSchema');
const Task = require('../Models/TaskSchema');

exports.createResource = async (resourceData) => {
  // Verify the resource type exists
  const resourceType = await ResourceType.findOne({
    _id: resourceData.type,
    organization: resourceData.organization
  }).lean();

  if (!resourceType) {
    throw new Error(`Resource type with ID ${resourceData.type} not found`);
  }

  // Convert fields to Map
  const fieldsMap = resourceData.fields instanceof Map 
    ? resourceData.fields 
    : new Map(Object.entries(resourceData.fields || {}));

  // Validate fields
  const fieldErrors = [];
  const fieldDefinitions = resourceType.fieldDefinitions || [];
  const allowedFields = new Set(fieldDefinitions.map(def => def.fieldName));

  // Validate required fields and types
  for (const def of fieldDefinitions) {
    const fieldValue = fieldsMap.get(def.fieldName);
    
    if (def.required && (fieldValue === undefined || fieldValue === null || fieldValue === '')) {
      fieldErrors.push(`Field '${def.fieldName}' is required`);
      continue;
    }
    
    if (fieldValue !== undefined && fieldValue !== null) {
      const typeCheck = checkFieldType(fieldValue, def.fieldType);
      if (!typeCheck.valid) {
        fieldErrors.push(`Field '${def.fieldName}' should be ${def.fieldType}: ${typeCheck.message}`);
      }
    }
  }

  if (fieldErrors.length > 0) {
    throw new Error(`Validation errors: ${fieldErrors.join(', ')}`);
  }

  // Create resource with explicit field mapping
  const resource = new Resource({
    displayName: resourceData.displayName, // Explicitly include
    type: resourceData.type,
    organization: resourceData.organization,
    createdBy: resourceData.createdBy,
    fields: fieldsMap,
    // Initialize other required fields
    status: 'active', // Add default status if needed
    tags: [] // Initialize empty array if needed
  });

  console.log('Final resource before save:', resource); // Debug log
  
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