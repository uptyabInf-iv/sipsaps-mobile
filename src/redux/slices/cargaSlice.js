import { createSlice } from '@reduxjs/toolkit';

const cargaSlice = createSlice({
  name: 'carga',
  initialState: { estaCargando: false },
  reducers: {
    mostrarCarga: (state) => { state.estaCargando = true; },
    ocultarCarga: (state) => { state.estaCargando = false; },
  },
});

export const { mostrarCarga, ocultarCarga } = cargaSlice.actions;
export default cargaSlice.reducer;