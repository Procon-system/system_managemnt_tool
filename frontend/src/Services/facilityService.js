import axios from 'axios';

const API_URL = 'http://localhost:5000/api/facility';

const facilityService = {
  // Create a new facility
  createFacility: async (facilityData, token) => {
    const response = await axios.post(
      `${API_URL}/create-facility`, 
      facilityData,
      {
        headers: {
          Authorization: `Bearer ${token}`, // Include the token in the Authorization header
        },
      }
    );
    return response.data;
  },

  // Fetch all facilities
  fetchFacilities: async () => {
    const response = await axios.get(`${API_URL}/get-all-facility`);
    return response.data;
  },

  // Update a facility by ID
  updateFacility: async (facilityId, updatedData) => {
    const response = await axios.put(
      `${API_URL}/update-facility/${facilityId}`,
      updatedData
    );
    return response.data;
  },

  // Delete a facility by ID
  deleteFacility: async (facilityId) => {
    const response = await axios.delete(`${API_URL}/delete-facility/${facilityId}`);
    return response.data;
  },
};

export default facilityService;
