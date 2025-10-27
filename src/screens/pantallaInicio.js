// Pantalla principal de bienvenida y login: Flujo secuencial minimalista para SIPSAPS.
// Vista 1: Bienvenida profesional con checkbox. Vista 2: Login elegante como catálogo con inputs activos.
// Optimizado para futuro: Integración API y persistencia. Colores indigo dinámicos. Case-insensitive login.

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons'; // Iconos para inputs y botón.
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Para persistencia futura.
import BotonPrincipal from '../components/botonPrincipal';
import IndicadorCarga from '../components/indicadorCarga';
import ModalGeneral from '../components/modalGeneral'; // Modal para backend errors.
import { useTemasPersonalizado } from '../hooks/useTemasPersonalizado';
import { useManejoCarga } from '../hooks/useManejoCarga';
import api from '../utils/api'; // API conexión.
import { useDispatch } from 'react-redux';
import { setUser } from '../redux/slices/userSlice'; // Redux user.
import { validarLogin } from '../utils/validator'; // Validación dinámica.

export default function PantallaInicio() {
  const dispatch = useDispatch(); // Para Redux.
  const insets = useSafeAreaInsets();

  const tema = useTemasPersonalizado() || {};
  const {
    colores = {}, // Usar un objeto vacío como fallback para 'colores'
    fuentes = {}, // Usar un objeto vacío como fallback para 'fuentes'
    espaciados = {},
    sombras = {},
  } = tema;

  const { estaCargando, ejecutarConCarga } = useManejoCarga(false);

  // Estados generales: Vista actual, checkbox no mostrar bienvenida.
  const [vistaActual, setVistaActual] = useState('bienvenida'); // 'bienvenida' o 'login'.
  const [noMostrarBienvenida, setNoMostrarBienvenida] = useState(false);

  // Estados para login (activos para escribir).
  const [email, setEmail] = useState(''); // UsernameOrEmail.
  const [password, setPassword] = useState('');

  // Estados para validación dinámica.
  const [errorsInput, setErrorsInput] = useState({}); // { email: 'msg', password: 'msg' }.

  // Estados para modal backend errors.
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('error');
  const [modalMessage, setModalMessage] = useState('');

  // Animación fade: Shared values específicas por vista.
  const opacidadBienvenida = useSharedValue(1);
  const opacidadLogin = useSharedValue(0);

  // Cargar preferencia checkbox al montar (persistente).
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

  // Validación dinámica por campo (onBlur/onChange).
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
    // Fade out bienvenida, fade in login.
    opacidadBienvenida.value = withTiming(0, {
      duration: 400,
      easing: Easing.out(Easing.ease),
    });
    opacidadLogin.value = withTiming(1, {
      duration: 400,
      easing: Easing.out(Easing.ease),
    });
    setVistaActual('login');

    // Guardar preferencia si checkbox marcado.
    if (noMostrarBienvenida) {
      try {
        await AsyncStorage.setItem('noMostrarBienvenida', 'true');
      } catch (error) {
        console.log('Error guardando preferencia:', error);
      }
    }
  };

  const manejarLogin = async () => {
    // Validación global antes de API.
    const errors = validarLogin(email, password);
    if (Object.keys(errors).length > 0) {
      setErrorsInput(errors); // Muestra spans.
      return;
    }

    // Lowercase para case-insensitive (username/email).
    const usernameOrEmailLower = email.toLowerCase().trim(); // Trim para espacios.

    try {
      await ejecutarConCarga(async () => {
        const result = await api.post('/auth/login', {
          usernameOrEmail: usernameOrEmailLower, // Envía lower para backend ILIKE.
          password,
        });
        // Guarda en Redux y AsyncStorage.
        dispatch(setUser(result)); // AppNavigator cambiará a MainApp al observar isAuthenticated=true
        await AsyncStorage.setItem('jwt', result.token);
        await AsyncStorage.setItem('user', JSON.stringify(result.user));
        // Corrección recomendada: no navegar manualmente; AppNavigator conmuta automáticamente.
      });
    } catch (error) {
      // Backend errors en modal (e.g., 401 "Credenciales incorrectas").
      setModalType('error');
      setModalMessage(
        error.message.includes('401')
          ? 'Credenciales incorrectas. Verifica usuario/contraseña.'
          : 'Error al iniciar sesión. Intenta de nuevo.'
      );
      setModalVisible(true);
    }
  };

  // Estilos animados específicos.
  const estiloBienvenida = useAnimatedStyle(() => ({
    opacity: opacidadBienvenida.value,
  }));
  const estiloLogin = useAnimatedStyle(() => ({
    opacity: opacidadLogin.value,
  }));

  // Estilos dinámicos: Dentro del componente para acceso a fuentes/colores (scope seguro).
  const estilos = StyleSheet.create({
    contenedor: {
      flex: 1,
    },
    vista: {
      flex: 1,
      justifyContent: vistaActual === 'login' ? 'flex-start' : 'center', // Sube contenido en login.
      alignItems: 'center',
      paddingHorizontal: 40,
      paddingTop: vistaActual === 'login' ? espaciados.extraGrande : 0, // Padding top para centrar arriba en login.
    },
    logo: {
      width: 80,
      height: 80,
      marginBottom: 30,
    },
    titulo: {
      textAlign: 'center',
      marginBottom: 10,
      letterSpacing: 1.5,
    },
    subtitulo: {
      marginBottom: 40,
      lineHeight: 22,
      paddingHorizontal: 20,
    },
    checkboxContenedor: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 40,
    },
    checkboxTexto: {
      fontSize: fuentes.tamanos.pequeno,
      marginLeft: 10,
    },
    // Header para login (logo + título alineados).
    headerLogin: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      marginBottom: 40,
    },
    tituloLogin: {
      textAlign: 'center',
      letterSpacing: 0.5,
      fontSize: fuentes.tamanos.grande,
      fontFamily: fuentes.negrita,
    },
    formulario: {
      width: '100%',
      marginBottom: 30,
      backgroundColor: colores.superficie, // Tarjeta blanca para catálogo.
      borderRadius: espaciados.medio,
      padding: espaciados.grande,
      ...sombras.pequena, // Sombra sutil para profundidad elegante.
    },
    campo: {
      marginBottom: 20,
    },
    inputContenedor: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colores.fondo, // Fondo claro para input.
      borderRadius: espaciados.pequeno,
      borderWidth: 1.5, // Más visible: Border más grueso.
      borderColor:
        errorsInput.email || errorsInput.password
          ? colores.error
          : colores.principal + '20', // Rojo si error.
      paddingHorizontal: espaciados.medio,
      paddingVertical: espaciados.medio, // Más padding vertical para visibilidad.
    },
    iconoInput: {
      marginRight: espaciados.pequeno,
      color: colores.principal, // Indigo para iconos, más visible.
    },
    input: {
      flex: 1,
      fontSize: fuentes.tamanos.medio,
      color: colores.textoPrincipal,
      fontFamily: fuentes.regular,
    },
    label: {
      fontSize: fuentes.tamanos.pequeno,
      marginBottom: 5,
      color: colores.textoSecundario,
    },
    errorMensaje: {
      // Span para error dinámico.
      fontSize: fuentes.tamanos.pequeno - 2,
      color: colores.error,
      marginTop: 5,
      textAlign: 'left',
    },
    link: {
      fontSize: fuentes.tamanos.pequeno,
      marginTop: 20,
      textDecorationLine: 'underline',
    },
  });

  return (
    <LinearGradient
      colors={[colores.fondo, colores.secundario + '10']} // Degradado indigo sutil.
      style={[estilos.contenedor, { paddingTop: insets.top }]}
    >
      {/* Vista Bienvenida (minimalista, profesional). */}
      {vistaActual === 'bienvenida' && (
        <Animated.View style={[estilos.vista, estiloBienvenida]}>
          {/* Logo centrado. */}
          <Image
            source={require('../assets/imagenes/logo-sipsaps.png')} // Ajusta a tu logo.
            style={estilos.logo}
            accessible={true}
            accessibilityLabel="Logo de SIPSAPS"
            resizeMode="contain"
          />
          {/* Título profesional. */}
          <Text
            style={[
              estilos.titulo,
              {
                color: colores.principal, // Indigo vibrante.
                fontSize: fuentes.tamanos.titulo + 2,
                fontFamily: fuentes.negrita,
              },
            ]}
            accessible={true}
            accessibilityRole="header"
          >
            Bienvenido a SIPSAPS
          </Text>
          {/* Subtítulo descriptivo (profesional para salud). */}
          <Text
            style={[
              estilos.subtitulo,
              {
                color: colores.textoSecundario,
                fontSize: fuentes.tamanos.medio,
                textAlign: 'center',
              },
            ]}
          >
            Plataforma Integral para la Gestión Eficiente de Reservas Médicas y
            Seguimiento de Pacientes
          </Text>
          {/* Checkbox no mostrar más. */}
          <View style={estilos.checkboxContenedor}>
            <Switch
              value={noMostrarBienvenida}
              onValueChange={setNoMostrarBienvenida}
              trackColor={{
                false: colores.textoSecundario,
                true: colores.principal,
              }}
              thumbColor={noMostrarBienvenida ? '#FFFFFF' : '#F4F3F4'}
              accessible={true}
              accessibilityLabel="No mostrar esta pantalla nuevamente"
            />
            <Text
              style={[
                estilos.checkboxTexto,
                { color: colores.textoSecundario },
              ]}
            >
              No mostrar esta pantalla nuevamente
            </Text>
          </View>
          {/* Botón Continuar con ícono. */}
          <BotonPrincipal
            titulo="Continuar"
            onPress={manejarContinuar}
            iconoNombre="arrow-right"
          />
        </Animated.View>
      )}

      {/* Vista Login (estática, minimalista como catálogo). */}
      {vistaActual === 'login' && (
        <Animated.View style={[estilos.vista, estiloLogin]}>
          {/* Header: Logo alineado izquierda, título centrado. */}
          <View style={estilos.headerLogin}>
            <Image
              source={require('../assets/imagenes/logo-sipsaps.png')}
              style={{ width: 40, height: 40, marginRight: espaciados.pequeno }}
              accessible={true}
              accessibilityLabel="Logo de SIPSAPS"
            />
            <Text
              style={[
                estilos.tituloLogin,
                { color: colores.principal }, // Indigo para título.
              ]}
              accessible={true}
              accessibilityRole="header"
            >
              SIPSAPS
            </Text>
          </View>

          {/* Título login debajo del header. */}
          <Text
            style={[
              estilos.tituloLogin,
              {
                color: colores.textoPrincipal,
                fontSize: fuentes.tamanos.grande,
                fontFamily: fuentes.negrita,
              },
            ]}
            accessible={true}
            accessibilityRole="header"
          >
            Iniciar Sesión
          </Text>

          {/* Formulario como "catálogo" (tarjeta con sombra, iconos en inputs). */}
          <View style={estilos.formulario}>
            {/* Input UsernameOrEmail con icono. */}
            <View style={estilos.campo}>
              <Text style={[estilos.label, { color: colores.textoSecundario }]}>
                Nombre de Usuario o Correo Electrónico
              </Text>
              <View
                style={[
                  estilos.inputContenedor,
                  {
                    borderColor: errorsInput.email
                      ? colores.error
                      : colores.principal + '20',
                  }, // Rojo si error.
                ]}
              >
                <FontAwesome
                  name="envelope"
                  size={18}
                  style={estilos.iconoInput}
                />
                <TextInput
                  style={estilos.input}
                  placeholder="usuario@ejemplo.com"
                  placeholderTextColor={colores.textoSecundario + '60'}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  accessible={true}
                  accessibilityLabel="Ingresa tu nombre de usuario o email"
                  onBlur={onBlurEmail} // Validación dinámica.
                />
              </View>
              {errorsInput.email && (
                <Text
                  style={estilos.errorMensaje}
                  accessible={true}
                  accessibilityLabel="Error en email"
                >
                  {errorsInput.email}
                </Text>
              )}
            </View>
            {/* Input Password con icono. */}
            <View style={estilos.campo}>
              <Text style={[estilos.label, { color: colores.textoSecundario }]}>
                Contraseña
              </Text>
              <View
                style={[
                  estilos.inputContenedor,
                  {
                    borderColor: errorsInput.password
                      ? colores.error
                      : colores.principal + '20',
                  }, // Rojo si error.
                ]}
              >
                <FontAwesome name="lock" size={18} style={estilos.iconoInput} />
                <TextInput
                  style={estilos.input}
                  placeholder="********"
                  placeholderTextColor={colores.textoSecundario + '60'}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={true}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={manejarLogin} // Submit al presionar Enter.
                  accessible={true}
                  accessibilityLabel="Ingresa tu contraseña"
                  onBlur={onBlurPassword} // Validación dinámica.
                />
              </View>
              {errorsInput.password && (
                <Text
                  style={estilos.errorMensaje}
                  accessible={true}
                  accessibilityLabel="Error en password"
                >
                  {errorsInput.password}
                </Text>
              )}
            </View>
          </View>

          {/* Botón Login con ícono. */}
          <BotonPrincipal
            titulo="Iniciar Sesión"
            onPress={manejarLogin}
            iconoNombre="sign-in"
          />

          {/* Link olvidado (futuro). */}
          <Text style={[estilos.link, { color: colores.principal }]}>
            ¿Olvidaste tu contraseña?
          </Text>

          {/* Eliminamos el espacio entre el link y el IndicadorCarga */}
          {estaCargando && (
            <IndicadorCarga
              texto="Iniciando sesión..."
              tamaño="grande"
              tipo="bloques" // Dinámico indigo.
            />
          )}

          {/* Modal para backend errors (e.g., credenciales incorrectas). */}
          <ModalGeneral
            visible={modalVisible}
            type={modalType}
            title={modalType === 'error' ? 'Error' : 'Éxito'}
            message={modalMessage}
            onClose={() => setModalVisible(false)}
          />
        </Animated.View>
      )}
    </LinearGradient>
  );
}