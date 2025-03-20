import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import machineService from '../Services/machineService';
import { checkTokenAndLogout } from '../Helper/checkTokenExpire'; 
// Async Thunks for CRUD operations
export const createMachine = createAsyncThunk(
  'machines/createMachine',
  async (machineData, { getState,dispatch,rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenAndLogout(token, dispatch)) {
      return null; // Exit if the token is expired
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
  async (_, { getState,dispatch,rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenAndLogout(token, dispatch)) {
      return null; // Exit if the token is expired
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
  async ({ machineId, updatedData }, { getState,dispatch,rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenAndLogout(token, dispatch)) {
      return null; // Exit if the token is expired
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
  async (machineId, { getState,dispatch,rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenAndLogout(token, dispatch)) {
      return null; // Exit if the token is expired
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
  reducers: {
    addMachineFromSocket: (state, action) => {
      const newMachine = action.payload.newMachine;
      const existingIndex = state.machines.findIndex(machine => machine._id === newMachine._id);
      if (existingIndex !== -1) {
        state.machines[existingIndex] = newMachine;
      } else {
        state.machines.push(newMachine);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createMachine.pending, (state) => { state.status = 'loading'; })
      .addCase(createMachine.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // state.machines= [...state.machines, action.payload];
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
      // .addCase(updateMachine.fulfilled, (state, action) => {
      //   const updatedMachine = action.payload;
      //   const index = state.machines.findIndex(machine => machine.id === updatedMachine.id);
      //   if (index !== -1) {
      //     state.machines[index] = { ...state.machines[index], ...updatedMachine };
      //   }
      // })
      .addCase(updateMachine.fulfilled, (state, action) => {
        const updatedMachine = action.payload;
        const index = state.machines.findIndex(machine => machine._id === updatedMachine._id);
        if (index !== -1) {
          // Update the existing machine instead of adding a new one
          state.machines[index] = updatedMachine;
        }
      })
     .addCase(deleteMachine.fulfilled, (state, action) => {
    // Ensure you use `_id` or the correct key that matches your machine object
    state.machines = state.machines.filter(machine => machine._id !== action.payload.id);
});

  },
});
export const { addMachineFromSocket } = machineSlice.actions;

export default machineSlice.reducer;
