import axios from 'axios';
import { localDB } from '../pouchDb';
import { saveUserSession } from './authService';
// Helper function to check if online
const isOnline = () => navigator.onLine;

export const saveOfflineRequest = async (request) => {
  try {
    // Ensure the request object has the required properties
    const offlineRequest = {
      _id: new Date().toISOString(), // Unique ID for the request
      url: request.url,
      method: request.method || 'GET', // Default to GET if method is not provided
      headers: request.headers || {},
      data: request.data || {},
    };

    await localDB.post(offlineRequest);
    console.log('Offline request saved:', offlineRequest);
  } catch (error) {
    console.error('Failed to save offline request:', error);
  }
};
// Process offline requests when online
export const processOfflineRequests = async () => {
  try {
    const result = await localDB.allDocs({ include_docs: true });
    const requests = result.rows.map((row) => row.doc);

    for (const request of requests) {
      try {
        // Ensure the request object is valid
        if (!request.url) {
          console.error('Invalid request: Missing URL', request);
          continue;
        }

        // Process the request using Axios
        const response = await axios({
          url: request.url,
          method: request.method || 'GET',
          headers: request.headers || {},
          data: request.data || {},
        });

        // Handle login requests
        if (request.url.includes('/login')) {
          await saveUserSession(response.data); // Save session if login request
        }

        // Remove the processed request from PouchDB
        await localDB.remove(request);
        console.log('Offline request processed:', request);
      } catch (error) {
        console.error('Failed to process offline request:', error);
      }
    }
  } catch (error) {
    console.error('Failed to fetch offline requests:', error);
  }
};
// Sync offline requests when online
window.addEventListener('online', async () => {
  console.log('App is online. Processing offline requests...');
  await processOfflineRequests();
});
