// import axios from 'axios';

// const API_URL = 'http://localhost:5000/api/material';

// const materialService = {
//   // Create a new material
//   createMaterial: async (materialData, token) => {
//     const response = await axios.post(
//       `${API_URL}/create-materials`, 
//       materialData,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`, // Include the token in the Authorization header
//         },
//       }
//     );
//     console.log("response",response)
//     return response.data;
//   },

//   // Fetch all materials
//   fetchMaterials: async (token) => {
//     const response = await axios.get(`${API_URL}/get-all-materials`,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`, // Include the token in the Authorization header
//         },
//       }
//     );
//     return response.data;
//   },

//   // Update a material by ID
//   updateMaterial: async (materialId, updatedData,token) => {
//     const response = await axios.put(
//       `${API_URL}/update-materials/${materialId}`,
//       updatedData,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`, // Include the token in the Authorization header
//         },
//       }
//     );
//     return response.data;
//   },

//   // Delete a material by ID
//   deleteMaterial: async (materialId,token) => {
//     const response = await axios.delete(`${API_URL}/delete-materials/${materialId}`,
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

// export default materialService;
import axios from 'axios';
import { localDB } from '../pouchDb'; // Import the shared localDB instance
import { v4 as uuidv4 } from 'uuid';
const API_URL = 'http://localhost:5000/api/material';

const materialService = {
  // Create a new material
  createMaterial: async (materialData, token) => {
    try {
      console.log('Creating material with data:', materialData);
      if (navigator.onLine) {
        // Online: Use Axios to send data to the backend
        const isFormData = materialData instanceof FormData;
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
          },
        };
        const response = await axios.post(`${API_URL}/create-materials`, isFormData ? materialData : materialData, config);
        console.log('Material saved to remote API:', response.data);

        // Sync the created material with the local database
        const createdMaterial = response.data;
        const existingDoc = await localDB.get('materials').catch(() => null);

        if (existingDoc) {
          const updatedMaterials = [...existingDoc.data, { ...createdMaterial, synced: true, isNew: false }];
          await localDB.put({
            _id: 'materials',
            _rev: existingDoc._rev,
            data: updatedMaterials,
          });
          console.log('Material added to localDB:', createdMaterial);
        } else {
          await localDB.put({
            _id: 'materials',
            data: [{ ...createdMaterial, synced: true, isNew: false }],
          });
          console.log('New materials document created in localDB:', createdMaterial);
        }

        return createdMaterial;
      } else {
        // Offline: Store data locally in the materials document
        const materialId = `material:${uuidv4()}`;
        const newMaterial = {
          _id: materialId,
          type: 'material',
          ...materialData,
          synced: false,
          isNew: true,
        };

        const existingDoc = await localDB.get('materials').catch(() => null);
        if (existingDoc) {
          const updatedMaterials = [...existingDoc.data, newMaterial];
          await localDB.put({
            _id: 'materials',
            _rev: existingDoc._rev,
            data: updatedMaterials,
          });
          console.log('Material saved locally:', newMaterial);
        } else {
          await localDB.put({
            _id: 'materials',
            data: [newMaterial],
          });
          console.log('New materials document created in localDB:', newMaterial);
        }
        return newMaterial;
      }
    } catch (error) {
      console.error('Error creating material:', error.response?.data || error.message);
      throw error || new Error('Error creating material');
    }
  },

fetchMaterials: async (token) => {
    try {
      let materials;
      if (navigator.onLine) {
        const response = await axios.get(`${API_URL}/get-all-materials`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        materials = response.data;
        console.log('Fetched materials from server:', materials);

        try {
          const existingDoc = await localDB.get('materials').catch(() => null);
          const docToSave = {
            _id: 'materials',
            data: materials.map((material) => ({ ...material, synced: true })),
          };
          if (existingDoc) {
            docToSave._rev = existingDoc._rev;
          }
          await localDB.put(docToSave);
          console.log('Materials saved to PouchDB successfully.');
        } catch (err) {
          if (err.name === 'conflict') {
            console.log('Document conflict detected. Retrying...');
            const latestDoc = await localDB.get('materials');
            await localDB.put({
              _id: 'materials',
              _rev: latestDoc._rev,
              data: materials.map((material) => ({ ...material, synced: true })),
            });
            console.log('Materials updated in PouchDB successfully.');
          } else {
            console.error('Error saving materials to PouchDB:', err);
            throw err;
          }
        }
        return materials;
      } else {
        console.log('App is offline. Fetching materials from PouchDB...');
        const localData = await localDB.get('materials').catch(() => ({ data: [] }));
        console.log('Fetched materials from PouchDB:', localData.data);
        return localData.data;
      }
    } catch (error) {
      console.error('Failed to fetch materials:', error);
      throw new Error('Failed to fetch materials');
    }
  },
// Sync local changes with the remote API when online
updateMaterial: async (materialId, updatedData, token) => {
    try {
      if (navigator.onLine) {
        // Online: Update material on the remote API
        const response = await axios.put(
          `${API_URL}/update-materials/${materialId}`,
          updatedData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Sync the updated material with the local database
        const updatedMaterial = response.data;

        // Fetch the existing materials document
        const existingDoc = await localDB.get('materials').catch(() => null);

        if (existingDoc) {
          // Find the material to update in the data array
          const updatedMaterials = existingDoc.data.map((material) =>
            material._id === materialId ? { ...material, ...updatedMaterial, isNew: false } : material
          );

          // Update the document with the new materials array
          await localDB.put({
            _id: 'materials',
            _rev: existingDoc._rev,
            data: updatedMaterials,
          });

          console.log('Material updated in PouchDB successfully.');
        } else {
          console.error('Materials document not found in localDB.');
          throw new Error('Materials document not found in local database');
        }

        return updatedMaterial;
      } else {
        // Offline: Update material in the local database
        const existingDoc = await localDB.get('materials').catch(() => null);

        if (existingDoc) {
          // Find the material to update in the data array
          const updatedMaterials = existingDoc.data.map((material) =>
            material._id === materialId ? { ...material, ...updatedData, synced: false, isNew: false } : material
          );

          // Update the document with the new materials array
          await localDB.put({
            _id: 'materials',
            _rev: existingDoc._rev,
            data: updatedMaterials,
          });

          console.log('Material updated in PouchDB (offline).');
          return updatedData;
        } else {
          console.error('Materials document not found in localDB.');
          throw new Error('Materials document not found in local database');
        }
      }
    } catch (error) {
      console.error('Error updating material:', error.response?.data || error.message);
      throw error.response?.data || new Error('Error updating material');
    }
  },
  
  deleteMaterial: async (materialId, token) => {
    try {
      if (navigator.onLine) {
        // Online: Delete material from the remote API
        const response = await axios.delete(`${API_URL}/delete-materials/${materialId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Fetch the existing materials document
        const existingDoc = await localDB.get('materials').catch(() => null);

        if (existingDoc) {
          // Filter out the deleted material from the data array
          const updatedMaterials = existingDoc.data.filter(
            (material) => material._id !== materialId
          );

          // Update the document with the new materials array
          await localDB.put({
            _id: 'materials',
            _rev: existingDoc._rev,
            data: updatedMaterials,
          });

          console.log('Material deleted from PouchDB successfully.');
        } else {
          console.error('Materials document not found in localDB.');
          throw new Error('Materials document not found in local database');
        }

        return response.data;
      } else {
        // Offline: Mark material as deleted in the local database
        const existingDoc = await localDB.get('materials').catch(() => null);

        if (existingDoc) {
          // Find the material to mark as deleted
          const updatedMaterials = existingDoc.data.map((material) =>
            material._id === materialId ? { ...material, _deleted: true, synced: false } : material
          );

          // Update the document with the new materials array
          await localDB.put({
            _id: 'materials',
            _rev: existingDoc._rev,
            data: updatedMaterials,
          });

          console.log('Material marked for deletion in PouchDB (offline).');
          return { message: 'Material marked for deletion', materialId };
        } else {
          console.error('Materials document not found in localDB.');
          throw new Error('Materials document not found in local database');
        }
      }
    } catch (error) {
      console.error('Error deleting material:', error.response?.data || error.message);
      throw error.response?.data || new Error('Error deleting material');
    }
  },

  syncLocalChanges: async (token) => {
    try {
      console.log('Starting sync process for materials...');
  
      if (navigator.onLine) {
        // Fetch the materials document from the local database
        const materialsDoc = await localDB.get('materials').catch(() => null);
  
        if (materialsDoc) {
          const materials = materialsDoc.data;
          console.log('Materials in localDB:', materials);
  
          // Filter for unsynced materials
          const unsyncedMaterials = materials.filter((material) => !material.synced);
  
          console.log('Unsynced materials:', unsyncedMaterials);
  
          // Process each unsynced material
          for (const material of unsyncedMaterials) {
            try {
              if (material._deleted) {
                console.log('Syncing deleted material:', material._id);
                await axios.delete(`${API_URL}/delete-materials/${material._id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                const updatedMaterials = materials.filter((m) => m._id !== material._id);
                await localDB.put({ _id: 'materials', _rev: materialsDoc._rev, data: updatedMaterials });
                console.log('Deleted material synced and removed from localDB.');
              } else if (material.isNew) {
                console.log('Syncing new material:', material._id);
                const { _id, isNew, ...materialData } = material;
                const response = await axios.post(`${API_URL}/create-materials`, materialData, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                const updatedMaterials = materials.filter((m) => m._id !== material._id).concat({ ...response.data, synced: true });
                const latestDoc = await localDB.get('materials');
                await localDB.put({ _id: 'materials', _rev: latestDoc._rev, data: updatedMaterials });
                console.log('New material synced and updated in localDB.');
              } else {
                console.log('Syncing updated material:', material._id);
                await axios.put(`${API_URL}/update-materials/${material._id}`, material, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                const updatedMaterials = materials.map((m) => (m._id === material._id ? { ...m, synced: true } : m));
                const latestDoc = await localDB.get('materials');
                await localDB.put({ _id: 'materials', _rev: latestDoc._rev, data: updatedMaterials });
                console.log('Updated material synced and marked as synced in localDB.');
              }
            } catch (error) {
              console.error(`Error syncing material ${material._id}:`, error.response?.data || error.message);
            }
          }
        } else {
          console.error('Materials document not found in localDB.');
        }
      } else {
        console.log('App is offline. Sync process skipped.');
      }
    } catch (error) {
      console.error('Error during sync process for materials:', error.response?.data || error.message);
    }
  }

};

export default materialService;