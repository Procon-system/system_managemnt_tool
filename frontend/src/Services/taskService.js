// src/services/taskService.js
import axios from 'axios';
const API_URL = 'http://localhost:5000/api/tasks';
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
      console.log("response",response.data.taskData)
  return response.data.taskData;
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
 
    try {
      const response = await axios.put(
        `${API_URL}/update-tasks/${taskId}`,
        updatedData, // Send FormData with the updated data
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data.task; // Return the updated task data
    } catch (error) {
      console.error('Error updating task:', error.response?.data || error.message);
      throw error.response?.data || error.message || new Error('Error updating task');
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
};



export default taskService;
