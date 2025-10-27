// src/hooks/useTemasPersonalizado.js
// Hook para manejar el tema personalizado: Claro/oscuro según sistema, con validaciones robustas y fallbacks.

import { useColorScheme } from 'react-native';
import { temaGlobal } from '../utils/temaGlobal';

// Objeto de colores por defecto si temaGlobal falla
const coloresPorDefecto = {
  principal: '#4F46E5', // Indigo moderno
  secundario: '#7C3AED', // Violeta indigo
  fondo: '#F8FAFC', // Gris azulado
  superficie: '#FFFFFF', // Blanco puro
  textoPrincipal: '#1E293B', // Gris oscuro
  textoSecundario: '#64748B', // Gris medio
  error: '#FF3B30',
  exito: '#34C759',
  oscuro: {
    fondo: '#0F172A', // Azul indigo oscuro
    superficie: '#1C1C1E',
    textoPrincipal: '#FFFFFF',
    textoSecundario: '#8E8E93',
  },
};

// Defaults para otras props
const fuentesPorDefecto = {
  regular: 'System',
  media: 'System',
  negrita: 'System',
  tamanos: {
    pequeno: 12,
    medio: 16,
    grande: 20,
    titulo: 28,
  },
};
const espaciadosPorDefecto = {
  extraPequenio: 4,
  pequeno: 8,
  medio: 16,
  grande: 24,
  extraGrande: 32,
};
const radioBordesPorDefecto = {
  pequeno: 4,
  medio: 8,
  grande: 12,
};
const sombrasPorDefecto = {
  pequena: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
};

export const useTemasPersonalizado = () => {
  const esquemaColor = useColorScheme();
  const esOscuro = esquemaColor === 'dark';

  // Validar que temaGlobal exista y tenga colores, usar por defecto si no
  const coloresBase = temaGlobal?.colores || coloresPorDefecto;

  // Fusionar colores base con oscuro si es necesario
  const colores = esOscuro
    ? {
        ...coloresBase,
        ...coloresBase.oscuro,
      }
    : coloresBase;

  // Asignar el resto de las propiedades con fallbacks
  const fuentes = temaGlobal?.fuentes || fuentesPorDefecto;
  const espaciados = temaGlobal?.espaciados || espaciadosPorDefecto;
  const radioBordes = temaGlobal?.radioBordes || radioBordesPorDefecto;
  const sombras = temaGlobal?.sombras || sombrasPorDefecto;

  // Objeto tema completo
  const tema = {
    colores,
    fuentes,
    espaciados,
    radioBordes,
    sombras,
    esOscuro,
  };

  // Depuración mejorada (quita en prod)
  console.log('Tema cargado:', {
    principal: colores?.principal,
    esOscuro,
    temaGlobalExists: !!temaGlobal,
    coloresExists: !!temaGlobal?.colores,
  });

  return tema;
};
