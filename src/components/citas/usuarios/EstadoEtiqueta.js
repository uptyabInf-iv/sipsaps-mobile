import React from 'react';
import { View, Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { styles } from './estilosCitas';

// Mapa de estados y sus colores/iconos — exportado para uso compartido
export const ESTATUS_INFO = {
  Aprobada: { color: '#28a745', icon: 'check-circle' },
  Pendiente: { color: '#ffc107', icon: 'hourglass-half' },
  Cancelada: { color: '#dc3545', icon: 'times-circle' },
  Reprogramada: { color: '#17a2b8', icon: 'calendar' },
  Atendida: { color: '#6c757d', icon: 'history' },
};

export default function EstadoEtiqueta({ estatus, estiloExtra }) {
  const info = ESTATUS_INFO[estatus] || { color: '#999', icon: 'question' };
  return (
    <View style={[styles.statusTag, { backgroundColor: info.color + '20' }, estiloExtra]}>
      <FontAwesome name={info.icon} size={11} color={info.color} />
      <Text style={[styles.statusTagText, { color: info.color }]}>{estatus}</Text>
    </View>
  );
}