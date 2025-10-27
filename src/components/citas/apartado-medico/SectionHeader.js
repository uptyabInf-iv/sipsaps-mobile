import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { useTemasPersonalizado } from '../../../hooks/useTemasPersonalizado';

// CORRECCIÓN: Renombra la función a "SectionHeader" para que coincida con el nombre del archivo y la importación.
export default memo(function SectionHeader({ title }) {
  const { colores, esOscuro } = useTemasPersonalizado();
  return (
    <View style={{ marginTop: 18, marginHorizontal: 12, paddingVertical: 18, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: esOscuro ? '#1A1A1A' : '#ECEFF3', marginBottom: 18, backgroundColor: esOscuro ? '#0F1112' : '#FAFBFC' }}>
      <Text style={{ fontSize: 15, fontWeight: '700', color: colores.textoPrincipal, letterSpacing: 0.6, textTransform: 'capitalize' }}>{title}</Text>
    </View>
  );
});