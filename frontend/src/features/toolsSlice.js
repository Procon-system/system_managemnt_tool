
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import toolService from '../Services/toolsService';

export const createTool = createAsyncThunk(
  'tools/createTool',
  async (toolData, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    try {
      return await toolService.createTool(toolData, token);
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error creating tool');
    }
  }
);

export const fetchTools = createAsyncThunk(
  'tools/fetchTools',
  async (_, {getState, rejectWithValue }) => {
    const token = getState().auth.token;
    try {
      return await toolService.fetchTools( token );
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error fetching tools');
    }
  }
);

export const updateTool = createAsyncThunk(
  'tools/updateTool',
  async ({ toolId, updatedData }, {getState, rejectWithValue }) => {
    const token = getState().auth.token;
    try {
      return await toolService.updateTool(toolId, updatedData, token );
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error updating tool');
    }
  }
);

export const deleteTool = createAsyncThunk(
  'tools/deleteTool',
  async (toolId, {getState, rejectWithValue }) => {
    const token = getState().auth.token;
    try {
      return await toolService.deleteTool(toolId, token );
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error deleting tool');
    }
  }
);

const toolSlice = createSlice({
  name: 'tools',
  initialState: { tools: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createTool.pending, (state) => { state.status = 'loading'; })
      .addCase(createTool.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.tools.push(action.payload);
      })
      .addCase(createTool.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchTools.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.tools = action.payload;
      })
      .addCase(updateTool.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const index = state.tools.findIndex(tool => tool._id === action.payload._id);
        if (index !== -1) state.tools[index] = action.payload;
      })
      .addCase(deleteTool.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.tools = state.tools.filter(tool => tool._id !== action.payload._id);
      });
  },
});

export default toolSlice.reducer;
