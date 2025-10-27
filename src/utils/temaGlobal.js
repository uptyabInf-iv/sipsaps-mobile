// src/utils/temaGlobal.js
// Tema global (FORZADO A CLARO)
// Este archivo define el tema global de la app. Se eliminó la rama de tema oscuro
// para que la aplicación utilice siempre el tema claro.

export const temaGlobal = {
  // Colores (tema claro fijo): elegidos para accesibilidad (contraste >4.5:1 para texto).
  colores: {
    principal: '#4F46E5', // Indigo moderno, vibrante pero calmado.
    secundario: '#7C3AED', // Violeta indigo para acentos.
    fondo: '#F8FAFC', // Gris azulado suave (agradable a la vista).
    superficie: '#FFFFFF', // Blanco puro para bloques.
    textoPrincipal: '#1E293B', // Gris oscuro para texto.
    textoSecundario: '#64748B', // Gris medio.
    error: '#FF3B30',
    exito: '#34C759',
    // Nota: el objeto de configuración para tema oscuro se removió a propósito
    // para que la app utilice siempre colores del tema claro.
  },

  // Fuentes: Usa sistema para compatibilidad y accesibilidad (escalables).
  fuentes: {
    regular: 'System',
    media: 'System',
    negrita: 'System',
    tamanos: {
      pequeno: 12,
      medio: 16,
      grande: 20,
      titulo: 28,
    },
  },

  // Espaciados: Escala consistente (basada en 8px) para ritmos visuales ordenados.
  espaciados: {
    extraPequenio: 4,
    pequeno: 8,
    medio: 16,
    grande: 24,
    extraGrande: 32,
  },

  // Bordes redondeados: Para componentes como botones o cards.
  radioBordes: {
    pequeno: 4,
    medio: 8,
    grande: 12,
  },

  // Sombras: Para profundidad (iOS y Android compatibles).
  sombras: {
    pequena: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
      elevation: 3, // Solo para Android.
    },
    media: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 6,
    },
  },
};