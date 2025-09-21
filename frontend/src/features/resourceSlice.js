import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { checkTokenAndLogout } from '../Helper/checkTokenExpire';
import resourceService from '../Services/resourceService';
import { logout } from './authSlice'; // Adjust the path if necessary

const fetchCache = {};
const CACHE_DURATION_MS = 5000;
export const createResource = createAsyncThunk(
  'resources/createResource',
  async (resourceData, { getState, dispatch, rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenAndLogout(token, dispatch)) {
      return null;
    }
    try {
      const response = await resourceService.createResource(resourceData, token);
     
      return response.data; 
    } catch (error) {
      return rejectWithValue(error.message || 'Error creating resource');
    }
  }
);

export const fetchResourcesByType = createAsyncThunk(
  'resources/fetchResourcesByType',
  async (typeId, { getState, dispatch, rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenAndLogout(token, dispatch)) {
      return null;
    }
    try {
      const response = await resourceService.getResourcesByType(typeId, token);
      
      return response.data; 
    } catch (error) {
      return rejectWithValue(error.message || 'Error fetching resources');
    }
  }
);
export const checkRecurringAvailability = createAsyncThunk(
  'resources/checkRecurring',
  async (checkData, { getState, rejectWithValue }) => {
    console.log("checkData",checkData)
    const token = getState().auth.token;
    if (
      !Array.isArray(checkData.resourceIds)   ||
      checkData.resourceIds.length === 0       ||
      !checkData.frequency                    ||
      !checkData.task_period                  ||
      !checkData.schedule
    ) {
      return { clear: true };
    }
    try {
      const data = await resourceService.checkRecurringAvailability(checkData, token);
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error checking recurring availability');
    }
  }
);
export const fetchAvailableResources = createAsyncThunk(
  'resources/fetchAvailable',
  async ({ typeId, startTime, endTime }, { getState,dispatch,  rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenAndLogout(token, dispatch)) return null;
    try {
      const response = await resourceService.getAvailableResources({ typeId, startTime, endTime }, token);
      // Return a payload that includes the typeId so the reducer knows where to store the data
      return { typeId, resources: response.data };
    } catch (error) {
      return rejectWithValue(error.message || 'Error fetching available resources');
    }
  },
  {
    condition: (payload) => {
      const { typeId, startTime, endTime } = payload;
      const cacheKey = `${typeId}-${startTime}-${endTime}`;
      const cacheEntry = fetchCache[cacheKey];
      const now = Date.now();

      // 1. If this exact request is currently being fetched, abort.
      if (cacheEntry?.status === 'loading') {
          return false;
      }
      
      // 2. If this exact request was successfully fetched recently, abort.
      if (cacheEntry?.status === 'fetched' && (now - cacheEntry.timestamp < CACHE_DURATION_MS)) {
        return false;
      }

      // If we proceed, mark this request as 'loading' in our cache.
      // This is the key change that allows different requests to run concurrently.
      fetchCache[cacheKey] = { status: 'loading', timestamp: now };
      return true; // Proceed with the fetch.
    }
  }
);
export const fetchResourceById = createAsyncThunk(
  'resources/fetchResourceById',
  async (id, { getState, dispatch, rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenAndLogout(token, dispatch)) {
      return null;
    }
    try {
      return await resourceService.getResourceById(id, token);
    } catch (error) {
      return rejectWithValue(error.message || 'Error fetching resource');
    }
  }
);
export const updateResource = createAsyncThunk(
  'resources/updateResource',
  async ({ id, updatedData }, { getState, dispatch, rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenAndLogout(token, dispatch)) {
      return null;
    }
    try {
      return await resourceService.updateResource(id, updatedData, token);
    } catch (error) {
      return rejectWithValue(error.message || 'Error updating resource');
    }
  }
);
export const deleteResource = createAsyncThunk(
  'resources/deleteResource',
  async ({ id, force = false }, { getState, dispatch, rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenAndLogout(token, dispatch)) {
      return null; 
    }
    try {
      const response = await resourceService.deleteResource(id, token, force);
    
      if (!response.data.canDelete) {
        return rejectWithValue({ 
          message: response.message, 
          taskCount: response.data.taskCount,
          canDelete: response.data.canDelete, 
          id
        });
      }

      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Error deleting resource');
    }
  }
);
export const syncLocalResourceChanges = createAsyncThunk(
  'resources/syncLocalChanges',
  async (_, { getState, dispatch, rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenAndLogout(token, dispatch)) {
      return null;
    }
    try {
      return await resourceService.syncLocalChanges(token);
    } catch (error) {
      return rejectWithValue(error.message || 'Error syncing local changes');
    }
  }
);

const initialState = {
  data: {
    resources: [],
    total: 0,
    pages: 1,
    currentPage: 1
  },
  availableResources: {},
  availableStatus: 'idle',
  currentResource: null,
  recurringConflict: null,
  isCheckingRecurring: false,
  status: 'idle',
  error: null,
  loading: false
};

const resourceSlice = createSlice({
  name: 'resources',
  initialState,
  reducers: {
    resourceAdded: (state, action) => {
      state.data.resources.unshift(action.payload);
      state.data.total += 1;
    },
    resourceUpdated: (state, action) => {
      const index = state.data.resources.findIndex(r => r._id === action.payload);
      if (index !== -1) {
        state.data.resources[index] = action.payload;
      }
    },
    resourceDeleted: (state, action) => {
      state.data.resources = state.data.resources.filter(r => r._id !== action.payload.data.id);
      state.data.total -= 1;
    },
    setCurrentResource: (state, action) => {
      state.currentResource = action.payload;
    },
    resetResourceState: (state) => {
      state.data = {
        resources: [],
        total: 0,
        pages: 1,
        currentPage: 1
      };
      state.currentResource = null;
      state.status = 'idle';
      state.error = null;
      state.loading = false;
    },
    clearAvailableResources: (state) => {
      state.availableResources = {};
      state.availableStatus = 'idle';
  },
  clearRecurringConflict: (state) => {
    state.recurringConflict = null;
   },
   clearError: (state) => {
        state.error = null;
      }
  },
  extraReducers: (builder) => {
    builder
      // Create Resource
      .addCase(createResource.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
        state.error = null;
      })
      .addCase(createResource.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loading = false;
        if (action.payload) {
          state.data.resources.unshift(action.payload);
          state.data.total += 1;
        }
      })
      .addCase(createResource.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Resources by Type
      .addCase(fetchResourcesByType.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
        state.error = null;
      })
      
      .addCase(fetchResourcesByType.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loading = false;
        
        const { typeId, resources: newResources = [] } = action.payload;
        
        // Store resources by type (new)
        if (!state.data.resourcesByType) {
          state.data.resourcesByType = {};
        }
        state.data.resourcesByType[typeId] = newResources;
        
        // Maintain combined list (for backward compatibility)
        const existingResources = state.data.resources || [];
        const mergedResources = [
          ...existingResources.filter(existing => 
            !newResources.some(newRes => newRes._id === existing._id)
          ),
          ...newResources
        ];
        
        state.data.resources = mergedResources;
        state.data.total = action.payload.total || mergedResources.length;
        state.data.pages = action.payload.pages || 1;
        state.data.currentPage = action.payload.currentPage || 1;
      })
      .addCase(fetchResourcesByType.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAvailableResources.pending, (state) => {
        state.availableStatus = 'loading';
      })
      .addCase(fetchAvailableResources.fulfilled, (state, action) => {
        state.availableStatus = 'succeeded';
        if (action.payload) {
          const { typeId, resources } = action.payload;
          
          state.availableResources[typeId] = resources;
        }
      })
      .addCase(fetchAvailableResources.rejected, (state, action) => {
        state.availableStatus = 'failed';
        state.error = action.payload;
      })
      .addCase(checkRecurringAvailability.pending, (state) => {
        state.isCheckingRecurring = true;
        const { typeId } = state.currentCheckArg || {};
   if (typeId) delete state.recurringConflict[typeId];    
    })
      .addCase(checkRecurringAvailability.fulfilled, (state, action) => {
           state.isCheckingRecurring = false;
        
            // if we returned { clear: true } from the thunk, bail
            if (action.payload.clear) return;
        
           const { typeId } = action.meta.arg;
           const { available, unavailableResourceIds = [], message } = action.payload;
           const allForType =
             (state.data.resourcesByType?.[typeId]) ??
             state.data.resources.filter(r =>
              (r.type?._id === typeId) || (r.type === typeId)
           );
    
         // 2. Write back into the same availableResources map
          if (available) {
           state.availableResources[typeId] = allForType;
           } else {
             const blocked = new Set(unavailableResourceIds.map(id => id.toString()));
             state.availableResources[typeId] = allForType.filter(
               r => !blocked.has(r._id.toString())
             );
           // 3. Store the human-readable conflict message keyed by type
           state.recurringConflict = state.recurringConflict || {};
             state.recurringConflict[typeId] = message;
         }
       })
    
         .addCase(checkRecurringAvailability.rejected, (state, action) => {
           state.isCheckingRecurring = false;
         // Put the error text into the same conflict map
         const { typeId } = action.meta.arg;
         state.recurringConflict = state.recurringConflict || {};
           state.recurringConflict[typeId] = action.payload || action.error.message;
         })
      // Fetch Resource by ID
      .addCase(fetchResourceById.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchResourceById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loading = false;
        state.currentResource = action.payload;
      })
      .addCase(fetchResourceById.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Resource
      .addCase(updateResource.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
        state.error = null;
      })
      .addCase(updateResource.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loading = false;
        if (action.payload) {
          const index = state.data.resources.findIndex(r => r._id === action.payload._id);
          if (index !== -1) {
            state.data.resources[index] = action.payload;
          }
          if (state.currentResource?._id === action.payload._id) {
            state.currentResource = action.payload;
          }
        }
      })
      .addCase(updateResource.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete Resource
      .addCase(deleteResource.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteResource.fulfilled, (state, action) => {

        state.status = 'succeeded';
        state.loading = false;
        state.data.resources = state.data.resources.filter(r => r._id !== action.payload.data.id); // Correct immutable update
        state.data.total -= 1;
        
        // if (state.currentResource?._id === action.payload.data.id) {
        //     state.currentResource = null;
        // }
    })
      .addCase(deleteResource.rejected, (state, action) => {
      
        state.status = 'failed';
        state.loading = false;
        state.error = action.payload;
      })
      
      // Sync Local Changes
      .addCase(syncLocalResourceChanges.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
        state.error = null;
      })
      .addCase(syncLocalResourceChanges.fulfilled, (state) => {
        state.status = 'succeeded';
        state.loading = false;
      })
      .addCase(syncLocalResourceChanges.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(logout, (state, action) => {
        return initialState;
      });
  }
});

export const { 
  resourceAdded, 
  resourceUpdated, 
  resourceDeleted,
  setCurrentResource,
  resetResourceState,
  clearAvailableResources,
  clearRecurringConflict,
  clearError
} = resourceSlice.actions;

export default resourceSlice.reducer;