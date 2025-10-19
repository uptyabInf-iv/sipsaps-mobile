// Modal de carga con "cubos de estadísticas" animados, elegante y minimalista.
// - Animación suave y en bucle hasta que llegue respuesta del servidor.
// - Mensaje progresivo si el backend tarda, con transición.
// - Botón para cerrar después de un tiempo prolongado.
// - Dispara onTimeout al minuto para que el padre oculte el modal y muestre el error.
// - Splash-like, siempre al frente (Modal nativo, overFullScreen, statusBarTranslucent).

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { useTemasPersonalizado } from '../hooks/useTemasPersonalizado';

// Tiempos (ms)
const WARNING_MS = 15000; // Mostrar mensaje calmado de "reintentando"
const CLOSE_BTN_MS = 40000; // Tras mucho tiempo, permitir cerrar manualmente
const TIMEOUT_MS = 60000; // Al minuto, consideramos que no responde (sin romper "visible" controlado)

// Utilidades simples
const addAlpha = (hex = '#000000', alphaHex = '20') => {
  // Si hex ya trae alpha, devolvemos tal cual
  if (/^#([A-Fa-f0-9]{8})$/.test(hex)) return hex;
  if (/^#([A-Fa-f0-9]{6})$/.test(hex)) return `${hex}${alphaHex}`;
  return hex;
};

// Cubo animado (pulso y shimmer diagonal)
const CuboEstadistica = React.memo(function CuboEstadistica({
  index = 0,
  size = 48,
  colorBase = '#5B21B6',
  surface = '#FFFFFF',
  isDark = false,
}) {
  const escala = useSharedValue(1);
  const despl = useSharedValue(0);
  const shimmer = useSharedValue(-1); // -1 a 1 (posición relativa)

  React.useEffect(() => {
    const delay = index * 150;

    // Pulso suave + micro desplazamiento vertical
    escala.value = withRepeat(
      withDelay(
        delay,
        withSequence(
          withTiming(1.06, { duration: 700, easing: Easing.out(Easing.quad) }),
          withTiming(1.0, { duration: 700, easing: Easing.in(Easing.quad) })
        )
      ),
      -1,
      false
    );

    despl.value = withRepeat(
      withDelay(
        delay,
        withSequence(
          withTiming(-2, { duration: 700, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 700, easing: Easing.in(Easing.quad) })
        )
      ),
      -1,
      false
    );

    // Shimmer que cruza el cubo diagonalmente
    shimmer.value = withRepeat(
      withDelay(
        delay + 200,
        withSequence(withTiming(1, { duration: 1400, easing: Easing.linear }), withTiming(-1, { duration: 0 }))
      ),
      -1,
      false
    );
  }, [escala, despl, shimmer, index]);

  const estiloCubo = useAnimatedStyle(() => ({
    transform: [{ scale: escala.value }, { translateY: despl.value }],
  }));

  const estiloShimmer = useAnimatedStyle(() => {
    // Convertimos -1..1 a desplazamiento en px dentro del cubo
    // Diagonal: usamos translateX
    const offset = ((shimmer.value + 1) / 2) * size * 1.6 - size * 0.3;
    return {
      transform: [{ translateX: offset }],
      opacity: 0.6,
    };
  });

  const borde = isDark ? '#2E2E2E' : addAlpha(colorBase, '33');
  const fondo = isDark ? '#0C0C0D' : addAlpha(colorBase, '12');

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: borde,
          backgroundColor: fondo,
          overflow: 'hidden',
        },
        estiloCubo,
      ]}
      accessible={false}
    >
      {/* Contenido sutil de "estadística": dos barras internas */}
      <View
        style={{
          flex: 1,
          padding: 6,
          justifyContent: 'space-between',
        }}
      >
        <View
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: addAlpha(colorBase, '55'),
            width: '78%',
          }}
        />
        <View
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: addAlpha(colorBase, '99'),
            width: index % 2 === 0 ? '58%' : '68%',
            alignSelf: 'flex-end',
          }}
        />
      </View>

      {/* Shimmer diagonal */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: -size * 0.2,
            left: -size * 0.4,
            width: size,
            height: size * 1.4,
            transform: [{ rotate: '20deg' }],
          },
          estiloShimmer,
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={[
            'rgba(255,255,255,0)',
            isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.35)',
            'rgba(255,255,255,0)',
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </Animated.View>
  );
});

export default function IndicadorCarga({
  visible = true,
  texto = '',
  tamaño = 'grande',
  tipo = 'bloques', // mantenido para extensiones futuras
  onTimeout, // callback opcional: al minuto sin respuesta
  onCancelar, // callback opcional: si el usuario cierra manualmente
}) {
  const { colores = {}, espaciados = {}, fuentes = {}, esOscuro } =
    useTemasPersonalizado();

  // Animación de entrada/salida
  const opacidadModal = useSharedValue(0);
  const escalaModal = useSharedValue(0.98);
  const fondoOpacidad = useSharedValue(0.0);

  // Estados de UX
  const [showWarning, setShowWarning] = React.useState(false);
  const [showClose, setShowClose] = React.useState(false);
  const [timedOut, setTimedOut] = React.useState(false);

  // Timers refs
  const warningRef = React.useRef(null);
  const closeBtnRef = React.useRef(null);
  const timeoutRef = React.useRef(null);

  // Manejo de visibilidad
  React.useEffect(() => {
    // Limpia timers al desmontar o cambios
    const clearAll = () => {
      if (warningRef.current) clearTimeout(warningRef.current);
      if (closeBtnRef.current) clearTimeout(closeBtnRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      warningRef.current = null;
      closeBtnRef.current = null;
      timeoutRef.current = null;
    };

    if (visible) {
      setShowWarning(false);
      setShowClose(false);
      setTimedOut(false);

      // Animación de entrada
      opacidadModal.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) });
      escalaModal.value = withTiming(1, { duration: 450, easing: Easing.out(Easing.quad) });
      fondoOpacidad.value = withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) });

      // Programación de UX de espera
      warningRef.current = setTimeout(() => setShowWarning(true), WARNING_MS);
      closeBtnRef.current = setTimeout(() => setShowClose(true), CLOSE_BTN_MS);
      timeoutRef.current = setTimeout(() => {
        setTimedOut(true);
        onTimeout?.(); // Delega al padre cerrar el modal y mostrar error
      }, TIMEOUT_MS);
    } else {
      clearAll();
      // Animación de salida
      opacidadModal.value = withTiming(0, { duration: 220 });
      escalaModal.value = withTiming(0.98, { duration: 220 });
      fondoOpacidad.value = withTiming(0, { duration: 220 });
    }
    return () => clearAll();
  }, [visible, onTimeout, opacidadModal, escalaModal, fondoOpacidad]);

  // Estilos animados
  const estiloModal = useAnimatedStyle(() => ({
    opacity: opacidadModal.value,
    transform: [{ scale: escalaModal.value }],
  }));

  const estiloFondo = useAnimatedStyle(() => ({
    opacity: fondoOpacidad.value,
  }));

  // Estilos dinámicos
  const estilosDinamicos = React.useMemo(
    () =>
      StyleSheet.create({
        tarjetaCentral: {
          backgroundColor: colores.superficie || '#FFFFFF',
          borderRadius: 20,
          width: tamaño === 'grande' ? 280 : 240,
          paddingVertical: espaciados.grande || 20,
          paddingHorizontal: espaciados.grande || 20,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.25,
          shadowRadius: 20,
          elevation: 12,
        },
        tituloApp: {
          textAlign: 'center',
          letterSpacing: 2.5,
          color: colores.principal || '#5B21B6',
          fontSize: (fuentes.tamanos?.titulo || 24) + 2,
          fontFamily: fuentes.negrita || 'System',
          fontWeight: '800',
        },
        texto: {
          textAlign: 'center',
          lineHeight: 22,
          color: colores.textoSecundario || '#374151',
          fontSize: fuentes.tamanos?.medio || 14,
          fontFamily: fuentes.regular || 'System',
          marginTop: espaciados.pequeno || 10,
        },
        wrapperCuboGrid: {
          marginTop: espaciados.grande || 18,
          width: '100%',
        },
        grid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          rowGap: 12,
        },
        aviso: {
          marginTop: espaciados.medio || 14,
          textAlign: 'center',
          color: colores.textoSecundario,
          fontSize: 12,
        },
        avisoTimeout: {
          marginTop: espaciados.medio || 14,
          textAlign: 'center',
          color: esOscuro ? '#FFB4AB' : '#B91C1C',
          fontSize: 12,
          fontWeight: '700',
        },
        botonCerrar: {
          marginTop: espaciados.medio || 14,
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colores.textoSecundario || '#9CA3AF',
        },
        botonCerrarTexto: {
          color: colores.textoSecundario || '#6B7280',
          fontWeight: '700',
        },
      }),
    [colores, espaciados, fuentes, tamaño, esOscuro]
  );

  if (!visible) return null;

  // Tamaño de cubos según prop
  const cubeSize = tamaño === 'grande' ? 52 : 44;
  const primary = colores.principal || '#5B21B6';
  const surface = colores.superficie || '#FFFFFF';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => {}}
      statusBarTranslucent
      hardwareAccelerated
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
      accessible
      accessibilityLabel="Pantalla de carga"
    >
      <Animated.View
        style={[
          {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          },
          estiloFondo,
        ]}
        pointerEvents="auto"
      >
        {/* Fondo: blur + gradiente sutil */}
        <BlurView intensity={120} tint={esOscuro ? 'dark' : 'light'} style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={
              esOscuro
                ? ['rgba(15, 15, 16, 0.85)', 'rgba(18, 19, 21, 0.85)']
                : [addAlpha(primary, '22'), 'rgba(209, 213, 219, 0.6)']
            }
            style={StyleSheet.absoluteFill}
          />
        </BlurView>

        {/* Tarjeta central tipo splash */}
        <Animated.View style={[estilosDinamicos.tarjetaCentral, estiloModal]}>
          <Text
            style={estilosDinamicos.tituloApp}
            accessible
            accessibilityRole="header"
          >
            SIPSAPS
          </Text>

          {texto ? (
            <Text style={estilosDinamicos.texto} accessible accessibilityLabel="Mensaje de carga">
              {texto}
            </Text>
          ) : null}

          {/* Cubos en grilla 2x2 */}
          <View style={estilosDinamicos.wrapperCuboGrid}>
            <View style={estilosDinamicos.grid}>
              {[0, 1, 2, 3].map((i) => (
                <CuboEstadistica
                  key={i}
                  index={i}
                  size={cubeSize}
                  colorBase={primary}
                  surface={surface}
                  isDark={!!esOscuro}
                />
              ))}
            </View>
          </View>

          {/* Mensajes progresivos */}
          {timedOut ? (
            <Text style={estilosDinamicos.avisoTimeout} accessibilityLiveRegion="polite">
              El servidor no responde en este momento.
            </Text>
          ) : showWarning ? (
            <Text style={estilosDinamicos.aviso} accessibilityLiveRegion="polite">
              El servidor está tardando en responder… reintentando conexión
            </Text>
          ) : null}

          {/* Botón para cerrar manualmente después de mucho tiempo */}
          {!timedOut && showClose ? (
            <TouchableOpacity
              onPress={onCancelar}
              style={estilosDinamicos.botonCerrar}
              accessibilityRole="button"
              accessibilityLabel="Cerrar indicador de carga"
            >
              <Text style={estilosDinamicos.botonCerrarTexto}>Cerrar</Text>
            </TouchableOpacity>
          ) : null}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}