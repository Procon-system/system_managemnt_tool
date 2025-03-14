// import axios from 'axios';

// const API_URL = 'http://localhost:5000/api/users'; // Adjust based on your API setup

// // Fetch all users
// export const getAllUsers = async (token) => {
//   try {
//     const response = await axios.get(`${API_URL}/get-users`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       console.log("respose data",response.data)
//     return response.data;
//   } catch (error) {
//     if (error.response && error.response.data) {
//       throw new Error(error.response.data.error || 'Error fetching users');
//     }
//     throw new Error('Network error or server unavailable');
//   }
// };

// // Fetch users by IDs
// export const getUsersByIds = async (userIds, token) => {
//   try {
//     const response = await axios.post(`${API_URL}/get-users-by-ids`, { userIds }, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return response.data;
//   } catch (error) {
//     if (error.response && error.response.data) {
//       throw new Error(error.response.data.error || 'Error fetching users by IDs');
//     }
//     throw new Error('Network error or server unavailable');
//   }
// };
// // Update user profile
// export const updateUserProfile = async (id, updateData, token) => {
//   try {
//     console.log("nnn1",updateData);
//     const response = await axios.put(`${API_URL}/update-profile/${id}`, updateData, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return response.data;
//   } catch (error) {
//     if (error.response && error.response.data) {
//       throw new Error(error.response.data.error || 'Error updating profile');
//     }
//     throw new Error('Network error or server unavailable');
//   }
// };

// // Delete user account
// export const deleteUserAccount = async (id, token) => {
//   try {
//     const response = await axios.delete(`${API_URL}/delete-account/${id}`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return response.data;
//   } catch (error) {
//     if (error.response && error.response.data) {
//       throw new Error(error.response.data.error || 'Error deleting account');
//     }
//     throw new Error('Network error or server unavailable');
//   }
// };
import axios from 'axios';
import { localDB } from '../pouchDb';

const API_URL = 'http://localhost:5000/api/users'; // Adjust based on your API setup


// Function to check if the app is online
const isOnline = () => navigator.onLine;

export const getAllUsers = async (token) => {
 
  try {
    if (isOnline()) {
    
      // Fetch users from the server
      const response = await axios.get(`${API_URL}/get-users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('Fetched users from server:', response.data);

      // Save users to local PouchDB for offline use
      try {
        await localDB.put({
          _id: 'users',
          data: response.data,
        });
        console.log('Users saved to PouchDB successfully.');
      } catch (err) {
        if (err.name === 'conflict') {
          console.log('Document conflict detected. Updating existing document...');
          const existingDoc = await localDB.get('users');
          await localDB.put({
            _id: 'users',
            _rev: existingDoc._rev,
            data: response.data,
          });
          console.log('Users updated in PouchDB successfully.');
        } else {
          console.error('Error saving users to PouchDB:', err);
          throw err;
        }
      }

      return response.data;
    } else {
      // Fetch users from local PouchDB if offline
      console.log('App is offline. Fetching users from PouchDB...');
      const localData = await localDB.get('users').catch((err) => {
        console.log('No users found in PouchDB. Returning empty array.');
        return { data: [] }; // Return empty array if no data exists
      });

      console.log('Fetched users from PouchDB:', localData.data);
      return localData.data;
    }
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw new Error('Failed to fetch users');
  }
};
// **Fetch Users by IDs with Offline Support**
export const getUsersByIds = async (userIds, token) => {
  try {
    if (isOnline()) {
      const response = await axios.post(`${API_URL}/get-users-by-ids`, { userIds }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } else {
      // Fetch users locally (basic filtering)
      const localData = await localDB.get('users').catch(() => ({ data: [] }));
      return localData.data.filter(user => userIds.includes(user.id));
    }
  } catch (error) {
    throw new Error('Failed to fetch users by IDs');
  }
};

// **Update User Profile (Offline Sync)**
export const updateUserProfile = async (id, updateData, token) => {
  try {
    if (isOnline()) {
      const response = await axios.put(`${API_URL}/update-profile/${id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update local database
      const localUsers = await localDB.get('users').catch(() => ({ data: [] }));
      const updatedUsers = localUsers.data.map(user => (user.id === id ? { ...user, ...updateData } : user));

      await localDB.put({ _id: 'users', _rev: localUsers._rev, data: updatedUsers });
      return response.data;
    } else {
      // Save changes locally for sync later
      await localDB.put({
        _id: `pending-update-${id}`,
        type: 'update',
        data: updateData,
      });
      return { message: 'User profile updated locally, will sync when online' };
    }
  } catch (error) {
    throw new Error('Failed to update user profile');
  }
};

// **Delete User Account (Offline Sync)**
export const deleteUserAccount = async (id, token) => {
  try {
    if (isOnline()) {
      const response = await axios.delete(`${API_URL}/delete-account/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Remove user from local PouchDB
      const localUsers = await localDB.get('users').catch(() => ({ data: [] }));
      const updatedUsers = localUsers.data.filter(user => user.id !== id);

      await localDB.put({ _id: 'users', _rev: localUsers._rev, data: updatedUsers });
      return response.data;
    } else {
      // Mark the user for deletion offline
      await localDB.put({
        _id: `pending-delete-${id}`,
        type: 'delete',
        userId: id,
      });
      return { message: 'User marked for deletion, will sync when online' };
    }
  } catch (error) {
    throw new Error('Failed to delete user');
  }
};

// **Sync Local Changes to Server When Online**
export const syncOfflineChanges = async (token) => {
  if (isOnline()) {
    try {
      const pendingUpdates = await localDB.allDocs({ include_docs: true });
      for (let doc of pendingUpdates.rows) {
        if (doc.doc.type === 'update') {
          await updateUserProfile(doc.doc._id.replace('pending-update-', ''), doc.doc.data, token);
          await localDB.remove(doc.doc);
        } else if (doc.doc.type === 'delete') {
          await deleteUserAccount(doc.doc.userId, token);
          await localDB.remove(doc.doc);
        }
      }
    } catch (error) {
      console.error('Error syncing offline data:', error);
    }
  }
};

// **Listen for online status and sync changes**
window.addEventListener('online', () => {
  console.log('Back online, syncing data...');
  syncOfflineChanges();
});
// import axios from 'axios';
// import { localDB } from '../pouchDb';
// import { v4 as uuidv4 } from 'uuid';
// const API_URL = 'http://localhost:5000/api/users'; // Adjust based on your API setup

// // Function to check if the app is online
// const isOnline = () => navigator.onLine;

// // **Fetch All Users**
// export const getAllUsers = async (token) => {
//   try {
//     let users;

//     if (isOnline()) {
//       // Online: Fetch users from the server
//       const response = await axios.get(`${API_URL}/get-users`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       users = response.data;

//       console.log('Fetched users from server:', users);

//       // Save users to local PouchDB for offline use
//       try {
//         // Fetch the existing document (if it exists)
//         const existingDoc = await localDB.get('users').catch(() => null);

//         // Prepare the document to save
//         const docToSave = {
//           _id: 'users',
//           data: users.map((user) => ({ ...user, synced: true, isNew: false })), // Mark all users as synced
//         };

//         // If the document exists, include its _rev
//         if (existingDoc) {
//           docToSave._rev = existingDoc._rev;
//         }

//         // Save or update the document
//         await localDB.put(docToSave);
//         console.log('Users saved to PouchDB successfully.');
//       } catch (err) {
//         if (err.name === 'conflict') {
//           console.log('Document conflict detected. Retrying...');
//           // Fetch the latest revision and retry
//           const latestDoc = await localDB.get('users');
//           await localDB.put({
//             _id: 'users',
//             _rev: latestDoc._rev,
//             data: users.map((user) => ({ ...user, synced: true, isNew: false })), // Mark all users as synced
//           });
//           console.log('Users updated in PouchDB successfully.');
//         } else {
//           console.error('Error saving users to PouchDB:', err);
//           throw err;
//         }
//       }

//       return users;
//     } else {
//       // Offline: Fetch users from local PouchDB
//       console.log('App is offline. Fetching users from PouchDB...');
//       const localData = await localDB.get('users').catch((err) => {
//         console.log('No users found in PouchDB. Returning empty array.');
//         return { data: [] }; // Return empty array if no data exists
//       });

//       console.log('Fetched users from PouchDB:', localData.data);
//       return localData.data;
//     }
//   } catch (error) {
//     console.error('Failed to fetch users:', error);
//     throw new Error('Failed to fetch users');
//   }
// };

// // **Fetch Users by IDs**
// export const getUsersByIds = async (userIds, token) => {
//   try {
//     if (isOnline()) {
//       // Online: Fetch users by IDs from the server
//       const response = await axios.post(`${API_URL}/get-users-by-ids`, { userIds }, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       return response.data;
//     } else {
//       // Offline: Fetch users locally
//       const localData = await localDB.get('users').catch(() => ({ data: [] }));
//       return localData.data.filter((user) => userIds.includes(user.id));
//     }
//   } catch (error) {
//     console.error('Failed to fetch users by IDs:', error);
//     throw new Error('Failed to fetch users by IDs');
//   }
// };

// // **Create User**
// export const createUser = async (userData, token) => {
//   try {
//     if (isOnline()) {
//       // Online: Create user on the server
//       const response = await axios.post(`${API_URL}/create-user`, userData, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       // Sync the created user with the local database
//       const createdUser = response.data;

//       // Fetch the existing users document
//       const existingDoc = await localDB.get('users').catch(() => null);

//       if (existingDoc) {
//         // Add the new user to the data array
//         const updatedUsers = [...existingDoc.data, { ...createdUser, synced: true, isNew: false }];

//         // Update the document with the new users array
//         await localDB.put({
//           _id: 'users',
//           _rev: existingDoc._rev,
//           data: updatedUsers,
//         });

//         console.log('User added to localDB:', createdUser);
//       } else {
//         // Create a new users document if it doesn't exist
//         await localDB.put({
//           _id: 'users',
//           data: [{ ...createdUser, synced: true, isNew: false }],
//         });

//         console.log('New users document created in localDB:', createdUser);
//       }

//       return createdUser;
//     } else {
//       // Offline: Store user locally
//       const userId = `user:${uuidv4()}`; // Generate a user:<UUID> _id
//       const newUser = {
//         _id: userId,
//         type: 'user',
//         ...userData,
//         synced: false, // Mark as unsynced
//         isNew: true, // Mark as new user
//       };

//       // Fetch the existing users document
//       const existingDoc = await localDB.get('users').catch(() => null);

//       if (existingDoc) {
//         // Add the new user to the data array
//         const updatedUsers = [...existingDoc.data, newUser];

//         // Update the document with the new users array
//         await localDB.put({
//           _id: 'users',
//           _rev: existingDoc._rev,
//           data: updatedUsers,
//         });

//         console.log('User saved locally:', newUser);
//       } else {
//         // Create a new users document if it doesn't exist
//         await localDB.put({
//           _id: 'users',
//           data: [newUser],
//         });

//         console.log('New users document created in localDB:', newUser);
//       }

//       return newUser;
//     }
//   } catch (error) {
//     console.error('Error creating user:', error.response?.data || error.message);
//     throw error || new Error('Error creating user');
//   }
// };

// // **Update User**
// export const updateUser = async (userId, updatedData, token) => {
//   try {
//     if (isOnline()) {
//       // Online: Update user on the server
//       const response = await axios.put(`${API_URL}/update-user/${userId}`, updatedData, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       // Sync the updated user with the local database
//       const updatedUser = response.data;

//       // Fetch the existing users document
//       const existingDoc = await localDB.get('users').catch(() => null);

//       if (existingDoc) {
//         // Find the user to update in the data array
//         const updatedUsers = existingDoc.data.map((user) =>
//           user._id === userId ? { ...user, ...updatedUser, synced: true, isNew: false } : user
//         );

//         // Update the document with the new users array
//         await localDB.put({
//           _id: 'users',
//           _rev: existingDoc._rev,
//           data: updatedUsers,
//         });

//         console.log('User updated in localDB:', updatedUser);
//       } else {
//         console.error('Users document not found in localDB.');
//         throw new Error('Users document not found in local database');
//       }

//       return updatedUser;
//     } else {
//       // Offline: Update user locally
//       const existingDoc = await localDB.get('users').catch(() => null);

//       if (existingDoc) {
//         // Find the user to update in the data array
//         const updatedUsers = existingDoc.data.map((user) =>
//           user._id === userId ? { ...user, ...updatedData, synced: false, isNew: false } : user
//         );

//         // Update the document with the new users array
//         await localDB.put({
//           _id: 'users',
//           _rev: existingDoc._rev,
//           data: updatedUsers,
//         });

//         console.log('User updated in localDB (offline):', userId);
//         return updatedData;
//       } else {
//         console.error('Users document not found in localDB.');
//         throw new Error('Users document not found in local database');
//       }
//     }
//   } catch (error) {
//     console.error('Error updating user:', error.response?.data || error.message);
//     throw error.response?.data || new Error('Error updating user');
//   }
// };

// // **Delete User**
// export const deleteUser = async (userId, token) => {
//   try {
//     if (isOnline()) {
//       // Online: Delete user from the server
//       const response = await axios.delete(`${API_URL}/delete-user/${userId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       // Fetch the existing users document
//       const existingDoc = await localDB.get('users').catch(() => null);

//       if (existingDoc) {
//         // Remove the deleted user from the data array
//         const updatedUsers = existingDoc.data.filter((user) => user._id !== userId);

//         // Update the document with the new users array
//         await localDB.put({
//           _id: 'users',
//           _rev: existingDoc._rev,
//           data: updatedUsers,
//         });

//         console.log('User deleted from localDB:', userId);
//       } else {
//         console.error('Users document not found in localDB.');
//         throw new Error('Users document not found in local database');
//       }

//       return response.data;
//     } else {
//       // Offline: Mark user as deleted locally
//       const existingDoc = await localDB.get('users').catch(() => null);

//       if (existingDoc) {
//         // Mark the user as deleted in the data array
//         const updatedUsers = existingDoc.data.map((user) =>
//           user._id === userId ? { ...user, _deleted: true, synced: false } : user
//         );

//         // Update the document with the new users array
//         await localDB.put({
//           _id: 'users',
//           _rev: existingDoc._rev,
//           data: updatedUsers,
//         });

//         console.log('User marked for deletion in localDB:', userId);
//         return { message: 'User marked for deletion, will sync when online' };
//       } else {
//         console.error('Users document not found in localDB.');
//         throw new Error('Users document not found in local database');
//       }
//     }
//   } catch (error) {
//     console.error('Error deleting user:', error.response?.data || error.message);
//     throw error.response?.data || new Error('Error deleting user');
//   }
// };

// // **Sync Local Changes**
// export const syncLocalChanges = async (token) => {
//   try {
//     console.log('Starting sync process for users...');

//     if (isOnline()) {
//       // Fetch the users document from the local database
//       const usersDoc = await localDB.get('users').catch(() => null);

//       if (usersDoc) {
//         // Extract the users array from the document
//         const users = usersDoc.data;
//         console.log('Users in localDB:', users);

//         // Filter for unsynced users
//         const unsyncedUsers = users.filter((user) => !user.synced);
//         console.log('Unsynced users:', unsyncedUsers);

//         // Process each unsynced user
//         for (const user of unsyncedUsers) {
//           try {
//             if (user._deleted) {
//               // Sync deleted users
//               console.log('Syncing deleted user:', user._id);
//               await axios.delete(`${API_URL}/delete-user/${user._id}`, {
//                 headers: { Authorization: `Bearer ${token}` },
//               });

//               // Remove the deleted user from the local database
//               const updatedUsers = users.filter((u) => u._id !== user._id);

//               // Fetch the latest revision to avoid conflicts
//               const latestDoc = await localDB.get('users');
//               await localDB.put({
//                 _id: 'users',
//                 _rev: latestDoc._rev,
//                 data: updatedUsers,
//               });

//               console.log('Deleted user synced and removed from localDB.');
//             } else if (user.isNew) {
//               // Sync newly created users
//               console.log('Syncing new user:', user._id);
//               const { _id, isNew, ...userData } = user;

//               // Create the user on the server
//               const response = await axios.post(`${API_URL}/create-user`, userData, {
//                 headers: { Authorization: `Bearer ${token}` },
//               });

//               // Replace the temporary user with the one returned by the server
//               const updatedUsers = users
//                 .filter((u) => u._id !== user._id) // Remove the temporary user
//                 .concat({ ...response.data, synced: true, isNew: false }); // Add the synced user

//               // Fetch the latest revision to avoid conflicts
//               const latestDoc = await localDB.get('users');
//               await localDB.put({
//                 _id: 'users',
//                 _rev: latestDoc._rev,
//                 data: updatedUsers,
//               });

//               console.log('New user synced and updated in localDB.');
//             } else {
//               // Sync updated users
//               console.log('Syncing updated user:', user._id);
//               await axios.put(`${API_URL}/update-user/${user._id}`, user, {
//                 headers: { Authorization: `Bearer ${token}` },
//               });

//               // Mark the user as synced in the local database
//               const updatedUsers = users.map((u) =>
//                 u._id === user._id ? { ...u, synced: true } : u
//               );

//               // Fetch the latest revision to avoid conflicts
//               const latestDoc = await localDB.get('users');
//               await localDB.put({
//                 _id: 'users',
//                 _rev: latestDoc._rev,
//                 data: updatedUsers,
//               });

//               console.log('Updated user synced and marked as synced in localDB.');
//             }
//           } catch (error) {
//             console.error(`Error syncing user ${user._id}:`, error.response?.data || error.message);

//             // Mark the user as synced to prevent infinite retries
//             const updatedUsers = users.map((u) =>
//               u._id === user._id ? { ...u, synced: true } : u
//             );

//             // Fetch the latest revision to avoid conflicts
//             const latestDoc = await localDB.get('users');
//             await localDB.put({
//               _id: 'users',
//               _rev: latestDoc._rev,
//               data: updatedUsers,
//             });

//             console.log('User marked as synced to prevent retries:', user._id);
//           }
//         }

//         console.log('Sync process for users completed.');
//       } else {
//         console.error('Users document not found in localDB.');
//       }
//     } else {
//       console.log('App is offline. Sync process skipped.');
//     }
//   } catch (error) {
//     console.error('Error during sync process for users:', error.response?.data || error.message);
//     throw error.response?.data || new Error('Error during sync process for users');
//   }
// };

// // **Listen for online status and sync changes**
// window.addEventListener('online', () => {
//   console.log('Back online, syncing data...');
//   syncLocalChanges();
// });