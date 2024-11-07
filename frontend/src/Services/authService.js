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
   try{
     const response = await axios.post(`${API_URL}/login`, credentials);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
        throw new Error(error.response.data.error || 'Error during email confirmation');
    }
    throw new Error('Network error or server unavailable');
}
  };
export const forgotPassword = async (emailData) => {
   try{
    const response = await axios.post(`${API_URL}/forgot-password`, emailData);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
        throw new Error(error.response.data.error || 'Error during email confirmation');
    }
    throw new Error('Network error or server unavailable');
}
 };
  
export const resetPassword = async (id,token, passwordData) => {
  try{
    const response = await axios.post(`${API_URL}/reset-password/${id}/${token}`, passwordData);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
        throw new Error(error.response.data.error || 'Error during email confirmation');
    }
    throw new Error('Network error or server unavailable');
}
 };
 export const confirmEmail = async (confirmationCode) => {
  try {
    const response = await axios.post(`${API_URL}/confirm-email/${confirmationCode}`);
    return response.data; // Return the data from the response
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Error confirming email');
  }
};
export const logoutUser = async () => {
  await axios.post(`${API_URL}/logout`); // Assuming you have a logout endpoint
};
