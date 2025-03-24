
import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_BASE_URL}/api/tools`;

const toolService = {
  // Create a new tool
  createTool: async (toolData, token) => {
    try {
      console.log("Creating tool with data:", toolData);
      const response = await axios.post(
        `${API_URL}/create-tools`,
        toolData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating tool:', error.response?.data || error.message);
      throw error.response?.data || new Error('Error creating tool');
    }
  },

  // Fetch all tools
  fetchTools: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/get-all-tools`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching tools:', error.response?.data || error.message);
      throw error.response?.data || new Error('Error fetching tools');
    }
  },

  // Update a tool by ID
  updateTool: async (toolId, updatedData, token) => {
    try {
      const response = await axios.put(
        `${API_URL}/update-tools/${toolId}`,
        updatedData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating tool:', error.response?.data || error.message);
      throw error.response?.data || new Error('Error updating tool');
    }
  },

  // Delete a tool by ID
  deleteTool: async (toolId, token) => {
    try {
      const response = await axios.delete(
        `${API_URL}/delete-tools/${toolId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting tool:', error.response?.data || error.message);
      throw error.response?.data || new Error('Error deleting tool');
    }
  },
};

export default toolService;
