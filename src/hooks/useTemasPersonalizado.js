// src/hooks/useTemasPersonalizado.js
// Hook personalizado que proporciona el tema global a los componentes.
// Detecta tema oscuro del dispositivo para accesibilidad dinámica.

import { useColorScheme } from 'react-native';
import { temaGlobal } from '../utils/temaGlobal';

export const useTemasPersonalizado = () => {

  const esquemaColor = useColorScheme(); // 'light' o 'dark' del sistema.

  const esOscuro = esquemaColor === 'dark';


  // Selecciona colores según el modo (claro u oscuro).
  const colores = esOscuro ? temaGlobal.colores.oscuro : temaGlobal.colores;

  const fuentes = temaGlobal.fuentes;

  const espaciados = temaGlobal.espaciados;

  const radioBordes = temaGlobal.radioBordes;

  const sombras = temaGlobal.sombras;

  return {
    colores,

    fuentes,

    espaciados,

    radioBordes,

    sombras,

    esOscuro, // Útil para lógica extra (ej.: iconos).

  };
};