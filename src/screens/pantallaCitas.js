// src/screens/pantallaCitas.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useTemasPersonalizado } from '../hooks/useTemasPersonalizado';

// Componente para las tarjetas de opción (reutilizable y elegante)
const OpcionCitaCard = ({ titulo, descripcion, icono, screenName }) => {
  const navigation = useNavigation();
  const { colores, espaciados, sombras, fuentes, esOscuro } =
    useTemasPersonalizado();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colores.superficie,
          ...sombras.pequena,
          borderColor: esOscuro ? colores.textoSecundario + '20' : '#E5E7EB',
          borderWidth: 1,
        },
      ]}
      onPress={() => navigation.navigate(screenName)}
      activeOpacity={0.7}
    >
      <FontAwesome
        name={icono}
        size={32}
        color={colores.principal}
        style={styles.cardIcon}
      />
      <View style={styles.cardTextContainer}>
        <Text
          style={[
            styles.cardTitle,
            { color: colores.textoPrincipal, fontSize: fuentes.tamanos.grande },
          ]}
        >
          {titulo}
        </Text>
        <Text
          style={[styles.cardDescription, { color: colores.textoSecundario }]}
        >
          {descripcion}
        </Text>
      </View>
      <FontAwesome
        name="chevron-right"
        size={18}
        color={colores.textoSecundario}
      />
    </TouchableOpacity>
  );
};

// Pantalla principal
export default function PantallaCitas() {
  const insets = useSafeAreaInsets();
  const { colores, espaciados, fuentes } = useTemasPersonalizado();
  // Aquí podrías usar tu hook de usuario para verificar el rol
  // const { user } = useUser();
  // const esMedico = user?.rol === 'MEDICO';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colores.fondo, paddingTop: insets.top },
      ]}
    >
      <ScrollView contentContainerStyle={{ padding: espaciados.grande }}>
        <Text
          style={[
            styles.headerTitle,
            { color: colores.textoPrincipal, fontSize: fuentes.tamanos.titulo },
          ]}
        >
          Gestión de Citas
        </Text>
        <Text
          style={[styles.headerSubtitle, { color: colores.textoSecundario }]}
        >
          Organiza y consulta tus citas médicas de forma sencilla y rápida.
        </Text>

        <View style={{ marginTop: espaciados.extraGrande }}>
          <OpcionCitaCard
            titulo="Agendar Nueva Cita"
            descripcion="Reserva un nuevo espacio con nuestros especialistas."
            icono="calendar-plus-o"
            screenName="AgendarCita"
          />
          <OpcionCitaCard
            titulo="Mis Citas Agendadas"
            descripcion="Consulta el historial y estado de tus citas."
            icono="history"
            screenName="HistorialCitas"
          />
          {/* --- NUEVA OPCIÓN PARA MÉDICOS (visible para todos por ahora) --- */}
          <OpcionCitaCard
            titulo="Gestionar Citas de Pacientes"
            descripcion="Aprueba, cancela o reprograma las solicitudes."
            icono="users"
            screenName="GestionCitasMedico"
          />
          {/* ----------------------------------------------------------------- */}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardIcon: {
    marginRight: 20,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});
