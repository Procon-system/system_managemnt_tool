import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import taskService from '../Services/taskService';
import { checkTokenAndLogout } from '../Helper/checkTokenExpire'; 

// export const createTask = createAsyncThunk(
//   'tasks/createTask',
//   async (taskData, { getState, dispatch,rejectWithValue }) => {
//     try {
//       // Get the token from the Redux state
//       const token = getState().auth.token;
//       if (checkTokenAndLogout(token, dispatch)) {
//         return null; // Exit if the token is expired
//       }
//       // Call the taskService with taskData and token
//       return await taskService.createTask(taskData, token);
//     } catch (error) {
//       return rejectWithValue(error.details || 'Error creating task');
//     }
//   }
// );
export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData, { getState, dispatch, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (checkTokenAndLogout(token, dispatch)) {
        return rejectWithValue('Session expired');
      }
      
      const response = await taskService.createTask(taskData, token);
      
      // Ensure consistent response format
      return Array.isArray(response) 
        ? { data: response } 
        : response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error creating task');
    }
  }
);
export const getTasksByAssignedUser = createAsyncThunk(
  'tasks/getTasksByAssignedUser',
  async (userId, { getState,dispatch, rejectWithValue }) => {
    try {
      const token = getState().auth.token; // Get the token from Redux state
      if (checkTokenAndLogout(token, dispatch)) {
        return null; // Exit if the token is expired
      }
      // return await taskService.getTasksByAssignedUser(userId, token); // Call the service function
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error fetching tasks for assigned user');
    }
  }
);
export const getTasksDoneByAssignedUser = createAsyncThunk(
  'tasks/getTasksDoneByAssignedUser',
  async (userId, { getState,dispatch, rejectWithValue }) => {
    try {
      const token = getState().auth.token; // Get the token from Redux state
      if (checkTokenAndLogout(token, dispatch)) {
        return null; // Exit if the token is expired
      }
      // return await taskService.getTasksDoneByAssignedUser(userId, token); // Call the service function
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error fetching tasks for assigned user');
    }
  }
); //getAllDoneTasks
export const getAllDoneTasks = createAsyncThunk(
  'tasks/getAllDoneTasks',
  async (_, { rejectWithValue }) => {
    
    try {
      // return await taskService.getAllDoneTasks();
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error fetching tasks');
    }
  }
);
// Fetch Tasks
export const fetchOrganizationTasks = createAsyncThunk(
  'tasks/fetchOrganizationTasks',
  async ({ page = 1, limit = 10 }, { rejectWithValue, dispatch, getState }) =>{
      try {
        const token = getState().auth.token; // Get the token from Redux state
        if (checkTokenAndLogout(token, dispatch)) {
          return null; // Exit if the token is expired
        }
        return await taskService.getOrganizationTasks(
          { page, limit },
          token
        );
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ taskId, updatedData }, { getState, dispatch,rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenAndLogout(token, dispatch)) {
      return null; // Exit if the token is expired
    }

    console.log("🟢 FormData before sending to service:");
    for (let pair of updatedData.entries()) {
        console.log(pair[0], pair[1]);
    }

    try {
      // return await taskService.updateTask(taskId, updatedData, token);
      const response = await taskService.updateTask(taskId, updatedData, token);
    return response; 
    } catch (error) {
      console.error('Error in updateTask:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message || 'Error updating task');
    }
  }
);

// Fetch image metadata
export const fetchImageMetadata = createAsyncThunk(
  'tasks/fetchImageMetadata',
  async ({ fileIds }, { getState, dispatch, rejectWithValue }) => {
    const token = getState().auth.token;

    if (checkTokenAndLogout(token, dispatch)) return null;

    try {
      const response = await taskService.fetchImageMetadata(fileIds, token);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch image file
export const fetchImageFile = createAsyncThunk(
  'tasks/fetchImageFile',
  async ({ fileId }, { getState, dispatch, rejectWithValue }) => {
    const token = getState().auth.token;

    if (checkTokenAndLogout(token, dispatch)) return null;

    try {
      const response = await taskService.fetchImageFile(fileId, token);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete Task
export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId, { getState,dispatch,rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenAndLogout(token, dispatch)) {
      return null; // Exit if the token is expired
    }
    try {
      console.log("delete",taskId,token)
      return await taskService.deleteTask(taskId,token );
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error deleting task');
    }
  }
);

export const bulkUpdateTasks = createAsyncThunk(
  'tasks/bulkUpdateTasks',
  async (tasksData, { getState, dispatch,rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (checkTokenAndLogout(token, dispatch)) {
        return null; // Exit if the token is expired
      }
      const results = await taskService.bulkUpdateTasks(tasksData, token);
      // Filter successful updates
      const successfulUpdates = results.filter(result => result.status === 'success')
                                     .map(result => result.updatedTask);
      
      return successfulUpdates;
    } catch (error) {
      console.log("error",error)
      return rejectWithValue(error.response?.data || 'Error updating tasks');
    }
  }
);
export const filterTasks = createAsyncThunk(
  'tasks/filterTasks',
  async (filters, { getState,dispatch, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (checkTokenAndLogout(token, dispatch)) {
        return null; // Exit if the token is expired
      }
      return await taskService.filterTasks(filters); // ✅ Call filterTasks API
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error filtering tasks');
    }
  }
);
const taskSlice = createSlice({
  name: 'tasks',
  initialState: {
    tasks: [],
    status: 'idle',
    filteredTasks: [], 
    imageMetadata: [],
    imageFiles: {},
    error: null,
    currentView: 'allTasks', // Default to showing all tasks
  },
  reducers: {
    setTaskView: (state, action) => {
      state.currentView = action.payload; // Update the view (e.g., 'allTasks' or 'userTasks')
    },
    
    addMultipleTasksFromSocket: (state, action) => {
      // Ensure state.tasks is always an array
      if (!Array.isArray(state.tasks)) {
        state.tasks = [];
      }
      
      // Ensure payload is an array
      const newTasks = Array.isArray(action.payload) ? action.payload : [action.payload].filter(Boolean);
      
      // Create Set of existing IDs (safe even if state.tasks is empty)
      const existingIds = new Set(
        Array.isArray(state.tasks) 
          ? state.tasks.map(t => t._id) 
          : []
      );
      
      // Filter out duplicates and invalid tasks
      const uniqueNewTasks = newTasks.filter(
        task => task?._id && !existingIds.has(task._id)
      );
      
      // Safely add new tasks
      if (uniqueNewTasks.length > 0) {
        state.tasks = [...state.tasks, ...uniqueNewTasks];
      }
    },
    resetFilteredTasks: (state) => {
      state.filteredTasks = [];
      state.currentView = 'allTasks'; // Reset to all tasks view
    },
    
  },
  extraReducers: (builder) => {
    builder
    .addCase(fetchImageMetadata.pending, (state) => {
      state.status = 'loading';
    })
    .addCase(fetchImageMetadata.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.imageMetadata = action.payload;
    })
    .addCase(fetchImageMetadata.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.payload;
    })
    .addCase(fetchImageFile.fulfilled, (state, action) => {
      state.imageFiles[action.payload.fileId] = action.payload.blob;
    })
      .addCase(createTask.pending, (state) => {
        state.status = 'loading';
      })
    
      // In your taskSlice.js
.addCase(createTask.fulfilled, (state, action) => {
  state.status = 'succeeded';
  
  // Process payload into array of tasks
  const receivedTasks = Array.isArray(action.payload) 
    ? action.payload 
    : action.payload?.data 
      ? Array.isArray(action.payload.data) 
        ? action.payload.data 
        : [action.payload.data]
      : [action.payload].filter(Boolean);
  
  // Create Set of existing task IDs for quick lookup
  const existingIds = new Set(state.tasks.map(t => t._id));
  
  // Filter out duplicates and invalid tasks
  const uniqueNewTasks = receivedTasks.filter(
    task => task?._id && !existingIds.has(task._id)
  );
  
  // Merge new tasks with existing ones (IMPORTANT: Use Immer's mutable syntax)
  state.tasks.push(...uniqueNewTasks);
})
      .addCase(createTask.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(filterTasks.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(filterTasks.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.filteredTasks = action.payload;
        state.currentView = 'filteredTasks'; // ✅ Switch view to filtered tasks
      })
      .addCase(filterTasks.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchOrganizationTasks.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchOrganizationTasks.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.tasks = action.payload;
      })
      .addCase(fetchOrganizationTasks.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.status = 'succeeded';
      
        // Extract the updated task from the payload
        const updatedTask = action.payload;
        // Check if the task exists and update it, otherwise add it
        const index = state.tasks.findIndex(task => task._id === updatedTask._id);
        if (index !== -1) {
          state.tasks[index] = updatedTask; // Update existing task
        } else {
          state.tasks.push(updatedTask); // Add new task if it doesn't exist
        }
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.tasks = state.tasks.filter(task => task._id !== action.payload._id); // Use the correct identifier

      })
       // For getting tasks by assigned user
       .addCase(getTasksByAssignedUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getTasksByAssignedUser.fulfilled, (state, action) => {
        console.log("Fetched Tasks:", action.payload); // Log the fetched tasks
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
      })
      .addCase(bulkUpdateTasks.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      
      .addCase(bulkUpdateTasks.fulfilled, (state, action) => {
        const results = action.payload;
        if (Array.isArray(results)) {
          results.forEach((result) => {
            if (result.status === 'success' && result.updatedTask) {
              const index = state.tasks.findIndex((task) => task._id === result.updatedTask._id);
              if (index !== -1) {
                // Merge only the updated fields with the existing task
                state.tasks[index] = {
                  ...state.tasks[index], // Keep existing fields
                  ...result.updatedTask, // Overwrite with updated fields
                  start: result.updatedTask.start_time || state.tasks[index].start, // Preserve existing start if not updated
                  end: result.updatedTask.end_time || state.tasks[index].end, // Preserve existing end if not updated
                };
              } else {
                // If the task doesn't exist in the state, add it
                state.tasks.push({
                  ...result.updatedTask,
                  start: result.updatedTask.start_time,
                  end: result.updatedTask.end_time,
                });
              }
            }
          });
        }
        state.status = 'succeeded';
      })
      .addCase(bulkUpdateTasks.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to update tasks';
      })
  },
});
export const { setTaskView,addMultipleTasksFromSocket ,resetFilteredTasks} = taskSlice.actions;

export default taskSlice.reducer;
