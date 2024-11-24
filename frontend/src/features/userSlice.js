import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getAllUsers, updateUserProfile, deleteUserAccount } from "../Services/userService";

// Thunks for async operations
export const getUsers = createAsyncThunk("users/getUserAll", async (_, {getState, rejectWithValue }) => {
    const token = getState().auth.token;
  try {
    return await getAllUsers(token);
  } catch (error) {
    return rejectWithValue(error.message);
  }
});
// async ({ toolId, updatedData }, {getState, rejectWithValue }) => {
export const updateUser = createAsyncThunk("users/update", async ({ id, updateData}, {getState, rejectWithValue }) => {
    const token = getState().auth.token;
  try {
    return await updateUserProfile(id, updateData, token);
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const deleteUser = createAsyncThunk("users/delete", async ({ id }, {getState, rejectWithValue }) => {
    const token = getState().auth.token;
  try {
    return await deleteUserAccount(id, token);
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

// Initial state
const initialState = {
  users: [],
  loading: false,
  error: null,
};

// User slice
const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Fetch users
    builder.addCase(getUsers.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getUsers.fulfilled, (state, action) => {
      state.loading = false;
      state.users = action.payload;
    });
    builder.addCase(getUsers.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Update user
    builder.addCase(updateUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateUser.fulfilled, (state, action) => {
      state.loading = false;
      const updatedUser = action.payload.user;
      state.users = state.users.map((user) =>
        user.id === updatedUser.id ? updatedUser : user
      );
    });
    builder.addCase(updateUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Delete user
    builder.addCase(deleteUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteUser.fulfilled, (state, action) => {
      state.loading = false;
      const deletedUserId = action.meta.arg.id;
      state.users = state.users.filter((user) => user.id !== deletedUserId);
    });
    builder.addCase(deleteUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export default userSlice.reducer;
