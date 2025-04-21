import axios from 'axios';
import { localDB } from '../pouchDb';

const API_URL = `${process.env.REACT_APP_API_BASE_URL}/api/users`;

// Function to check if the app is online
const isOnline = () => navigator.onLine;

export const getAllUsers = async (token) => {
  try {
    // if (isOnline()) {
      // Fetch users from the server
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Save users to local PouchDB for offline use
      // try {
      //   await localDB.put({
      //     _id: 'users',
      //     data: response.data.data, // Adjusted to match backend response structure
      //   });
      //   console.log('Users saved to PouchDB successfully.');
      // } catch (err) {
      //   if (err.name === 'conflict') {
      //     console.log('Document conflict detected. Updating existing document...');
      //     const existingDoc = await localDB.get('users');
      //     await localDB.put({
      //       _id: 'users',
      //       _rev: existingDoc._rev,
      //       data: response.data.data,
      //     });
      //     console.log('Users updated in PouchDB successfully.');
      //   } else {
      //     console.error('Error saving users to PouchDB:', err);
      //     throw err;
      //   }
      // }

      return response.data.data;
    // } else {
    //   // Fetch users from local PouchDB if offline
    //   console.log('App is offline. Fetching users from PouchDB...');
    //   const localData = await localDB.get('users').catch((err) => {
    //     console.log('No users found in PouchDB. Returning empty array.');
    //     return { data: [] }; // Return empty array if no data exists
    //   });

    //   console.log('Fetched users from PouchDB:', localData.data);
    //   return localData.data;
    // }
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch users');
  }
};

export const getUser = async (userId, token) => {
  try {
    if (isOnline()) {
      const response = await axios.get(`${API_URL}/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } else {
      const localData = await localDB.get('users').catch(() => ({ data: [] }));
      return localData.data.find(user => user._id === userId) || null;
    }
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch user');
  }
};

export const updateUserProfile = async (userId, updateData, token) => {
  try {
    if (isOnline()) {
      const response = await axios.put(`${API_URL}/${userId}`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update local database
      const localUsers = await localDB.get('users').catch(() => ({ data: [] }));
      const updatedUsers = localUsers.data.map(user => 
        user._id === userId ? { ...user, ...updateData } : user
      );

      await localDB.put({ _id: 'users', _rev: localUsers._rev, data: updatedUsers });
      return response.data.data;
    } else {
      // Save changes locally for sync later
      await localDB.put({
        _id: `pending-update-${userId}`,
        type: 'update',
        userId,
        data: updateData,
      });
      return { message: 'User updated locally, will sync when online' };
    }
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to update user');
  }
};

export const adminUpdateUser = async (userId, updateData, token) => {
  try {
    if (isOnline()) {
      const response = await axios.put(`${API_URL}/${userId}/admin`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update local database
      const localUsers = await localDB.get('users').catch(() => ({ data: [] }));
      const updatedUsers = localUsers.data.map(user => 
        user._id === userId ? { ...user, ...updateData } : user
      );

      await localDB.put({ _id: 'users', _rev: localUsers._rev, data: updatedUsers });
      return response.data.data;
    } else {
      // Save changes locally for sync later
      await localDB.put({
        _id: `pending-admin-update-${userId}`,
        type: 'adminUpdate',
        userId,
        data: updateData,
      });
      return { message: 'Admin update saved locally, will sync when online' };
    }
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to admin update user');
  }
};

export const deleteUserAccount= async (userId, token) => {
  try {
    if (isOnline()) {
      const response = await axios.delete(`${API_URL}/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Remove user from local PouchDB
      const localUsers = await localDB.get('users').catch(() => ({ data: [] }));
      const updatedUsers = localUsers.data.filter(user => user._id !== userId);

      await localDB.put({ _id: 'users', _rev: localUsers._rev, data: updatedUsers });
      return response.data;
    } else {
      // Mark the user for deletion offline
      await localDB.put({
        _id: `pending-delete-${userId}`,
        type: 'delete',
        userId,
      });
      return { message: 'User marked for deletion, will sync when online' };
    }
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to delete user');
  }
};

export const syncOfflineChanges = async (token) => {
  if (isOnline()) {
    try {
      const pendingChanges = await localDB.allDocs({
        include_docs: true,
        startkey: 'pending-',
        endkey: 'pending-\uffff'
      });

      for (let row of pendingChanges.rows) {
        const doc = row.doc;
        try {
          if (doc.type === 'update') {
            await updateUserProfile(doc.userId, doc.data, token);
          } else if (doc.type === 'adminUpdate') {
            await adminUpdateUser(doc.userId, doc.data, token);
          } else if (doc.type === 'delete') {
            await deleteUserAccount(doc.userId, token);
          }
          await localDB.remove(doc);
        } catch (error) {
          console.error(`Failed to sync change ${doc._id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error during offline sync:', error);
    }
  }
};

// Initialize sync on app start and when coming back online
export const initSync = (token) => {
  window.addEventListener('online', () => syncOfflineChanges(token));
  syncOfflineChanges(token); // Try immediately if already online
};