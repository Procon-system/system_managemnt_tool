
import { configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web
import authReducer from '../features/authSlice';
import taskReducer from '../features/taskSlice';
import toolReducer from '../features/toolsSlice';
import materialReducer from '../features/materialsSlice';
import facilityReducer from '../features/facilitySlice';
import machineReducer from '../features/machineSlice';
import userSlice from '../features/userSlice';
import { combineReducers } from 'redux';

// Define persist configuration for the auth slice
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'], // Only persist the auth slice
};

// Combine all reducers
const rootReducer = combineReducers({
  auth: authReducer,
  tasks: taskReducer,
  tools: toolReducer,
  materials: materialReducer,
  facilities: facilityReducer,
  machines: machineReducer,
  users:userSlice,
});

// Wrap the root reducer with persistReducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
});

export const persistor = persistStore(store);
export default store;
