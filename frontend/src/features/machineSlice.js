import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import machineService from '../Services/machineService';
import checkTokenExpiration from "../Helper/checkTokenExpire";
import { toast } from 'react-toastify';
import { logout } from "../features/authSlice"; // Import logout action

// Async Thunks for CRUD operations
export const createMachine = createAsyncThunk(
  'machines/createMachine',
  async (machineData, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenExpiration(token)) {
      window.Storage.dispatch(logout()); 
      toast.error("Your session has expired. Please log in again.");
      return null;
    }
    try {
      return await machineService.createMachine(machineData, token);
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error creating machine');
    }
  }
);

export const fetchMachines = createAsyncThunk(
  'machines/fetchMachines',
  async (_, { getState,rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenExpiration(token)) {
      window.Storage.dispatch(logout()); 
      toast.error("Your session has expired. Please log in again.");
      return null;
    }
    try {
      return await machineService.fetchMachines(token);
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error fetching machines');
    }
  }
);

export const updateMachine = createAsyncThunk(
  'machines/updateMachine',
  async ({ machineId, updatedData }, { getState,rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenExpiration(token)) {
      window.Storage.dispatch(logout()); 
      toast.error("Your session has expired. Please log in again.");
      return null;
    }
    try {
      return await machineService.updateMachine(machineId, updatedData,token);
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error updating machine');
    }
  }
);

export const deleteMachine = createAsyncThunk(
  'machines/deleteMachine',
  async (machineId, { getState,rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenExpiration(token)) {
      window.Storage.dispatch(logout()); 
      toast.error("Your session has expired. Please log in again.");
      return null;
    }
    try {
      return await machineService.deleteMachine(machineId,token);
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error deleting machine');
    }
  }
);

// Machine Slice
const machineSlice = createSlice({
  name: 'machines',
  initialState: { machines: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createMachine.pending, (state) => { state.status = 'loading'; })
      .addCase(createMachine.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.machines.push(action.payload);
      })
      .addCase(createMachine.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchMachines.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchMachines.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.machines = action.payload;
      })
      .addCase(updateMachine.fulfilled, (state, action) => {
        const index = state.machines.findIndex(machine => machine.id === action.payload.id);
        if (index !== -1) {
          state.machines[index] = action.payload;
        }
      })
      .addCase(deleteMachine.fulfilled, (state, action) => {
        state.machines = state.machines.filter(machine => machine.id !== action.payload.id);
      });
  },
});

export default machineSlice.reducer;
