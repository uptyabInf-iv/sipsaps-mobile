// src/screens/pantallaInicio.js
// Pantalla principal de bienvenida y login (estilo inspirado en Pinterest, solo UX - sin tocar lógica)
// - Mantiene toda la lógica original (validaciones, llamadas API, redux, AsyncStorage).
// - Cambios UX:
//   * Estilo tipo "card" central, colores suaves, tipografía espaciosa parecida a Pinterest.
//   * Inputs minimalistas (solo 2 campos) con bordes redondeados, sombras sutiles y buen espaciado.
//   * Botón principal prominente con bordes redondeados y micro-sombra.
//   * Se elimina el enlace "¿Olvidaste tu contraseña?" (como pediste).
//   * Se mejoró el comportamiento en teléfonos pequeños (padding, evitar solapamiento con bordes / safe area).
// - Nota: No modifiqué la lógica de login ni las conexiones API.

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Image,
  TextInput,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BotonPrincipal from '../components/botonPrincipal';
import IndicadorCarga from '../components/indicadorCarga';
import ModalGeneral from '../components/modalGeneral';
import { useTemasPersonalizado } from '../hooks/useTemasPersonalizado';
import { useManejoCarga } from '../hooks/useManejoCarga';
import api from '../utils/api';
import { useDispatch } from 'react-redux';
import { setUser } from '../redux/slices/userSlice';
import { validarLogin } from '../utils/validator';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const COMPACT = SCREEN_WIDTH <= 360; // breakpoint para teléfonos muy compactos
const H_PADDING = COMPACT ? 14 : 30;
const LOGO_SIZE = COMPACT ? 56 : 84;
const ICON_SMALL = COMPACT ? 16 : 20;
const INPUT_HEIGHT = COMPACT ? 44 : 56;

export default function PantallaInicio() {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  // useTemasPersonalizado (usamos valores por defecto si no existe)
  const tema = useTemasPersonalizado() || {};
  const {
    colores = {
      principal: '#E60023', // rojo estilo Pinterest
      secundario: '#FF7BAC',
      fondo: '#FFF7F7',
      superficie: '#FFFFFF',
      textoPrincipal: '#0F172A',
      textoSecundario: '#64748B',
      error: '#FF3B30',
    },
    fuentes = {
      regular: 'System',
      negrita: 'System',
      tamanos: { pequeno: 12, medio: 16, grande: 20, titulo: 28 },
    },
    espaciados = { pequeno: 8, medio: 16, grande: 24, extraGrande: 32 },
    sombras = {
      pequena: { shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2 },
      media: { shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 4 },
    },
  } = tema;

  const { estaCargando, ejecutarConCarga } = useManejoCarga(false);

  const [vistaActual, setVistaActual] = useState('bienvenida');
  const [noMostrarBienvenida, setNoMostrarBienvenida] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorsInput, setErrorsInput] = useState({});

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('error');
  const [modalMessage, setModalMessage] = useState('');

  const opacidadBienvenida = useSharedValue(1);
  const opacidadLogin = useSharedValue(0);

  useEffect(() => {
    const cargarPreferencia = async () => {
      try {
        const valor = await AsyncStorage.getItem('noMostrarBienvenida');
        if (valor === 'true') {
          setNoMostrarBienvenida(true);
          setVistaActual('login');
          opacidadBienvenida.value = 0;
          opacidadLogin.value = 1;
        }
      } catch (error) {
        console.log('Error cargando preferencia:', error);
      }
    };
    cargarPreferencia();
  }, []);

  const validarInput = (campo, value) => {
    const errors = validarLogin(
      campo === 'email' ? value : email,
      campo === 'password' ? value : password
    );
    setErrorsInput(errors);
  };

  const onBlurEmail = () => validarInput('email', email);
  const onBlurPassword = () => validarInput('password', password);

  const manejarContinuar = async () => {
    opacidadBienvenida.value = withTiming(0, { duration: 320, easing: Easing.out(Easing.ease) });
    opacidadLogin.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.ease) });
    setVistaActual('login');

    if (noMostrarBienvenida) {
      try {
        await AsyncStorage.setItem('noMostrarBienvenida', 'true');
      } catch (error) {
        console.log('Error guardando preferencia:', error);
      }
    }
  };

  const manejarLogin = async () => {
    const errors = validarLogin(email, password);
    if (Object.keys(errors).length > 0) {
      setErrorsInput(errors);
      return;
    }

    const usernameOrEmailLower = email.toLowerCase().trim();

    try {
      await ejecutarConCarga(async () => {
        const result = await api.post('/auth/login', {
          usernameOrEmail: usernameOrEmailLower,
          password,
        });
        dispatch(setUser(result));
        await AsyncStorage.setItem('jwt', result.token);
        await AsyncStorage.setItem('user', JSON.stringify(result.user));
      });
    } catch (error) {
      setModalType('error');
      setModalMessage(
        (error?.message || '').includes('401')
          ? 'Credenciales incorrectas. Verifica usuario/contraseña.'
          : 'Error al iniciar sesión. Intenta nuevamente.'
      );
      setModalVisible(true);
    }
  };

  const estiloBienvenida = useAnimatedStyle(() => ({ opacity: opacidadBienvenida.value }));
  const estiloLogin = useAnimatedStyle(() => ({ opacity: opacidadLogin.value }));

  const styles = StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: colores.fondo,
    },
    pantallaCentro: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: H_PADDING,
      paddingTop: insets.top + 12,
      paddingBottom: Math.max(insets.bottom, 12),
    },

    // Card principal centrada (Pinterest-like)
    card: {
      width: '100%',
      backgroundColor: colores.superficie,
      borderRadius: 20,
      paddingVertical: COMPACT ? 18 : 26,
      paddingHorizontal: COMPACT ? 14 : 22,
      alignItems: 'center',
      ...(sombras.media || {}),
      minWidth: 300,
    },

    logo: {
      width: LOGO_SIZE,
      height: LOGO_SIZE,
      marginBottom: COMPACT ? 12 : 18,
      borderRadius: 12,
    },
    tituloGrande: {
      fontSize: COMPACT ? 20 : fuentes.tamanos.titulo,
      fontFamily: fuentes.negrita,
      color: colores.textoPrincipal,
      marginBottom: 8,
      letterSpacing: 0.6,
    },
    descripcion: {
      fontSize: COMPACT ? 12 : fuentes.tamanos.medio,
      color: colores.textoSecundario,
      textAlign: 'center',
      marginBottom: COMPACT ? 12 : 18,
      paddingHorizontal: COMPACT ? 6 : 12,
    },

    // Formulario minimalista
    formulario: {
      width: '100%',
      marginTop: 4,
    },
    campo: { marginBottom: COMPACT ? 10 : 14 },
    inputContenedor: {
      flexDirection: 'row',
      alignItems: 'center',
      height: INPUT_HEIGHT,
      backgroundColor: '#fff',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colores.principal + '20',
      paddingHorizontal: 12,
    },
    iconoInput: { marginRight: 10 },
    input: {
      flex: 1,
      fontSize: COMPACT ? 14 : fuentes.tamanos.medio,
      color: colores.textoPrincipal,
      paddingVertical: 0,
    },
    label: {
      fontSize: COMPACT ? 12 : 13,
      color: colores.textoSecundario,
      marginBottom: 6,
    },
    errorMensaje: {
      fontSize: COMPACT ? 11 : 12,
      color: colores.error,
      marginTop: 6,
    },

    // Switch row
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      width: '100%',
      marginTop: COMPACT ? 8 : 12,
      marginBottom: COMPACT ? 6 : 12,
    },
    switchText: {
      marginLeft: 10,
      color: colores.textoSecundario,
      fontSize: COMPACT ? 12 : 13,
    },

    botonWrapper: {
      width: '100%',
      marginTop: COMPACT ? 10 : 18,
    },

    // Footer small
    footerSmall: {
      marginTop: COMPACT ? 8 : 12,
      alignItems: 'center',
    },

    // Accessibility spacing & safe touch area
    safeAreaBuffer: {
      height: Math.max(insets.bottom, 12),
    },

    // Adjustments for very small screens to prevent overflow
    smallScreenSpacer: {
      height: Math.max(0, (SCREEN_HEIGHT < 640 ? 8 : 18)),
    },
  });

  return (
    <LinearGradient colors={[colores.fondo, colores.secundario + '06']} style={[styles.contenedor]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.pantallaCentro}>
            {/* Bienvenida / Login swap */}
            {vistaActual === 'bienvenida' && (
              <Animated.View style={[styles.card, estiloBienvenida]}>
                <Image
                  source={require('../assets/imagenes/logo-sipsaps.png')}
                  style={styles.logo}
                  accessible
                  accessibilityLabel="Logo de SIPSAPS"
                  resizeMode="contain"
                />
                <Text style={styles.tituloGrande}>Bienvenido a SIPSAPS</Text>
                <Text style={styles.descripcion}>
                  Gestiona y reserva citas médicas desde la comodidad de tu teléfono
                </Text>

                <View style={styles.switchRow}>
                  <Switch
                    value={noMostrarBienvenida}
                    onValueChange={setNoMostrarBienvenida}
                    trackColor={{ false: colores.textoSecundario + '40', true: colores.principal }}
                    thumbColor={noMostrarBienvenida ? '#fff' : '#F4F3F4'}
                    accessibilityLabel="No mostrar esta pantalla nuevamente"
                  />
                  <Text style={styles.switchText}>No mostrar esta pantalla nuevamente</Text>
                </View>

                <View style={styles.botonWrapper}>
                  <BotonPrincipal titulo="Continuar" onPress={manejarContinuar} iconoNombre="arrow-right" small={COMPACT} />
                </View>
              </Animated.View>
            )}

            {vistaActual === 'login' && (
              <Animated.View style={[styles.card, estiloLogin]}>
                <Image
                  source={require('../assets/imagenes/logo-sipsaps.png')}
                  style={[styles.logo, { width: COMPACT ? 48 : 64, height: COMPACT ? 48 : 64 }]}
                  accessible
                  accessibilityLabel="Logo de SIPSAPS"
                />
                <Text style={styles.tituloGrande}>Iniciar sesión</Text>
                <Text style={styles.descripcion}>Accede con tu usuario o correo electrónico</Text>

                <View style={styles.formulario}>
                  <View style={styles.campo}>
                    <Text style={styles.label}>Usuario o correo</Text>
                    <View style={[styles.inputContenedor, { borderColor: errorsInput.email ? colores.error : colores.principal + '20' }]}>
                      <FontAwesome name="user" size={ICON_SMALL} color={colores.principal} style={styles.iconoInput} />
                      <TextInput
                        style={styles.input}
                        placeholder="usuario@ejemplo.com"
                        placeholderTextColor={colores.textoSecundario + '70'}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="next"
                        blurOnSubmit={false}
                        accessibilityLabel="Ingresa tu nombre de usuario o email"
                        onBlur={onBlurEmail}
                      />
                    </View>
                    {errorsInput.email ? <Text style={styles.errorMensaje}>{errorsInput.email}</Text> : null}
                  </View>

                  <View style={styles.campo}>
                    <Text style={styles.label}>Contraseña</Text>
                    <View style={[styles.inputContenedor, { borderColor: errorsInput.password ? colores.error : colores.principal + '20' }]}>
                      <FontAwesome name="lock" size={ICON_SMALL} color={colores.principal} style={styles.iconoInput} />
                      <TextInput
                        style={styles.input}
                        placeholder="********"
                        placeholderTextColor={colores.textoSecundario + '70'}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoCapitalize="none"
                        returnKeyType="done"
                        onSubmitEditing={manejarLogin}
                        accessibilityLabel="Ingresa tu contraseña"
                        onBlur={onBlurPassword}
                      />
                    </View>
                    {errorsInput.password ? <Text style={styles.errorMensaje}>{errorsInput.password}</Text> : null}
                  </View>
                </View>

                <View style={styles.botonWrapper}>
                  <BotonPrincipal titulo="Iniciar sesión" onPress={manejarLogin} iconoNombre="sign-in" small={COMPACT} />
                </View>

                {estaCargando && (
                  <View style={{ marginTop: 12 }}>
                    <IndicadorCarga texto="Iniciando sesión..." tamaño={COMPACT ? 'mediano' : 'grande'} tipo="bloques" />
                  </View>
                )}
              </Animated.View>
            )}

            <View style={styles.smallScreenSpacer} />

            <View style={styles.safeAreaBuffer} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ModalGeneral visible={modalVisible} type={modalType} title={modalType === 'error' ? 'Error' : 'Éxito'} message={modalMessage} onClose={() => setModalVisible(false)} />
    </LinearGradient>
  );
}