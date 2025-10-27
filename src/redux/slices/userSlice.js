// src/redux/slices/userSlice.js
// Slice para estado de usuario: Login guarda user/token, logout limpia.

import { createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
  name: 'user',
  initialState: {
    user: null, // { id_usuario, nombre, rol, etc. } de login.
    token: null, // JWT de sesión.
    isAuthenticated: false,
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, logout } = userSlice.actions;
export default userSlice.reducer;
