// src/screens/citas/agendarCita.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useTemasPersonalizado } from '../../hooks/useTemasPersonalizado';

// Componente de input reutilizable
const FormInput = ({ label, placeholder, icon, multiline = false }) => {
  const { colores, esOscuro } = useTemasPersonalizado();
  return (
    <View style={styles.inputContainer}>
      <Text style={[styles.label, { color: colores.textoSecundario }]}>
        {label}
      </Text>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: esOscuro ? '#2C2C2E' : '#F2F2F7',
            borderColor: esOscuro ? '#444' : '#E5E5E7',
          },
        ]}
      >
        {icon && (
          <FontAwesome
            name={icon}
            size={18}
            color={colores.textoSecundario}
            style={styles.inputIcon}
          />
        )}
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={colores.textoSecundario + '80'}
          style={[
            styles.input,
            { color: colores.textoPrincipal },
            multiline && { height: 100, textAlignVertical: 'top' },
          ]}
          multiline={multiline}
        />
      </View>
    </View>
  );
};

export default function AgendarCita() {
  const insets = useSafeAreaInsets();
  const { colores, fuentes, espaciados } = useTemasPersonalizado();

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
          Agendar Nueva Cita
        </Text>

        <View style={{ marginTop: espaciados.grande }}>
          <FormInput
            label="Especialidad"
            placeholder="Ej: Cardiología, Pediatría..."
            icon="stethoscope"
          />
          <FormInput
            label="Médico de Preferencia (Opcional)"
            placeholder="Dr. Juan Pérez"
            icon="user-md"
          />
          <FormInput
            label="Fecha y Hora"
            placeholder="Seleccionar fecha..."
            icon="calendar"
          />
          <FormInput
            label="Motivo de la Consulta"
            placeholder="Describe brevemente el motivo de tu visita..."
            icon="commenting-o"
            multiline
          />
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: colores.principal,
              marginTop: espaciados.extraGrande,
            },
          ]}
        >
          <Text style={styles.submitButtonText}>Confirmar Solicitud</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerTitle: { fontWeight: 'bold', marginBottom: 24 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, marginBottom: 8, fontWeight: '500' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 15,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 50, fontSize: 16 },
  submitButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});