import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import toolService from '../Services/toolsService';
import checkTokenExpiration from "../Helper/checkTokenExpire";
import { toast } from 'react-toastify';
import { logout } from "../features/authSlice"; // Import logout action

export const createTool = createAsyncThunk(
  'tools/createTool',
  async (toolData, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenExpiration(token)) {
      window.Storage.dispatch(logout()); 
      toast.error("Your session has expired. Please log in again.");
      return null;
    }
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
    if (checkTokenExpiration(token)) {
      window.Storage.dispatch(logout()); 
      toast.error("Your session has expired. Please log in again.");
      return null;
    }
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
    if (checkTokenExpiration(token)) {
      window.Storage.dispatch(logout()); 
      toast.error("Your session has expired. Please log in again.");
      return null;
    }
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
    if (checkTokenExpiration(token)) {
      window.Storage.dispatch(logout()); 
      toast.error("Your session has expired. Please log in again.");
      return null;
    }
    try {
      return await toolService.deleteTool(toolId, token );
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error deleting tool');
    }
  }
);

const toolsSlice = createSlice({
  name: 'tools',
  initialState: {
    tools: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    // Add these reducers for socket events
    addToolFromSocket: (state, action) => {
      if (!state.tools.find(tool => tool._id === action.payload._id)) {
        state.tools.push(action.payload);
      }
    },
    updateToolFromSocket: (state, action) => {
      const index = state.tools.findIndex(tool => tool._id === action.payload._id);
      if (index !== -1) {
        state.tools[index] = action.payload;
      }
    },
    removeToolFromSocket: (state, action) => {
      state.tools = state.tools.filter(tool => tool._id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createTool.pending, (state) => { state.status = 'loading'; })
      .addCase(createTool.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Don't update state here - let socket handle it
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
        // Don't update state here - let socket handle it
      })
      .addCase(deleteTool.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Don't update state here - let socket handle it
      });
  },
});

export const { 
  addToolFromSocket, 
  updateToolFromSocket, 
  removeToolFromSocket 
} = toolsSlice.actions;

export default toolsSlice.reducer;
