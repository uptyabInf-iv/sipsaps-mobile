// src/screens/citas/historialCitas.js
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SectionList,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTemasPersonalizado } from '../../hooks/useTemasPersonalizado';
import * as Animatable from 'react-native-animatable';

// Datos estáticos para simulación (incluye citas atendidas)
const CITAS_MOCK = [
  { id: '1', especialidad: 'Cardiología', medico: 'Dr. Alan Turing', fecha: '2025-11-10T10:00:00Z', estatus: 'Aprobada', modificadoPor: 'Médico', canceladoPor: null, justificacion: 'Paciente presenta antecedentes familiares.', fechaAtencion: null },
  { id: '2', especialidad: 'Pediatría', medico: 'Dra. Ada Lovelace', fecha: '2025-10-20T15:30:00Z', estatus: 'Pendiente', modificadoPor: null, canceladoPor: null, justificacion: '', fechaAtencion: null },
  { id: '3', especialidad: 'Dermatología', medico: 'Dr. Linus Torvalds', fecha: '2025-09-05T09:00:00Z', estatus: 'Cancelada', modificadoPor: 'Médico', canceladoPor: 'Médico', justificacion: 'Emergencia en quirófano.', fechaAtencion: null },
  { id: '6', especialidad: 'Oftalmología', medico: 'Dr. Steve Wozniak', fecha: '2025-07-01T11:00:00Z', estatus: 'Atendida', modificadoPor: 'Médico', canceladoPor: null, justificacion: 'Chequeo de rutina completado.', fechaAtencion: '2025-07-01T11:30:00Z' },
  { id: '4', especialidad: 'General', medico: 'Dra. Grace Hopper', fecha: '2025-08-15T11:00:00Z', estatus: 'Cancelada', modificadoPor: 'Paciente', canceladoPor: 'Paciente', justificacion: 'Viaje de última hora.', fechaAtencion: null },
  { id: '5', especialidad: 'Cardiología', medico: 'Dr. Alan Turing', fecha: '2025-11-12T14:00:00Z', estatus: 'Reprogramada', modificadoPor: 'Paciente', canceladoPor: null, justificacion: 'Conflicto de horario laboral.', fechaAtencion: null },
];

const ESTATUS_INFO = {
  Aprobada: { color: '#28a745', icon: 'check-circle' },
  Pendiente: { color: '#ffc107', icon: 'hourglass-half' },
  Cancelada: { color: '#dc3545', icon: 'times-circle' },
  Reprogramada: { color: '#17a2b8', icon: 'calendar' },
  Atendida: { color: '#6c757d', icon: 'history' },
};

const StatusTag = ({ estatus }) => {
  const info = ESTATUS_INFO[estatus] || { color: '#999', icon: 'question' };
  return (
    <View style={[styles.statusTag, { backgroundColor: info.color + '20' }]}>
      <FontAwesome name={info.icon} size={11} color={info.color} />
      <Text style={[styles.statusTagText, { color: info.color }]}>{estatus}</Text>
    </View>
  );
};

const TarjetaCitaHistorial = React.memo(({ item, onPress }) => {
  const { colores, esOscuro } = useTemasPersonalizado();
  const infoEstatus = ESTATUS_INFO[item?.estatus] || ESTATUS_INFO.Pendiente;

  // Mostrar preview de justificación (máx 120 chars)
  const preview = item?.justificacion ? (item.justificacion.length > 120 ? item.justificacion.slice(0, 117) + '...' : item.justificacion) : '';

  // Interacción: admitimos abrir detalle incluso si Atendida/Cancelada.
  const disabled = false;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled && !preview}
      style={[
        styles.itemContainer,
        { backgroundColor: colores.superficie, shadowColor: esOscuro ? '#000' : '#555', opacity: disabled ? 0.98 : 1 },
      ]}
    >
      <View style={[styles.statusIndicator, { backgroundColor: infoEstatus.color }]} />
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={[styles.itemEspecialidad, { color: colores.textoPrincipal }]} numberOfLines={1}>
            {item?.especialidad ?? '—'}
          </Text>
          <StatusTag estatus={item?.estatus ?? 'Pendiente'} />
        </View>

        <View style={styles.infoRow}>
          <FontAwesome name="user-md" size={16} color={colores.textoSecundario} style={styles.infoIcon} />
          <Text style={[styles.itemMedico, { color: colores.textoSecundario }]} numberOfLines={1}>
            {item?.medico ?? '—'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <FontAwesome name="calendar" size={16} color={colores.textoSecundario} style={styles.infoIcon} />
          <Text style={[styles.itemFecha, { color: colores.textoSecundario }]}>
            {item?.fecha ? new Date(item.fecha).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' }) : '—'}
          </Text>
        </View>

        {preview ? (
          <Text style={[styles.justificacionPreview, { color: colores.textoSecundario }]} numberOfLines={2}>
            {preview}
          </Text>
        ) : null}

        {item?.estatus === 'Cancelada' && item.canceladoPor && (
          <Text style={{ color: infoEstatus.color, fontSize: 12, marginTop: 8, fontWeight: '700' }}>
            Cancelada por: {item.canceladoPor}
          </Text>
        )}

        {item?.estatus === 'Atendida' && item.fechaAtencion && (
          <Text style={{ color: colores.textoSecundario, fontSize: 12, marginTop: 8 }}>
            Atendida: {new Date(item.fechaAtencion).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
});

export default function HistorialCitas() {
  const insets = useSafeAreaInsets();
  const { colores, esOscuro } = useTemasPersonalizado();

  const [citas, setCitas] = useState(CITAS_MOCK);
  const [activeTab, setActiveTab] = useState('Activas'); // 'Activas' | 'Historial'
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState('Todos');

  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [modalAccionVisible, setModalAccionVisible] = useState(false);
  const [modalGestionVisible, setModalGestionVisible] = useState(false);
  const [modalDetalleVisible, setModalDetalleVisible] = useState(false);
  const [modalEstatusVisible, setModalEstatusVisible] = useState(false);

  const [tipoAccion, setTipoAccion] = useState('');
  const [justificacion, setJustificacion] = useState('');
  const [nuevaFecha, setNuevaFecha] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // asegurar arrays y separar act/asistidas
  const { citasActivas, citasAtendidas } = useMemo(() => {
    const arr = Array.isArray(citas) ? citas : [];
    return {
      citasActivas: arr.filter((c) => c?.estatus !== 'Atendida'),
      citasAtendidas: arr.filter((c) => c?.estatus === 'Atendida'),
    };
  }, [citas]);

  const citasFiltradas = useMemo(() => {
    let base = activeTab === 'Activas' ? citasActivas : citasAtendidas;
    if (!Array.isArray(base)) base = [];
    if (busqueda) {
      const q = busqueda.toLowerCase();
      base = base.filter(
        (c) => (c?.especialidad ?? '').toLowerCase().includes(q) || (c?.medico ?? '').toLowerCase().includes(q)
      );
    }
    if (filtroEstatus !== 'Todos') {
      base = base.filter((c) => c?.estatus === filtroEstatus);
    }
    return base.slice().sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [citasActivas, citasAtendidas, activeTab, busqueda, filtroEstatus]);

  const openActionModal = useCallback((cita) => {
    setCitaSeleccionada(cita);
    setModalAccionVisible(true);
  }, []);

  const openDetalleModalDirect = useCallback((cita) => {
    setCitaSeleccionada(cita);
    setModalDetalleVisible(true);
  }, []);

  const openGestionModal = useCallback((accion) => {
    setTipoAccion(accion);
    setJustificacion('');
    setNuevaFecha(new Date());
    setModalAccionVisible(false);
    setModalGestionVisible(true);
  }, []);

  const openDetalleModal = useCallback(() => {
    setModalAccionVisible(false);
    setModalDetalleVisible(true);
  }, []);

  const handleConfirmarAccion = useCallback(() => {
    if (!justificacion.trim()) {
      Alert.alert('Validación', 'Por favor, provee una justificación.');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setCitas((prev) =>
        prev.map((c) => {
          if (c?.id === (citaSeleccionada && citaSeleccionada.id)) {
            if (tipoAccion === 'reprogramar')
              return { ...c, estatus: 'Reprogramada', fecha: nuevaFecha.toISOString(), justificacion, modificadoPor: 'Paciente' };
            if (tipoAccion === 'cancelar')
              return { ...c, estatus: 'Cancelada', justificacion, canceladoPor: 'Paciente', modificadoPor: 'Paciente' };
          }
          return c;
        })
      );
      setIsSubmitting(false);
      setModalGestionVisible(false);
      Alert.alert('Éxito', 'Tu solicitud ha sido enviada.');
    }, 900);
  }, [citaSeleccionada, tipoAccion, justificacion, nuevaFecha]);

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (event?.type === 'set' && selectedDate) setNuevaFecha(selectedDate);
  };

  const setFiltroDesdeModal = (estado) => {
    setFiltroEstatus(estado);
    setModalEstatusVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colores.fondo, paddingTop: insets.top }]}>
      <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
        <Text style={[styles.headerTitle, { color: colores.textoPrincipal }]}>Mi Historial de Citas</Text>

        <View style={styles.tabContainer}>
          <TouchableOpacity onPress={() => setActiveTab('Activas')} style={[styles.tabButton, activeTab === 'Activas' && { backgroundColor: colores.principal }]}>
            <Text style={[styles.tabText, { color: activeTab === 'Activas' ? '#FFF' : colores.textoSecundario }]}>Citas Activas</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('Historial')} style={[styles.tabButton, activeTab === 'Historial' && { backgroundColor: colores.principal }]}>
            <Text style={[styles.tabText, { color: activeTab === 'Historial' ? '#FFF' : colores.textoSecundario }]}>Atendidas</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.searchWrapper, { backgroundColor: esOscuro ? '#1C1C1E' : '#FFF' }]}>
          <FontAwesome name="search" size={18} color={colores.textoSecundario} />
          <TextInput
            style={[styles.searchInput, { color: colores.textoPrincipal }]}
            placeholder="Buscar por médico o especialidad..."
            placeholderTextColor={colores.textoSecundario}
            value={busqueda}
            onChangeText={setBusqueda}
          />
        </View>

        <TouchableOpacity onPress={() => setModalEstatusVisible(true)} style={[styles.filterChip, { borderColor: colores.textoSecundario }]}>
          <FontAwesome name="filter" size={14} color={colores.textoSecundario} />
          <Text style={[styles.filterChipText, { color: colores.textoSecundario }]}>{filtroEstatus}</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'Activas' ? (
        <SectionList
          sections={['Pendiente', 'Reprogramada', 'Aprobada', 'Cancelada'].map((key) => {
            const data = citasFiltradas.filter((c) => c?.estatus === key);
            return { title: key, data };
          }).filter((s) => s.data.length > 0)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TarjetaCitaHistorial
              item={item}
              onPress={() => {
                // Canceladas/Atendidas: abrir solo detalle; Activas: abrir acción
                if (item?.estatus === 'Atendida' || item?.estatus === 'Cancelada') openDetalleModalDirect(item);
                else openActionModal(item);
              }}
            />
          )}
          renderSectionHeader={({ section: { title } }) => (
            <View style={[styles.sectionHeader]}>
              <Text style={styles.sectionHeaderText}>{title}</Text>
            </View>
          )}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 50 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 50, color: colores.textoSecundario }}>No se encontraron citas.</Text>}
        />
      ) : (
        <FlatList
          data={citasFiltradas}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TarjetaCitaHistorial
              item={item}
              // Para las citas atendidas abrimos detalle directo (solo lectura)
              onPress={() => openDetalleModalDirect(item)}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 50 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 50, color: colores.textoSecundario }}>No hay citas atendidas.</Text>}
        />
      )}

      {/* MODALES (sin cambios funcionales respecto a behavior anteriormente aceptado) */}
      <Modal visible={modalAccionVisible} transparent animationType="fade" onRequestClose={() => setModalAccionVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalAccionVisible(false)}>
          <Pressable style={[styles.actionModalContainer, { backgroundColor: colores.superficie }]}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalAccionVisible(false)}>
              <FontAwesome name="close" size={24} color={colores.textoSecundario} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colores.textoPrincipal }]}>Gestionar Cita</Text>
            <Text style={{ color: colores.textoSecundario, marginBottom: 18, textAlign: 'center' }}>
              {citaSeleccionada?.especialidad ?? ''} — {citaSeleccionada?.medico ?? ''}
            </Text>

            {citaSeleccionada?.estatus === 'Atendida' ? (
              <TouchableOpacity style={[styles.actionCard, { borderColor: colores.textoSecundario }]} onPress={openDetalleModal}>
                <FontAwesome name="info-circle" size={20} color={colores.textoSecundario} />
                <Text style={[styles.actionCardTitle, { color: colores.textoPrincipal, marginLeft: 12 }]}>Ver detalles</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={[styles.actionCard, { borderColor: colores.textoSecundario }]} onPress={openDetalleModal}>
                  <FontAwesome name="info-circle" size={20} color={colores.textoSecundario} />
                  <Text style={[styles.actionCardTitle, { color: colores.textoPrincipal, marginLeft: 12 }]}>Ver detalles</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionCard, { borderColor: ESTATUS_INFO.Reprogramada.color }]} onPress={() => openGestionModal('reprogramar')}>
                  <FontAwesome name="calendar" size={20} color={ESTATUS_INFO.Reprogramada.color} />
                  <Text style={[styles.actionCardTitle, { color: colores.textoPrincipal, marginLeft: 12 }]}>Reprogramar</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionCard, { borderColor: ESTATUS_INFO.Cancelada.color }]} onPress={() => openGestionModal('cancelar')}>
                  <FontAwesome name="times-circle" size={20} color={ESTATUS_INFO.Cancelada.color} />
                  <Text style={[styles.actionCardTitle, { color: colores.textoPrincipal, marginLeft: 12 }]}>Cancelar</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={modalGestionVisible} transparent animationType="fade" onRequestClose={() => setModalGestionVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={[styles.gestionModalContainer, { backgroundColor: colores.superficie }]}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalGestionVisible(false)}>
              <FontAwesome name="close" size={24} color={colores.textoSecundario} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colores.textoPrincipal }]}>{tipoAccion === 'reprogramar' ? 'Reprogramar Cita' : 'Cancelar Cita'}</Text>

            {tipoAccion === 'reprogramar' && (
              <>
                <Text style={[styles.label, { color: colores.textoSecundario }]}>Nueva Fecha</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.datePickerButton, { borderColor: colores.principal }]}>
                  <Text style={{ color: colores.principal, fontSize: 16 }}>{nuevaFecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
                </TouchableOpacity>
                {showDatePicker && <DateTimePicker value={nuevaFecha} mode="date" display="calendar" onChange={onDateChange} />}
              </>
            )}

            <Text style={[styles.label, { color: colores.textoSecundario, marginTop: 12 }]}>Justificación (obligatoria)</Text>
            <TextInput
              style={[styles.modalInput, { borderColor: '#CCC', color: colores.textoPrincipal, backgroundColor: esOscuro ? '#2C2C2E' : '#F2F2F7' }]}
              value={justificacion}
              onChangeText={setJustificacion}
              multiline
              placeholder="Explica por qué reprogramas o cancelas..."
            />

            <TouchableOpacity style={[styles.modalButton, { backgroundColor: isSubmitting ? '#AAA' : colores.principal }]} onPress={handleConfirmarAccion} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalButtonText}>Enviar</Text>}
            </TouchableOpacity>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={modalDetalleVisible} animationType="slide" onRequestClose={() => setModalDetalleVisible(false)}>
        <ScrollView style={{ flex: 1, backgroundColor: esOscuro ? '#000' : '#F2F2F7' }}>
          <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 20 }}>
            <TouchableOpacity onPress={() => setModalDetalleVisible(false)} style={styles.detalleCloseButton}>
              <FontAwesome name="close" size={28} color={colores.textoPrincipal} />
            </TouchableOpacity>
            <Text style={[styles.detalleHeaderTitle, { color: colores.textoPrincipal }]}>Detalle de la Cita</Text>
          </View>

          {citaSeleccionada ? (
            <View style={{ padding: 20 }}>
              <View style={styles.detalleSection}>
                <Text style={[styles.detalleSectionTitle, { color: colores.principal }]}>Cita</Text>
                <View style={styles.detalleRow}><Text style={[styles.detalleLabel, { color: colores.textoSecundario }]}>Especialidad</Text><Text style={[styles.detalleValue, { color: colores.textoPrincipal }]}>{citaSeleccionada.especialidad ?? '—'}</Text></View>
                <View style={styles.detalleRow}><Text style={[styles.detalleLabel, { color: colores.textoSecundario }]}>Médico</Text><Text style={[styles.detalleValue, { color: colores.textoPrincipal }]}>{citaSeleccionada.medico ?? '—'}</Text></View>
                <View style={styles.detalleRow}><Text style={[styles.detalleLabel, { color: colores.textoSecundario }]}>Fecha y Hora</Text><Text style={[styles.detalleValue, { color: colores.textoPrincipal }]}>{citaSeleccionada.fecha ? new Date(citaSeleccionada.fecha).toLocaleString('es-ES') : '—'}</Text></View>
                <View style={styles.detalleRow}><Text style={[styles.detalleLabel, { color: colores.textoSecundario }]}>Estado</Text><StatusTag estatus={citaSeleccionada.estatus ?? 'Pendiente'} /></View>
              </View>

              <View style={styles.detalleSection}>
                <Text style={[styles.detalleSectionTitle, { color: colores.principal }]}>Justificación</Text>
                <Text style={{ color: colores.textoSecundario }}>{citaSeleccionada.justificacion || 'Sin justificación'}</Text>
                {citaSeleccionada.estatus === 'Cancelada' && citaSeleccionada.canceladoPor && (
                  <Text style={{ color: ESTATUS_INFO.Cancelada.color, marginTop: 8, fontWeight: '700' }}>Cancelada por: {citaSeleccionada.canceladoPor}</Text>
                )}
              </View>

              {citaSeleccionada.estatus === 'Atendida' && citaSeleccionada.fechaAtencion && (
                <View style={styles.detalleSection}>
                  <Text style={[styles.detalleSectionTitle, { color: colores.principal }]}>Registro de Atención</Text>
                  <Text style={{ color: colores.textoSecundario }}>Atendida el: {new Date(citaSeleccionada.fechaAtencion).toLocaleString('es-ES')}</Text>
                </View>
              )}
            </View>
          ) : (
            <Text style={{ padding: 20, color: colores.textoSecundario }}>Selecciona una cita para ver detalles.</Text>
          )}
        </ScrollView>
      </Modal>

      <Modal visible={modalEstatusVisible} transparent animationType="fade" onRequestClose={() => setModalEstatusVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalEstatusVisible(false)}>
          <Pressable style={[styles.actionModalContainer, { backgroundColor: colores.superficie }]}>
            <Text style={[styles.modalTitle, { color: colores.textoPrincipal }]}>Filtrar por Estado</Text>
            {['Todos', 'Pendiente', 'Reprogramada', 'Aprobada', 'Cancelada', 'Atendida'].map((estado) => (
              <TouchableOpacity
                key={estado}
                style={[styles.actionCard, { borderColor: filtroEstatus === estado ? colores.principal : '#EEE' }]}
                onPress={() => setFiltroDesdeModal(estado)}
              >
                <FontAwesome name={ESTATUS_INFO[estado]?.icon || 'list'} size={18} color={ESTATUS_INFO[estado]?.color || colores.textoSecundario} />
                <Text style={[styles.actionCardTitle, { color: colores.textoPrincipal, marginLeft: 12 }]}>{estado}</Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerTitle: { fontSize: 28, fontWeight: '700', marginBottom: 12 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#E5E5EA', borderRadius: 10, padding: 4, marginBottom: 12 },
  tabButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabText: { fontWeight: '700' },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 15, marginBottom: 12 },
  searchInput: { flex: 1, height: 48, marginLeft: 10, fontSize: 16 },
  filterChip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.2 },
  filterChipText: { marginLeft: 8, fontWeight: '700', fontSize: 14 },
  itemContainer: { flexDirection: 'row', borderRadius: 12, marginVertical: 8, marginHorizontal: 0, elevation: 2, shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  statusIndicator: { width: 6, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
  itemContent: { flex: 1, padding: 14 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  itemEspecialidad: { fontSize: 16, fontWeight: '700' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  infoIcon: { width: 20 },
  itemMedico: { fontSize: 14 },
  itemFecha: { fontSize: 13, fontStyle: 'italic' },
  justificacionPreview: { marginTop: 8, fontSize: 13, lineHeight: 18 },
  statusTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusTagText: { marginLeft: 6, fontSize: 11, fontWeight: '700' },
  sectionHeader: { paddingVertical: 10, paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: '#E6E6E9', marginTop: 10 },
  sectionHeaderText: { fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  actionModalContainer: { borderRadius: 12, paddingVertical: 18, paddingHorizontal: 14, width: '100%', maxWidth: 420, alignItems: 'center' },
  actionCard: { flexDirection: 'row', alignItems: 'center', width: '100%', padding: 12, borderRadius: 10, borderWidth: 1.2, marginBottom: 10 },
  actionCardTitle: { fontSize: 16, fontWeight: '700' },
  closeButton: { position: 'absolute', top: 12, right: 12, padding: 6 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 10 },
  gestionModalContainer: { borderRadius: 12, padding: 16, width: '100%', maxWidth: 420, alignItems: 'center' },
  datePickerButton: { width: '100%', borderWidth: 1, borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 12 },
  modalInput: { width: '100%', borderWidth: 1, borderRadius: 10, padding: 12, minHeight: 80, textAlignVertical: 'top', fontSize: 15, marginBottom: 12 },
  modalButton: { width: '100%', padding: 12, borderRadius: 10, alignItems: 'center' },
  modalButtonText: { color: '#FFF', fontWeight: '700' },
  detalleContainer: { flex: 1 },
  detalleHeaderTitle: { fontSize: 22, fontWeight: '800', marginTop: 8 },
  detalleCloseButton: { position: 'absolute', top: 8, right: 10, padding: 8 },
  detalleSection: { marginBottom: 18 },
  detalleSectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 10 },
  detalleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  detalleLabel: { fontSize: 14, color: '#666' },
  detalleValue: { fontSize: 14, fontWeight: '700', flex: 1, textAlign: 'right', marginLeft: 10 },
});