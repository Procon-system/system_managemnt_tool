const resourceService = require('../Services/resourceService');
const { sendResponse } = require('../utils/responseHandler');
const generateRecurringInstances=require('../Helper/recurringFunction');

const invalidateResourceCaches = async (cache, resource) => {
  if (!resource || !resource.type) return;
  
  // 1. Invalidate the specific resource's cache
  const singleResourceCacheKey = `resource:${resource._id}`;
  await cache.del(singleResourceCacheKey);
  
  // 2. Invalidate all paginated list views for this resource's type
  const resourceTypeId = (typeof resource.type === 'object') ? resource.type._id.toString() : resource.type.toString();
  const listCachePattern = `resources:type:${resourceTypeId}:*`;
  
  // Assuming your cache client has a method like delPattern or scan+del
  await cache.delPattern(listCachePattern);
  
  console.log(`Cache invalidated for resource ${resource._id} and type list ${resourceTypeId}`);
};

exports.createResource = async (req, res) => {
  try {
    const { type, fields, displayName } = req.body;
    const orgId = req.user.org_id;

    const resourceData = {
      type,
      displayName,
      fields,
      organization: orgId,
      createdBy: req.user._id
    };

    const { Resource, ResourceType } = req.tenantModels;
    const resource = await resourceService.createResource(resourceData, Resource, ResourceType);

    // await req.tenantCache.flush();
    const resourceTypeId = resource.type.toString();
    const listCachePattern = `resources:type:${resourceTypeId}:*`;
    await req.tenantCache.delPattern(listCachePattern);
    
    sendResponse(res, 201, 'Resource created successfully', resource);
  } catch (error) {
    console.error('Error in createResource:', error);
    sendResponse(res, 400, error.message, null);
  }
};
exports.getResourceById = async (req, res) => {
  try {
    const resourceId = req.params.id;
    const orgId = req.user.org_id;

    const { Resource } = req.tenantModels;
    const cache = req.tenantCache;

    const cacheKey = `resource:${resourceId}`;
    const cached = await cache.get(cacheKey);

    if (cached) {
      
      return sendResponse(res, 200, 'Resource retrieved from cache', JSON.parse(cached));
    }

    
    const resource = await resourceService.getResourceById(resourceId, orgId, Resource);
    if (!resource) return sendResponse(res, 404, 'Resource not found', null);

    await cache.set(cacheKey, JSON.stringify(resource), { expiration: 300 });
    
    sendResponse(res, 200, 'Resource retrieved successfully', resource);
  } catch (error) {
    sendResponse(res, 500, error.message, null);
  }
};
exports.getAvailableResourcesByType = async (req, res) => {
  try {
    const { typeId } = req.params;
    const { startTime, endTime } = req.query;
    const { Resource, ResourceBooking } = req.tenantModels;

    if (!typeId || !startTime || !endTime) {
      return res.status(400).json({ message: 'typeId, startTime, and endTime are required query parameters.' });
    }

    const availableResources = await resourceService.getAvailableResourcesByType(
      typeId,
      startTime,
      endTime,
      { ResourceModel: Resource, ResourceBookingModel: ResourceBooking }
    );

    res.status(200).json({
      success: true,
      message: 'Available resources retrieved successfully',
      data: availableResources
    });

  } catch (error) {
    console.error('Error in getAvailableResourcesByType:', error);
    res.status(500).json({ message: error.message });
  }
};
exports.checkRecurringAvailability = async (req, res) => {
  try {
    const { Resource, ResourceBooking } = req.tenantModels;
    const {
      resourceIds,      // Array of resource IDs the user selected
      frequency,
      task_period,
      schedule,
     
    } = req.body;
const organizationId=req.user.org_id;
    // ... (validation remains the same) ...

    // 1. Generate all future instances.
    const instances = generateRecurringInstances({ schedule, organization: organizationId }, frequency, task_period);
    instances.unshift({ schedule }); // Check the first instance too.

    // 2. Use the refactored service to filter the selected resources.
    const availableResourceIds = await resourceService.filterOutUnavailableResources({
        resourceIdsToCheck: resourceIds,
        timeSlots: instances.map(inst => inst.schedule), // Pass all time slots
        organizationId,
        models: { ResourceModel: Resource, ResourceBookingModel: ResourceBooking }
    });

    // 3. Determine if there's a conflict by comparing the original list to the available list.
    if (availableResourceIds.length < resourceIds.length) {
      const availableSet = new Set(availableResourceIds.map(id => id.toString()));
      const unavailableIds = resourceIds.filter(id => !availableSet.has(id.toString()));
      
      // Fetch the names of the unavailable resources for a better error message
      const unavailableResources = await Resource.find({ _id: { $in: unavailableIds } }, 'displayName').lean();

      return res.status(200).json({
        success: true,
        available: false,
        message: `The following resources are not available for the entire recurring schedule: ${unavailableResources.map(r => r.displayName).join(', ')}.`,
        unavailableResourceIds: unavailableIds
      });
    }

    // If we get here, all selected resources are available.
    return res.status(200).json({ success: true, available: true });

  } catch (error) {
    console.error('Error in checkRecurringAvailability:', error);
    res.status(500).json({ success: false, message: 'Server error while checking availability.' });
  }
};
exports.getResourcesByType = async (req, res) => {
  try {
    const typeId = req.params.typeId;
    const orgId = req.user.org_id;
    const { page = 1, limit = 10 } = req.query;
    const { Resource } = req.tenantModels;
    const cache = req.tenantCache;

    const cacheKey = `resources:type:${typeId}:page:${page}:limit:${limit}`;
    const cached = await cache.get(cacheKey);

    if (cached) {
     
      return sendResponse(res, 200, 'Resources retrieved from cache', JSON.parse(cached));
    }

        const resources = await resourceService.getResourcesByType(typeId, orgId, { page, limit }, Resource);
    await cache.set(cacheKey, JSON.stringify(resources), { expiration: 300 });
   
    sendResponse(res, 200, 'Resources retrieved successfully', resources);
  } catch (error) {
    sendResponse(res, 500, error.message, null);
  }
};

exports.updateResource = async (req, res) => {
  try {
    const resourceId = req.params.id;
    const orgId = req.user.org_id;
    const { Resource } = req.tenantModels;
    
    // 1. Fetch the resource first to get its type definition
    const resource = await resourceService.getResourceById(resourceId, orgId, Resource);
    if (!resource) {
      return sendResponse(res, 404, 'Resource not found', null);
    }

    // --- FIX: Restructure the incoming payload ---
    const incomingData = req.body;
    const updatePayload = {};
    
    // Get the names of fields defined in the resource's type
    const definedCustomFields = resource.type.fieldDefinitions.map(def => def.fieldName);

    // List of known standard (non-custom) fields on the Resource model
    const standardFields = ['model', 'purchaseDate', 'status', 'tags'];

    // 2. Iterate and build the structured payload
    for (const key in incomingData) {
      const value = incomingData[key];

      if (key === 'name') {
        // Map the incoming 'name' to the schema's 'displayName'
        updatePayload.displayName = value;
      } else if (key === 'isBlockableOverride') {
        // Handle the boolean cast separately
        updatePayload.isBlockableOverride = (value === '') ? null : value;
      } else if (standardFields.includes(key)) {
        // Handle other standard fields
        updatePayload[key] = value;
      } else if (definedCustomFields.includes(key)) {
        // If it's a defined custom field, place it inside the `fields` object
        // using dot notation for atomic updates with Mongoose.
        updatePayload[`fields.${key}`] = value;
      }
    }
    // 3. Pass the new, correctly structured payload to the service
    const updatedResource = await resourceService.updateResource(resourceId, updatePayload, orgId, Resource);

 // Use the helper to perform both invalidations
 await invalidateResourceCaches(req.tenantCache, updatedResource);
    
    
    sendResponse(res, 200, 'Resource updated successfully', updatedResource);
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return sendResponse(res, 400, error.message, null);
    }
    sendResponse(res, 500, error.message, null);
  }
};
exports.deleteResource = async (req, res) => {
  try {
    const resourceId = req.params.id;
    const orgId = req.user.org_id;
    const cache = req.tenantCache;
    const { Resource, Task } = req.tenantModels;

    // Check for a 'force=true' query parameter
    const forceDelete = req.query.force === 'true';

    const resource = await resourceService.getResourceById(resourceId, orgId, Resource);
    if (!resource) return sendResponse(res, 404, 'Resource not found', null);

    const deletionResult = await resourceService.deleteResource(resourceId, orgId, Resource, Task, forceDelete);

    if (!deletionResult.canDelete) {
        return sendResponse(res, 200, deletionResult.warning, {
          taskCount: deletionResult.taskCount,
          canDelete: false // Indicate that deletion hasn't happened yet
      });
    }
    await cache.delPattern(`tasks:org:${req.user.org_id}:*`);
    await invalidateResourceCaches(req.tenantCache, resource);

    // Modify this line to include the resourceId from the deletionResult
    sendResponse(res, 200, 'Resource deleted successfully', {
      canDelete: true,
      id: deletionResult.id // Add the id here
    });
  } catch (error) {
    sendResponse(res, 500, error.message, null);
  }
};