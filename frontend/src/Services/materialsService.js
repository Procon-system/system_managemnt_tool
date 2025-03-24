import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_BASE_URL}/api/material`;

const materialService = {
  // Create a new material
  createMaterial: async (materialData, token) => {
    const response = await axios.post(
      `${API_URL}/create-materials`, 
      materialData,
      {
        headers: {
          Authorization: `Bearer ${token}`, // Include the token in the Authorization header
        },
      }
    );
    console.log("response",response)
    return response.data;
  },

  // Fetch all materials
  fetchMaterials: async (token) => {
    const response = await axios.get(`${API_URL}/get-all-materials`,
      {
        headers: {
          Authorization: `Bearer ${token}`, // Include the token in the Authorization header
        },
      }
    );
    return response.data;
  },

  // Update a material by ID
  updateMaterial: async (materialId, updatedData,token) => {
    const response = await axios.put(
      `${API_URL}/update-materials/${materialId}`,
      updatedData,
      {
        headers: {
          Authorization: `Bearer ${token}`, // Include the token in the Authorization header
        },
      }
    );
    return response.data;
  },

  // Delete a material by ID
  deleteMaterial: async (materialId,token) => {
    const response = await axios.delete(`${API_URL}/delete-materials/${materialId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`, // Include the token in the Authorization header
        },
      }
    );
    console.log("response",response)
    return response.data;
  },
};

export default materialService;
