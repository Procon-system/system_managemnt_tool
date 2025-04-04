import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_BASE_URL}/api/machine`;

const machineService = {
  // Create a new machine
  createMachine: async (machineData, token) => {
    console.log("machineData",machineData)
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
  fetchMachines: async (token) => {
    const response = await axios.get(`${API_URL}/get-all-machines`,
      {
        headers: {
          Authorization: `Bearer ${token}`, // Include the token in the Authorization header
        },
      }
    );
    return response.data;
  },

  // Update a machine by ID
  updateMachine: async (machineId, updatedData,token) => {
    const response = await axios.put(
      `${API_URL}/update-machines/${machineId}`,
      updatedData,
      {
        headers: {
          Authorization: `Bearer ${token}`, // Include the token in the Authorization header
        },
      }
    );
    return response.data;
  },

  // Delete a machine by ID
  deleteMachine: async (machineId,token) => {
    const response = await axios.delete(`${API_URL}/delete-machines/${machineId}`,
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

export default machineService;
