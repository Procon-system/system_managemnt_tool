// src/services/authService.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth'; // Adjust based on your API setup

export const registerUser = async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/register`, userData);
      return response.data; // Return the `data` directly
    } catch (error) {
      // Return a default object if there's an error
      if (error.response && error.response.data) {
        throw new Error(error.response.data.error || 'Error during registration');
      }
      throw new Error('Network error or server unavailable');
    }
  };

export const loginUser = async (credentials) => {
    const response = await axios.post(`${API_URL}/login`, credentials);
    return response.data;
  };

export const logoutUser = async () => {
  await axios.post(`${API_URL}/logout`); // Assuming you have a logout endpoint
};
