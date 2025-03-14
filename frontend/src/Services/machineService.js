// import axios from 'axios';

// const API_URL = 'http://localhost:5000/api/machine';

// const machineService = {
//   // Create a new machine
//   createMachine: async (machineData, token) => {
//     console.log("machineData",machineData)
//     const response = await axios.post(
//       `${API_URL}/create-machines`, 
//       machineData,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`, // Include the token in the Authorization header
//         },
//       }
//     );
//     return response.data;
//   },

//   // Fetch all machines
//   fetchMachines: async (token) => {
//     const response = await axios.get(`${API_URL}/get-all-machines`,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`, // Include the token in the Authorization header
//         },
//       }
//     );
//     return response.data;
//   },

//   // Update a machine by ID
//   updateMachine: async (machineId, updatedData,token) => {
//     const response = await axios.put(
//       `${API_URL}/update-machines/${machineId}`,
//       updatedData,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`, // Include the token in the Authorization header
//         },
//       }
//     );
//     return response.data;
//   },

//   // Delete a machine by ID
//   deleteMachine: async (machineId,token) => {
//     const response = await axios.delete(`${API_URL}/delete-machines/${machineId}`,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`, // Include the token in the Authorization header
//         },
//       }
//     );
//     console.log("response",response)
//     return response.data;
//   },
// };

// export default machineService;
import axios from 'axios';
import { localDB } from '../pouchDb'; // Import the shared localDB instance
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

const API_URL = 'http://localhost:5000/api/machine';

const machineService = {
  // Create a new machine

  createMachine: async (machineData, token) => {
    try {
      console.log('Creating machine with data:', machineData);
      if (navigator.onLine) {
        // Online: Use Axios to send data to the backend
        const response = await axios.post(`${API_URL}/create-machines`, machineData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('Machine saved to remote API:', response.data);
  
        // Sync the created machine with the local database
        const createdMachine = response.data;
  
        // Fetch the existing machines document
        const existingDoc = await localDB.get('machines').catch(() => null);
  
        if (existingDoc) {
          // Add the new machine to the data array
          const updatedMachines = [...existingDoc.data, { ...createdMachine, synced: true, isNew: false }];
  
          // Update the document with the new machines array
          await localDB.put({
            _id: 'machines',
            _rev: existingDoc._rev,
            data: updatedMachines,
          });
  
          console.log('Machine added to localDB:', createdMachine);
        } else {
          // Create a new machines document if it doesn't exist
          await localDB.put({
            _id: 'machines',
            data: [{ ...createdMachine, synced: true, isNew: false }],
          });
  
          console.log('New machines document created in localDB:', createdMachine);
        }
  
        return createdMachine;
      } else {
        // Offline: Store data locally in the machines document
        const machineId = `machine:${uuidv4()}`; // Generate a machine:<UUID> _id
        const newMachine = {
          _id: machineId,
          type: 'machine',
          ...machineData,
          synced: false, // Mark as unsynced
          isNew: true, // Mark as new machine
        };
  
        // Fetch the existing machines document
        const existingDoc = await localDB.get('machines').catch(() => null);
  
        if (existingDoc) {
          // Add the new machine to the data array
          const updatedMachines = [...existingDoc.data, newMachine];
  
          // Update the document with the new machines array
          await localDB.put({
            _id: 'machines',
            _rev: existingDoc._rev,
            data: updatedMachines,
          });
  
          console.log('Machine saved locally:', newMachine);
        } else {
          // Create a new machines document if it doesn't exist
          await localDB.put({
            _id: 'machines',
            data: [newMachine],
          });
  
          console.log('New machines document created in localDB:', newMachine);
        }
  
        return newMachine;
      }
    } catch (error) {
      console.error('Error creating machine:', error.response?.data || error.message);
      throw error || new Error('Error creating machine');
    }
  },
  fetchMachines: async (token) => {
    try {
      let machines;
  
      if (navigator.onLine) {
        // Online: Fetch machines from the remote API
        const response = await axios.get(`${API_URL}/get-all-machines`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        machines = response.data;
  
        console.log('Fetched machines from server:', machines);
  
        // Save all machines as individual documents in PouchDB
        try {
          // Fetch the existing "machines" document (if it exists)
          const existingDoc = await localDB.get('machines').catch(() => null);
  
          // Prepare the document to save
          const docToSave = {
            _id: 'machines',
            data: machines.map((machine) => ({
              ...machine,
              synced: true, // Mark each machine as synced
            })),
          };
  
          // If the document exists, include its _rev
          if (existingDoc) {
            docToSave._rev = existingDoc._rev;
          }
  
          // Save or update the document
          await localDB.put(docToSave);
          console.log('Machines saved to PouchDB successfully.');
        } catch (err) {
          if (err.name === 'conflict') {
            console.log('Document conflict detected. Retrying...');
            // Fetch the latest revision and retry
            const latestDoc = await localDB.get('machines');
            await localDB.put({
              _id: 'machines',
              _rev: latestDoc._rev,
              data: machines.map((machine) => ({
                ...machine,
                synced: true, // Mark each machine as synced
              })),
            });
            console.log('Machines updated in PouchDB successfully.');
          } else {
            console.error('Error saving machines to PouchDB:', err);
            throw err;
          }
        }
  
        return machines;
      } else {
        // Offline: Fetch machines from local PouchDB
        console.log('App is offline. Fetching machines from PouchDB...');
        const localData = await localDB.get('machines').catch((err) => {
          console.log('No machines found in PouchDB. Returning empty array.');
          return { data: [] }; // Return empty array if no data exists
        });
  
        console.log('Fetched machines from PouchDB:', localData.data);
        return localData.data;
      }
    } catch (error) {
      console.error('Failed to fetch machines:', error);
      throw new Error('Failed to fetch machines');
    }
  },
  updateMachine: async (machineId, updatedData, token) => {
    try {
      if (navigator.onLine) {
        // Online: Update machine on the remote API
        const response = await axios.put(
          `${API_URL}/update-machines/${machineId}`,
          updatedData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
  
        // Sync the updated machine with the local database
        const updatedMachine = response.data;
  
        // Fetch the existing machines document
        const existingDoc = await localDB.get('machines').catch(() => null);
  
        if (existingDoc) {
          // Find the machine to update in the data array
          const updatedMachines = existingDoc.data.map((machine) =>
            machine._id === machineId ? { ...machine, ...updatedMachine, isNew: false } : machine
          );
  
          // Update the document with the new machines array
          await localDB.put({
            _id: 'machines',
            _rev: existingDoc._rev,
            data: updatedMachines,
          });
  
          console.log('Machine updated in PouchDB successfully.');
        } else {
          console.error('Machines document not found in localDB.');
          throw new Error('Machines document not found in local database');
        }
  
        return updatedMachine;
      } else {
        // Offline: Update machine in the local database
        const existingDoc = await localDB.get('machines').catch(() => null);
  
        if (existingDoc) {
          // Find the machine to update in the data array
          const updatedMachines = existingDoc.data.map((machine) =>
            machine._id === machineId ? { ...machine, ...updatedData, synced: false, isNew: false } : machine
          );
  
          // Update the document with the new machines array
          await localDB.put({
            _id: 'machines',
            _rev: existingDoc._rev,
            data: updatedMachines,
          });
  
          console.log('Machine updated in PouchDB (offline).');
          return updatedData;
        } else {
          console.error('Machines document not found in localDB.');
          throw new Error('Machines document not found in local database');
        }
      }
    } catch (error) {
      console.error('Error updating machine:', error.response?.data || error.message);
      throw error.response?.data || new Error('Error updating machine');
    }
  },
  deleteMachine: async (machineId, token) => {
    try {
      if (navigator.onLine) {
        // Online: Delete machine from the remote API
        const response = await axios.delete(`${API_URL}/delete-machines/${machineId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        // Fetch the existing machines document
        const existingDoc = await localDB.get('machines').catch(() => null);
  
        if (existingDoc) {
          // Filter out the deleted machine from the data array
          const updatedMachines = existingDoc.data.filter(
            (machine) => machine._id !== machineId
          );
  
          // Update the document with the new machines array
          await localDB.put({
            _id: 'machines',
            _rev: existingDoc._rev,
            data: updatedMachines,
          });
  
          console.log('Machine deleted from PouchDB successfully.');
        } else {
          console.error('Machines document not found in localDB.');
          throw new Error('Machines document not found in local database');
        }
  
        return response.data;
      } else {
        // Offline: Mark machine as deleted in the local database
        const existingDoc = await localDB.get('machines').catch(() => null);
  
        if (existingDoc) {
          // Find the machine to mark as deleted
          const updatedMachines = existingDoc.data.map((machine) =>
            machine._id === machineId ? { ...machine, _deleted: true, synced: false } : machine
          );
  
          // Update the document with the new machines array
          await localDB.put({
            _id: 'machines',
            _rev: existingDoc._rev,
            data: updatedMachines,
          });
  
          console.log('Machine marked for deletion in PouchDB (offline).');
          return { message: 'Machine marked for deletion', machineId };
        } else {
          console.error('Machines document not found in localDB.');
          throw new Error('Machines document not found in local database');
        }
      }
    } catch (error) {
      console.error('Error deleting machine:', error.response?.data || error.message);
      throw error.response?.data || new Error('Error deleting machine');
    }
  },
  syncLocalChanges: async (token) => {
    try {
      console.log('Starting sync process for machines...');
  
      if (navigator.onLine) {
        // Fetch the machines document from the local database
        const machinesDoc = await localDB.get('machines').catch(() => null);
  
        if (machinesDoc) {
          // Extract the machines array from the document
          const machines = machinesDoc.data;
          console.log('Machines in localDB:', machines);
  
          // Filter for unsynced machines
          const unsyncedMachines = machines.filter((machine) => !machine.synced);
  
          console.log('Unsynced machines:', unsyncedMachines);
  
          // Process each unsynced machine
          for (const machine of unsyncedMachines) {
            try {
              if (machine._deleted) {
                // Sync deleted machines
                console.log('Syncing deleted machine:', machine._id);
                await axios.delete(`${API_URL}/delete-machines/${machine._id}`, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });
  
                // Remove the deleted machine from the local database
                const updatedMachines = machines.filter((m) => m._id !== machine._id);
                await localDB.put({
                  _id: 'machines',
                  _rev: machinesDoc._rev,
                  data: updatedMachines,
                });
  
                console.log('Deleted machine synced and removed from localDB.');
              } else if (machine.isNew) {
                // Sync newly created machines (marked with isNew flag)
                console.log('Syncing new machine:', machine._id);
                const { _id, isNew, ...machineData } = machine;
  
                // Create the machine on the server
                const response = await axios.post(`${API_URL}/create-machines`, machineData, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });
  
                // Replace the temporary machine with the one returned by the server
                const updatedMachines = machines
                  .filter((m) => m._id !== machine._id) // Remove the temporary machine
                  .concat({ ...response.data, synced: true }); // Add the synced machine
  
                // Update the machines document
                const latestDoc = await localDB.get('machines'); // Fetch the latest revision
                await localDB.put({
                  _id: 'machines',
                  _rev: latestDoc._rev,
                  data: updatedMachines,
                });
  
                console.log('New machine synced and updated in localDB.');
              } else {
                // Sync updated machines (existing machines without isNew flag)
                console.log('Syncing updated machine:', machine._id);
                await axios.put(`${API_URL}/update-machines/${machine._id}`, machine, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });
  
                // Mark the machine as synced in the local database
                const updatedMachines = machines.map((m) =>
                  m._id === machine._id ? { ...m, synced: true } : m
                );
  
                // Update the machines document
                const latestDoc = await localDB.get('machines'); // Fetch the latest revision
                await localDB.put({
                  _id: 'machines',
                  _rev: latestDoc._rev,
                  data: updatedMachines,
                });
  
                console.log('Updated machine synced and marked as synced in localDB.');
              }
            } catch (error) {
              console.error(`Error syncing machine ${machine._id}:`, error.response?.data || error.message);
  
              // Mark the machine as synced to prevent infinite retries
              const updatedMachines = machines.map((m) =>
                m._id === machine._id ? { ...m, synced: true } : m
              );
  
              // Update the machines document
              const latestDoc = await localDB.get('machines'); // Fetch the latest revision
              await localDB.put({
                _id: 'machines',
                _rev: latestDoc._rev,
                data: updatedMachines,
              });
  
              console.log('Machine marked as synced to prevent retries:', machine._id);
            }
          }
  
          console.log('Sync process for machines completed.');
        } else {
          console.error('Machines document not found in localDB.');
        }
      } else {
        console.log('App is offline. Sync process skipped.');
      }
    } catch (error) {
      console.error('Error during sync process for machines:', error.response?.data || error.message);
      throw error.response?.data || new Error('Error during sync process for machines');
    }
  },
};

export default machineService;