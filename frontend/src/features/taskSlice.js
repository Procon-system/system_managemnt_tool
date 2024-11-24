
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import taskService from '../Services/taskService';
export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData, { getState, rejectWithValue }) => {
    try {
      // Get the token from the Redux state
      console.log("token", getState().auth); 
      const token = getState().auth.token;

      // Call the taskService with taskData and token
      return await taskService.createTask(taskData, token);
    } catch (error) {
      console.log("error", error);
      return rejectWithValue(error.response?.data || 'Error creating task');
    }
  }
);
export const getTasksByAssignedUser = createAsyncThunk(
  'tasks/getTasksByAssignedUser',
  async (userId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token; // Get the token from Redux state
      return await taskService.getTasksByAssignedUser(userId, token); // Call the service function
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error fetching tasks for assigned user');
    }
  }
);
export const getTasksDoneByAssignedUser = createAsyncThunk(
  'tasks/getTasksDoneByAssignedUser',
  async (userId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token; // Get the token from Redux state
      return await taskService.getTasksDoneByAssignedUser(userId, token); // Call the service function
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error fetching tasks for assigned user');
    }
  }
); //getAllDoneTasks
export const getAllDoneTasks = createAsyncThunk(
  'tasks/getAllDoneTasks',
  async (_, { rejectWithValue }) => {
    
    try {
      return await taskService.getAllDoneTasks();
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error fetching tasks');
    }
  }
);
// Fetch Tasks
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (_, { rejectWithValue }) => {
    
    try {
      return await taskService.fetchTasks( );
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error fetching tasks');
    }
  }
);

// Update Task
export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ taskId, updatedData }, {getState, rejectWithValue }) => {
    const token = getState().auth.token;
    try {
      return await taskService.updateTask(taskId, updatedData,token );
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error updating task');
    }
  }
);

// Delete Task
export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId, { getState,rejectWithValue }) => {
    const token = getState().auth.token;
    try {
      return await taskService.deleteTask(taskId,token );
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error deleting task');
    }
  }
);

const taskSlice = createSlice({
  name: 'tasks',
  initialState: {
    tasks: [],
    status: 'idle',
    error: null,
    currentView: 'allTasks', // Default to showing all tasks
  },
  reducers: {
    setTaskView: (state, action) => {
      state.currentView = action.payload; // Update the view (e.g., 'allTasks' or 'userTasks')
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createTask.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.tasks.push(action.payload);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      .addCase(fetchTasks.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      .addCase(updateTask.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const index = state.tasks.findIndex(task => task.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.tasks = state.tasks.filter(task => task.id !== action.payload.id);
      })
       // For getting tasks by assigned user
       .addCase(getTasksByAssignedUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getTasksByAssignedUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.tasks = action.payload; // Set the tasks to those fetched for the assigned user
      })
      .addCase(getTasksByAssignedUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(getTasksDoneByAssignedUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getTasksDoneByAssignedUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.tasks = action.payload; // Set the tasks to those fetched for the assigned user
      })
      .addCase(getTasksDoneByAssignedUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(getAllDoneTasks.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getAllDoneTasks.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.tasks = action.payload; // Set the tasks to those fetched for the assigned user
      })
      .addCase(getAllDoneTasks.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
      
  },
});
export const { setTaskView } = taskSlice.actions;

export default taskSlice.reducer;
