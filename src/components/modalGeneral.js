// src/components/modalGeneral.js
// Modal general reutilizable: Fondo blur oscurecido, centrado, animación fade-in. Para errors/success/info.

import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTemasPersonalizado } from '../hooks/useTemasPersonalizado';
import { FontAwesome } from '@expo/vector-icons'; // Icono close.

// Estilos Estáticos (NO usan variables de 'colores', 'fuentes', etc.)
const estilosEstaticos = StyleSheet.create({
  fondoBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Oscurecido base.
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  titulo: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'System',
    fontWeight: 'bold',
    textAlign: 'center',
    marginLeft: 10,
  },
  contenido: {
    marginBottom: 20,
    minHeight: 60,
  },
  mensaje: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  botonCerrar: {
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5', // Color de borde fijo.
  },
  botonTexto: {
    fontSize: 16,
    color: '#007AFF', // Color de link fijo (iOS blue).
    fontWeight: '600',
  },
});

const ModalGeneral = React.memo(
  ({ visible, type = 'info', title, message, onClose, children }) => {
    const { colores, fuentes, espaciados, radioBordes } =
      useTemasPersonalizado(); // Obtiene variables de tema

    const opacidad = useSharedValue(0);
    const escala = useSharedValue(0.9);

    React.useEffect(() => {
      if (visible) {
        opacidad.value = withTiming(1, {
          duration: 300,
          easing: Easing.out(Easing.ease),
        });
        escala.value = withTiming(1, {
          duration: 300,
          easing: Easing.out(Easing.back(0.5)),
        });
      } else {
        opacidad.value = withTiming(0, { duration: 200 });
        escala.value = withTiming(0.9, { duration: 200 });
      }
    }, [visible, opacidad, escala]);

    const estiloModal = useAnimatedStyle(() => ({
      opacity: opacidad.value,
      transform: [{ scale: escala.value }],
    }));

    const colorIcono =
      type === 'error'
        ? colores.error
        : type === 'success'
          ? colores.exito
          : colores.principal; // Estilos Dinámicos (usan useMemo para optimización)

    const estilosDinamicos = React.useMemo(
      () =>
        StyleSheet.create({
          modal: {
            backgroundColor: colores.superficie || 'white', // Fallback por si acaso
            borderRadius: radioBordes.grande || 16,
            width: '85%',
            maxWidth: 350,
            padding: espaciados.grande || 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 10,
          },
          mensajeTexto: {
            // Estilo para el mensaje con color de texto dinámico
            color: colores.textoPrincipal || 'black',
            fontSize: fuentes.tamanos.medio || 16,
            textAlign: 'center',
            lineHeight: 22,
          },
        }),
      [colores, radioBordes, espaciados, fuentes]
    );

    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="none"
        onRequestClose={onClose}
        accessible={true}
        accessibilityLabel="Modal de notificación"
      >
        <BlurView intensity={80} style={estilosEstaticos.fondoBlur} tint="dark">
          <Animated.View style={[estilosDinamicos.modal, estiloModal]}>
            <View style={estilosEstaticos.header}>
              <FontAwesome
                name={
                  type === 'error'
                    ? 'exclamation-triangle'
                    : type === 'success'
                      ? 'check-circle'
                      : 'info-circle'
                }
                size={24}
                color={colorIcono}
              />
              <Text style={[estilosEstaticos.titulo, { color: colorIcono }]}>
                {title ||
                  (type === 'error'
                    ? 'Error'
                    : type === 'success'
                      ? 'Éxito'
                      : 'Información')}
              </Text>
              <TouchableOpacity
                onPress={onClose}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Cerrar modal"
              >
                <FontAwesome
                  name="times"
                  size={20}
                  color={colores.textoSecundario}
                />
              </TouchableOpacity>
            </View>
            <View style={estilosEstaticos.contenido}>
              {children || (
                <Text style={estilosDinamicos.mensajeTexto}>{message}</Text>
              )}
            </View>
            <TouchableOpacity
              style={estilosEstaticos.botonCerrar}
              onPress={onClose}
            >
              <Text style={estilosEstaticos.botonTexto}>Cerrar</Text>
            </TouchableOpacity>
          </Animated.View>
        </BlurView>
      </Modal>
    );
  }
);

export default ModalGeneral;
