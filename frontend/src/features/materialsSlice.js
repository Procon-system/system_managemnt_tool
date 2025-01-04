import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import materialService from '../Services/materialsService';
import checkTokenExpiration from "../Helper/checkTokenExpire";
import { toast } from 'react-toastify';
import { logout } from "../features/authSlice"; // Import logout action

// Async Thunks for CRUD operations
export const createMaterial = createAsyncThunk(
  'materials/createMaterial',
  async (materialData, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenExpiration(token)) {
      window.Storage.dispatch(logout()); 
      toast.error("Your session has expired. Please log in again.");
      return null;
    }
    try {
      return await materialService.createMaterial(materialData, token);
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error creating material');
    }
  }
);

export const fetchMaterials = createAsyncThunk(
  'materials/fetchMaterials',
  async (_, { getState,rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenExpiration(token)) {
      window.Storage.dispatch(logout()); 
      toast.error("Your session has expired. Please log in again.");
      return null;
    }
    try {
      return await materialService.fetchMaterials(token);
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error fetching materials');
    }
  }
);

export const updateMaterial = createAsyncThunk(
  'materials/updateMaterial',
  async ({ materialId, updatedData }, {getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenExpiration(token)) {
      window.Storage.dispatch(logout()); 
      toast.error("Your session has expired. Please log in again.");
      return null;
    }
    try {
      return await materialService.updateMaterial(materialId, updatedData,token);
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error updating material');
    }
  }
);

export const deleteMaterial = createAsyncThunk(
  'materials/deleteMaterial',
  async (materialId, { getState,rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenExpiration(token)) {
      window.Storage.dispatch(logout()); 
      toast.error("Your session has expired. Please log in again.");
      return null;
    }
    try {
      return await materialService.deleteMaterial(materialId,token);
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error deleting material');
    }
  }
);

// Material Slice
const materialSlice = createSlice({
  name: 'materials',
  initialState: { materials: [], status: 'idle', error: null },
  reducers: {},
  
  extraReducers: (builder) => {
    builder
      .addCase(createMaterial.pending, (state) => { state.status = 'loading'; })
      .addCase(createMaterial.fulfilled, (state, action) => {
        console.log("Payload received:", action.payload);
        state.status = 'succeeded';
        // Append the new material without resetting state
        state.materials = [...state.materials, action.payload];
      })
      .addCase(createMaterial.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchMaterials.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchMaterials.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.materials = action.payload;
      })
      .addCase(updateMaterial.fulfilled, (state, action) => {
        const updatedMaterial = action.payload;
        const index = state.materials.findIndex((material) => material._id === updatedMaterial._id);
         if (index !== -1) {
          // Only update the specific material, don't replace the entire array
          state.materials[index] = { ...state.materials[index], ...updatedMaterial };
        }
      })
      .addCase(deleteMaterial.fulfilled, (state, action) => {
        // Remove the deleted material without resetting state
        state.materials = state.materials.filter(material => material._id !== action.payload.id);
      });
  },
});
export const { setMaterials } = materialSlice.actions;

export default materialSlice.reducer;
