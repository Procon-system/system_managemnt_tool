import axios from 'axios';
import { localDB } from '../pouchDb';
import { v4 as uuidv4 } from 'uuid';

const API_URL = `${process.env.REACT_APP_API_BASE_URL}/api/resource-types`;

const resourceTypeService = {
  createResourceType: async (resourceTypeData, token) => {
    try {
    //   if (navigator.onLine) {
        const response = await axios.post(API_URL, resourceTypeData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Sync with local DB
        // try {
        //   const existingDoc = await localDB.get('resourceTypes').catch(() => null);
        //   const newResourceType = { ...response.data, synced: true };
          
        //   if (existingDoc) {
        //     await localDB.put({
        //       _id: 'resourceTypes',
        //       _rev: existingDoc._rev,
        //       data: [...existingDoc.data, newResourceType]
        //     });
        //   } else {
        //     await localDB.put({
        //       _id: 'resourceTypes',
        //       data: [newResourceType]
        //     });
        //   }
        // } catch (dbError) {
        //   console.error('Local DB sync error:', dbError);
        // }
        
        return response.data;
    //   } else {
    //     // Offline handling
    //     const resourceTypeId = `resourceType:${uuidv4()}`;
    //     const newResourceType = {
    //       _id: resourceTypeId,
    //       type: 'resourceType',
    //       ...resourceTypeData,
    //       synced: false,
    //       isNew: true
    //     };
        
    //     const existingDoc = await localDB.get('resourceTypes').catch(() => null);
        
    //     if (existingDoc) {
    //       await localDB.put({
    //         _id: 'resourceTypes',
    //         _rev: existingDoc._rev,
    //         data: [...existingDoc.data, newResourceType]
    //       });
    //     } else {
    //       await localDB.put({
    //         _id: 'resourceTypes',
    //         data: [newResourceType]
    //       });
    //     }
        
    //     return newResourceType;
    //   }
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  fetchResourceTypes: async (token) => {
    try {
      if (navigator.onLine) {
        const response = await axios.get(API_URL, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Cache data locally
        // try {
        //   const existingDoc = await localDB.get('resourceTypes').catch(() => null);
        //   const dataToStore = {
        //     _id: 'resourceTypes',
        //     data: response.data.map(item => ({ ...item, synced: true }))
        //   };
          
        //   if (existingDoc) {
        //     dataToStore._rev = existingDoc._rev;
        //   }
          
        //   await localDB.put(dataToStore);
        // } catch (dbError) {
        //   console.error('Local DB sync error:', dbError);
        // }
        
        return response.data;
      } else {
        const localData = await localDB.get('resourceTypes').catch(() => ({ data: [] }));
        return localData.data;
      }
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateResourceType: async (id, updatedData, token) => {
    try {
      if (navigator.onLine) {
        const response = await axios.put(`${API_URL}/${id}`, updatedData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Update local DB
        try {
          const existingDoc = await localDB.get('resourceTypes');
          const updatedData = existingDoc.data.map(item => 
            item._id === id ? { ...response.data, synced: true } : item
          );
          
          await localDB.put({
            _id: 'resourceTypes',
            _rev: existingDoc._rev,
            data: updatedData
          });
        } catch (dbError) {
          console.error('Local DB sync error:', dbError);
        }
        
        return response.data;
      } else {
        // Offline handling
        const existingDoc = await localDB.get('resourceTypes');
        const updatedData = existingDoc.data.map(item => 
          item._id === id ? { ...item, ...updatedData, synced: false } : item
        );
        
        await localDB.put({
          _id: 'resourceTypes',
          _rev: existingDoc._rev,
          data: updatedData
        });
        
        return { _id: id, ...updatedData };
      }
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteResourceType: async (id, token) => {
    try {
      if (navigator.onLine) {
        await axios.delete(`${API_URL}/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Update local DB
        try {
          const existingDoc = await localDB.get('resourceTypes');
          const updatedData = existingDoc.data.filter(item => item._id !== id);
          
          await localDB.put({
            _id: 'resourceTypes',
            _rev: existingDoc._rev,
            data: updatedData
          });
        } catch (dbError) {
          console.error('Local DB sync error:', dbError);
        }
        
        return id;
      } else {
        // Offline handling - mark for deletion
        const existingDoc = await localDB.get('resourceTypes');
        const updatedData = existingDoc.data.map(item => 
          item._id === id ? { ...item, _deleted: true } : item
        );
        
        await localDB.put({
          _id: 'resourceTypes',
          _rev: existingDoc._rev,
          data: updatedData
        });
        
        return id;
      }
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default resourceTypeService;