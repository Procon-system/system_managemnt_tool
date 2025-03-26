const ResourceType = require('../models/ResourceType');
const Resource = require('../models/Resource');

exports.createResourceType = async (typeData) => {
  // Validate field definitions
  if (!typeData.fieldDefinitions || typeData.fieldDefinitions.length === 0) {
    throw new Error('At least one field definition is required');
  }
  
  const fieldNames = typeData.fieldDefinitions.map(f => f.fieldName);
  const uniqueNames = new Set(fieldNames);
  
  if (fieldNames.length !== uniqueNames.size) {
    throw new Error('Field names must be unique within a resource type');
  }
  
  const resourceType = new ResourceType(typeData);
  return await resourceType.save();
};

exports.getResourceTypesByOrganization = async (organizationId) => {
  return await ResourceType.find({ organization: organizationId });
};

exports.getResourceTypeById = async (typeId, organizationId) => {
  return await ResourceType.findOne({
    _id: typeId,
    organization: organizationId
  });
};

exports.updateResourceType = async (typeId, updateData, organizationId) => {
  // Don't allow changing organization
  if (updateData.organization) {
    throw new Error('Cannot change organization');
  }
  
  const resourceType = await ResourceType.findOneAndUpdate(
    { _id: typeId, organization: organizationId },
    updateData,
    { new: true, runValidators: true }
  );
  
  if (!resourceType) {
    throw new Error('Resource type not found');
  }
  
  return resourceType;
};

exports.deleteResourceType = async (typeId, organizationId) => {
  // Check if any resources exist of this type
  const resourceCount = await Resource.countDocuments({
    type: typeId,
    organization: organizationId
  });
  
  if (resourceCount > 0) {
    throw new Error('Cannot delete resource type that has existing resources');
  }
  
  const resourceType = await ResourceType.findOneAndDelete({
    _id: typeId,
    organization: organizationId
  });
  
  if (!resourceType) {
    throw new Error('Resource type not found');
  }
};