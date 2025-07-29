
const getBlockableResourceIds = async ({ resourceIds, organizationId, ResourceModel }) => {
  if (!resourceIds || resourceIds.length === 0) {
    return []; // No resources to check, return early.
  }

  // 1. Fetch resources and populate their type
  const resourcesToCheck = await ResourceModel.find({
    _id: { $in: resourceIds },
    organization: organizationId
  })
  .populate('type', 'isBlockable')
  .lean();

  // 2. Validate that all requested resources were found
  if (resourcesToCheck.length !== resourceIds.length) {
    throw { statusCode: 404, message: 'One or more assigned resources were not found or do not belong to the organization.' };
  }
  
  // 3. Determine which resources are effectively blockable
  const blockableIds = resourcesToCheck
    .filter(resource => {
      const isEffectivelyBlockable = resource.isBlockableOverride ?? resource.type?.isBlockable ?? false;
      return isEffectivelyBlockable;
    })
    .map(resource => resource._id.toString()); // Ensure IDs are strings

  return blockableIds;
};
module.exports = getBlockableResourceIds;