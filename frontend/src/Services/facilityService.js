// import axios from 'axios';

// const API_URL = 'http://localhost:5000/api/facility';

// const facilityService = {
//   // Create a new facility
//   createFacility: async (facilityData, token) => {
//     const response = await axios.post(
//       `${API_URL}/create-facility`, 
//       facilityData,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`, // Include the token in the Authorization header
//         },
//       }
//     );
//     return response.data;
//   },

//   // Fetch all facilities
//   fetchFacilities: async (token) => {
//     const response = await axios.get(`${API_URL}/get-all-facility`,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`, // Include the token in the Authorization header
//         },
//       }
//     );
//     return response.data;
//   },

//   // Update a facility by ID
//   updateFacility: async (facilityId, updatedData,token) => {
//     const response = await axios.put(
//       `${API_URL}/update-facility/${facilityId}`,
//       updatedData,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`, // Include the token in the Authorization header
//         },
//       }
//     );
//     return response.data;
//   },

//   // Delete a facility by ID
//   deleteFacility: async (facilityId,token) => {
//     const response = await axios.delete(`${API_URL}/delete-facility/${facilityId}`,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`, // Include the token in the Authorization header
//         },
//       }
//     );
//     return response.data;
//   },
// };

// export default facilityService;
import axios from 'axios';
import { localDB } from '../pouchDb'; // Import the shared localDB instance
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

const API_URL = 'http://localhost:5000/api/facility';

const facilityService = {
  // Create a new facility
 
  createFacility: async (facilityData, token) => {
    try {
      if (navigator.onLine) {
        // Online: Use Axios to send data to the backend
        const response = await axios.post(`${API_URL}/create-facility`, facilityData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        // Sync the created facility with the local database
        const createdFacility = response.data;
  
        // Fetch the existing facilities document
        const existingDoc = await localDB.get('facilities').catch(() => null);
  
        if (existingDoc) {
          // Add the new facility to the data array and mark it as synced
          const updatedFacilities = [...existingDoc.data, { ...createdFacility, synced: true }];
  
          // Update the facilities document
          await localDB.put({
            _id: 'facilities',
            _rev: existingDoc._rev,
            data: updatedFacilities,
          });
          } else {
          // Create a new facilities document if it doesn't exist
          await localDB.put({
            _id: 'facilities',
            data: [{ ...createdFacility, synced: true }],
          });
          }
  
        return createdFacility;
      } else {
        // Offline: Store data locally in the facilities document
        const facilityId = `facility:${uuidv4()}`; // Generate a facility:<UUID> _id
        const newFacility = {
          _id: facilityId,
          type: 'facility',
          ...facilityData,
          synced: false, // Mark as unsynced
          isNew: true, // Mark as new
        };
  
        // Fetch the existing facilities document
        const existingDoc = await localDB.get('facilities').catch(() => null);
  
        if (existingDoc) {
          // Add the new facility to the data array and mark it as unsynced
          const updatedFacilities = [...existingDoc.data, newFacility];
  
          // Update the facilities document
          await localDB.put({
            _id: 'facilities',
            _rev: existingDoc._rev,
            data: updatedFacilities,
          });
          } else {
          // Create a new facilities document if it doesn't exist
          await localDB.put({
            _id: 'facilities',
            data: [newFacility],
          });
          }
  
        return newFacility;
      }
    } catch (error) {
      console.error('Error creating facility:', error.response?.data || error.message);
      throw error || new Error('Error creating facility');
    }
  },
 
  fetchFacilities: async (token) => {
  try {
    let facilities;

    if (navigator.onLine) {
      // Online: Fetch facilities from the remote API
      const response = await axios.get(`${API_URL}/get-all-facility`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      facilities = response.data;

      // Save all facilities as a single document
      try {
        // Fetch the existing document (if it exists)
        const existingDoc = await localDB.get('facilities').catch(() => null);

        // Prepare the document to save
        const docToSave = {
          _id: 'facilities',
          data: facilities.map((facility) => ({ ...facility, synced: true })), // Mark as synced
        };

        // If the document exists, include its _rev
        if (existingDoc) {
          docToSave._rev = existingDoc._rev;
        }

        // Save or update the document
        await localDB.put(docToSave);
      } catch (err) {
        if (err.name === 'conflict') {
          // Fetch the latest revision and retry
          const latestDoc = await localDB.get('facilities');
          await localDB.put({
            _id: 'facilities',
            _rev: latestDoc._rev,
            data: facilities.map((facility) => ({ ...facility, synced: true })), // Mark as synced
          });
        } else {
          console.error('Error saving facilities to PouchDB:', err);
          throw err;
        }
      }

      return facilities;
    } else {
            const localData = await localDB.get('facilities').catch((err) => {
                return { data: [] }; // Return empty array if no data exists
      });
      return localData.data;
    }
  } catch (error) {
    console.error('Failed to fetch facilities:', error);
    throw new Error('Failed to fetch facilities');
  }
},
  // Update a facility by ID
  updateFacility: async (facilityId, updatedData, token) => {
    try {
      if (navigator.onLine) {
        // Online: Update facility on the remote API
        const response = await axios.put(
          `${API_URL}/update-facility/${facilityId}`,
          updatedData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
  
        // Sync the updated facility with the local database
        const updatedFacility = response.data;
  
        // Fetch the existing facilities document
        const existingDoc = await localDB.get('facilities').catch(() => null);
  
        if (existingDoc) {
          // Find the facility to update in the data array
          const updatedFacilities = existingDoc.data.map((facility) =>
            facility._id === facilityId ? { ...facility, ...updatedFacility } : facility
          );
  
          // Update the document with the new facilities array
          await localDB.put({
            _id: 'facilities',
            _rev: existingDoc._rev,
            data: updatedFacilities,
          });
          } else {
          console.error('Facilities document not found in localDB.');
          throw new Error('Facilities document not found in local database');
        }
  
        return updatedFacility;
      } else {
        // Offline: Update facility in the local database
        const existingDoc = await localDB.get('facilities').catch(() => null);
  
        if (existingDoc) {
          // Find the facility to update in the data array
          const updatedFacilities = existingDoc.data.map((facility) =>
            facility._id === facilityId ? { ...facility, ...updatedData, synced: false } : facility
          );
  
          // Update the document with the new facilities array
          await localDB.put({
            _id: 'facilities',
            _rev: existingDoc._rev,
            data: updatedFacilities,
          });
            return updatedData;
        } else {
          console.error('Facilities document not found in localDB.');
          throw new Error('Facilities document not found in local database');
        }
      }
    } catch (error) {
      console.error('Error updating facility:', error.response?.data || error.message);
      throw error.response?.data || new Error('Error updating facility');
    }
  },
  // Delete a facility by ID
  deleteFacility: async (facilityId, token) => {
    try {
      if (navigator.onLine) {
        // Online: Delete facility from the remote API
        const response = await axios.delete(`${API_URL}/delete-facility/${facilityId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        // Fetch the existing facilities document
        const existingDoc = await localDB.get('facilities').catch(() => null);
  
        if (existingDoc) {
          // Filter out the deleted facility from the data array
          const updatedFacilities = existingDoc.data.filter(
            (facility) => facility._id !== facilityId
          );
  
          // Update the document with the new facilities array
          await localDB.put({
            _id: 'facilities',
            _rev: existingDoc._rev,
            data: updatedFacilities,
          });
          } else {
          console.error('Facilities document not found in localDB.');
          throw new Error('Facilities document not found in local database');
        }
  
        return response.data;
      } else {
        // Offline: Mark facility as deleted in the local database
        const existingDoc = await localDB.get('facilities').catch(() => null);
  
        if (existingDoc) {
          // Find the facility to mark as deleted
          const updatedFacilities = existingDoc.data.map((facility) =>
            facility._id === facilityId ? { ...facility, _deleted: true, synced: false } : facility
          );
  
          // Update the document with the new facilities array
          await localDB.put({
            _id: 'facilities',
            _rev: existingDoc._rev,
            data: updatedFacilities,
          });
            return { message: 'Facility marked for deletion', facilityId };
        } else {
          console.error('Facilities document not found in localDB.');
          throw new Error('Facilities document not found in local database');
        }
      }
    } catch (error) {
      console.error('Error deleting facility:', error.response?.data || error.message);
      throw error.response?.data || new Error('Error deleting facility');
    }
  },

  syncLocalChanges: async (token) => {
    try {      if (navigator.onLine) {
        // Fetch the facilities document from the local database
        const facilitiesDoc = await localDB.get('facilities').catch(() => null);
  
        if (facilitiesDoc) {
          // Extract the facilities array from the document
          const facilities = facilitiesDoc.data;
          
          // Filter for unsynced facilities
          const unsyncedFacilities = facilities.filter((facility) => !facility.synced);
  
          // Process each unsynced facility
          for (const facility of unsyncedFacilities) {
            try {
              if (facility._deleted) {
                // Sync deleted facilities
                                await axios.delete(`${API_URL}/delete-facility/${facility._id}`, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });
  
                // Remove the deleted facility from the local database
                const updatedFacilities = facilities.filter((f) => f._id !== facility._id);
                await localDB.put({
                  _id: 'facilities',
                  _rev: facilitiesDoc._rev,
                  data: updatedFacilities,
                });
                } else if (facility.isNew) {
                // Sync newly created facilities (marked with isNew: true)
                               const { _id, isNew, ...facilityData } = facility;
  
                // Create the facility on the server
                const response = await axios.post(`${API_URL}/create-facility`, facilityData, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });
  
                // Replace the temporary facility with the one returned by the server
                const updatedFacilities = facilities
                  .filter((f) => f._id !== facility._id) // Remove the temporary facility
                  .concat({ ...response.data, synced: true }); // Add the synced facility
  
                // Update the facilities document
                const latestDoc = await localDB.get('facilities'); // Fetch the latest revision
                await localDB.put({
                  _id: 'facilities',
                  _rev: latestDoc._rev,
                  data: updatedFacilities,
                });
                } else {
                // Sync updated facilities (not marked as isNew)
                await axios.put(`${API_URL}/update-facility/${facility._id}`, facility, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });
  
                // Mark the facility as synced in the local database
                const updatedFacilities = facilities.map((f) =>
                  f._id === facility._id ? { ...f, synced: true } : f
                );
  
                // Update the facilities document
                const latestDoc = await localDB.get('facilities'); // Fetch the latest revision
                await localDB.put({
                  _id: 'facilities',
                  _rev: latestDoc._rev,
                  data: updatedFacilities,
                });
                }
            } catch (error) {
              console.error(`Error syncing facility ${facility._id}:`, error.response?.data || error.message);
  
              // Mark the facility as synced to prevent infinite retries
              const updatedFacilities = facilities.map((f) =>
                f._id === facility._id ? { ...f, synced: true } : f
              );
  
              // Update the facilities document
              const latestDoc = await localDB.get('facilities'); // Fetch the latest revision
              await localDB.put({
                _id: 'facilities',
                _rev: latestDoc._rev,
                data: updatedFacilities,
              });
              }
          }
          } else {
          console.error('Facilities document not found in localDB.');
        }
      }
    } catch (error) {
      console.error('Error during sync process for facilities:', error.response?.data || error.message);
    }
  },
};

export default facilityService;