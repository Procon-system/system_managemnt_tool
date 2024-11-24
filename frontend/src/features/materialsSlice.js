import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import materialService from '../Services/materialsService';

// Async Thunks for CRUD operations
export const createMaterial = createAsyncThunk(
  'materials/createMaterial',
  async (materialData, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
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
        state.status = 'succeeded';
        state.materials.push(action.payload);
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
        const index = state.materials.findIndex(material => material.id === action.payload.id);
        if (index !== -1) {
          state.materials[index] = action.payload;
        }
      })
      .addCase(deleteMaterial.fulfilled, (state, action) => {
        state.materials = state.materials.filter(material => material.id !== action.payload.id);
      });
  },
});

export default materialSlice.reducer;
