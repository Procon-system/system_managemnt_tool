import axios from 'axios';

// The API URL should point to your new reporting endpoint
const API_URL = `${process.env.REACT_APP_API_BASE_URL}/api/tasks/report-data`;

const analyticsService = {
  /**
   * Fetches task data for the analytics report.
   * @param {object} filters - An object containing filter parameters like startDate, endDate, userId.
   * @param {string} token - The user's authentication token.
   * @returns {Promise<Array>} A promise that resolves to the array of task data.
   */
  getAnalyticsData: async (filters, token) => {
    try {
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
        // Axios will automatically append these to the URL as query parameters
        params: filters 
      });
      return response.data.data; // Return the 'data' array from your API response
    } catch (error) {
      // Re-throw a standardized error object for the slice to handle
      throw error.response?.data || { message: error.message };
    }
  },

  // You can add other analytics-related API calls here in the future
  // e.g., getFilterOptions, getSavedReportViews, etc.
};

export default analyticsService;