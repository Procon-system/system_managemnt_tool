
// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import axios from 'axios';

// const API_URL = 'http://localhost:5000/api/tasks/create-tasks';

// export const createTask = createAsyncThunk(
//   '/create-tasks',
//   async (taskData, { rejectWithValue }) => {
//     try {
//       const response = await axios.post(API_URL, taskData);
//       return response.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data || 'Error creating task');
//     }
//   }
// );

// const taskSlice = createSlice({
//   name: 'tasks',
//   initialState: {
//     tasks: [],
//     status: 'idle',
//     error: null,
//   },
//   reducers: {},
//   extraReducers: (builder) => {
//     builder
//       .addCase(createTask.pending, (state) => {
//         state.status = 'loading';
//       })
//       .addCase(createTask.fulfilled, (state, action) => {
//         state.status = 'succeeded';
//         state.tasks.push(action.payload);
//       })
//       .addCase(createTask.rejected, (state, action) => {
//         state.status = 'failed';
//         state.error = action.payload;
//       });
//   },
// });

// export default taskSlice.reducer;

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import taskService from '../Services/taskService';

// Create Task
export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData, { rejectWithValue }) => {
    try {
      return await taskService.createTask(taskData);
    } catch (error) {
      console.log("error",error)
      return rejectWithValue(error.response?.data || 'Error creating task');
    }
  }
);

// Fetch Tasks
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (_, { rejectWithValue }) => {
    try {
      return await taskService.fetchTasks();
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error fetching tasks');
    }
  }
);

// Update Task
export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ taskId, updatedData }, { rejectWithValue }) => {
    try {
      return await taskService.updateTask(taskId, updatedData);
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error updating task');
    }
  }
);

// Delete Task
export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId, { rejectWithValue }) => {
    try {
      return await taskService.deleteTask(taskId);
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
  },
  reducers: {},
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
      });
  },
});

export default taskSlice.reducer;
