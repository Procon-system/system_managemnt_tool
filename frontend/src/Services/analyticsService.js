
import axios from 'axios';

import qs from 'qs';

const API_URL = `${process.env.REACT_APP_API_BASE_URL}/api/tasks/report-data`;

const analyticsService = {
  getAnalyticsData: async (filters, token) => {
    try {
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters,
        
        paramsSerializer: params => {
            // Now 'qs' is correctly defined and can be used.
            return qs.stringify(params, { arrayFormat: 'repeat' });
        }
      });
      return response.data.data; 
    } catch (error) {
      // Re-throw a standardized error object for the slice/thunk to handle
      throw error.response?.data || { message: error.message };
    }
  },
};

export default analyticsService;