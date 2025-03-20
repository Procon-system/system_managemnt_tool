import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import facilityService from '../Services/facilityService';
import { checkTokenAndLogout } from '../Helper/checkTokenExpire'; 
// Async Thunks for CRUD operations
export const createFacility = createAsyncThunk(
  'facilities/createFacility',
  async (facilityData, { getState, dispatch,rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenAndLogout(token, dispatch)) {
      return null; // Exit if the token is expired
    }
    try {
      return await facilityService.createFacility(facilityData, token);
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error creating facility');
    }
  }
);

export const fetchFacilities = createAsyncThunk(
  'facilities/fetchFacilities',
  async (_, {getState, dispatch,rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenAndLogout(token, dispatch)) {
      return null; // Exit if the token is expired
    }
    try {
      return await facilityService.fetchFacilities(token);
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error fetching facilities');
    }
  }
);

export const updateFacility = createAsyncThunk(
  'facilities/updateFacility',
  async ({ facilityId, updatedData }, {getState,dispatch, rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenAndLogout(token, dispatch)) {
      return null; // Exit if the token is expired
    }
    try {
      return await facilityService.updateFacility(facilityId, updatedData,token );
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error updating facility');
    }
  }
);

export const deleteFacility = createAsyncThunk(
  'facilities/deleteFacility',
  async (facilityId, { getState,dispatch,rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenAndLogout(token, dispatch)) {
      return null; // Exit if the token is expired
    }
    try {
      return await facilityService.deleteFacility(facilityId,token );
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error deleting facility');
    }
  }
);

// Facility Slice
const facilitySlice = createSlice({
  name: 'facilities',
  initialState: { facilities: [], status: 'idle', error: null },
  reducers: {
    facilityCreated: (state, action) => {
      if (action.payload.newFacility) {
        state.facilities.push(action.payload.newFacility);
      }
    },
    facilityUpdated: (state, action) => {
      const { updatedData } = action.payload;
      const index = state.facilities.findIndex(facility => facility._id === updatedData._id);
      if (index !== -1) {
        state.facilities[index] = updatedData;
      }
    },
    facilityDeleted: (state, action) => {
      const deletedId = action.payload;
      state.facilities = state.facilities.filter(facility => facility._id !== deletedId);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createFacility.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createFacility.fulfilled, (state, action) => {
        state.status = 'succeeded';
      })
      .addCase(createFacility.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchFacilities.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchFacilities.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.facilities = action.payload;
      })
      .addCase(fetchFacilities.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(updateFacility.fulfilled, (state, action) => {
      })
      .addCase(deleteFacility.fulfilled, (state, action) => {
      });
  },
});

export const { facilityCreated, facilityUpdated, facilityDeleted } = facilitySlice.actions;
export default facilitySlice.reducer;
