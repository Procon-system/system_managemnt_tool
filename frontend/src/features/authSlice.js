
import { createSlice } from "@reduxjs/toolkit";
import checkTokenExpiration from "../Helper/checkTokenExpire";
import {jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import { resetToastFlag } from '../Helper/checkTokenExpire';

const initialState = {
  user: null,
  token: null,
  isLoggedIn: false,
  access_level: null, // Add accessLevel to track user permissions
};
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action) => {
      console.log("action.payload",action.payload)
      const { token, user, access_level } = action.payload;
    
      if (checkTokenExpiration(token)) {
        throw new Error("Token is expired"); // Prevent setting expired token
      }
    
      state.token = token;
      state.user = user;
      state.access_level = access_level;
      state.isLoggedIn = true;
      resetToastFlag();
      const { exp } = jwtDecode(token);
      const expiresIn = exp * 1000 - Date.now();
    
      // Set timeout to log out the user when the token expires
      setTimeout(() => {
        toast.error("Your session has expired. Please log in again.");
        window.Storage.dispatch(logout()); // Use the globally accessible store

      }, expiresIn);
    },
    
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.access_level = null; // Clear accessLevel
      state.isLoggedIn = false;
      localStorage.removeItem('token');
sessionStorage.removeItem('token');
    },
  },
});

export const { login, logout } = authSlice.actions;

export default authSlice.reducer;
