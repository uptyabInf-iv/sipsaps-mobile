import React from 'react';
import { View } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTemasPersonalizado } from '../hooks/useTemasPersonalizado';

export default function SliderPersonalizado() {
  const { colores, espaciados } = useTemasPersonalizado();

  return (
    <View style={{ padding: espaciados.medio }}>
      <Slider
        style={{ width: 200, height: espaciados.grande }}
        minimumValue={0}
        maximumValue={100}
        minimumTrackTintColor={colores.principal}
        maximumTrackTintColor={colores.textoSecundario}
        thumbTintColor={colores.secundario}
        accessible={true}
        accessibilityLabel="Slider para ajustar valor"
      />
    </View>
  );
}