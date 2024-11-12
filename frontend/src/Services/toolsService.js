// src/services/toolService.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/tools';

const toolService = {
  createTool: async (toolData, token) => {
    console.log("datnnna",toolData);
    const response = await axios.post(
      `${API_URL}/create-tools`, 
      toolData ,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },
  fetchTools: async () => {
    const response = await axios.get(`${API_URL}/get-all-tools`);
    return response.data;
  },
  updateTool: async (toolId, updatedData) => {
    const response = await axios.put(`${API_URL}/update-tools/${toolId}`, updatedData);
    return response.data;
  },
  deleteTool: async (toolId) => {
    const response = await axios.delete(`${API_URL}/delete-tools/${toolId}`);
    return response.data;
  },
};

export default toolService;
