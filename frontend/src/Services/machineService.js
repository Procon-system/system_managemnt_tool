import axios from 'axios';

const API_URL = 'http://localhost:5000/api/machine';

const machineService = {
  // Create a new machine
  createMachine: async (machineData, token) => {
    const response = await axios.post(
      `${API_URL}/create-machines`, 
      machineData,
      {
        headers: {
          Authorization: `Bearer ${token}`, // Include the token in the Authorization header
        },
      }
    );
    return response.data;
  },

  // Fetch all machines
  fetchMachines: async () => {
    const response = await axios.get(`${API_URL}/get-all-machines`);
    return response.data;
  },

  // Update a machine by ID
  updateMachine: async (machineId, updatedData) => {
    const response = await axios.put(
      `${API_URL}/update-machines/${machineId}`,
      updatedData
    );
    return response.data;
  },

  // Delete a machine by ID
  deleteMachine: async (machineId) => {
    const response = await axios.delete(`${API_URL}/delete-machines/${machineId}`);
    return response.data;
  },
};

export default machineService;
