import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import analyticsService from '../Services/analyticsService';
import { checkTokenAndLogout } from '../Helper/checkTokenExpire'; // Corrected path
import { transformApiData, calculateKPIs } from '../utils/analyticsTransformer'; // We will create this file next

// --- Async Thunk for Fetching Data ---
export const fetchAnalyticsData = createAsyncThunk(
  'analytics/fetchData',
  async (filters, { getState, dispatch, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (checkTokenAndLogout(token, dispatch)) {
        return rejectWithValue('Session expired');
      }
      
      // The service will fetch the raw, nested data from the API
      const rawApiTasks = await analyticsService.getAnalyticsData(filters, token);
      
      // The transformation happens here, before the data hits the Redux store
      const transformedTasks = transformApiData(rawApiTasks);
      const kpis = calculateKPIs(transformedTasks);

      // Return a complete payload for the reducer
      return {
        rawTasks: rawApiTasks,
        gridTasks: transformedTasks,
        kpis,
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch analytics data');
    }
  }
);

const initialState = {
    rawTasks: [],
    gridTasks: [],
    kpis: { /* ... */ },
    // This structure now matches what the FilterPanel component expects
    filters: {
      dateRange: {
        start: '', // Default to empty strings
        end: '',
      },
      userIds: [],
      resourceIds: [],
      tags: [], // Assuming you might add this filter later
    },
    status: 'idle',
    error: null,
  };
  
  const analyticsSlice = createSlice({
    name: 'analytics',
    initialState,
    reducers: {
      setAnalyticsFilters: (state, action) => {
        // This logic needs to correctly merge the nested dateRange
        const { dateRange, ...otherFilters } = action.payload;
        state.filters = {
          ...state.filters,
          ...otherFilters,
          dateRange: {
            ...state.filters.dateRange,
            ...dateRange,
          },
        };
      },
    },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalyticsData.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchAnalyticsData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.rawTasks = action.payload.rawTasks;
        state.gridTasks = action.payload.gridTasks;
        state.kpis = action.payload.kpis;
      })
      .addCase(fetchAnalyticsData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { setAnalyticsFilters } = analyticsSlice.actions;

export default analyticsSlice.reducer;