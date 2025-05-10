
// services/resourceTypeService.js

exports.createResourceType = async (typeData, ResourceTypeModel) => {
  if (!typeData.fieldDefinitions || typeData.fieldDefinitions.length === 0) {
    throw new Error('At least one field definition is required');
  }

  const fieldNames = typeData.fieldDefinitions.map(f => f.fieldName);
  const uniqueNames = new Set(fieldNames);

  if (fieldNames.length !== uniqueNames.size) {
    throw new Error('Field names must be unique within a resource type');
  }

  const resourceType = new ResourceTypeModel(typeData);
  return await resourceType.save();
};

exports.getResourceTypes = async (ResourceTypeModel) => {
  return await ResourceTypeModel.find({});
};

exports.getResourceTypeById = async (typeId, ResourceTypeModel) => {
  return await ResourceTypeModel.findById(typeId);
};

exports.updateResourceType = async (typeId, updateData, ResourceTypeModel) => {
  if (updateData.organization) {
    throw new Error('Cannot change organization');
  }

  const updated = await ResourceTypeModel.findByIdAndUpdate(
    typeId,
    updateData,
    { new: true, runValidators: true }
  );

  if (!updated) {
    throw new Error('Resource type not found');
  }

  return updated;
};

exports.deleteResourceType = async (typeId, ResourceTypeModel, ResourceModel) => {
  const resourceCount = await ResourceModel.countDocuments({ type: typeId });

  if (resourceCount > 0) {
    throw new Error('Cannot delete resource type that has existing resources');
  }

  const deleted = await ResourceTypeModel.findByIdAndDelete(typeId);

  if (!deleted) {
    throw new Error('Resource type not found');
  }

  return deleted;
};
