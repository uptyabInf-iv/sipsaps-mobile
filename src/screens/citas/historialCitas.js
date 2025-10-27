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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTemasPersonalizado } from '../../hooks/useTemasPersonalizado';
import * as Animatable from 'react-native-animatable';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../utils/api';

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

// Selectors de hora (AM/PM) accesibles
const SegChip = ({ label, active, onPress, color }) => (
  <TouchableOpacity
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
    style={{
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: active ? color : '#E5E5E7',
      backgroundColor: active ? color + '15' : 'transparent',
      marginRight: 8,
      marginBottom: 8,
    }}
  >
    <Text style={{ color: active ? color : '#111827', fontWeight: '700' }}>{label}</Text>
  </TouchableOpacity>
);

const TarjetaCitaHistorial = React.memo(({ item, onPress }) => {
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
      style={{
        flexDirection: 'row',
        borderRadius: 12,
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 16,
        backgroundColor: colores.superficie,
        shadowColor: esOscuro ? '#000' : '#555',
        elevation: 2,
      }}
    >
      {/* Borde de estado */}
      <View style={{ width: 6, backgroundColor: infoEstatus.color, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 }} />

      <View style={{ flex: 1, padding: 16 }}>
        {/* Encabezado: Especialidad + Estado */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colores.textoPrincipal }} numberOfLines={1}>
              {item?.especialidad ?? '—'}
            </Text>
            {/* Médico con prefijo */}
            <View style={{ flexDirection: 'row', marginTop: 6, alignItems: 'center' }}>
              <FontAwesome name="user-md" size={14} color={colores.textoSecundario} />
              <Text style={{ marginLeft: 8, color: colores.textoSecundario }} numberOfLines={1}>
                {medDisplay}
              </Text>
            </View>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: infoEstatus.color,
              backgroundColor: infoEstatus.color + '20',
            }}
          >
            <FontAwesome name={infoEstatus.icon} size={14} color={infoEstatus.color} />
            <Text style={{ marginLeft: 6, fontWeight: '700', color: colores.textoPrincipal }}>{item?.estatus ?? 'Pendiente'}</Text>
          </View>
        </View>

        {/* Fecha y hora sin TZ shift */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#17a2b8' + '20',
              borderWidth: 1,
              borderColor: '#17a2b8',
            }}
          >
            <FontAwesome name="calendar-o" size={14} color="#17a2b8" />
          </View>
          <View style={{ marginLeft: 10 }}>
            <Text style={{ color: colores.textoSecundario, fontSize: 12 }}>Programada</Text>
            <Text style={{ color: colores.textoPrincipal, fontWeight: '700' }}>
              {fmtFechaLarga(item.fechaStr)} • {horaChip}
            </Text>
          </View>
        </View>

        {/* Fuera de horario */}
        {fueraHorario ? (
          <View
            style={{
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
            }}
          >
            <FontAwesome name="exclamation-triangle" size={12} color="#F59E0B" />
            <Text style={{ marginLeft: 6, color: '#A16207', fontWeight: '700' }}>Fuera de horario: {horaChip}</Text>
          </View>
        ) : null}

        {/* Motivo o justificación */}
        {item?.motivo ? (
          <View style={{ marginTop: 12 }}>
            <Text style={{ color: colores.textoSecundario, fontSize: 12, marginBottom: 4 }}>Motivo</Text>
            <Text style={{ color: colores.textoPrincipal, fontSize: 15, lineHeight: 22 }} numberOfLines={3}>
              {item.motivo}
            </Text>
          </View>
        ) : preview ? (
          <View style={{ marginTop: 12 }}>
            <Text style={{ color: colores.textoSecundario, fontSize: 12, marginBottom: 4 }}>Nota</Text>
            <Text style={{ color: colores.textoPrincipal, fontSize: 15, lineHeight: 22 }} numberOfLines={3}>
              {preview}
            </Text>
          </View>
        ) : null}

        {/* Separador */}
        <View style={{ height: 1, backgroundColor: '#F0F0F0', marginTop: 14, marginBottom: 10 }} />

        {/* Footer: acción principal */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={onPress}
            style={{
              backgroundColor: colores.principal,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <FontAwesome name="eye" size={12} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', marginLeft: 6 }}>Ver detalle</Text>
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

      // fuente principal: r.fecha y r.hora del backend
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
    // inicializa fecha y hora con los actuales
    const base = citaSeleccionada?.fechaStr
      ? new Date(`${citaSeleccionada.fechaStr}T00:00:00`)
      : new Date();
    setNuevaFecha(base);
    // hora
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
        const hora = usarHoraActual
          ? (citaSeleccionada?.horaStr || '09:00')
          : to24h(hour12, minute, ampm);

        await api.patch(`/citas/${citaSeleccionada.id_cita}/reprogramar`, {
          fecha,
          hora,
          justificacion,
          allow_out_of_schedule: permitirFueraHorario,
        });

        // Actualiza UI local
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
        // Si más adelante añades endpoint de cancelación, llámalo aquí.
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
      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: colores.principal }}
    >
      <FontAwesome name="refresh" size={16} color={colores.principal} />
      <Text style={{ marginLeft: 8, color: colores.principal, fontWeight: '700' }}>Recargar</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colores.fondo, paddingTop: insets.top }]}>
      <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[styles.headerTitle, { color: colores.textoPrincipal }]}>Mi Historial de Citas</Text>
          <RecargarButton />
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity onPress={() => setActiveTab('Activas')} style={[styles.tabButton, activeTab === 'Activas' && { backgroundColor: colores.principal }]}>
            <Text style={[styles.tabText, { color: activeTab === 'Activas' ? '#FFF' : colores.textoSecundario }]}>Citas Activas</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('Historial')} style={[styles.tabButton, activeTab === 'Historial' && { backgroundColor: colores.principal }]}>
            <Text style={[styles.tabText, { color: activeTab === 'Historial' ? '#FFF' : colores.textoSecundario }]}>Atendidas</Text>
          </TouchableOpacity>
        </View>

        {/* Buscador más notable */}
        <View style={[styles.searchWrapper, { backgroundColor: esOscuro ? '#151517' : '#FFFFFF' }]}>
          <FontAwesome name="search" size={18} color={colores.principal} />
          <TextInput
            style={[styles.searchInput, { color: colores.textoPrincipal }]}
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
          style={[styles.filterChip, { borderColor: colores.textoSecundario }]}
          accessibilityRole="button"
          accessibilityLabel="Filtrar por estado"
        >
          <FontAwesome name="filter" size={14} color={colores.textoSecundario} />
          <Text style={[styles.filterChipText, { color: colores.textoSecundario }]}>{filtroEstatus}</Text>
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
            />
          )}
          renderSectionHeader={({ section: { title } }) => (
            <View style={[styles.sectionHeader]}>
              <Text style={styles.sectionHeaderText}>{title}</Text>
            </View>
          )}
          contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 50 }}
          ListEmptyComponent={
            <EmptyState
              texto="Aún no tienes citas activas."
              subtitulo="Solicita tu primera cita desde Agendar Cita para comenzar tu historial."
            />
          }
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
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 4, paddingTop: 10, paddingBottom: 50 }}
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
          <Pressable style={[styles.actionModalContainer, { backgroundColor: colores.superficie }]}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalAccionVisible(false)}>
              <FontAwesome name="close" size={24} color={colores.textoSecundario} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colores.textoPrincipal }]}>Gestionar Cita</Text>
            <Text style={{ color: colores.textoSecundario, marginBottom: 18, textAlign: 'center' }}>
              {citaSeleccionada?.especialidad ?? ''} — {citaSeleccionada?.medico ? `${doctorPrefix(citaSeleccionada.med_sexo)} ${citaSeleccionada.medico}` : '—'}
            </Text>

            <TouchableOpacity style={[styles.actionCard, { borderColor: colores.textoSecundario }]} onPress={openDetalleModal}>
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

                {/* Hora: usar la actual o seleccionar nueva */}
                <View style={{ marginTop: 10 }}>
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
                      {/* Select de horas 1-12 */}
                      <Text style={[styles.label, { color: colores.textoSecundario }]}>Hora</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {[...Array(12)].map((_, idx) => {
                          const val = idx + 1;
                          return (
                            <SegChip
                              key={`h-${val}`}
                              label={String(val)}
                              active={hour12 === val}
                              onPress={() => setHour12(val)}
                              color={colores.principal}
                            />
                          );
                        })}
                      </View>

                      {/* Minutos */}
                      <Text style={[styles.label, { color: colores.textoSecundario, marginTop: 6 }]}>Minutos</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {['00', '15', '30', '45'].map((mm) => (
                          <SegChip
                            key={`m-${mm}`}
                            label={mm}
                            active={minute === mm}
                            onPress={() => setMinute(mm)}
                            color={colores.principal}
                          />
                        ))}
                      </View>

                      {/* AM/PM */}
                      <Text style={[styles.label, { color: colores.textoSecundario, marginTop: 6 }]}>Periodo</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {['AM', 'PM'].map((p) => (
                          <SegChip
                            key={`p-${p}`}
                            label={p}
                            active={ampm === p}
                            onPress={() => setAmpm(p)}
                            color={colores.principal}
                          />
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Permitir fuera de horario */}
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

      <Modal visible={modalDetalleVisible} animationType="slide" onRequestClose={() => setModalDetalleVisible(false)}>
        <ScrollView style={{ flex: 1, backgroundColor: esOscuro ? '#000' : '#F2F2F7' }}>
          <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 20 }}>
            <TouchableOpacity onPress={() => setModalDetalleVisible(false)} style={styles.detalleCloseButton} accessibilityLabel="Cerrar detalle">
              <FontAwesome name="close" size={28} color={colores.textoPrincipal} />
            </TouchableOpacity>
            <Text style={[styles.detalleHeaderTitle, { color: colores.textoPrincipal }]}>Detalle de la Cita</Text>
          </View>

          {citaSeleccionada ? (
            <View style={{ padding: 20 }}>
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
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerTitle: { fontSize: 28, fontWeight: '800', letterSpacing: 0.5, marginBottom: 12 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#E5E5EA', borderRadius: 12, padding: 4, marginBottom: 14, marginTop: 6 },
  tabButton: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabText: { fontWeight: '700' },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: { flex: 1, height: 48, marginLeft: 10, fontSize: 16 },
  filterChip: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.2, marginBottom: 8 },
  filterChipText: { marginLeft: 8, fontWeight: '700', fontSize: 14 },
  statusTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusTagText: { marginLeft: 6, fontSize: 11, fontWeight: '700' },
  sectionHeader: { paddingVertical: 8, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: '#E6E6E9', marginTop: 6 },
  sectionHeaderText: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  actionModalContainer: { borderRadius: 12, paddingVertical: 18, paddingHorizontal: 14, width: '100%', maxWidth: 440, alignItems: 'center' },
  actionCard: { flexDirection: 'row', alignItems: 'center', width: '100%', padding: 12, borderRadius: 10, borderWidth: 1.2, marginBottom: 10 },
  actionCardTitle: { fontSize: 16, fontWeight: '700' },
  closeButton: { position: 'absolute', top: 12, right: 12, padding: 6 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 10 },
  gestionModalContainer: { borderRadius: 12, padding: 16, width: '100%', maxWidth: 440, alignItems: 'center' },
  datePickerButton: { width: '100%', borderWidth: 1.5, borderRadius: 12, padding: 12, alignItems: 'center', marginBottom: 12, backgroundColor: '#F8FAFC' },
  label: { fontSize: 13, fontWeight: '700' },
  modalInput: { width: '100%', borderWidth: 1.5, borderRadius: 12, padding: 12, minHeight: 80, textAlignVertical: 'top', fontSize: 15, marginTop: 6 },
  modalButton: { width: '100%', padding: 12, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  modalButtonText: { color: '#FFF', fontWeight: '800' },
  detalleHeaderTitle: { fontSize: 22, fontWeight: '800', marginTop: 8 },
  detalleCloseButton: { position: 'absolute', top: 8, right: 10, padding: 8 },
  detalleSection: { marginBottom: 18 },
  detalleSectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 10 },
  detalleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  detalleLabel: { fontSize: 14, color: '#666' },
  detalleValue: { fontSize: 14, fontWeight: '700', flex: 1, textAlign: 'right', marginLeft: 10 },
});