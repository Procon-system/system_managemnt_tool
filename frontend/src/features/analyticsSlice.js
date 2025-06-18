
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import analyticsService from '../Services/analyticsService';
import { checkTokenAndLogout } from '../Helper/checkTokenExpire';

// // The thunk now expects an array of populated tasks from the service
// export const fetchAnalyticsData = createAsyncThunk(
//   'analytics/fetchData',
//   async (filters, { getState, dispatch, rejectWithValue }) => {
//     try {
//       const token = getState().auth.token;
//       if (checkTokenAndLogout(token, dispatch)) {
//         return rejectWithValue('Session expired');
//       }
      
//       // This call now correctly returns the populated tasks array
//       const populatedTasks = await analyticsService.getAnalyticsData(filters, token);
      
//       // The thunk simply returns the raw data. No transformation here.
//       return populatedTasks; 
//     } catch (error) {
//       console.error("Error in fetchAnalyticsData thunk:", error);
//       return rejectWithValue(error.message || 'Failed to fetch analytics data');
//     }
//   }
// );

// // The initial state is now much simpler, reflecting the API response
// const initialState = {
//     // This will hold the raw array of populated tasks from the API
//     rawTasks: [], 
//     filters: {
//       dateRange: {
//         start: '',
//         end: '',
//       },
//       userIds: [],
//       resourceIds: [],
//       tags: [],
//     },
//     status: 'idle',
//     error: null,
//   };
  
//   const analyticsSlice = createSlice({
//     name: 'analytics',
//     initialState,
//     reducers: {
//       // This reducer remains the same
//       setAnalyticsFilters: (state, action) => {
//         const { dateRange, ...otherFilters } = action.payload;
//         state.filters = {
//           ...state.filters,
//           ...otherFilters,
//           dateRange: {
//             ...state.filters.dateRange,
//             ...dateRange,
//           },
//         };
//       },
//     },
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchAnalyticsData.pending, (state) => {
//         state.status = 'loading';
//         state.error = null;
//       })
//       .addCase(fetchAnalyticsData.fulfilled, (state, action) => {
//         state.status = 'succeeded';
//         // The payload is the array of tasks, which we store directly
//         state.rawTasks = action.payload;
//       })
//       .addCase(fetchAnalyticsData.rejected, (state, action) => {
//         state.status = 'failed';
//         state.error = action.payload;
//       });
//   },
// });

// export const { setAnalyticsFilters } = analyticsSlice.actions;

// export default analyticsSlice.reducer;

export const fetchAnalyticsData = createAsyncThunk(
  'analytics/fetchData',
  async (dateRange, { getState, dispatch, rejectWithValue }) => {
    try {
      
      const token = getState().auth.token;
            if (checkTokenAndLogout(token, dispatch)) {
              return rejectWithValue('Session expired');
            }
            
      // Fetch a broad dataset based only on a date range
      const populatedTasks = await analyticsService.getAnalyticsData(dateRange, token);
      return populatedTasks; 
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch analytics data');
    }
  }
);

const initialState = {
    // This holds the complete, unfiltered dataset for the session
    allTasks: [], 
    status: 'idle',
    error: null,
  };
  
  const analyticsSlice = createSlice({
    name: 'analytics',
    initialState,
    reducers: {
      // The setAnalyticsFilters reducer is removed.
    },
    extraReducers: (builder) => {
    builder
      .addCase(fetchAnalyticsData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAnalyticsData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.allTasks = action.payload; // Store the master dataset
      })
      .addCase(fetchAnalyticsData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default analyticsSlice.reducer;