// // src/services/authService.js
// import axios from 'axios';
// // import store from '../Store/store';
// const API_URL = 'http://localhost:5000/api/auth'; // Adjust based on your API setup

// export const registerUser = async (userData) => {
//     try {
//       // const token = store.getState().auth.token;
//       const response = await axios.post(`${API_URL}/register`, 
//         userData,
//         // {
//         //   headers: {
//         //     Authorization: `Bearer ${token}`, // Include the token in the Authorization header
//         //   },
//         // },
//         );
//       return response.data; // Return the `data` directly
//     } catch (error) {
//       // Return a default object if there's an error
//       if (error.response && error.response.data) {
//         throw new Error(error.response.data.error || 'Error during registration');
//       }
//       throw new Error('Network error or server unavailable');
//     }
//   };

// export const loginUser = async (credentials) => {
//    try{
//      const response = await axios.post(`${API_URL}/login`, credentials);
//     return response.data;
//   } catch (error) {
//     // Check if the error is an HTTP response error
//     if (error.response && error.response.data) {
//       throw new Error(error.response.data.message || 'Login failed');
//     }
//     // Handle network or server issues
//     throw new Error('Network error or server unavailable');
//   }
//   };
// export const forgotPassword = async (emailData) => {
//    try{
//     const response = await axios.post(`${API_URL}/forgot-password`, emailData);
//     return response.data;
//   } catch (error) {
//     if (error.response && error.response.data) {
//         throw new Error(error.response.data.error || 'Error during email confirmation');
//     }
//     throw new Error('Network error or server unavailable');
// }
//  };
  
// export const resetPassword = async (id,token, passwordData) => {
//   try{
//     const response = await axios.post(`${API_URL}/reset-password/${id}/${token}`, passwordData);
//     return response.data;
//   } catch (error) {
//     if (error.response && error.response.data) {
//         throw new Error(error.response.data.error || 'Error during email confirmation');
//     }
//     throw new Error('Network error or server unavailable');
// }
//  };
//  export const confirmEmail = async (confirmationCode) => {
//   try {
//     const response = await axios.post(`${API_URL}/confirm-email/${confirmationCode}`);
//     return response.data; // Return the data from the response
//   } catch (error) {
//     throw new Error(error.response?.data?.error || 'Error confirming email');
//   }
// };
// export const logoutUser = async () => {
//   await axios.post(`${API_URL}/logout`); // Assuming you have a logout endpoint
// };
import axios from 'axios';
import { localDB } from '../pouchDb';
import CryptoJS from 'crypto-js';
import { saveOfflineRequest } from './offlineService';

const API_URL = 'http://localhost:5000/api/auth';
const SECRET_KEY = 'your-secret-key'; // Use environment variables for production

// Helper function to check online status
const isOnline = () => {
  const onlineStatus = navigator.onLine;
  console.log('Is online:', onlineStatus); // Log the online status
  return onlineStatus;
};

// Encrypt data before storing in PouchDB
const encryptData = (data) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
};

// Decrypt data from PouchDB
const decryptData = (ciphertext) => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    console.error('Error decrypting data:', error);
    return null;
  }
};

// Store user session in PouchDB
export const saveUserSession = async (userData) => {
  try {
    const encryptedUser = encryptData(userData);

    // Try to fetch the existing document
    let existingDoc;
    try {
      existingDoc = await localDB.get('user_session');
    } catch (error) {
      // If the document doesn't exist, create a new one
      if (error.name === 'not_found') {
        await localDB.put({ _id: 'user_session', encryptedData: encryptedUser });
        console.log('User session saved:', userData); // Log the saved session
        return;
      }
      throw error; // Re-throw other errors
    }

    // If the document exists, update it with the new data
    await localDB.put({
      _id: 'user_session',
      _rev: existingDoc._rev, // Include the revision to avoid conflicts
      encryptedData: encryptedUser,
    });
    console.log('User session updated:', userData); // Log the updated session
  } catch (error) {
    console.error('Error saving session:', error);
  }
};

// Retrieve user session from PouchDB
export const getUserSession = async () => {
  try {
    const session = await localDB.get('user_session');
    const decryptedData = decryptData(session.encryptedData);
    console.log('Retrieved session:', decryptedData); // Log the retrieved session
    return decryptedData;
  } catch (error) {
    console.log('No stored session found.');
    return null;
  }
};

// Delete user session from PouchDB
export const removeUserSession = async () => {
  try {
    const session = await localDB.get('user_session');
    await localDB.remove(session);
    console.log('User session removed.');
  } catch (error) {
    console.log('No session to remove.');
  }
};

// **Register User**
export const registerUser = async (userData) => {
  const request = { method: 'post', url: `${API_URL}/register`, data: userData };

  if (!isOnline()) {
    await saveOfflineRequest(request);
    throw new Error('You are offline. Registration will be processed when online.');
  }

  try {
    const response = await axios(request);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Error during registration');
  }
};

export const loginUser = async (credentials) => {
  const request = {
    method: 'post',
    url: `${API_URL}/login`,
    data: credentials,
    headers: { 'Content-Type': 'application/json' },
  };

  if (!isOnline()) {
    console.log('App is offline. Checking stored session...');
    const cachedUser = await getUserSession();
    console.log('Cached user:', cachedUser); // Log the cached user
    console.log('Login credentials:', credentials); // Log the login credentials

    if (cachedUser && cachedUser.user && cachedUser.user.email === credentials.email) {
      console.log('Using cached session:', cachedUser); // Log the cached session
      return cachedUser; // Allow offline access
    }
    throw new Error('You are offline and have no stored session.');
  }

  try {
    const response = await axios(request);
    await saveUserSession(response.data);
    console.log('Login successful. Session saved:', response.data); // Log the saved session
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};
// **Logout User**
export const logoutUser = async () => {
  await removeUserSession();
};

// **Forgot Password**
export const forgotPassword = async (emailData) => {
  const request = { method: 'post', url: `${API_URL}/forgot-password`, data: emailData };

  if (!isOnline()) {
    await saveOfflineRequest(request);
    throw new Error('You are offline. Request will be processed when online.');
  }

  try {
    const response = await axios(request);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Error during email confirmation');
  }
};

// **Reset Password**
export const resetPassword = async (id, token, passwordData) => {
  const request = { method: 'post', url: `${API_URL}/reset-password/${id}/${token}`, data: passwordData };

  if (!isOnline()) {
    await saveOfflineRequest(request);
    throw new Error('You are offline. Request will be processed when online.');
  }

  try {
    const response = await axios(request);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Error during password reset');
  }
};

// **Confirm Email**
export const confirmEmail = async (confirmationCode) => {
  const request = { method: 'post', url: `${API_URL}/confirm-email/${confirmationCode}` };

  if (!isOnline()) {
    await saveOfflineRequest(request);
    throw new Error('You are offline. Request will be processed when online.');
  }

  try {
    const response = await axios(request);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Error confirming email');
  }
};

// **Check if User is Authenticated**
export const isAuthenticated = async () => {
  return (await getUserSession()) !== null;
};
