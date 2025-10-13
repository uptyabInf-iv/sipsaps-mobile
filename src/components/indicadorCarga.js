// src/components/indicadorCarga.js
// Componente reutilizable para mostrar un indicador de carga con animaciones suaves.
// Optimizado con Reanimated: rotación infinita + fade. Soporta variantes (spinner/bloques).
// Personalizable via props: visible, texto, tamaño, tipo.

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useTemasPersonalizado } from '../hooks/useTemasPersonalizado';

export default function IndicadorCarga({ visible = true, texto = 'Cargando...', tamaño = 'grande', tipo = 'spinner' }) {
  const { colores, espaciados, fuentes } = useTemasPersonalizado();

  // Animación para spinner (rotación infinita).
  const rotacion = useSharedValue(0);
  useEffect(() => {
    if (tipo === 'spinner') {
      rotacion.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1, // Infinito.
        false
      );
    }
  }, [rotacion, tipo]);

  const estiloSpinnerAnimado = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rotacion.value}deg` }],
  }));

  // Fade para visibilidad (optimización: solo renderiza si visible).
  if (!visible) return null;

  const tamanoSpinner = tamaño === 'grande' ? 40 : 24;

  return (
    <View style={[estilos.contenedor, { backgroundColor: colores.superficie }]}>
      {tipo === 'spinner' ? (
        // Variante original: Spinner rotatorio.
        <Animated.View
          style={[
            estilos.spinner,
            { width: tamanoSpinner, height: tamanoSpinner, borderColor: colores.principal },
            estiloSpinnerAnimado,
          ]}
        />
      ) : (
        // Nueva variante: 3 bloques que se escalan secuencialmente (carga dinámica).
        <View style={estilos.contenedorBloques}>
          {[0, 1, 2].map((index) => (
            <BloqueAnimado
              key={index}
              delay={index * 300} // Secuencial: 0ms, 300ms, 600ms.
              colores={colores}
              tamano={tamaño === 'grande' ? 60 : 40}
            />
          ))}
        </View>
      )}
      <Text
        style={[
          estilos.texto,
          {
            color: colores.textoSecundario,
            fontSize: fuentes.tamanos.medio,
            marginTop: espaciados.pequeno,
          },
        ]}
        accessible={true}
        accessibilityLabel="Indicador de carga en progreso"
      >
        {texto}
      </Text>
    </View>
  );
}

// Sub-componente para bloques animados (optimizado con memo para rendimiento).
const BloqueAnimado = React.memo(({ delay, colores, tamano }) => {
  const escala = useSharedValue(0.2); // Empieza pequeño (simula vacío).

  useEffect(() => {
    escala.value = withDelay(
      delay,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }) // Escala suave, profesional.
    );
  }, [escala, delay]);

  const estiloBloqueAnimado = useAnimatedStyle(() => ({
    transform: [{ scaleX: escala.value }], // "Llena" horizontalmente para efecto dinámico.
    backgroundColor: colores.principal, // Indigo o color del tema.
  }));

  return (
    <Animated.View
      style={[
        estilos.bloque,
        { width: tamano, height: 8, borderRadius: 4 },
        estiloBloqueAnimado,
      ]}
      accessible={false} // Sub-elemento, no accesible individualmente.
    />
  );
});

const estilos = StyleSheet.create({
  contenedor: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderRadius: 8,
  },
  spinner: {
    borderWidth: 3,
    borderRadius: 20, // Círculo perfecto.
    borderTopColor: 'transparent', // Solo borde principal con color.
  },
  contenedorBloques: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginBottom: 10,
  },
  bloque: {
    // Estilo base para bloques (animado via shared value).
  },
  texto: {
    textAlign: 'center',
  },
});