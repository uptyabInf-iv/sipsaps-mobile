// src/components/citas/apartado-medico/GuiaVisualColapsable.js
import React, { memo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTemasPersonalizado } from '../../../hooks/useTemasPersonalizado';

export default memo(function GuiaVisualColapsable() {
  const { colores } = useTemasPersonalizado();
  const [visible, setVisible] = useState(false);
  return (
    <View style={{ padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16, backgroundColor: colores.principal + '10', borderColor: colores.principal + '20' }}>
      <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }} onPress={() => setVisible(v => !v)}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colores.principal }}>Guía Rápida</Text>
        <FontAwesome name={visible ? 'chevron-up' : 'chevron-down'} size={16} color={colores.principal} />
      </TouchableOpacity>
      {visible && (
        <View style={{ paddingTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }}>
            <FontAwesome name="filter" size={14} color={colores.textoSecundario} />
            <Text style={{ color: colores.textoSecundario, marginLeft: 8, flex: 1 }}>Usa los filtros para organizar las citas.</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }}>
            <FontAwesome name="hand-pointer-o" size={14} color={colores.textoSecundario} />
            <Text style={{ color: colores.textoSecundario, marginLeft: 8, flex: 1 }}>Pulsa una tarjeta para acciones o 'Ver detalle' para información completa.</Text>
          </View>
        </View>
      )}
    </View>
  );
});