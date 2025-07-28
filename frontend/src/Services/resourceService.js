import axios from 'axios';


const API_URL = `${process.env.REACT_APP_API_BASE_URL}/api/resources`;

const resourceService = {
  createResource: async (resourceData, token) => {
    try {
     
        const response = await axios.post(API_URL, resourceData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        return response.data;
     
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getResourcesByType: async (typeId, token) => {
    try {
     
        const response = await axios.get(`${API_URL}/type/${typeId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
      
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getAvailableResources: async ({ typeId, startTime, endTime }, token) => {
    try {
      const response = await axios.get(`${API_URL}/available/${typeId}`, {
        params: { startTime, endTime }, // Pass times as query parameters
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  checkRecurringAvailability: async (checkData, token) => {
    try {
      // Use the correct endpoint you defined in your Express routes
      const response = await axios.post(`${API_URL}/check-availability`, checkData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data; // This will be { success, available, conflicts, message }
    } catch (error) {
      // Re-throw the error so the thunk can catch it and reject the promise
      throw error.response?.data || { message: 'Network error checking availability.' };
    }
  },
  getResourceById: async (id, token) => {
    try {
      
        const response = await axios.get(`${API_URL}/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
      
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateResource: async (id, updatedData, token) => {
    try {
      
        const response = await axios.put(`${API_URL}/${id}`, updatedData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        return response.data;
     
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteResource: async (id, token) => {
    try {
        await axios.delete(`${API_URL}/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return id;
     
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  
};

export default resourceService;