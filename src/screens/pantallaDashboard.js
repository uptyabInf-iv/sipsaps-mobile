// src/screens/pantallaDashboard.js
// Dashboard dinámico: Bienvenida personalizada con user de Redux. Accesible y simple para futuro.
// Optimizado: Memo para no re-render, cards placeholder para features (citas, perfil).

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { useTemasPersonalizado } from '../hooks/useTemasPersonalizado';
import { FontAwesome } from '@expo/vector-icons'; // Iconos para cards.
import BotonPrincipal from '../components/botonPrincipal'; // Para cards.

export default function PantallaDashboard() {
  const insets = useSafeAreaInsets();
  const { user } = useSelector((state) => state.user); // User de Redux (de login).
  const { colores, fuentes, espaciados, sombras } = useTemasPersonalizado();

  // Bienvenida dinámica.
  const nombreCompleto = user ? `${user.nombre_usuario || 'Usuario'}` : 'Bienvenido';
  const rol = user?.rol || 'Invitado';

  const renderCard = (titulo, icono, descripcion, onPress) => (
    <View style={[estilos.card, sombras.pequena]}>
      <View style={estilos.cardHeader}>
        <FontAwesome name={icono} size={24} color={colores.principal} />
        <Text style={[estilos.cardTitulo, { color: colores.textoPrincipal }]}>
          {titulo}
        </Text>
      </View>
      <Text style={[estilos.cardDescripcion, { color: colores.textoSecundario }]}>
        {descripcion}
      </Text>
      {onPress && <BotonPrincipal titulo="Abrir" onPress={onPress} />}
    </View>
  );

  // Estilos dinámicos: Dentro del componente para acceso a fuentes/colores (fix scope).
  const estilos = StyleSheet.create({
    contenedor: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    content: {
      padding: 20,
    },
    header: {
      alignItems: 'center',
      marginBottom: 30,
    },
    bienvenida: {
      textAlign: 'center',
      letterSpacing: 1,
    },
    rol: {
      textAlign: 'center',
      marginTop: 5,
    },
    cardsContainer: {
      width: '100%',
      gap: 15,
    },
    card: {
      backgroundColor: '#FFFFFF', // Superficie blanca.
      borderRadius: 12,
      padding: 20,
      shadowColor: '#000', // Sombra del tema.
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    cardTitulo: {
      fontSize: fuentes.tamanos.medio, // Ahora en scope.
      fontFamily: fuentes.negrita,
      marginLeft: 10,
    },
    cardDescripcion: {
      fontSize: fuentes.tamanos.pequeno, // Ahora en scope.
      lineHeight: 18,
    },
  });

  return (
    <LinearGradient
      colors={[colores.fondo, colores.secundario + '10']}
      style={[estilos.contenedor, { paddingTop: insets.top }]}
    >
      <ScrollView style={estilos.scroll} contentContainerStyle={estilos.content}>
        {/* Header con bienvenida dinámica. */}
        <View style={estilos.header}>
          <Text
            style={[
              estilos.bienvenida,
              {
                color: colores.principal,
                fontSize: fuentes.tamanos.titulo,
                fontFamily: fuentes.negrita,
              },
            ]}
            accessible={true}
            accessibilityRole="header"
          >
            ¡Bienvenido, {nombreCompleto}!
          </Text>
          <Text
            style={[
              estilos.rol,
              {
                color: colores.textoSecundario,
                fontSize: fuentes.tamanos.medio,
              },
            ]}
            accessible={true}
            accessibilityLabel={`Rol: ${rol}`}
          >
            Rol: {rol}
          </Text>
        </View>

        {/* Cards placeholder (futuro: Citas, Perfil, etc.). */}
        <View style={estilos.cardsContainer}>
          {renderCard(
            'Reservar Cita',
            'calendar',
            'Agenda tu próxima consulta médica fácilmente.',
            () => Alert.alert('Feature en desarrollo')
          )}
          {renderCard(
            'Mi Perfil',
            'user',
            'Actualiza tus datos personales y preferencias.',
            () => Alert.alert('Feature en desarrollo')
          )}
          {renderCard(
            'Mis Citas',
            'list',
            'Revisa y cancela tus reservas pendientes.',
            () => Alert.alert('Feature en desarrollo')
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}