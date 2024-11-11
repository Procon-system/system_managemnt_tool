import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import facilityService from '../Services/facilityService';

// Async Thunks for CRUD operations
export const createFacility = createAsyncThunk(
  'facilities/createFacility',
  async (facilityData, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    try {
      return await facilityService.createFacility(facilityData, token);
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error creating facility');
    }
  }
);

export const fetchFacilities = createAsyncThunk(
  'facilities/fetchFacilities',
  async (_, { rejectWithValue }) => {
    try {
      return await facilityService.fetchFacilities();
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error fetching facilities');
    }
  }
);

export const updateFacility = createAsyncThunk(
  'facilities/updateFacility',
  async ({ facilityId, updatedData }, { rejectWithValue }) => {
    try {
      return await facilityService.updateFacility(facilityId, updatedData);
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error updating facility');
    }
  }
);

export const deleteFacility = createAsyncThunk(
  'facilities/deleteFacility',
  async (facilityId, { rejectWithValue }) => {
    try {
      return await facilityService.deleteFacility(facilityId);
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error deleting facility');
    }
  }
);

// Facility Slice
const facilitySlice = createSlice({
  name: 'facilities',
  initialState: { facilities: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createFacility.pending, (state) => { state.status = 'loading'; })
      .addCase(createFacility.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.facilities.push(action.payload);
      })
      .addCase(createFacility.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchFacilities.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchFacilities.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.facilities = action.payload;
      })
      .addCase(updateFacility.fulfilled, (state, action) => {
        const index = state.facilities.findIndex(facility => facility.id === action.payload.id);
        if (index !== -1) {
          state.facilities[index] = action.payload;
        }
      })
      .addCase(deleteFacility.fulfilled, (state, action) => {
        state.facilities = state.facilities.filter(facility => facility.id !== action.payload.id);
      });
  },
});

export default facilitySlice.reducer;
