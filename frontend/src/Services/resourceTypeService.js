import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_BASE_URL}/api/resource-types`;

const resourceTypeService = {
  createResourceType: async (resourceTypeData, token) => {
    try {
   
        const response = await axios.post(API_URL, resourceTypeData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        

        return response.data.data;

    } catch (error) {
      throw error;
    }
  },

  fetchResourceTypes: async (token) => {
    try {
     
        const response = await axios.get(API_URL, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        
        return response.data;
     
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateResourceType: async (id, updatedData, token) => {
    try {
      
        const response = await axios.put(`${API_URL}/${id}`, updatedData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        return response.data;
      
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteResourceType: async (id, token) => {
    try {
      
        await axios.delete(`${API_URL}/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return id;
      
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getArchivePreview: async (id, token) => { 
    const res = await axios.delete(`${API_URL}/${id}?confirm=false`, {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: (s) => s === 200 || s === 412 || s === 400 
    });

    if (res.status === 412) return { needConfirm: true, preview: res.data?.data };
    if (res.status === 200) return { needConfirm: false, result: res.data?.data };
    throw new Error(res.data?.message || "Failed to get preview");
  },

 
  confirmArchive: async (id, token) => {
    const res = await axios.delete(`${API_URL}/${id}?confirm=true`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data?.data;
  }
};

export default resourceTypeService;