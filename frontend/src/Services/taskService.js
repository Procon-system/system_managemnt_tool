// src/services/taskService.js
import axios from 'axios';
const API_URL = `${process.env.REACT_APP_API_BASE_URL}/api/tasks`;
const taskService = {
  createTask: async (taskData, token) => {
    try {
      const isFormData = taskData instanceof FormData;
  
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        },
      };
  
      const response = await axios.post(
        `${API_URL}/create-tasks`,
        isFormData ? taskData : { taskData },
        config
      );
      console.log("response",response.data.results)
  return response.data.results;
    } catch (error) {
      console.error('Error creating task:', error.response?.data || error.message);
      throw error || new Error('Error creating task');
    }
  },
  // Fetch all tasks
  fetchTasks: async () => {
    try {
      const response = await axios.get(`${API_URL}/get-all-tasks`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tasks:', error.response?.data || error.message);
      throw error.response?.data || new Error('Error fetching tasks');
    }
  },


updateTask: async (taskId, updatedData, token) => {
  console.log("UpdatedData before sending:", updatedData);

  try {
    const response = await axios.put(`${API_URL}/update-tasks/${taskId}`, updatedData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.task;
  } catch (error) {
    console.error("Error updating task:", error.response?.data || error.message);
    throw error.response?.data || error.message || new Error("Error updating task");
  }
},

  
  // Delete a task by ID
  deleteTask: async (taskId, token) => {
    try {
      console.log("taskId, token",taskId, token);
      const response = await axios.delete(
        `${API_URL}/delete-tasks/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`, // Include the token in the Authorization header
          },
        }
      );
      console.log("response del", response);
      return response.data;
    } catch (error) {
      console.error('Error deleting task:', error.response?.data || error.message);
      throw error.response?.data || new Error('Error deleting task');
    }
  },
  getTasksByAssignedUser: async (userId, token) => {
    try {
      const response = await axios.get(
        `${API_URL}/get-tasks/assigned`, 
        {
          params: { userId }, // Pass userId as a query parameter
          headers: {
            Authorization: `Bearer ${token}`, // Include the token in the Authorization header
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching tasks:', error.response?.data || error.message);
      throw error.response?.data || new Error('Error fetching tasks');
    }
  },
  getTasksDoneByAssignedUser: async (userId, token) => {
    try {
      const response = await axios.get(
        `${API_URL}/get-tasks/done/user`, 
        {
          params: { userId }, // Pass userId as a query parameter
          headers: {
            Authorization: `Bearer ${token}`, // Include the token in the Authorization header
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching tasks:', error.response?.data || error.message);
      throw error.response?.data || new Error('Error fetching tasks');
    }
  },
  getAllDoneTasks: async (token) => {
    try {
      const response = await axios.get(
        `${API_URL}/get-tasks/done`,
        {
          headers: {
            Authorization: `Bearer ${token}`, // Include the token in the Authorization header
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting task:', error.response?.data || error.message);
      throw error.response?.data || new Error('Error deleting task');
    }
  },
  bulkUpdateTasks: async (tasksData, token) => {
    console.log("tasksData comes",tasksData)  
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        },
      };
      
      // Format the data to match backend expectations
      const taskUpdates = tasksData.map(task => ({
        id: task._id,
        updateData: {
          start_time: task.start_time,
          end_time: task.end_time,
          color: task.color,
          title: task.title,
          updated_at: new Date().toISOString()
        }
      }));

      const response = await axios.put(
        `${API_URL}/bulk-update`,
        { taskUpdates },
        config
      );
      console.log("response",response.data)
      return response.data.results // Return the updated tasks data
    } catch (error) {
      console.log("error service",error)
      console.error('Error updating tasks:', error.response?.data || error.message);
      throw error.response?.data || error.message || new Error('Error updating tasks');
    }
  },
 filterTasks: async (filters) => {
    try {
      const response = await axios.get(`${API_URL}/filter`, { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error filtering tasks:', error.response?.data || error.message);
      throw error.response?.data || new Error('Error filtering tasks');
    }
  },
};



export default taskService;
