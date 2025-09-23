const Task = require('../Models/TaskSchema');
// In services/resource.service.js

const getBlockableResourceIds = require('../Helper/resourceBlocking'); // Make sure this is imported
exports.filterOutUnavailableResources = async ({ resourceIdsToCheck, timeSlots, organizationId, models }) => {
  const { ResourceModel, ResourceBookingModel } = models;

  if (!resourceIdsToCheck || resourceIdsToCheck.length === 0 || !timeSlots || timeSlots.length === 0) {
    return resourceIdsToCheck || []; // Return original list if there's nothing to check against
  }

  // 1. From the given list, find out which ones are actually blockable.
  const blockableIds = await getBlockableResourceIds({
      resourceIds: resourceIdsToCheck,
      organizationId,
      ResourceModel,
  });

  // If none of the resources to check are blockable, they are all considered available.
  if (blockableIds.length === 0) {
      return resourceIdsToCheck;
  }

  const conflictQueryTimeSlots = timeSlots.map(slot => {
    // slot may have { start, end } or { startTime, endTime }
    const rawStart = slot.start  ?? slot.startTime;
    const rawEnd   = slot.end    ?? slot.endTime;
    const startDt  = new Date(rawStart);
    const endDt    = new Date(rawEnd);
  
    if (isNaN(startDt.valueOf()) || isNaN(endDt.valueOf())) {
      console.error(`Invalid slot dates:`, slot);
      // skip or throw, depending on your error policy
      return null;
    }
  
    return {
      // these are the *fields* on ResourceBooking
      startTime: { $lt: endDt },
      endTime:   { $gt: startDt },
    };
  })
  .filter(Boolean);  // drop any nulls

  const conflictingBookings = await ResourceBookingModel.find({
      resource: { $in: blockableIds },
      organization: organizationId,
      status: 'confirmed',
      $or: conflictQueryTimeSlots,
  }).lean();

  const bookedResourceIds = new Set(conflictingBookings.map(b => b.resource.toString()));

  // 3. Return the original list of IDs, but with the booked ones removed.
  return resourceIdsToCheck.filter(id => !bookedResourceIds.has(id.toString()));
};
exports.createResource = async (resourceData, ResourceModel, ResourceTypeModel) => {
  // Verify the resource type exists
  const resourceType = await ResourceTypeModel.findOne({
    _id: resourceData.type
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
  const resource = new ResourceModel({
    displayName: resourceData.displayName, // Explicitly include
    type: resourceData.type,
    organization: resourceData.organization,
    createdBy: resourceData.createdBy,
    fields: fieldsMap,
    // Initialize other required fields
    status: 'active', // Add default status if needed
    tags: [] // Initialize empty array if needed
  });

  
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
exports.getResourceById = async (resourceId, organizationId,ResourceModel) => {
  return await ResourceModel.findOne({
    _id: resourceId,
    organization: organizationId
  })
    .populate('type')
    .populate('createdBy', 'first_name last_name');
};
exports.getAvailableResourcesByType = async (typeId, startTime, endTime, { ResourceModel, ResourceBookingModel }) => {
  // 1. Fetch all resources of the given type. This part doesn't change.
  const allResources = await ResourceModel.find({ type: typeId }).lean();

  if (allResources.length === 0) {
    return [];
  }

  const allResourceIds = allResources.map(r => r._id);
  const organizationId = allResources[0].organization; // Get org ID from the first resource

  // 2. Use the new service to get back a list of ONLY the available IDs.
  const availableResourceIds = await exports.filterOutUnavailableResources({
      resourceIdsToCheck: allResourceIds,
      timeSlots: [{ startTime, endTime }], // For this function, there is only one time slot
      organizationId,
      models: { ResourceModel, ResourceBookingModel }
  });

  const availableIdsSet = new Set(availableResourceIds.map(id => id.toString()));

  // 3. Filter the original full resource objects based on the available IDs.
  return allResources.filter(resource => availableIdsSet.has(resource._id.toString()));
};
exports.getResourcesByType = async (typeId, organizationId, options = {},ResourceModel) => {
  const { page = 1, limit = 10 } = options;
  
  const resources = await ResourceModel.find({
    type: typeId,
    
  })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('type')
    .populate('createdBy', 'first_name last_name');
    
  const count = await ResourceModel.countDocuments({
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
exports.updateResource = async (resourceId, updateData, organizationId,ResourceModel) => {
  // Don't allow changing the resource type
  if (updateData.type) {
    throw new Error('Cannot change resource type after creation');
  }
  const resource = await ResourceModel.findOneAndUpdate(
    { _id: resourceId, organization: organizationId },
    updateData,
    { new: true, runValidators: true }
  ).populate('type');
  if (!resource) {
    throw new Error('Resource not found');
  }
  
  return resource;
};
const mongoose = require('mongoose');

exports.deleteResource = async (resourceId, organizationId, ResourceModel, TaskModel, forceDelete = false) => {
  const rid = new mongoose.Types.ObjectId(resourceId);
  const oid = new mongoose.Types.ObjectId(organizationId);

  // 1) Count references (respect forceDelete)
  const taskCount = await TaskModel.countDocuments({
    'resources.resource': rid,
    organization: oid,
  });

  if (!forceDelete && taskCount > 0) {
    return {
      canDelete: false,
      warning: `This resource is assigned to ${taskCount} task(s). Deleting it will remove it from these tasks.`,
      taskCount,
    };
  }

  // 2) Detach from tasks BEFORE deleting the resource doc
  const pullRes = await TaskModel.updateMany(
    { 'resources.resource': rid, organization: oid },
    { $pull: { resources: { resource: rid } } }
  );
  // Helpful diagnostics
  console.log(
    `[RESOURCES] Pulled resource ${rid} from tasks in org ${oid}. matched=${pullRes.matchedCount ?? pullRes.n}, modified=${pullRes.modifiedCount ?? pullRes.nModified}`
  );

  // 3) Delete the resource itself
  const resource = await ResourceModel.findOneAndDelete({ _id: rid, organization: oid });
  if (!resource) {
    throw new Error('Resource not found');
  }

  return { canDelete: true, deleted: true, id: resourceId, taskCount };
};
