import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_BASE_URL}/api`;

const axiosInstance = axios.create({
  baseURL: API_URL,
});

// Create a function that ACCEPTS the store and sets up the interceptor.
export const setupAxiosInterceptors = (store) => {
  axiosInstance.interceptors.request.use(
    (config) => {
      // Now we get the token from the store that was passed in.
      const token = store.getState().auth.token; 
      
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
};

export default axiosInstance;