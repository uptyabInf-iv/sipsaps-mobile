// src/hooks/useManejoCarga.js
// Hook para manejar estado de carga: muestra/oculta el IndicadorCarga.
// Soporta integración con API futura via utils/api.js.

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux'; // Para Redux global (opcional).

export const useManejoCarga = (esGlobal = false) => {
  // Prop: true para carga app-wide.
  const [estaCargandoLocal, setEstaCargandoLocal] = useState(false);
  const dispatch = useDispatch();
  const estaCargandoGlobal = useSelector(
    (state) => state.carga?.estaCargando || false
  ); // Asume slice 'carga' en Redux.

  const mostrarCarga = () => {
    if (esGlobal) {
      dispatch({ type: 'carga/mostrar' }); // Acción Redux futura.
    } else {
      setEstaCargandoLocal(true);
    }
  };

  const ocultarCarga = () => {
    if (esGlobal) {
      dispatch({ type: 'carga/ocultar' });
    } else {
      setEstaCargandoLocal(false);
    }
  };

  const estaCargando = esGlobal ? estaCargandoGlobal : estaCargandoLocal;

  // Integración futura con API: Ejemplo de uso.
  const ejecutarConCarga = async (funcionApi) => {
    mostrarCarga();
    try {
      const resultado = await funcionApi(); // Llama API.
      return resultado;
    } catch (error) {
      console.error('Error en carga:', error); // Log específico.
      throw error; // Propaga para handleError en caller.
    } finally {
      ocultarCarga(); // Siempre oculta loader, incluso error.
    }
  };
  return { estaCargando, mostrarCarga, ocultarCarga, ejecutarConCarga };
};
