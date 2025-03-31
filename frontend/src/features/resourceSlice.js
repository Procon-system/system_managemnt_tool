import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { checkTokenAndLogout } from '../Helper/checkTokenExpire';
import resourceService from '../Services/resourceService';

// Async Thunks using the service layer
export const createResource = createAsyncThunk(
  'resources/createResource',
  async (resourceData, { getState, dispatch, rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenAndLogout(token, dispatch)) {
      return null;
    }
    try {
      const response = await resourceService.createResource(resourceData, token);
      console.log("response.data2",response.data)
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
      console.log("response.data1",response.data)
      return response.data; 
    } catch (error) {
      return rejectWithValue(error.message || 'Error fetching resources');
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
  async (id, { getState, dispatch, rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenAndLogout(token, dispatch)) {
      return null;
    }
    try {
      await resourceService.deleteResource(id, token);
      return id;
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
  currentResource: null,
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
      const index = state.data.resources.findIndex(r => r._id === action.payload._id);
      if (index !== -1) {
        state.data.resources[index] = action.payload;
      }
    },
    resourceDeleted: (state, action) => {
      state.data.resources = state.data.resources.filter(r => r._id !== action.payload);
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
        // Store the entire API response in data
        state.data = {
          resources: action.payload.resources || [],
          total: action.payload.total || 0,
          pages: action.payload.pages || 1,
          currentPage: action.payload.currentPage || 1
        };
      })
      .addCase(fetchResourcesByType.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.payload;
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
        state.data.resources = state.data.resources.filter(r => r._id !== action.payload);
        state.data.total -= 1;
        if (state.currentResource?._id === action.payload) {
          state.currentResource = null;
        }
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
      });
  }
});

export const { 
  resourceAdded, 
  resourceUpdated, 
  resourceDeleted,
  setCurrentResource,
  resetResourceState
} = resourceSlice.actions;

export default resourceSlice.reducer;