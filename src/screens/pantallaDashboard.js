// src/screens/pantallaDashboard.js
// Pantalla placeholder para dashboard post-login (futuro: citas médicas, etc.).

import React from 'react';
import { View, Text } from 'react-native';
import { useTemasPersonalizado } from '../hooks/useTemasPersonalizado';

export default function PantallaDashboard() {
  const { colores, fuentes } = useTemasPersonalizado();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colores.fondo }}>
      <Text style={{ color: colores.textoPrincipal, fontSize: fuentes.tamanos.titulo }}>
        Dashboard de SIPSAPS (En Desarrollo)
      </Text>
    </View>
  );
}