import axios from 'axios';

const API_URL = 'http://localhost:5000/api/users'; // Adjust based on your API setup

// Fetch all users
export const getAllUsers = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/get-users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("respose data",response.data)
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.error || 'Error fetching users');
    }
    throw new Error('Network error or server unavailable');
  }
};

// Update user profile
export const updateUserProfile = async (id, updateData, token) => {
  try {
    console.log("nnn1",updateData);
    const response = await axios.put(`${API_URL}/update-profile/${id}`, updateData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.error || 'Error updating profile');
    }
    throw new Error('Network error or server unavailable');
  }
};

// Delete user account
export const deleteUserAccount = async (id, token) => {
  try {
    const response = await axios.delete(`${API_URL}/delete-account/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.error || 'Error deleting account');
    }
    throw new Error('Network error or server unavailable');
  }
};
