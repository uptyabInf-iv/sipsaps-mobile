import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import cargaReducer from './slices/cargaSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    carga: cargaReducer,
  },
});