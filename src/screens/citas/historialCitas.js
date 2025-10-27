// src/screens/citas/historialCitas.js
// Historial de citas — adaptado para pantallas muy compactas (<=360px).
// Mejoras:
// - Breakpoint COMPACT para reducir paddings, tamaños y apilar controles verticalmente.
// - SegChip acepta prop compact para mostrarse full-width y apilado en pantallas pequeñas.
// - TarjetaCitaHistorial adapta paddings y fuentes en compact.
// - Modales (acción/gestión/estado) muestran botones apilados y ocupan todo el ancho en compact.
// - Se respetan safe-area insets y paddingBottom para evitar solapamiento con bottom bar.

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
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTemasPersonalizado } from '../../hooks/useTemasPersonalizado';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../utils/api';

const ESTATUS_INFO = {
  Aprobada: { color: '#28a745', icon: 'check-circle' },
  Pendiente: { color: '#ffc107', icon: 'hourglass-half' },
  Cancelada: { color: '#dc3545', icon: 'times-circle' },
  Reprogramada: { color: '#17a2b8', icon: 'calendar' },
  Atendida: { color: '#6c757d', icon: 'history' },
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COMPACT = SCREEN_WIDTH <= 360; // breakpoint para phones muy compactos

const StatusTag = ({ estatus }) => {
  const info = ESTATUS_INFO[estatus] || { color: '#999', icon: 'question' };
  return (
    <View style={[styles.statusTag, { backgroundColor: info.color + '20' }]}>
      <FontAwesome name={info.icon} size={11} color={info.color} />
      <Text style={[styles.statusTagText, { color: info.color }]}>{estatus}</Text>
    </View>
  );
};

// Helpers de formato (evitan desfases por zona horaria)
const fmt12h = (hhmm) => {
  if (!hhmm) return '—';
  const [H, M] = hhmm.split(':').map((n) => parseInt(n, 10));
  if (Number.isNaN(H) || Number.isNaN(M)) return '—';
  let h = H % 12;
  if (h === 0) h = 12;
  const ampm = H >= 12 ? 'PM' : 'AM';
  return `${h}:${String(M).padStart(2, '0')} ${ampm}`;
};
const fmtFechaLarga = (yyyyMmDd) => {
  if (!yyyyMmDd) return '—';
  try {
    const d = new Date(yyyyMmDd + 'T00:00:00');
    return d.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return yyyyMmDd;
  }
};
const doctorPrefix = (sexo) => {
  if (sexo === 'M') return 'Dr.';
  if (sexo === 'F') return 'Dra.';
  return 'Dr(a).';
};

// SegChip ahora soporta compact: ocupa ancho completo y se apila verticalmente en pantallas compactas
const SegChip = ({ label, active, onPress, color, compact }) => (
  <TouchableOpacity
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
    style={[
      chipStyles.chip,
      {
        borderColor: active ? color : '#E5E5E7',
        backgroundColor: active ? color + '15' : 'transparent',
      },
      compact ? chipStyles.chipCompact : null,
    ]}
  >
    <Text style={[chipStyles.chipText, { color: active ? color : '#111827' }]}>{label}</Text>
  </TouchableOpacity>
);

const TarjetaCitaHistorial = React.memo(({ item, onPress, compact }) => {
  const { colores, esOscuro } = useTemasPersonalizado();
  const infoEstatus = ESTATUS_INFO[item?.estatus] || ESTATUS_INFO.Pendiente;

  const preview = item?.justificacion
    ? item.justificacion.length > 120
      ? item.justificacion.slice(0, 117) + '...'
      : item.justificacion
    : '';

  const fueraHorario = !!item?.fueraHorario;
  const horaChip = item?.horaStr ? fmt12h(item.horaStr) : '—';
  const medDisplay = item?.medico ? `${doctorPrefix(item.med_sexo)} ${item.medico}` : '—';

  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Abrir detalles de la cita con ${medDisplay}`}
      activeOpacity={0.9}
      style={[
        styles.card,
        compact ? styles.cardCompact : null,
        { backgroundColor: colores.superficie, shadowColor: esOscuro ? '#000' : '#555' },
      ]}
    >
      <View style={[styles.cardStateBorder, { backgroundColor: infoEstatus.color }]} />

      <View style={[styles.cardBody, compact ? styles.cardBodyCompact : null]}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderLeft}>
            <Text style={[styles.cardTitle, { color: colores.textoPrincipal }]} numberOfLines={1}>
              {item?.especialidad ?? '—'}
            </Text>
            <View style={styles.cardSubRow}>
              <FontAwesome name="user-md" size={compact ? 12 : 14} color={colores.textoSecundario} />
              <Text style={[styles.cardSubtitle, { color: colores.textoSecundario }]} numberOfLines={1}>
                {medDisplay}
              </Text>
            </View>
          </View>

          <View style={[styles.statusPill, { borderColor: infoEstatus.color, backgroundColor: infoEstatus.color + '20' }]}>
            <FontAwesome name={infoEstatus.icon} size={12} color={infoEstatus.color} />
            <Text style={[styles.statusPillText, { color: colores.textoPrincipal }]}>{item?.estatus ?? 'Pendiente'}</Text>
          </View>
        </View>

        <View style={styles.dateRow}>
          <View style={styles.dateIconWrap}>
            <FontAwesome name="calendar-o" size={12} color="#17a2b8" />
          </View>
          <View style={{ marginLeft: 10 }}>
            <Text style={[styles.metaLabel, { color: colores.textoSecundario }]}>Programada</Text>
            <Text style={[styles.metaValue, { color: colores.textoPrincipal }]}>
              {fmtFechaLarga(item.fechaStr)} • {horaChip}
            </Text>
          </View>
        </View>

        {fueraHorario ? (
          <View style={styles.outOfSchedule}>
            <FontAwesome name="exclamation-triangle" size={12} color="#F59E0B" />
            <Text style={styles.outOfScheduleText}>Fuera de horario: {horaChip}</Text>
          </View>
        ) : null}

        {item?.motivo ? (
          <View style={{ marginTop: 10 }}>
            <Text style={[styles.sectionLabel, { color: colores.textoSecundario }]}>Motivo</Text>
            <Text style={[styles.sectionText, { color: colores.textoPrincipal }]} numberOfLines={compact ? 2 : 3}>
              {item.motivo}
            </Text>
          </View>
        ) : preview ? (
          <View style={{ marginTop: 10 }}>
            <Text style={[styles.sectionLabel, { color: colores.textoSecundario }]}>Nota</Text>
            <Text style={[styles.sectionText, { color: colores.textoPrincipal }]} numberOfLines={compact ? 2 : 3}>
              {preview}
            </Text>
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          <TouchableOpacity
            onPress={onPress}
            style={[styles.detailButton, compact ? styles.detailButtonCompact : null, { backgroundColor: colores.principal }]}
            accessibilityRole="button"
            accessibilityLabel="Ver detalle de la cita"
          >
            <FontAwesome name="eye" size={12} color="#fff" />
            <Text style={styles.detailButtonText}>Ver detalle</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default function HistorialCitas() {
  const insets = useSafeAreaInsets();
  const { colores, esOscuro } = useTemasPersonalizado();

  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  // Select de hora AM/PM para reprogramar
  const [hour12, setHour12] = useState(9);
  const [minute, setMinute] = useState('00');
  const [ampm, setAmpm] = useState('AM');
  const [usarHoraActual, setUsarHoraActual] = useState(true);
  const [permitirFueraHorario, setPermitirFueraHorario] = useState(false);

  const parseHoraTo12 = useCallback((hhmm) => {
    if (!hhmm) return { h12: 9, mm: '00', ampm: 'AM' };
    const [H, M] = hhmm.split(':').map((n) => parseInt(n, 10));
    const am = H < 12;
    let h12 = H % 12;
    if (h12 === 0) h12 = 12;
    return { h12, mm: String(M).padStart(2, '0'), ampm: am ? 'AM' : 'PM' };
  }, []);

  const to24h = useCallback((h12, mm, ampmFlag) => {
    let h = parseInt(h12, 10);
    if (ampmFlag === 'AM') {
      if (h === 12) h = 0;
    } else {
      if (h !== 12) h = h + 12;
    }
    return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }, []);

  // Mapea respuesta backend a forma usada por UI
  const mapCitas = useCallback((arr) => {
    return (arr || []).map((r) => {
      const med_sexo = r.med_sexo || r.sexo_medico || null;
      const just = r.justificacion || '';
      const fueraHorario = !!r.fueraHorario || /\[FUERA_HORARIO\]/i.test(just);

      const fechaStr = r.fecha || (r.fechaSolicitud ? new Date(r.fechaSolicitud).toISOString().slice(0, 10) : null);
      const horaStr = r.hora || (r.fechaSolicitud ? `${String(new Date(r.fechaSolicitud).getHours()).padStart(2,'0')}:${String(new Date(r.fechaSolicitud).getMinutes()).padStart(2,'0')}` : null);

      return {
        id: String(r.id_cita ?? r.id ?? Math.random()),
        id_cita: r.id_cita,
        especialidad: r.especialidad || '—',
        medico: r.medico || `${(r.med_nombre || '')} ${(r.med_apellido || '')}`.trim(),
        med_sexo,
        fechaStr,
        horaStr,
        fecha: fechaStr && horaStr ? `${fechaStr}T${horaStr}:00` : null,
        fechaSolicitud: r.fechaSolicitud || (fechaStr && horaStr ? new Date(`${fechaStr}T${horaStr}:00`).toISOString() : null),
        estatus: r.estatus || 'Pendiente',
        modificadoPor: r.modificadoPor || null,
        canceladoPor: r.canceladoPor || null,
        justificacion: just,
        motivo: r.motivo || '',
        fechaAtencion: r.fechaAtencion || null,
        fueraHorario,
      };
    });
  }, []);

  const fetchCitas = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get('/citas/mias');
      const arr = Array.isArray(data) ? data : data?.data || [];
      setCitas(mapCitas(arr));
    } catch (e) {
      api.handleError?.(e);
      setCitas([]);
    } finally {
      setLoading(false);
    }
  }, [mapCitas]);

  const refresh = useCallback(async () => {
    try {
      setRefreshing(true);
      const data = await api.get('/citas/mias');
      const arr = Array.isArray(data) ? data : data?.data || [];
      setCitas(mapCitas(arr));
    } catch (e) {
      api.handleError?.(e);
    } finally {
      setRefreshing(false);
    }
  }, [mapCitas]);

  useFocusEffect(useCallback(() => { fetchCitas(); }, [fetchCitas]));

  // separar activas/atendidas
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
        (c) =>
          (c?.especialidad ?? '').toLowerCase().includes(q) ||
          (c?.medico ?? '').toLowerCase().includes(q)
      );
    }
    if (filtroEstatus !== 'Todos') {
      base = base.filter((c) => c?.estatus === filtroEstatus);
    }
    return base.slice().sort((a, b) => {
      const keyA = `${a.fechaStr || ''}T${a.horaStr || '00:00'}`;
      const keyB = `${b.fechaStr || ''}T${b.horaStr || '00:00'}`;
      return new Date(keyB) - new Date(keyA);
    });
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
    const base = citaSeleccionada?.fechaStr ? new Date(`${citaSeleccionada.fechaStr}T00:00:00`) : new Date();
    setNuevaFecha(base);
    const parsed = parseHoraTo12(citaSeleccionada?.horaStr || '09:00');
    setHour12(parsed.h12);
    setMinute(parsed.mm);
    setAmpm(parsed.ampm);
    setUsarHoraActual(true);
    setPermitirFueraHorario(!!citaSeleccionada?.fueraHorario);
    setModalAccionVisible(false);
    setModalGestionVisible(true);
  }, [citaSeleccionada, parseHoraTo12]);

  const openDetalleModal = useCallback(() => {
    setModalAccionVisible(false);
    setModalDetalleVisible(true);
  }, []);

  const handleConfirmarAccion = useCallback(async () => {
    if (tipoAccion !== 'reprogramar' && tipoAccion !== 'cancelar') return;

    if (!justificacion.trim()) {
      Alert.alert('Validación', 'Por favor, provee una justificación.');
      return;
    }
    setIsSubmitting(true);

    try {
      if (tipoAccion === 'reprogramar') {
        const fecha = `${nuevaFecha.getFullYear()}-${String(nuevaFecha.getMonth() + 1).padStart(2, '0')}-${String(nuevaFecha.getDate()).padStart(2, '0')}`;
        const hora = usarHoraActual ? (citaSeleccionada?.horaStr || '09:00') : to24h(hour12, minute, ampm);

        await api.patch(`/citas/${citaSeleccionada.id_cita}/reprogramar`, {
          fecha,
          hora,
          justificacion,
          allow_out_of_schedule: permitirFueraHorario,
        });

        setCitas((prev) =>
          prev.map((c) =>
            c.id === citaSeleccionada.id
              ? {
                  ...c,
                  estatus: 'Reprogramada',
                  fechaStr: fecha,
                  horaStr: hora,
                  fecha: `${fecha}T${hora}:00`,
                  fechaSolicitud: new Date(`${fecha}T${hora}:00`).toISOString(),
                  justificacion: `[REPROGRAMADA] ${c.justificacion || ''}`.trim(),
                  fueraHorario: permitirFueraHorario || c.fueraHorario || false,
                  modificadoPor: 'Paciente',
                }
              : c
          )
        );
      }

      if (tipoAccion === 'cancelar') {
        setCitas((prev) =>
          prev.map((c) =>
            c.id === citaSeleccionada.id
              ? {
                  ...c,
                  estatus: 'Cancelada',
                  justificacion,
                  canceladoPor: 'Paciente',
                  modificadoPor: 'Paciente',
                }
              : c
          )
        );
      }

      Alert.alert('Éxito', tipoAccion === 'reprogramar' ? 'Tu cita fue reprogramada.' : 'Tu cita fue cancelada.');
      setModalGestionVisible(false);
    } catch (e) {
      api.handleError?.(e);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    tipoAccion,
    justificacion,
    nuevaFecha,
    usarHoraActual,
    hour12,
    minute,
    ampm,
    citaSeleccionada,
    permitirFueraHorario,
    to24h,
  ]);

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (event?.type === 'set' && selectedDate) setNuevaFecha(selectedDate);
  };

  const setFiltroDesdeModal = (estado) => {
    setFiltroEstatus(estado);
    setModalEstatusVisible(false);
  };

  const EmptyState = ({ texto, subtitulo }) => (
    <View style={{ alignItems: 'center', marginTop: 50, paddingHorizontal: 24 }}>
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

  const RecargarButton = () => (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Recargar citas"
      accessibilityHint="Vuelve a cargar tu historial de citas"
      onPress={fetchCitas}
      style={[styles.reloadButton, { borderColor: colores.principal }]}
    >
      <FontAwesome name="refresh" size={16} color={colores.principal} />
      <Text style={{ marginLeft: 8, color: colores.principal, fontWeight: '700' }}>Recargar</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colores.fondo, paddingTop: insets.top }]}>
      <View style={{ paddingHorizontal: COMPACT ? 12 : 20, paddingTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[styles.headerTitle, { color: colores.textoPrincipal, fontSize: COMPACT ? 20 : 28 }]}>Mi Historial de Citas</Text>
          <RecargarButton />
        </View>

        <View style={[styles.tabContainer, COMPACT ? styles.tabContainerCompact : null]}>
          <TouchableOpacity onPress={() => setActiveTab('Activas')} style={[styles.tabButton, activeTab === 'Activas' && { backgroundColor: colores.principal }, COMPACT ? styles.tabButtonCompact : null]}>
            <Text style={[styles.tabText, { color: activeTab === 'Activas' ? '#FFF' : colores.textoSecundario }]}>{COMPACT ? 'Activas' : 'Citas Activas'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('Historial')} style={[styles.tabButton, activeTab === 'Historial' && { backgroundColor: colores.principal }, COMPACT ? styles.tabButtonCompact : null]}>
            <Text style={[styles.tabText, { color: activeTab === 'Historial' ? '#FFF' : colores.textoSecundario }]}>{COMPACT ? 'Atendidas' : 'Atendidas'}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.searchWrapper, { backgroundColor: esOscuro ? '#151517' : '#FFFFFF' }]}>
          <FontAwesome name="search" size={18} color={colores.principal} />
          <TextInput
            style={[styles.searchInput, { color: colores.textoPrincipal, fontSize: COMPACT ? 14 : 16 }]}
            placeholder="Buscar por médico o especialidad..."
            placeholderTextColor={colores.textoSecundario}
            value={busqueda}
            onChangeText={setBusqueda}
            accessibilityLabel="Buscar citas"
            accessibilityHint="Filtra por médico o especialidad"
          />
        </View>

        <TouchableOpacity
          onPress={() => setModalEstatusVisible(true)}
          style={[styles.filterChip, { borderColor: colores.textoSecundario, paddingHorizontal: COMPACT ? 12 : 16 }]}
          accessibilityRole="button"
          accessibilityLabel="Filtrar por estado"
        >
          <FontAwesome name="filter" size={14} color={colores.textoSecundario} />
          <Text style={[styles.filterChipText, { color: colores.textoSecundario, fontSize: COMPACT ? 13 : 14 }]}>{filtroEstatus}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colores.principal} size="large" />
        </View>
      ) : activeTab === 'Activas' ? (
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
                if (item?.estatus === 'Atendida' || item?.estatus === 'Cancelada') openDetalleModalDirect(item);
                else openActionModal(item);
              }}
              compact={COMPACT}
            />
          )}
          renderSectionHeader={({ section: { title } }) => (
            <View style={[styles.sectionHeader, { paddingHorizontal: COMPACT ? 12 : 16 }]}>
              <Text style={[styles.sectionHeaderText, { fontSize: COMPACT ? 11 : 13 }]}>{title}</Text>
            </View>
          )}
          contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: Math.max(insets.bottom + 80, 120) }}
          ListEmptyComponent={
            <EmptyState
              texto="Aún no tienes citas activas."
              subtitulo="Solicita tu primera cita desde Agendar Cita para comenzar tu historial."
            />
          }
          stickySectionHeadersEnabled={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colores.principal} />}
        />
      ) : (
        <FlatList
          data={citasFiltradas}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TarjetaCitaHistorial
              item={item}
              onPress={() => openDetalleModalDirect(item)}
              compact={COMPACT}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 4, paddingTop: 10, paddingBottom: Math.max(insets.bottom + 80, 120) }}
          ListEmptyComponent={
            <EmptyState
              texto="No has solicitado ninguna cita atendida."
              subtitulo="Cuando completes una consulta, aparecerá aquí."
            />
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colores.principal} />}
        />
      )}

      {/* MODALES */}
      <Modal visible={modalAccionVisible} transparent animationType="fade" onRequestClose={() => setModalAccionVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalAccionVisible(false)}>
          <Pressable style={[styles.actionModalContainer, { backgroundColor: colores.superficie, flexDirection: COMPACT ? 'column' : 'column' }]}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalAccionVisible(false)}>
              <FontAwesome name="close" size={24} color={colores.textoSecundario} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colores.textoPrincipal }]}>Gestionar Cita</Text>
            <Text style={{ color: colores.textoSecundario, marginBottom: 18, textAlign: 'center' }}>
              {citaSeleccionada?.especialidad ?? ''} — {citaSeleccionada?.medico ? `${doctorPrefix(citaSeleccionada.med_sexo)} ${citaSeleccionada.medico}` : '—'}
            </Text>

            {/* Botones apilados (uno debajo del otro) para mejor UX en compact */}
            <View style={{ width: '100%' }}>
              <TouchableOpacity style={[styles.actionCard, { borderColor: colores.textoSecundario, flexDirection: 'row', alignItems: 'center' }]} onPress={openDetalleModal}>
                <FontAwesome name="info-circle" size={20} color={colores.textoSecundario} />
                <Text style={[styles.actionCardTitle, { color: colores.textoPrincipal, marginLeft: 12 }]}>Ver detalles</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionCard, { borderColor: ESTATUS_INFO.Reprogramada.color }]} onPress={() => openGestionModal('reprogramar')}>
                <FontAwesome name="calendar" size={20} color={ESTATUS_INFO.Reprogramada.color} />
                <Text style={[styles.actionCardTitle, { color: colores.textoPrincipal, marginLeft: 12 }]}>Reprogramar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionCard, { borderColor: ESTATUS_INFO.Cancelada.color }]} onPress={() => {
                setTipoAccion('cancelar');
                setJustificacion('');
                setModalAccionVisible(false);
                setModalGestionVisible(true);
              }}>
                <FontAwesome name="times-circle" size={20} color={ESTATUS_INFO.Cancelada.color} />
                <Text style={[styles.actionCardTitle, { color: colores.textoPrincipal, marginLeft: 12 }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={modalGestionVisible} transparent animationType="fade" onRequestClose={() => setModalGestionVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={[styles.gestionModalContainer, { backgroundColor: colores.superficie }]}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalGestionVisible(false)}>
              <FontAwesome name="close" size={24} color={colores.textoSecundario} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colores.textoPrincipal }]}>
              {tipoAccion === 'reprogramar' ? 'Reprogramar Cita' : 'Cancelar Cita'}
            </Text>

            {tipoAccion === 'reprogramar' && (
              <>
                <Text style={[styles.label, { color: colores.textoSecundario, marginBottom: 6 }]}>Nueva Fecha</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.datePickerButton, { borderColor: colores.principal }]}>
                  <Text style={{ color: colores.principal, fontSize: 16 }}>
                    {nuevaFecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && <DateTimePicker value={nuevaFecha} mode="date" display="calendar" onChange={onDateChange} />}

                <View style={{ marginTop: 10, width: '100%' }}>
                  <TouchableOpacity
                    onPress={() => setUsarHoraActual(!usarHoraActual)}
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                    accessibilityRole="button"
                    accessibilityLabel={usarHoraActual ? 'Usar hora actual (activado)' : 'Usar hora actual (desactivado)'}
                  >
                    <FontAwesome name={usarHoraActual ? 'toggle-on' : 'toggle-off'} size={28} color={colores.principal} />
                    <Text style={{ marginLeft: 8, color: colores.textoPrincipal, fontWeight: '700' }}>
                      {usarHoraActual ? 'Usar la misma hora' : 'Elegir nueva hora'}
                    </Text>
                  </TouchableOpacity>

                  {!usarHoraActual && (
                    <View style={{ marginTop: 10 }}>
                      <Text style={[styles.label, { color: colores.textoSecundario }]}>Hora</Text>
                      <View style={[chipStyles.chipsContainer, COMPACT ? chipStyles.chipsContainerColumn : null]}>
                        {[...Array(12)].map((_, idx) => {
                          const val = idx + 1;
                          return (
                            <SegChip
                              key={`h-${val}`}
                              label={String(val)}
                              active={hour12 === val}
                              onPress={() => setHour12(val)}
                              color={colores.principal}
                              compact={COMPACT}
                            />
                          );
                        })}
                      </View>

                      <Text style={[styles.label, { color: colores.textoSecundario, marginTop: 6 }]}>Minutos</Text>
                      <View style={[chipStyles.chipsContainer, COMPACT ? chipStyles.chipsContainerColumn : null]}>
                        {['00', '15', '30', '45'].map((mm) => (
                          <SegChip
                            key={`m-${mm}`}
                            label={mm}
                            active={minute === mm}
                            onPress={() => setMinute(mm)}
                            color={colores.principal}
                            compact={COMPACT}
                          />
                        ))}
                      </View>

                      <Text style={[styles.label, { color: colores.textoSecundario, marginTop: 6 }]}>Periodo</Text>
                      <View style={[chipStyles.chipsContainer, COMPACT ? chipStyles.chipsContainerColumn : null]}>
                        {['AM', 'PM'].map((p) => (
                          <SegChip
                            key={`p-${p}`}
                            label={p}
                            active={ampm === p}
                            onPress={() => setAmpm(p)}
                            color={colores.principal}
                            compact={COMPACT}
                          />
                        ))}
                      </View>
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={() => setPermitirFueraHorario(!permitirFueraHorario)}
                    style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}
                  >
                    <FontAwesome name={permitirFueraHorario ? 'check-square' : 'square-o'} size={18} color={'#F59E0B'} />
                    <Text style={{ marginLeft: 8, color: '#A16207', fontWeight: '700' }}>
                      Permitir fuera de horario
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <Text style={[styles.label, { color: colores.textoSecundario, marginTop: 12 }]}>
              Justificación {tipoAccion === 'cancelar' ? '(obligatoria)' : '(obligatoria)'}
            </Text>
            <TextInput
              style={[styles.modalInput, { borderColor: '#CCC', color: colores.textoPrincipal, backgroundColor: esOscuro ? '#2C2C2E' : '#F8FAFC' }]}
              value={justificacion}
              onChangeText={setJustificacion}
              multiline
              placeholder="Explica por qué reprogramas o cancelas..."
              accessibilityLabel="Escribe la justificación"
            />

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: isSubmitting ? '#AAA' : colores.principal }]}
              onPress={handleConfirmarAccion}
              disabled={isSubmitting}
            >
              {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalButtonText}>Confirmar</Text>}
            </TouchableOpacity>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Detalle modal (igual) */}
      <Modal visible={modalDetalleVisible} animationType="slide" onRequestClose={() => setModalDetalleVisible(false)}>
        <ScrollView style={{ flex: 1, backgroundColor: esOscuro ? '#000' : '#F2F2F7' }}>
          <View style={{ paddingTop: insets.top + 10, paddingHorizontal: COMPACT ? 12 : 20 }}>
            <TouchableOpacity onPress={() => setModalDetalleVisible(false)} style={styles.detalleCloseButton} accessibilityLabel="Cerrar detalle">
              <FontAwesome name="close" size={28} color={colores.textoPrincipal} />
            </TouchableOpacity>
            <Text style={[styles.detalleHeaderTitle, { color: colores.textoPrincipal, fontSize: COMPACT ? 18 : 22 }]}>Detalle de la Cita</Text>
          </View>

          {citaSeleccionada ? (
            <View style={{ padding: COMPACT ? 12 : 20 }}>
              <View style={styles.detalleSection}>
                <Text style={[styles.detalleSectionTitle, { color: colores.principal }]}>Cita</Text>
                <View style={styles.detalleRow}>
                  <Text style={[styles.detalleLabel, { color: colores.textoSecundario }]}>Especialidad</Text>
                  <Text style={[styles.detalleValue, { color: colores.textoPrincipal }]}>{citaSeleccionada.especialidad ?? '—'}</Text>
                </View>
                <View style={styles.detalleRow}>
                  <Text style={[styles.detalleLabel, { color: colores.textoSecundario }]}>Médico</Text>
                  <Text style={[styles.detalleValue, { color: colores.textoPrincipal }]}>
                    {citaSeleccionada.medico ? `${doctorPrefix(citaSeleccionada.med_sexo)} ${citaSeleccionada.medico}` : '—'}
                  </Text>
                </View>
                <View style={styles.detalleRow}>
                  <Text style={[styles.detalleLabel, { color: colores.textoSecundario }]}>Fecha</Text>
                  <Text style={[styles.detalleValue, { color: colores.textoPrincipal }]}>{fmtFechaLarga(citaSeleccionada.fechaStr)}</Text>
                </View>
                <View style={styles.detalleRow}>
                  <Text style={[styles.detalleLabel, { color: colores.textoSecundario }]}>Hora</Text>
                  <Text style={[styles.detalleValue, { color: colores.textoPrincipal }]}>{fmt12h(citaSeleccionada.horaStr)}</Text>
                </View>
                <View style={styles.detalleRow}>
                  <Text style={[styles.detalleLabel, { color: colores.textoSecundario }]}>Estado</Text>
                  <StatusTag estatus={citaSeleccionada.estatus ?? 'Pendiente'} />
                </View>
                {citaSeleccionada.fueraHorario ? (
                  <View style={[styles.detalleRow, { borderBottomWidth: 0, paddingVertical: 10 }]}>
                    <Text style={[styles.detalleLabel, { color: colores.textoSecundario }]}>Observación</Text>
                    <Text style={[styles.detalleValue, { color: '#A16207', fontWeight: '800' }]}>
                      Fuera de horario: {fmt12h(citaSeleccionada.horaStr)}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.detalleSection}>
                <Text style={[styles.detalleSectionTitle, { color: colores.principal }]}>Justificación</Text>
                <Text style={{ color: colores.textoSecundario }}>{citaSeleccionada.justificacion || 'Sin justificación'}</Text>
              </View>

              {citaSeleccionada.fechaAtencion ? (
                <View style={styles.detalleSection}>
                  <Text style={[styles.detalleSectionTitle, { color: colores.principal }]}>Registro de Atención</Text>
                  <Text style={{ color: colores.textoSecundario }}>
                    Atendida el: {new Date(citaSeleccionada.fechaAtencion).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short', hour12: true })}
                  </Text>
                </View>
              ) : null}
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
            <View style={{ width: '100%' }}>
              {['Todos', 'Pendiente', 'Reprogramada', 'Aprobada', 'Cancelada', 'Atendida'].map((estado) => (
                <TouchableOpacity
                  key={estado}
                  style={[styles.actionCard, { borderColor: filtroEstatus === estado ? colores.principal : '#EEE' }]}
                  onPress={() => setFiltroDesdeModal(estado)}
                  accessibilityLabel={`Filtrar por ${estado}`}
                >
                  <FontAwesome name={ESTATUS_INFO[estado]?.icon || 'list'} size={18} color={ESTATUS_INFO[estado]?.color || colores.textoSecundario} />
                  <Text style={[styles.actionCardTitle, { color: colores.textoPrincipal, marginLeft: 12 }]}>{estado}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  chipsContainerColumn: {
    flexDirection: 'column',
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.25,
    marginRight: 8,
    marginBottom: 8,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipCompact: {
    width: '100%',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  chipText: {
    fontWeight: '700',
  },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerTitle: { fontWeight: '800', letterSpacing: 0.5, marginBottom: COMPACT ? 8 : 12 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#E5E5EA', borderRadius: 12, padding: 4, marginBottom: 14, marginTop: 6 },
  tabContainerCompact: { flexDirection: 'column', alignItems: 'stretch' },
  tabButton: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', marginHorizontal: 4 },
  tabButtonCompact: { width: '100%', alignItems: 'flex-start', paddingHorizontal: 12, marginBottom: 8 },
  tabText: { fontWeight: '700' },

  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: COMPACT ? 8 : 10,
    marginBottom: 12,
    borderWidth: 1.2,
    borderColor: '#D1D5DB',
  },
  searchInput: { flex: 1, height: COMPACT ? 40 : 48, marginLeft: 10 },

  filterChip: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.2, marginBottom: 8 },
  filterChipText: { marginLeft: 8, fontWeight: '700', fontSize: COMPACT ? 13 : 14 },

  statusTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusTagText: { marginLeft: 6, fontSize: 11, fontWeight: '700' },

  /* Card */
  card: {
    flexDirection: 'row',
    borderRadius: 12,
    marginHorizontal: ITEM_MARGIN(),
    marginTop: 12,
    marginBottom: 16,
    elevation: 2,
  },
  cardCompact: {
    marginHorizontal: ITEM_MARGIN(true),
  },
  cardStateBorder: {
    width: 6,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  cardBody: {
    flex: 1,
    padding: 16,
  },
  cardBodyCompact: {
    padding: 12,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  cardHeaderLeft: { flex: 1, paddingRight: 12 },
  cardTitle: { fontSize: COMPACT ? 15 : 16, fontWeight: '700' },
  cardSubRow: { flexDirection: 'row', marginTop: 6, alignItems: 'center' },
  cardSubtitle: { marginLeft: 8, color: '#6B7280' },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusPillText: { marginLeft: 6, fontWeight: '700' },

  dateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  dateIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#17a2b8',
    backgroundColor: '#17a2b8' + '20',
  },
  metaLabel: { fontSize: 12 },
  metaValue: { fontWeight: '700' },

  outOfSchedule: {
    marginTop: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
    backgroundColor: '#F59E0B20',
  },
  outOfScheduleText: { marginLeft: 6, color: '#A16207', fontWeight: '700' },

  sectionLabel: { color: '#6B7280', marginBottom: 4, fontSize: COMPACT ? 12 : 13 },
  sectionText: { fontSize: COMPACT ? 13 : 15, lineHeight: 20 },

  cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 12 },
  detailButton: { backgroundColor: '#4F46E5', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  detailButtonCompact: { paddingVertical: 8, paddingHorizontal: 10 },
  detailButtonText: { color: '#fff', fontWeight: '700', marginLeft: 6 },

  /* Section header */
  sectionHeader: { paddingVertical: 8, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: '#E6E6E9', marginTop: 6 },
  sectionHeaderText: { fontSize: COMPACT ? 11 : 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },

  /* Modals */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: COMPACT ? 12 : 20 },
  actionModalContainer: { borderRadius: 12, paddingVertical: COMPACT ? 12 : 18, paddingHorizontal: COMPACT ? 12 : 14, width: '100%', maxWidth: COMPACT ? 360 : 440, alignItems: 'center' },
  actionCard: { flexDirection: 'row', alignItems: 'center', width: '100%', padding: COMPACT ? 10 : 12, borderRadius: 10, borderWidth: 1.2, marginBottom: 10 },
  actionCardTitle: { fontSize: COMPACT ? 15 : 16, fontWeight: '700' },
  closeButton: { position: 'absolute', top: 12, right: 12, padding: 6 },
  modalTitle: { fontSize: COMPACT ? 16 : 18, fontWeight: '800', marginBottom: 10 },

  gestionModalContainer: { borderRadius: 12, padding: COMPACT ? 12 : 16, width: '100%', maxWidth: COMPACT ? 360 : 440, alignItems: 'center' },
  datePickerButton: { width: '100%', borderWidth: 1.5, borderRadius: 12, padding: COMPACT ? 10 : 12, alignItems: 'center', marginBottom: 12, backgroundColor: '#F8FAFC' },
  label: { fontSize: COMPACT ? 13 : 14, fontWeight: '700' },
  modalInput: { width: '100%', borderWidth: 1.5, borderRadius: 12, padding: 10, minHeight: 80, textAlignVertical: 'top', fontSize: COMPACT ? 13 : 15, marginTop: 6 },
  modalButton: { width: '100%', padding: COMPACT ? 10 : 12, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  modalButtonText: { color: '#FFF', fontWeight: '800' },

  detalleHeaderTitle: { fontSize: COMPACT ? 18 : 22, fontWeight: '800', marginTop: 8 },
  detalleCloseButton: { position: 'absolute', top: 8, right: 10, padding: 8 },
  detalleSection: { marginBottom: 18 },
  detalleSectionTitle: { fontSize: COMPACT ? 14 : 16, fontWeight: '800', marginBottom: 10 },
  detalleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  detalleLabel: { fontSize: COMPACT ? 13 : 14, color: '#666' },
  detalleValue: { fontSize: COMPACT ? 13 : 14, fontWeight: '700', flex: 1, textAlign: 'right', marginLeft: 10 },

  reloadButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1 },
});

function ITEM_MARGIN(compact = false) {
  return compact ? 8 : 16;
}