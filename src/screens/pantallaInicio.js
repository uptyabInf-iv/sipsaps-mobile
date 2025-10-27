// src/screens/pantallaInicio.js
// Pantalla principal de bienvenida y login (mejorada):
// - Forzada a tema claro (no depende del modo del sistema).
// - Responsive para pantallas muy compactas (<=360px).
// - Iconos y botones reducidos en compact.
// - Espaciados y tamaños ajustados para mejor UX en móviles pequeños.

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Alert,
  Image,
  TextInput,
  Dimensions,
  Platform,
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COMPACT = SCREEN_WIDTH <= 360; // breakpoint para teléfonos muy compactos
const H_PADDING = COMPACT ? 12 : 40;
const LOGO_SIZE = COMPACT ? 56 : 80;
const ICON_SMALL = COMPACT ? 16 : 18;
const INPUT_HEIGHT = COMPACT ? 42 : 52;

export default function PantallaInicio() {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  // useTemasPersonalizado ya está forzado a tema claro en el hook.
  const tema = useTemasPersonalizado() || {};
  const {
    colores = {
      principal: '#4F46E5',
      secundario: '#7C3AED',
      fondo: '#F8FAFC',
      superficie: '#FFFFFF',
      textoPrincipal: '#1E293B',
      textoSecundario: '#64748B',
      error: '#FF3B30',
    },
    fuentes = {
      regular: 'System',
      negrita: 'System',
      tamanos: { pequeno: 12, medio: 16, grande: 20, titulo: 28 },
    },
    espaciados = { pequeno: 8, medio: 16, grande: 24, extraGrande: 32 },
    sombras = {},
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
    contenedor: { flex: 1 },
    vista: {
      flex: 1,
      justifyContent: vistaActual === 'login' ? 'flex-start' : 'center',
      alignItems: 'center',
      paddingHorizontal: H_PADDING,
      paddingTop: vistaActual === 'login' ? espaciados.extraGrande : 0,
    },
    logo: { width: LOGO_SIZE, height: LOGO_SIZE, marginBottom: COMPACT ? 18 : 30 },
    titulo: {
      textAlign: 'center',
      marginBottom: COMPACT ? 8 : 10,
      letterSpacing: 1.2,
      fontSize: COMPACT ? 18 : fuentes.tamanos.titulo + 2,
      fontFamily: fuentes.negrita,
      color: colores.principal,
    },
    subtitulo: {
      marginBottom: COMPACT ? 20 : 40,
      lineHeight: 20,
      paddingHorizontal: COMPACT ? 8 : 20,
      color: colores.textoSecundario,
      textAlign: 'center',
      fontSize: COMPACT ? 13 : fuentes.tamanos.medio,
    },
    checkboxContenedor: { flexDirection: 'row', alignItems: 'center', marginBottom: COMPACT ? 20 : 40 },
    checkboxTexto: { fontSize: COMPACT ? 12 : fuentes.tamanos.pequeno, marginLeft: 10, color: colores.textoSecundario },

    headerLogin: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: COMPACT ? 16 : 40 },
    tituloLogin: { textAlign: 'center', letterSpacing: 0.5, fontSize: COMPACT ? 18 : fuentes.tamanos.grande, fontFamily: fuentes.negrita },

    formulario: {
      width: '100%',
      marginBottom: COMPACT ? 18 : 30,
      backgroundColor: colores.superficie,
      borderRadius: COMPACT ? 10 : espaciados.medio,
      padding: COMPACT ? espaciados.medio : espaciados.grande,
      ...(sombras?.pequena || {}),
    },
    campo: { marginBottom: COMPACT ? 12 : 20 },
    inputContenedor: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colores.fondo,
      borderRadius: COMPACT ? 8 : espaciados.pequeno,
      borderWidth: 1.2,
      borderColor: colores.principal + '20',
      paddingHorizontal: COMPACT ? 10 : espaciados.medio,
      height: INPUT_HEIGHT,
    },
    iconoInput: { marginRight: COMPACT ? 8 : espaciados.pequeno, color: colores.principal },
    input: { flex: 1, fontSize: COMPACT ? 14 : fuentes.tamanos.medio, color: colores.textoPrincipal, paddingVertical: 0 },
    label: { fontSize: COMPACT ? 12 : fuentes.tamanos.pequeno, marginBottom: 6, color: colores.textoSecundario },
    errorMensaje: { fontSize: COMPACT ? 11 : fuentes.tamanos.pequeno - 2, color: colores.error, marginTop: 6 },

    link: { fontSize: COMPACT ? 13 : fuentes.tamanos.pequeno, marginTop: 14, color: colores.principal, textDecorationLine: 'underline' },

    // Small button spacing (BotonPrincipal should support small prop)
    botonWrapper: { width: '100%', marginTop: COMPACT ? 8 : 18, marginBottom: COMPACT ? 6 : 12 },

    indicadorCargaWrap: { marginTop: 8 },
  });

  return (
    <LinearGradient colors={[colores.fondo, colores.secundario + '08']} style={[styles.contenedor, { paddingTop: insets.top }]}>
      {vistaActual === 'bienvenida' && (
        <Animated.View style={[styles.vista, estiloBienvenida]}>
          <Image
            source={require('../assets/imagenes/logo-sipsaps.png')}
            style={styles.logo}
            accessible
            accessibilityLabel="Logo de SIPSAPS"
            resizeMode="contain"
          />
          <Text style={styles.titulo}>Bienvenido a SIPSAPS</Text>
          <Text style={styles.subtitulo}>
            Plataforma integral para la gestión eficiente de reservas médicas y seguimiento de pacientes
          </Text>

          <View style={styles.checkboxContenedor}>
            <Switch
              value={noMostrarBienvenida}
              onValueChange={setNoMostrarBienvenida}
              trackColor={{ false: colores.textoSecundario, true: colores.principal }}
              thumbColor={noMostrarBienvenida ? '#FFFFFF' : '#F4F3F4'}
              accessibilityLabel="No mostrar esta pantalla nuevamente"
            />
            <Text style={styles.checkboxTexto}>No mostrar esta pantalla nuevamente</Text>
          </View>

          <View style={styles.botonWrapper}>
            <BotonPrincipal titulo="Continuar" onPress={manejarContinuar} iconoNombre="arrow-right" small={COMPACT} />
          </View>
        </Animated.View>
      )}

      {vistaActual === 'login' && (
        <Animated.View style={[styles.vista, estiloLogin]}>
          <View style={styles.headerLogin}>
            <Image
              source={require('../assets/imagenes/logo-sipsaps.png')}
              style={{ width: COMPACT ? 36 : 40, height: COMPACT ? 36 : 40, marginRight: 8 }}
              accessible
              accessibilityLabel="Logo de SIPSAPS"
            />
            <Text style={styles.tituloLogin}>SIPSAPS</Text>
          </View>

          <Text style={[styles.tituloLogin, { color: colores.textoPrincipal, marginBottom: COMPACT ? 12 : 20 }]}>Iniciar Sesión</Text>

          <View style={styles.formulario}>
            <View style={styles.campo}>
              <Text style={styles.label}>Nombre de Usuario o Correo Electrónico</Text>
              <View style={[styles.inputContenedor, { borderColor: errorsInput.email ? colores.error : colores.principal + '20' }]}>
                <FontAwesome name="envelope" size={ICON_SMALL} style={styles.iconoInput} color={colores.principal} />
                <TextInput
                  style={styles.input}
                  placeholder="usuario@ejemplo.com"
                  placeholderTextColor={colores.textoSecundario + '60'}
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
                <FontAwesome name="lock" size={ICON_SMALL} style={styles.iconoInput} color={colores.principal} />
                <TextInput
                  style={styles.input}
                  placeholder="********"
                  placeholderTextColor={colores.textoSecundario + '60'}
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
            <BotonPrincipal titulo="Iniciar Sesión" onPress={manejarLogin} iconoNombre="sign-in" small={COMPACT} />
          </View>

          <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>

          {estaCargando && (
            <View style={styles.indicadorCargaWrap}>
              <IndicadorCarga texto="Iniciando sesión..." tamaño={COMPACT ? 'mediano' : 'grande'} tipo="bloques" />
            </View>
          )}

          <ModalGeneral visible={modalVisible} type={modalType} title={modalType === 'error' ? 'Error' : 'Éxito'} message={modalMessage} onClose={() => setModalVisible(false)} />
        </Animated.View>
      )}
    </LinearGradient>
  );
}