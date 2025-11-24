import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
// ********************************************************
// MODIFICACIÓN: Importar FontAwesome desde @expo/vector-icons
import { FontAwesome } from '@expo/vector-icons'; 
// ********************************************************
import { styles } from './estilosCitas';
import { useTemasPersonalizado } from '../../../hooks/useTemasPersonalizado';

// Componente que agrupa estado "vacío" y botón recargar para mantener la pantalla limpia.
// Exporta dos componentes: EstadoVacioCitas y BotonRecargarCitas
export function EstadoVacioCitas({ texto, subtitulo }) {
  const { colores } = useTemasPersonalizado();
  return (
    <View style={{ alignItems: 'center', marginTop: 50, paddingHorizontal: 24 }}>
      {/* Usando FontAwesome (de @expo/vector-icons) */}
      <FontAwesome name="calendar-o" size={28} color={colores.textoSecundario} />
      <Text style={{ textAlign: 'center', marginTop: 12, color: colores.textoSecundario, fontSize: 15, lineHeight: 22 }}>
        {texto}
      </Text>
      {subtitulo ? (
        <Text style={{ textAlign: 'center', marginTop: 6, color: colores.textoSecundario, fontSize: 13 }}>
          {subtitulo}
        </Text>
      ) : null}
    </View>
  );
}

export function BotonRecargarCitas({ onPress }) {
  const { colores } = useTemasPersonalizado();
  
  // MODIFICACIÓN UX: Botón solo de icono para ahorrar espacio y mejorar la coherencia
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Recargar citas"
      accessibilityHint="Vuelve a cargar tu historial de citas"
      onPress={onPress}
      // Aumenta el hitSlop para facilitar el toque
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} 
      style={[
        // Eliminamos estilos de texto y padding horizontal/vertical para hacerlo circular o cuadrado pequeño
        styles.reloadButton,
        {
          borderColor: colores.principal,
          // Hacemos el padding simétrico y pequeño
          padding: 8, 
          // Usar un color de fondo ligero para que el área de toque sea visible
          backgroundColor: colores.principal + '15', 
          borderRadius: 50, // Lo hacemos circular
          // Opcional: ajustar el tamaño si styles.reloadButton no lo hace
          minWidth: 36, 
          minHeight: 36,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}
    >
      {/* Icono de recarga, quitamos el texto. Usamos 'redo' para un look más moderno o 'refresh' si prefieres el estilo circular */}
      <FontAwesome name="refresh" size={16} color={colores.principal} />
    </TouchableOpacity>
  );
}