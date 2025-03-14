
// import axios from 'axios';

// const API_URL = 'http://localhost:5000/api/tools';

// const toolService = {
//   // Create a new tool
//   createTool: async (toolData, token) => {
//     try {
//       console.log("Creating tool with data:", toolData);
//       const response = await axios.post(
//         `${API_URL}/create-tools`,
//         toolData,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );
//       return response.data;
//     } catch (error) {
//       console.error('Error creating tool:', error.response?.data || error.message);
//       throw error.response?.data || new Error('Error creating tool');
//     }
//   },

//   // Fetch all tools
//   fetchTools: async (token) => {
//     try {
//       const response = await axios.get(`${API_URL}/get-all-tools`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       return response.data;
//     } catch (error) {
//       console.error('Error fetching tools:', error.response?.data || error.message);
//       throw error.response?.data || new Error('Error fetching tools');
//     }
//   },

//   // Update a tool by ID
//   updateTool: async (toolId, updatedData, token) => {
//     try {
//       const response = await axios.put(
//         `${API_URL}/update-tools/${toolId}`,
//         updatedData,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );
//       return response.data;
//     } catch (error) {
//       console.error('Error updating tool:', error.response?.data || error.message);
//       throw error.response?.data || new Error('Error updating tool');
//     }
//   },

//   // Delete a tool by ID
//   deleteTool: async (toolId, token) => {
//     try {
//       const response = await axios.delete(
//         `${API_URL}/delete-tools/${toolId}`,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );
//       return response.data;
//     } catch (error) {
//       console.error('Error deleting tool:', error.response?.data || error.message);
//       throw error.response?.data || new Error('Error deleting tool');
//     }
//   },
// };

// export default toolService;
import axios from 'axios';
import { localDB } from '../pouchDb'; // Import the shared localDB instance
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

const API_URL = 'http://localhost:5000/api/tools';

const toolService = {
  // Create a new tool
  createTool: async (toolData, token) => {
    try {
      console.log('Creating tool with data:', toolData);
  
      if (navigator.onLine) {
        // Online: Use Axios to send data to the backend
        const response = await axios.post(`${API_URL}/create-tools`, toolData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('Tool saved to remote API:', response.data);
  
        // Sync the created tool with the local database
        const createdTool = response.data;
  
        // Fetch the existing tools document
        const existingDoc = await localDB.get('tools').catch(() => null);
  
        if (existingDoc) {
          // Add the new tool to the data array
          const updatedTools = [...existingDoc.data, { ...createdTool, synced: true, isNew: false }];
  
          // Update the document with the new tools array
          await localDB.put({
            _id: 'tools',
            _rev: existingDoc._rev,
            data: updatedTools,
          });
  
          console.log('Tool added to localDB:', createdTool);
        } else {
          // Create a new tools document if it doesn't exist
          await localDB.put({
            _id: 'tools',
            data: [{ ...createdTool, synced: true, isNew: false }],
          });
  
          console.log('New tools document created in localDB:', createdTool);
        }
  
        return createdTool;
      } else {
        // Offline: Store data locally in the tools document
        const toolId = `tool:${uuidv4()}`; // Generate a tool:<UUID> _id
        const newTool = {
          _id: toolId,
          type: 'tool',
          ...toolData,
          synced: false, // Mark as unsynced
          isNew: true, // Mark as new tool
        };
  
        // Fetch the existing tools document
        const existingDoc = await localDB.get('tools').catch(() => null);
  
        if (existingDoc) {
          // Add the new tool to the data array
          const updatedTools = [...existingDoc.data, newTool];
  
          // Update the document with the new tools array
          await localDB.put({
            _id: 'tools',
            _rev: existingDoc._rev,
            data: updatedTools,
          });
  
          console.log('Tool saved locally:', newTool);
        } else {
          // Create a new tools document if it doesn't exist
          await localDB.put({
            _id: 'tools',
            data: [newTool],
          });
  
          console.log('New tools document created in localDB:', newTool);
        }
  
        return newTool;
      }
    } catch (error) {
      console.error('Error creating tool:', error.response?.data || error.message);
      throw error || new Error('Error creating tool');
    }
  },
  // Fetch all tools
  fetchTools: async (token) => {
    try {
      let tools;
  
      if (navigator.onLine) {
        // Online: Fetch tools from the remote API
        const response = await axios.get(`${API_URL}/get-all-tools`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        tools = response.data;
  
        console.log('Fetched tools from server:', tools);
  
        // Save all tools as a single document
        try {
          // Fetch the existing document (if it exists)
          const existingDoc = await localDB.get('tools').catch(() => null);
  
          // Prepare the document to save
          const docToSave = {
            _id: 'tools',
            data: tools.map((tool) => ({ ...tool, synced: true, isNew: false })), // Mark all tools as synced
          };
  
          // If the document exists, include its _rev
          if (existingDoc) {
            docToSave._rev = existingDoc._rev;
          }
  
          // Save or update the document
          await localDB.put(docToSave);
          console.log('Tools saved to PouchDB successfully.');
        } catch (err) {
          if (err.name === 'conflict') {
            console.log('Document conflict detected. Retrying...');
            // Fetch the latest revision and retry
            const latestDoc = await localDB.get('tools');
            await localDB.put({
              _id: 'tools',
              _rev: latestDoc._rev,
              data: tools.map((tool) => ({ ...tool, synced: true, isNew: false })), // Mark all tools as synced
            });
            console.log('Tools updated in PouchDB successfully.');
          } else {
            console.error('Error saving tools to PouchDB:', err);
            throw err;
          }
        }
  
        return tools;
      } else {
        // Offline: Fetch tools from local PouchDB
        console.log('App is offline. Fetching tools from PouchDB...');
        const localData = await localDB.get('tools').catch((err) => {
          console.log('No tools found in PouchDB. Returning empty array.');
          return { data: [] }; // Return empty array if no data exists
        });
  
        console.log('Fetched tools from PouchDB:', localData.data);
        return localData.data;
      }
    } catch (error) {
      console.error('Failed to fetch tools:', error);
      throw new Error('Failed to fetch tools');
    }
  },

  // Update a tool by ID
  updateTool: async (toolId, updatedData, token) => {
    try {
      if (navigator.onLine) {
        // Online: Update tool on the remote API
        const response = await axios.put(
          `${API_URL}/update-tools/${toolId}`,
          updatedData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
  
        // Sync the updated tool with the local database
        const updatedTool = response.data;
  
        // Fetch the existing tools document
        const existingDoc = await localDB.get('tools').catch(() => null);
  
        if (existingDoc) {
          // Find the tool to update in the data array
          const updatedTools = existingDoc.data.map((tool) =>
            tool._id === toolId ? { ...tool, ...updatedTool, synced: true, isNew: false } : tool
          );
  
          // Update the document with the new tools array
          await localDB.put({
            _id: 'tools',
            _rev: existingDoc._rev,
            data: updatedTools,
          });
  
          console.log('Tool updated in localDB:', updatedTool);
        } else {
          console.error('Tools document not found in localDB.');
          throw new Error('Tools document not found in local database');
        }
  
        return updatedTool;
      } else {
        // Offline: Update tool in the local database
        const existingDoc = await localDB.get('tools').catch(() => null);
  
        if (existingDoc) {
          // Find the tool to update in the data array
          const updatedTools = existingDoc.data.map((tool) =>
            tool._id === toolId ? { ...tool, ...updatedData, synced: false, isNew: false } : tool
          );
  
          // Update the document with the new tools array
          await localDB.put({
            _id: 'tools',
            _rev: existingDoc._rev,
            data: updatedTools,
          });
  
          console.log('Tool updated in localDB (offline):', toolId);
          return updatedData;
        } else {
          console.error('Tools document not found in localDB.');
          throw new Error('Tools document not found in local database');
        }
      }
    } catch (error) {
      console.error('Error updating tool:', error.response?.data || error.message);
      throw error.response?.data || new Error('Error updating tool');
    }
  },
  // Delete a tool by ID
  deleteTool: async (toolId, token) => {
    try {
      if (navigator.onLine) {
        // Online: Delete tool from the remote API
        const response = await axios.delete(`${API_URL}/delete-tools/${toolId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        // Fetch the existing tools document
        const existingDoc = await localDB.get('tools').catch(() => null);
  
        if (existingDoc) {
          // Remove the deleted tool from the data array
          const updatedTools = existingDoc.data.filter((tool) => tool._id !== toolId);
  
          // Update the document with the new tools array
          await localDB.put({
            _id: 'tools',
            _rev: existingDoc._rev,
            data: updatedTools,
          });
  
          console.log('Tool deleted from localDB:', toolId);
        } else {
          console.error('Tools document not found in localDB.');
          throw new Error('Tools document not found in local database');
        }
  
        return response.data;
      } else {
        // Offline: Mark tool as deleted in the local database
        const existingDoc = await localDB.get('tools').catch(() => null);
  
        if (existingDoc) {
          // Mark the tool as deleted in the data array
          const updatedTools = existingDoc.data.map((tool) =>
            tool._id === toolId ? { ...tool, _deleted: true, synced: false } : tool
          );
  
          // Update the document with the new tools array
          await localDB.put({
            _id: 'tools',
            _rev: existingDoc._rev,
            data: updatedTools,
          });
  
          console.log('Tool marked for deletion in localDB:', toolId);
          return { message: 'Tool marked for deletion', toolId };
        } else {
          console.error('Tools document not found in localDB.');
          throw new Error('Tools document not found in local database');
        }
      }
    } catch (error) {
      console.error('Error deleting tool:', error.response?.data || error.message);
      throw error.response?.data || new Error('Error deleting tool');
    }
  },

  // Sync local changes with the remote API when online
  syncLocalChanges: async (token) => {
    try {
      console.log('Starting sync process for tools...');
  
      if (navigator.onLine) {
        // Fetch the tools document from the local database
        const toolsDoc = await localDB.get('tools').catch(() => null);
  
        if (toolsDoc) {
          // Extract the tools array from the document
          const tools = toolsDoc.data;
          console.log('Tools in localDB:', tools);
  
          // Filter for unsynced tools
          const unsyncedTools = tools.filter((tool) => !tool.synced);
          console.log('Unsynced tools:', unsyncedTools);
  
          // Process each unsynced tool
          for (const tool of unsyncedTools) {
            try {
              if (tool._deleted) {
                // Sync deleted tools
                console.log('Syncing deleted tool:', tool._id);
                await axios.delete(`${API_URL}/delete-tools/${tool._id}`, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });
  
                // Remove the deleted tool from the local database
                const updatedTools = tools.filter((t) => t._id !== tool._id);
                await localDB.put({
                  _id: 'tools',
                  _rev: toolsDoc._rev,
                  data: updatedTools,
                });
  
                console.log('Deleted tool synced and removed from localDB.');
              } else if (tool.isNew) {
                // Sync newly created tools (marked with isNew flag)
                console.log('Syncing new tool:', tool._id);
                const { _id, isNew, ...toolData } = tool;
  
                // Create the tool on the server
                const response = await axios.post(`${API_URL}/create-tools`, toolData, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });
  
                // Replace the temporary tool with the one returned by the server
                const updatedTools = tools
                  .filter((t) => t._id !== tool._id) // Remove the temporary tool
                  .concat({ ...response.data, synced: true, isNew: false }); // Add the synced tool
  
                // Update the tools document
                const latestDoc = await localDB.get('tools'); // Fetch the latest revision
                await localDB.put({
                  _id: 'tools',
                  _rev: latestDoc._rev,
                  data: updatedTools,
                });
  
                console.log('New tool synced and updated in localDB.');
              } else {
                // Sync updated tools (existing tools without isNew flag)
                console.log('Syncing updated tool:', tool._id);
                await axios.put(`${API_URL}/update-tools/${tool._id}`, tool, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });
  
                // Mark the tool as synced in the local database
                const updatedTools = tools.map((t) =>
                  t._id === tool._id ? { ...t, synced: true } : t
                );
  
                // Update the tools document
                const latestDoc = await localDB.get('tools'); // Fetch the latest revision
                await localDB.put({
                  _id: 'tools',
                  _rev: latestDoc._rev,
                  data: updatedTools,
                });
  
                console.log('Updated tool synced and marked as synced in localDB.');
              }
            } catch (error) {
              console.error(`Error syncing tool ${tool._id}:`, error.response?.data || error.message);
  
              // Mark the tool as synced to prevent infinite retries
              const updatedTools = tools.map((t) =>
                t._id === tool._id ? { ...t, synced: true } : t
              );
  
              // Update the tools document
              const latestDoc = await localDB.get('tools'); // Fetch the latest revision
              await localDB.put({
                _id: 'tools',
                _rev: latestDoc._rev,
                data: updatedTools,
              });
  
              console.log('Tool marked as synced to prevent retries:', tool._id);
            }
          }
  
          console.log('Sync process for tools completed.');
        } else {
          console.error('Tools document not found in localDB.');
        }
      } else {
        console.log('App is offline. Sync process skipped.');
      }
    } catch (error) {
      console.error('Error during sync process for tools:', error.response?.data || error.message);
      throw error.response?.data || new Error('Error during sync process for tools');
    }
  },
};

export default toolService;