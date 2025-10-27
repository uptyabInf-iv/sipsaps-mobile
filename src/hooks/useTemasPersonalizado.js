// src/hooks/useTemasPersonalizado.js
// Hook para manejar el tema personalizado: FORZADO a modo CLARO (ignora el tema del sistema).

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
  media: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
};

export const useTemasPersonalizado = () => {
  // Forzamos tema CLARO: ignoramos useColorScheme / configuración del sistema.
  // Esto garantiza consistencia visual independientemente del modo oscuro del teléfono.
  const esOscuro = false;

  // Validar que temaGlobal exista y tenga colores, usar por defecto si no
  const coloresBase = temaGlobal?.colores || coloresPorDefecto;

  // No mezclamos con rama 'oscuro' — devolvemos siempre el tema claro definido en temaGlobal
  const colores = {
    ...coloresBase,
    // asegúrate de no incluir keys internas como 'oscuro'
  };

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

  // Log de depuración — puedes eliminar en producción
  // Muestra que forzamos tema claro
  // eslint-disable-next-line no-console
  console.log('useTemasPersonalizado: tema forzado a CLARO', {
    principal: colores?.principal,
    esOscuro,
    temaGlobalExists: !!temaGlobal,
  });

  return tema;
};