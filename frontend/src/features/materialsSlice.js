import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import materialService from '../Services/materialsService';
import { checkTokenAndLogout } from '../Helper/checkTokenExpire'; 
// Async Thunks for CRUD operations
export const createMaterial = createAsyncThunk(
  'materials/createMaterial',
  async (materialData, { getState, dispatch,rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenAndLogout(token, dispatch)) {
      return null; // Exit if the token is expired
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
  async (_, { getState, dispatch,rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenAndLogout(token, dispatch)) {
      return null; // Exit if the token is expired
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
  async ({ materialId, updatedData }, {getState, dispatch, rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenAndLogout(token, dispatch)) {
      return null; // Exit if the token is expired
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
  async (materialId, { getState, dispatch,rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenAndLogout(token, dispatch)) {
      return null; // Exit if the token is expired
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
  reducers: {
    // Add a new reducer for socket events
    addMaterialFromSocket: (state, action) => {
      const newMaterial = action.payload.newMaterial;
      const existingIndex = state.materials.findIndex(material => material._id === newMaterial._id);
      if (existingIndex !== -1) {
        state.materials[existingIndex] = newMaterial;
      } else {
        state.materials.push(newMaterial);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createMaterial.pending, (state) => { 
        state.status = 'loading'; 
      })
      .addCase(createMaterial.fulfilled, (state, action) => {
        state.status = 'succeeded';
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

// Export the new action
export const { addMaterialFromSocket } = materialSlice.actions;

export default materialSlice.reducer;
