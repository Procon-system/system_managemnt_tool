// src/features/notificationSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import notificationService from '../Services/notificationService';
import { checkTokenAndLogout } from '../Helper/checkTokenExpire';

const initialState = {
  items: [],
  unreadCount: 0,
  loading: false,
  error: null
};

// Thunks
export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async (_, { getState, dispatch, rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenAndLogout(token, dispatch)) return null;
    try {
      const data = await notificationService.getNotifications(token);
      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch notifications');
    }
  }
);

export const markNotificationsAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (ids, { getState, dispatch, rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenAndLogout(token, dispatch)) return null;
    try {
      await notificationService.markAsRead(ids, token);
      return ids;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to mark notifications as read');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      state.items.unshift(action.payload);
      state.unreadCount += 1;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        
        // 1. Check if the payload is an array. If not (i.e., it's null), use an empty array.
        const notifications = Array.isArray(action.payload) ? action.payload : [];

        // 2. Use this guaranteed-to-be-an-array variable for all state updates.
        state.items = notifications;
        state.unreadCount = notifications.filter(n => !n.isRead).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(markNotificationsAsRead.fulfilled, (state, action) => {
        // This reducer is now also safe because state.items is guaranteed to be an array.
        state.items = state.items.map(n => action.payload.includes(n._id) ? { ...n, isRead: true } : n);
        state.unreadCount = state.items.filter(n => !n.isRead).length;
      });
     
  }
});

export const { addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
