import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import taskService from '../Services/taskService';
import checkTokenExpiration from "../Helper/checkTokenExpire";
import { toast } from 'react-toastify';
import { logout } from "../features/authSlice"; // Import logout action

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData, { getState, rejectWithValue }) => {
    try {
      // Get the token from the Redux state
      const token = getState().auth.token;
      if (checkTokenExpiration(token)) {
        window.Storage.dispatch(logout()); 
        toast.error("Your session has expired. Please log in again.");
        return null;
      }
      // Call the taskService with taskData and token
      return await taskService.createTask(taskData, token);
    } catch (error) {
      return rejectWithValue(error.details || 'Error creating task');
    }
  }
);
export const getTasksByAssignedUser = createAsyncThunk(
  'tasks/getTasksByAssignedUser',
  async (userId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token; // Get the token from Redux state
      if (checkTokenExpiration(token)) {
        window.Storage.dispatch(logout()); 
        toast.error("Your session has expired. Please log in again.");
        return null;
      }
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
      if (checkTokenExpiration(token)) {
        window.Storage.dispatch(logout()); 
        toast.error("Your session has expired. Please log in again.");
        return null;
      }
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
export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ taskId, updatedData }, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenExpiration(token)) {
      window.Storage.dispatch(logout()); 
      toast.error("Your session has expired. Please log in again.");
      return null;
    }

    console.log("🟢 FormData before sending to service:");
    for (let pair of updatedData.entries()) {
        console.log(pair[0], pair[1]);
    }

    try {
      // return await taskService.updateTask(taskId, updatedData, token);
      const response = await taskService.updateTask(taskId, updatedData, token);
  console.log("API Response:", response); // Verify the response
  return response; 
    } catch (error) {
      console.error('Error in updateTask:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message || 'Error updating task');
    }
  }
);


// export const updateTask = createAsyncThunk(
//   'tasks/updateTask',
//   async ({ taskId, updatedData }, { getState, rejectWithValue }) => {
//     const token = getState().auth.token;
//     if (checkTokenExpiration(token)) {
//       window.Storage.dispatch(logout()); 
//       toast.error("Your session has expired. Please log in again.");
//       return null;
//     }
//     try {
//       // Prepare FormData
//       const formData = new FormData();

//       for (const key in updatedData) {
//         if (updatedData[key] && key !== 'image') {
//           if (typeof updatedData[key] === 'object' && !(updatedData[key] instanceof File)) {
//             formData.append(key, JSON.stringify(updatedData[key])); // Flatten nested objects/arrays
//           } else {
//             formData.append(key, updatedData[key]);
//           }
//         }
//       }

//       if (updatedData.image) {
//         formData.append('image', updatedData.image);
//       }
//       // Call the update service
//       return await taskService.updateTask(taskId, formData, token);
//     } catch (error) {
//       console.error('Error in updateTask:', error.response?.data || error.message);
//       return rejectWithValue(error.response?.data || error.message || 'Error updating task');
//     }
//   }
// );


// Delete Task
export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId, { getState,rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenExpiration(token)) {
      window.Storage.dispatch(logout()); 
      toast.error("Your session has expired. Please log in again.");
      return null;
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
  async (tasksData, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (checkTokenExpiration(token)) {
        window.Storage.dispatch(logout()); 
        toast.error("Your session has expired. Please log in again.");
        return null;
      }
      const results = await taskService.bulkUpdateTasks(tasksData, token);
      console.log("results",results)
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
  async (filters, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (checkTokenExpiration(token)) {
        window.Storage.dispatch(logout());
        toast.error("Your session has expired. Please log in again.");
        return null;
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
    error: null,
    currentView: 'allTasks', // Default to showing all tasks
  },
  reducers: {
    setTaskView: (state, action) => {
      state.currentView = action.payload; // Update the view (e.g., 'allTasks' or 'userTasks')
    },
    addTaskFromSocket: (state, action) => {
      console.log("addTaskFromSocket",action.payload)   
      const newTask = action.payload;
      if (!state.tasks.find(task => task._id === newTask._id)) {
        state.tasks.push(newTask);
      }
    },
    resetFilteredTasks: (state) => {
      state.filteredTasks = [];
      state.currentView = 'allTasks'; // Reset to all tasks view
    },
    // Add a reducer to handle bulk update success
    bulkUpdateTasksSuccess: (state, action) => {
      const updatedTasks = action.payload;
      const taskMap = new Map(state.tasks.map((task) => [task._id, task]));

      // Merge the updated tasks into the state
      updatedTasks.forEach((updatedTask) => {
        if (taskMap.has(updatedTask._id)) {
          taskMap.set(updatedTask._id, {
            ...taskMap.get(updatedTask._id),
            ...updatedTask,
          });
        } else {
          taskMap.set(updatedTask._id, updatedTask);
        }
      });

      state.tasks = Array.from(taskMap.values());
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createTask.pending, (state) => {
        state.status = 'loading';
      })
      
      .addCase(createTask.fulfilled, (state, action) => {
        console.log("Payload received in fulfilled case:", action.payload);
      
        state.status = 'succeeded';
      
        // Ensure action.payload is an array of messages and taskData
        const payloadArray = Array.isArray(action.payload) ? action.payload : [action.payload];
      
        payloadArray.forEach((payload) => {
         
          const task = payload?.taskData; // Extract taskData from each payload item
          if (task && task._id) { // Ensure the task is valid
            // Avoid duplicating tasks in the state
            if (!state.tasks.some((existingTask) => existingTask._id === task._id)) {
              state.tasks.push(task);
            }
          } else {
            console.error("Invalid task received in payload:", payload);
          }
        });
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
        // const results = action.payload;
        // if (Array.isArray(results)) {
        //   results.forEach((result) => {
        //     if (result.status === 'success' && result.updatedTask) {
        //       const index = state.tasks.findIndex((task) => task._id === result.updatedTask._id);
        //       if (index !== -1) {
        //         // Merge the updated fields with the existing task
        //         state.tasks[index] = {
        //           ...state.tasks[index], // Keep existing fields
        //           ...result.updatedTask, // Overwrite with updated fields
        //           start: result.updatedTask.start_time || state.tasks[index].start, // Preserve existing start if not updated
        //           end: result.updatedTask.end_time || state.tasks[index].end, // Preserve existing end if not updated
        //         };
        //       } else {
        //         // If the task doesn't exist in the state, add it
        //         state.tasks.push({
        //           ...result.updatedTask,
        //           start: result.updatedTask.start_time,
        //           end: result.updatedTask.end_time,
        //         });
        //       }
        //     }
        //   });
        // }
        state.status = 'succeeded';
      })
      .addCase(bulkUpdateTasks.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to update tasks';
      })
  },
});
export const { setTaskView,addTaskFromSocket ,resetFilteredTasks, bulkUpdateTasksSuccess} = taskSlice.actions;

export default taskSlice.reducer;
