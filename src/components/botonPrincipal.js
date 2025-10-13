// src/components/botonPrincipal.js
// Componente reutilizable de botón principal, con estilos del tema global y soporte para iconos FontAwesome.
// Úsalo en pantallas para acciones como "Iniciar Sesión" con ícono opcional (e.g., 'arrow-right').

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons'; // FontAwesome integrado.
import { useTemasPersonalizado } from '../hooks/useTemasPersonalizado';

export default function BotonPrincipal({ titulo, onPress, iconoNombre }) {
  const { colores, fuentes, espaciados, radioBordes } = useTemasPersonalizado();

  return (
    <TouchableOpacity
      style={[
        estilos.botonBase,
        {
          backgroundColor: colores.principal,
          paddingHorizontal: espaciados.medio,
          paddingVertical: espaciados.pequeno,
          borderRadius: radioBordes.medio,
        },
      ]}
      onPress={onPress}
      accessible={true}
      accessibilityLabel={`Botón: ${titulo}`}
      accessibilityRole="button"
    >
      <View style={estilos.contenidoBoton}>
        {iconoNombre && (
          <FontAwesome
            name={iconoNombre} // e.g., 'arrow-right'.
            size={20}
            color={colores.fondo} // Blanco sobre indigo, dinámico.
            style={estilos.icono}
          />
        )}
        <Text
          style={[
            estilos.textoBoton,
            {
              color: colores.fondo,
              fontSize: fuentes.tamanos.medio,
              fontFamily: fuentes.negrita,
            },
          ]}
        >
          {titulo}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  botonBase: {
    alignItems: 'center',
    marginVertical: 8,
    minHeight: 44, // Altura mínima para touch fácil (accesible).
  },
  contenidoBoton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icono: {
    marginRight: 8, // Espacio entre ícono y texto.
  },
  textoBoton: {
    textAlign: 'center',
  },
});