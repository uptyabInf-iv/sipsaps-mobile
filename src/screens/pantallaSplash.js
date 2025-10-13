// src/screens/pantallaSplash.js
// Pantalla inicial de splash: Logo animado + texto con bloques dinámicos en indigo.
// Carga secuencial elegante; navega auto post-simulación.

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native'; // Image para PNG.
import { SvgUri } from 'react-native-svg'; // Si usas SVG (opcional).
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import IndicadorCarga from '../components/indicadorCarga';
import { useTemasPersonalizado } from '../hooks/useTemasPersonalizado';
import { useSelector } from 'react-redux';
import { useManejoCarga } from '../hooks/useManejoCarga';

export default function PantallaSplash() {
  const navigation = useNavigation();
  const { colores, fuentes, espaciados } = useTemasPersonalizado();
  const estaCargando = useSelector((state) => state.carga.estaCargando);
  const { ejecutarConCarga } = useManejoCarga(true);

  // Valores para animaciones: Logo, texto independientes.
  const opacidadLogo = useSharedValue(0);
  const escalaLogo = useSharedValue(0.7);
  const opacidadTexto = useSharedValue(0);
  const traslacionY = useSharedValue(20);

  useEffect(() => {
    // Secuencia: Logo (0.3s delay), texto (0.8s), bloques en loader.
    opacidadLogo.value = withDelay(
      300,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) })
    );
    escalaLogo.value = withTiming(1, {
      duration: 1000,
      easing: Easing.out(Easing.back(0.5)) // Escala con rebote sutil, profesional.
    });

    opacidadTexto.value = withDelay(
      600, // Después del logo.
      withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) })
    );
    traslacionY.value = withTiming(0, {
      duration: 1000,
      easing: Easing.out(Easing.cubic)
    });

    // Carga simulada (3s total).
    ejecutarConCarga(async () => {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }).then(() => {
      navigation.replace('Inicio');
    });
  }, [navigation, ejecutarConCarga]);

  // Estilos animados.
  const estiloLogoAnimado = useAnimatedStyle(() => ({
    opacity: opacidadLogo.value,
    transform: [{ scale: escalaLogo.value }],
  }));

  const estiloTextoAnimado = useAnimatedStyle(() => ({
    opacity: opacidadTexto.value,
    transform: [{ translateY: traslacionY.value }],
  }));

  return (
    <LinearGradient
      colors={[colores.fondo, colores.secundario + '20']}
      style={estilos.contenedor}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Logo animado arriba. */}
      <Animated.View style={[estilos.logoContenedor, estiloLogoAnimado]}>
        {/* Para PNG: */}
        <Image
          source={require('../assets/imagenes/logo-sipsaps.png')} // Ajusta ruta.
          style={estilos.logo}
          accessible={true}
          accessibilityLabel="Logo de SIPSAPS"
          resizeMode="contain"
        />
        {/* O para SVG (comenta Image y descomenta esto): */}
        {/* <SvgUri
          width="100"
          height="100"
          uri={require('../assets/icono-sipsaps.svg')} // Local SVG.
          style={estilos.logo}
        /> */}
      </Animated.View>

      {/* Texto debajo del logo. */}
      <Animated.Text
        style={[
          estilos.textoPrincipal,
          {
            color: colores.principal,
            fontSize: fuentes.tamanos.titulo,
            fontFamily: fuentes.negrita,
          },
          estiloTextoAnimado,
        ]}
        accessible={true}
        accessibilityRole="header"
      >
        IPSPUPTYAB - SIPSAPS
      </Animated.Text>

      {/* Loader con bloques. */}
      <IndicadorCarga
        visible={estaCargando}
        texto="Cargando módulos..."
        tamaño="grande"
        tipo="bloques"
      />
    </LinearGradient>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  logoContenedor: {
    marginBottom: 20, // Espacio entre logo y texto.
  },
  logo: {
    width: 100,
    height: 100, // Tamaño fijo, escalable.
  },
  textoPrincipal: {
    textAlign: 'center',
    marginBottom: 50,
    letterSpacing: 3,
    textShadowColor: 'rgba(79, 70, 229, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});