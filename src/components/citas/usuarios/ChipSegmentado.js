import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { chipStyles } from './estilosCitas';

/**
 * ChipSegmentado
 * - compacto por defecto en pantallas pequeñas (se respeta prop compact)
 * - añade hitSlop para mejorar target en pantallas táctiles pequeñas
 */
export default function ChipSegmentado({ label, activo, alPresionar, color = '#4F46E5', compact = false }) {
  return (
    <TouchableOpacity
      onPress={alPresionar}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={[
        chipStyles.chip,
        {
          borderColor: activo ? color : '#E5E5E7',
          backgroundColor: activo ? color + '15' : 'transparent',
        },
        compact ? chipStyles.chipCompact : null,
      ]}
    >
      <Text style={[chipStyles.chipText, { color: activo ? color : '#111827' }]}>{label}</Text>
    </TouchableOpacity>
  );
}