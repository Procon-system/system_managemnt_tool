import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { checkTokenAndLogout } from '../Helper/checkTokenExpire';
import resourceTypeService from '../Services/resourceTypeService';

// Async Thunks using the service layer
export const createResourceType = createAsyncThunk(
  'resourceTypes/createResourceType',
  async (resourceTypeData, { getState, dispatch, rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenAndLogout(token, dispatch)) {
      return null;
    }
    try {
      return await resourceTypeService.createResourceType(resourceTypeData, token);
    } catch (error) {
      return rejectWithValue(error.message || 'Error creating resource type');
    }
  }
);

export const fetchResourceTypes = createAsyncThunk(
  'resourceTypes/fetchResourceTypes',
  async (_, { getState, dispatch, rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenAndLogout(token, dispatch)) {
      return null;
    }
    try {
      return await resourceTypeService.fetchResourceTypes(token);
    } catch (error) {
      return rejectWithValue(error.message || 'Error fetching resource types');
    }
  }
);

export const updateResourceType = createAsyncThunk(
  'resourceTypes/updateResourceType',
  async ({ id, updatedData }, { getState, dispatch, rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenAndLogout(token, dispatch)) {
      return null;
    }
    try {
      return await resourceTypeService.updateResourceType(id, updatedData, token);
    } catch (error) {
      return rejectWithValue(error.message || 'Error updating resource type');
    }
  }
);

export const deleteResourceType = createAsyncThunk(
  'resourceTypes/deleteResourceType',
  async (id, { getState, dispatch, rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenAndLogout(token, dispatch)) {
      return null;
    }
    try {
      await resourceTypeService.deleteResourceType(id, token);
      return id;
    } catch (error) {
      return rejectWithValue(error.message || 'Error deleting resource type');
    }
  }
);

const resourceTypeSlice = createSlice({
  name: 'resourceTypes',
  initialState: { 
    resourceTypes: [], 
    status: 'idle', 
    error: null,
    loading: false
  },
  reducers: {
    // Optional manual reducers if needed
    resourceTypeAdded: (state, action) => {
      state.resourceTypes.push(action.payload);
    },
    resourceTypeUpdated: (state, action) => {
      const index = state.resourceTypes.findIndex(
        rt => rt._id === action.payload._id
      );
      if (index !== -1) {
        state.resourceTypes[index] = action.payload;
      }
    },
    resourceTypeDeleted: (state, action) => {
      state.resourceTypes = state.resourceTypes.filter(
        rt => rt._id !== action.payload
      );
    },
    // Add a reducer to reset the state if needed
    resetResourceTypeState: (state) => {
      state.resourceTypes = [];
      state.status = 'idle';
      state.error = null;
      state.loading = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Create Resource Type
      .addCase(createResourceType.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
        state.error = null;
      })
      .addCase(createResourceType.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loading = false;
        if (action.payload) {
          state.resourceTypes.push(action.payload);
        }
      })
      .addCase(createResourceType.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Resource Types
      .addCase(fetchResourceTypes.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchResourceTypes.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loading = false;
        state.resourceTypes = action.payload.data || [];
      })
      .addCase(fetchResourceTypes.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Resource Type
      .addCase(updateResourceType.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
        state.error = null;
      })
      .addCase(updateResourceType.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loading = false;
        if (action.payload) {
          const index = state.resourceTypes.findIndex(
            rt => rt._id === action.payload._id
          );
          if (index !== -1) {
            state.resourceTypes[index] = action.payload;
          }
        }
      })
      .addCase(updateResourceType.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete Resource Type
      .addCase(deleteResourceType.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteResourceType.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loading = false;
        state.resourceTypes = state.resourceTypes.filter(
          rt => rt._id !== action.payload
        );
      })
      .addCase(deleteResourceType.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { 
  resourceTypeAdded, 
  resourceTypeUpdated, 
  resourceTypeDeleted,
  resetResourceTypeState
} = resourceTypeSlice.actions;

export default resourceTypeSlice.reducer;