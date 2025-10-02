import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getAllUsers, updateUserProfile, deleteUserAccount, adminUpdateUser,updateSelfProfile ,deleteMeSelfProfile} from "../Services/userService";
import { checkTokenAndLogout } from '../Helper/checkTokenExpire'; 
// Thunks for async operations
export const getUsers = createAsyncThunk("users/getUserAll", async (_, {getState, rejectWithValue }) => {
    const token = getState().auth.token;
  try {
    return await getAllUsers(token);
  } catch (error) {
    return rejectWithValue(error.message);
  }
});
export const getUsersByIds = createAsyncThunk(
  "users/getUsersByIds", 
  async ({ userIds }, { getState,dispatch, rejectWithValue }) => {
    const token = getState().auth.token;
    // Check token expiration and handle logout
   if (checkTokenAndLogout(token, dispatch)) {
    return null; // Exit if the token is expired
  }
    try {
      return await getUsersByIds(userIds, token); // Call the new service function
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
// export const updateMe = createAsyncThunk(
//   "users/updateMe",
//   async (updateData, { getState, dispatch, rejectWithValue }) => { // No 'id' needed
//     const token = getState().auth.token;
//     if (checkTokenAndLogout(token, dispatch)) {
//       return null;
//     }
//     try {
//       const updatedUser = await updateSelfProfile(updateData, token);
//       // Optional: Update the user info in the auth slice if it's stored there
//       // dispatch(authActions.setUserInfo(updatedUser));
//       return updatedUser;
//     }  catch (error) {
//       if (error) {
//         const errorMessage = error.message || error || "Failed to update profile.";
//       return rejectWithValue(errorMessage);
//       }
//       // Fallback for network errors or unhandled server errors
//       return rejectWithValue(error || "Failed to update profile.");
//     }
//   }
// );
export const updateMe = createAsyncThunk(
  "users/updateMe",
  async (updateData, { getState, dispatch, rejectWithValue }) => {
    const token = getState().auth.token;
    if (checkTokenAndLogout(token, dispatch)) {
      return null;
    }
    try {
      const updatedUser = await updateSelfProfile(updateData, token);
      return updatedUser;
    } catch (error) {
      const msg = error?.message || "Failed to update profile.";
      return rejectWithValue(msg);
    }
  }
);
export const deleteMe = createAsyncThunk(
  "users/deleteMe",
  async (_, { getState, dispatch, rejectWithValue }) => { 
    const token = getState().auth.token;
    if (!token || checkTokenAndLogout(token, dispatch)) {
      return rejectWithValue("Authentication token is missing or invalid. Please log in again.");
    }
    try {
      const deletionResult = await deleteMeSelfProfile(token);
      return deletionResult; 
    } catch (error) {
    
      const errorMessage = error.message || "Failed to delete profile.";
      return rejectWithValue(errorMessage);
    }
  }
);
export const updateUser = createAsyncThunk("users/update", async ({ id, updateData}, {getState,dispatch, rejectWithValue }) => {
    const token = getState().auth.token;
    // Check token expiration and handle logout
   if (checkTokenAndLogout(token, dispatch)) {
    return null; // Exit if the token is expired
  }
  try { 
    return await updateUserProfile(id, updateData, token);
  } catch (error) {
    return rejectWithValue(error.message);
  }
});
export const updateUserByAdmin = createAsyncThunk(
  "users/updateByAdmin",
  async ({ id, updateData }, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    try {
      // Call the admin update service function
      return await adminUpdateUser(id, updateData, token);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
export const deleteUser = createAsyncThunk(
  "users/delete",
    async (userId, { getState, rejectWithValue }) => { 
    const token = getState().auth.token;
    try {
      await deleteUserAccount(userId, token);
     
      return userId; 
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
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
    // Fetch users by IDs
    builder.addCase(getUsersByIds.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getUsersByIds.fulfilled, (state, action) => {
      state.loading = false;
      state.users = action.payload;  // This replaces users with those by ID
    });
    builder.addCase(getUsersByIds.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    builder.addCase(updateUserByAdmin.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateUserByAdmin.fulfilled, (state, action) => {
      state.loading = false;
      const updatedUser = action.payload; // Assuming the payload is the updated user object
      state.users = state.users.map((user) =>
        user._id === updatedUser._id ? updatedUser : user
      );
    });
    builder.addCase(updateUserByAdmin.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    builder.addCase(updateMe.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateMe.fulfilled, (state, action) => {
      state.loading = false;
      state.users = state.users.map(user =>
      user._id === action.payload._id ? action.payload : user
      );
    });
    builder.addCase(updateMe.rejected, (state, action) => {
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

    builder.addCase(deleteUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteUser.fulfilled, (state, action) => {
      state.loading = false;
           state.users = state.users.filter((user) => user._id !== action.payload);
    });
    builder.addCase(deleteUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export default userSlice.reducer;
