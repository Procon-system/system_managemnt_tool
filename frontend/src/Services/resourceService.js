import axios from 'axios';
import { localDB } from '../pouchDb';
import { v4 as uuidv4 } from 'uuid';

const API_URL = `${process.env.REACT_APP_API_BASE_URL}/api/resources`;

const resourceService = {
  createResource: async (resourceData, token) => {
    try {
      if (navigator.onLine) {
        const response = await axios.post(API_URL, resourceData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Sync with local DB
        try {
          const existingDoc = await localDB.get('resources').catch(() => null);
          const newResource = { ...response.data, synced: true };
          
          if (existingDoc) {
            await localDB.put({
              _id: 'resources',
              _rev: existingDoc._rev,
              data: [...existingDoc.data, newResource]
            });
          } else {
            await localDB.put({
              _id: 'resources',
              data: [newResource]
            });
          }
        } catch (dbError) {
          console.error('Local DB sync error:', dbError);
        }
        
        return response.data;
      } else {
        // Offline handling
        const resourceId = `resource:${uuidv4()}`;
        const newResource = {
          _id: resourceId,
          type: 'resource',
          ...resourceData,
          synced: false,
          isNew: true
        };
        
        const existingDoc = await localDB.get('resources').catch(() => null);
        
        if (existingDoc) {
          await localDB.put({
            _id: 'resources',
            _rev: existingDoc._rev,
            data: [...existingDoc.data, newResource]
          });
        } else {
          await localDB.put({
            _id: 'resources',
            data: [newResource]
          });
        }
        
        return newResource;
      }
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getResourcesByType: async (typeId, token) => {
    try {
      if (navigator.onLine) {
        const response = await axios.get(`${API_URL}/type/${typeId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Cache data locally
        try {
          const existingDoc = await localDB.get('resources').catch(() => null);
          const dataToStore = {
            _id: 'resources',
            data: response.data.map(item => ({ ...item, synced: true }))
          };
          
          if (existingDoc) {
            dataToStore._rev = existingDoc._rev;
          }
          
          await localDB.put(dataToStore);
        } catch (dbError) {
          console.error('Local DB sync error:', dbError);
        }
        console.log("response.data",response.data)
        
        return response.data;
      } else {
        // Get from local DB filtered by typeId
        const localData = await localDB.get('resources').catch(() => ({ data: [] }));
        return localData.data.filter(resource => resource.typeId === typeId);
      }
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getResourceById: async (id, token) => {
    try {
      if (navigator.onLine) {
        const response = await axios.get(`${API_URL}/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Update local cache
        try {
          const existingDoc = await localDB.get('resources').catch(() => null);
          if (existingDoc) {
            const existingIndex = existingDoc.data.findIndex(item => item._id === id);
            let updatedData = [...existingDoc.data];
            
            if (existingIndex >= 0) {
              updatedData[existingIndex] = { ...response.data, synced: true };
            } else {
              updatedData.push({ ...response.data, synced: true });
            }
            
            await localDB.put({
              _id: 'resources',
              _rev: existingDoc._rev,
              data: updatedData
            });
          }
        } catch (dbError) {
          console.error('Local DB sync error:', dbError);
        }
        
        return response.data;
      } else {
        const localData = await localDB.get('resources').catch(() => ({ data: [] }));
        return localData.data.find(item => item._id === id);
      }
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateResource: async (id, updatedData, token) => {
    try {
      if (navigator.onLine) {
        const response = await axios.put(`${API_URL}/${id}`, updatedData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Update local DB
        try {
          const existingDoc = await localDB.get('resources');
          const updatedResources = existingDoc.data.map(item => 
            item._id === id ? { ...response.data, synced: true } : item
          );
          
          await localDB.put({
            _id: 'resources',
            _rev: existingDoc._rev,
            data: updatedResources
          });
        } catch (dbError) {
          console.error('Local DB sync error:', dbError);
        }
        
        return response.data;
      } else {
        // Offline handling
        const existingDoc = await localDB.get('resources');
        const updatedResources = existingDoc.data.map(item => 
          item._id === id ? { ...item, ...updatedData, synced: false } : item
        );
        
        await localDB.put({
          _id: 'resources',
          _rev: existingDoc._rev,
          data: updatedResources
        });
        
        return { _id: id, ...updatedData };
      }
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteResource: async (id, token) => {
    try {
      if (navigator.onLine) {
        await axios.delete(`${API_URL}/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Update local DB
        try {
          const existingDoc = await localDB.get('resources');
          const updatedData = existingDoc.data.filter(item => item._id !== id);
          
          await localDB.put({
            _id: 'resources',
            _rev: existingDoc._rev,
            data: updatedData
          });
        } catch (dbError) {
          console.error('Local DB sync error:', dbError);
        }
        
        return id;
      } else {
        // Offline handling - mark for deletion
        const existingDoc = await localDB.get('resources');
        const updatedData = existingDoc.data.map(item => 
          item._id === id ? { ...item, _deleted: true } : item
        );
        
        await localDB.put({
          _id: 'resources',
          _rev: existingDoc._rev,
          data: updatedData
        });
        
        return id;
      }
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Additional method to sync local changes when coming back online
  syncLocalChanges: async (token) => {
    try {
      const localDoc = await localDB.get('resources').catch(() => ({ data: [] }));
      const unsyncedCreates = localDoc.data.filter(item => item.isNew && !item.synced);
      const unsyncedUpdates = localDoc.data.filter(item => !item.synced && !item.isNew && !item._deleted);
      const unsyncedDeletes = localDoc.data.filter(item => item._deleted);
      
      // Process creates
      for (const item of unsyncedCreates) {
        try {
          const { _id, isNew, synced, ...cleanItem } = item;
          await resourceService.createResource(cleanItem, token);
        } catch (error) {
          console.error(`Failed to sync created item ${item._id}:`, error);
        }
      }
      
      // Process updates
      for (const item of unsyncedUpdates) {
        try {
          const { _id, synced, ...cleanItem } = item;
          await resourceService.updateResource(_id, cleanItem, token);
        } catch (error) {
          console.error(`Failed to sync updated item ${item._id}:`, error);
        }
      }
      
      // Process deletes
      for (const item of unsyncedDeletes) {
        try {
          await resourceService.deleteResource(item._id, token);
        } catch (error) {
          console.error(`Failed to sync deleted item ${item._id}:`, error);
        }
      }
      
      // Refresh local data with server state
      if (unsyncedCreates.length > 0 || unsyncedUpdates.length > 0 || unsyncedDeletes.length > 0) {
        const response = await axios.get(API_URL, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        await localDB.put({
          _id: 'resources',
          _rev: localDoc._rev,
          data: response.data.map(item => ({ ...item, synced: true }))
        });
      }
      
      return { success: true };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default resourceService;