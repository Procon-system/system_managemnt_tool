// src/services/taskService.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/tasks';

const taskService = {
  // Create a new task
  createTask: async (taskData) => {
    const response = await axios.post(`${API_URL}/create-tasks`, {taskData});
    return response.data;
  },

  // Fetch all tasks
  fetchTasks: async () => {
    const response = await axios.get(`${API_URL}/get-all-tasks`);
    return response.data;
  },

  // Update a task by ID
  updateTask: async (taskId, updatedData) => {
    console.log("updatedsclice",updatedData)
    const response = await axios.put(`${API_URL}/update-tasks/${taskId}`, updatedData);
    return response.data;
  },

  // Delete a task by ID
  deleteTask: async (taskId) => {
    const response = await axios.delete(`${API_URL}/delete-tasks/${taskId}`);
    return response.data;
  },
};

export default taskService;
