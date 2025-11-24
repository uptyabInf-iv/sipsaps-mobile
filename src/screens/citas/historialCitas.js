// src/screens/citas/historialCitas.js
import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SectionList,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTemasPersonalizado } from '../../hooks/useTemasPersonalizado';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../utils/api';
import { FontAwesome } from '@expo/vector-icons';

// Componentes extraídos
import TarjetaCitaHistorial from '../../components/citas/usuarios/TarjetaCitaHistorial';
import { EstadoVacioCitas, BotonRecargarCitas } from '../../components/citas/usuarios/ControlesCitas';
import { ModalAccionesCita, ModalGestionCita, ModalDetalleCita, ModalFiltroEstatus } from '../../components/citas/usuarios/ModalesCitas';
import ChipSegmentado from '../../components/citas/usuarios/ChipSegmentado';
import EstadoEtiqueta, { ESTATUS_INFO } from '../../components/citas/usuarios/EstadoEtiqueta';
import { styles, chipStyles, COMPACT, ITEM_MARGIN } from '../../components/citas/usuarios/estilosCitas';
import { formatISOCaracas, stripBracketsAndCurly, humanizeTaggedEntry } from '../../utils/fechas';

// Helpers de formato (evitan desfases por zona horaria) — los dejo en la pantalla para centralizar lógica
const fmt12h = (hhmm) => {
  if (!hhmm) return '—';
  const parts = hhmm.split(':').map((n) => parseInt(n, 10));
  if (parts.length < 2) return '—';
  const [H, M] = parts;
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
    if (isNaN(d.getTime())) return yyyyMmDd;
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

  const searchInputRef = useRef(null);

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
    if (!Array.isArray(arr)) return [];
    return arr.map((r) => {
      // Defensive shorthand for fields that can be missing
      const med_sexo = r.med_sexo || r.sexo_medico || null;
      const just = r.justificacion || '';
      const fueraHorario = !!r.fueraHorario || /\[FUERA_HORARIO\]/i.test(just);

      // fecha/hora crudos del backend (validamos formatos simples)
      const fechaStr = r.fecha || (r.fechaSolicitud ? new Date(r.fechaSolicitud).toISOString().slice(0, 10) : null);

      // normalize hora: backend may send '18:00:00' or '18:00'
      let horaRaw = r.hora || null;
      if (horaRaw && typeof horaRaw === 'string') {
        // take HH:MM portion
        const m = horaRaw.match(/^(\d{2}:\d{2})/);
        horaRaw = m ? m[1] : horaRaw;
      } else if (!horaRaw && r.fechaSolicitud) {
        const d = new Date(r.fechaSolicitud);
        if (!isNaN(d.getTime())) {
          horaRaw = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }
      }

      // NUEVOS campos que el backend ahora puede enviar (humanizados / limpiados)
      const just_human = r.justificacion_human || null;
      const comentario_medico_human = r.comentario_medico_human || null;
      const motivo_cancelacion_human = r.motivo_cancelacion_human || null;
      const diagnostico_clean = r.diagnostico_clean || r.diagnostico || null;
      const fechaAtencionISO = r.fechaAtencion || null;
      const fechaAtencion_human = r.fechaAtencion_human || (fechaAtencionISO ? formatISOCaracas(fechaAtencionISO) : null);

      // detalle / motivo (columna detalles en BD viene como motivo en SELECT)
      const motivoRaw = (r.motivo ?? r.detalles ?? r.detalle ?? '') || '';
      // prefer humanized tags if backend provided them for motivo/motivo_cancelacion etc
      const motivoClean = typeof motivoRaw === 'string' ? stripBracketsAndCurly(motivoRaw) : '';

      // If backend didn't provide humanized strings for tagged fields, create a fallback
      // e.g., motivo_cancelacion_human might be null — fallback to humanizeTaggedEntry
      const motivo_cancelacion_human_final = motivo_cancelacion_human || (r.motivo_cancelacion ? humanizeTaggedEntry(r.motivo_cancelacion) : null);

      return {
        id: String(r.id_cita ?? r.id ?? Math.random()),
        id_cita: r.id_cita,
        especialidad: r.especialidad || '—',
        medico: r.medico || `${(r.med_nombre || '')} ${(r.med_apellido || '')}`.trim(),
        med_sexo,
        fechaStr,
        horaStr: horaRaw,
        // fecha ISO composed (useful para sorting or future ops); only if both parts valid
        fecha: fechaStr && horaRaw ? `${fechaStr}T${horaRaw}:00` : null,
        fechaSolicitud: r.fechaSolicitud || (fechaStr && horaRaw ? new Date(`${fechaStr}T${horaRaw}:00`).toISOString() : null),
        estatus: r.estatus || 'Pendiente',
        modificadoPor: r.modificadoPor || null,
        canceladoPor: r.canceladopor || r.canceladoPor || null,
        justificacion: r.justificacion || '',
        justificacion_human: just_human,
        motivo_cancelacion: r.motivo_cancelacion || '',
        motivo_cancelacion_human: motivo_cancelacion_human_final,
        comentario_medico: r.comentario_medico || '',
        comentario_medico_human,
        diagnostico: r.diagnostico || '',
        diagnostico_clean,
        fechaAtencion: fechaAtencionISO || null,
        fechaAtencion_human,
        fueraHorario,
        // Añadido: motivo / detalles crudos y saneados para que los modales los muestren
        motivo: motivoClean,
        detalles_raw: r.detalles ?? null,
        // Mantener original payload por si se necesita (no serializar en storage)
        _raw: r,
      };
    });
  }, []);

  const fetchCitas = useCallback(async () => {
    // Avoid overlapping fetches
    if (loading) return;
    try {
      setLoading(true);
      const data = await api.get('/citas/mias');
      const arr = Array.isArray(data) ? data : data?.data || [];
      setCitas(mapCitas(arr));
    } catch (e) {
      // Mejor manejo de errores: log y mostrar vacío para que UI no se rompa
      console.warn('fetchCitas error', e);
      api.handleError?.(e);
      setCitas([]);
    } finally {
      setLoading(false);
    }
  }, [loading, mapCitas]);

  const refresh = useCallback(async () => {
    if (refreshing) return;
    try {
      setRefreshing(true);
      const data = await api.get('/citas/mias');
      const arr = Array.isArray(data) ? data : data?.data || [];
      setCitas(mapCitas(arr));
    } catch (e) {
      console.warn('refresh citas error', e);
      api.handleError?.(e);
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, mapCitas]);

  useFocusEffect(useCallback(() => {
    // On focus, fetch only if list is empty to avoid too many requests.
    if (!citas.length) fetchCitas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchCitas]));

  // separar activas/atendidas
  const { citasActivas, citasAtendidas } = useMemo(() => {
    const arr = Array.isArray(citas) ? citas : [];
    return {
      citasActivas: arr.filter((c) => (c?.estatus || '').toLowerCase() !== 'atendida'),
      citasAtendidas: arr.filter((c) => (c?.estatus || '').toLowerCase() === 'atendida'),
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
          (c?.medico ?? '').toLowerCase().includes(q) ||
          (c?.motivo ?? '').toLowerCase().includes(q)
      );
    }
    if (filtroEstatus !== 'Todos') {
      base = base.filter((c) => c?.estatus === filtroEstatus);
    }
    // Sort defensivamente: prefer fecha (ISO) if available, fallback to fechaStr/horaStr
    return base.slice().sort((a, b) => {
      const dateA = a.fecha ? new Date(a.fecha) : (a.fechaSolicitud ? new Date(a.fechaSolicitud) : null);
      const dateB = b.fecha ? new Date(b.fecha) : (b.fechaSolicitud ? new Date(b.fechaSolicitud) : null);
      if (dateA && dateB) return dateB - dateA;
      // Fallback lexicográfico
      const keyA = `${a.fechaStr || ''}T${a.horaStr || '00:00'}`;
      const keyB = `${b.fechaStr || ''}T${b.horaStr || '00:00'}`;
      return new Date(keyB) - new Date(keyA);
    });
  }, [citasActivas, citasAtendidas, activeTab, busqueda, filtroEstatus]);

  const abrirModalAccion = useCallback((cita) => {
    setCitaSeleccionada(cita);
    setModalAccionVisible(true);
  }, []);

  const abrirDetalleDirecto = useCallback((cita) => {
    setCitaSeleccionada(cita);
    setModalDetalleVisible(true);
  }, []);

  const abrirGestionDesdeAccion = useCallback((accion) => {
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

  const abrirDetalleDesdeAccion = useCallback(() => {
    setModalAccionVisible(false);
    setModalDetalleVisible(true);
  }, []);

  const handleConfirmarAccion = useCallback(async () => {
    if (tipoAccion !== 'reprogramar' && tipoAccion !== 'cancelar') return;

    if (!justificacion.trim()) {
      // validación sencilla
      alert('Por favor, provee una justificación.');
      return;
    }
    setIsSubmitting(true);

    try {
      if (tipoAccion === 'reprogramar') {
        const fecha = `${nuevaFecha.getFullYear()}-${String(nuevaFecha.getMonth() + 1).padStart(2, '0')}-${String(nuevaFecha.getDate()).padStart(2, '0')}`;
        const hora = usarHoraActual ? (citaSeleccionada?.horaStr || '09:00') : to24h(hour12, minute, ampm);

        // Llamada al backend (paciente) — ya existe la ruta /:id/reprogramar
        await api.patch(`/citas/${citaSeleccionada.id_cita}/reprogramar`, {
          fecha,
          hora,
          justificacion,
          allow_out_of_schedule: permitirFueraHorario,
        });

        // solicitar estado actualizado al backend en lugar de mutar localmente para evitar inconsistencias
        await fetchCitas();
      }

      if (tipoAccion === 'cancelar') {
        // Llamada al backend para cancelar como paciente (nueva ruta)
        await api.patch(`/citas/${citaSeleccionada.id_cita}/cancelar-paciente`, {
          justificacion,
        });

        // refrescar desde backend
        await fetchCitas();
      }

      alert(tipoAccion === 'reprogramar' ? 'Tu cita fue reprogramada.' : 'Tu cita fue cancelada.');
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
    fetchCitas,
  ]);

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (event?.type === 'set' && selectedDate) setNuevaFecha(selectedDate);
  };

  const setFiltroDesdeModal = (estado) => {
    setFiltroEstatus(estado);
    setModalEstatusVisible(false);
  };

  // Helper: limpia búsqueda y enfoca input
  const clearSearch = useCallback(() => {
    setBusqueda('');
    if (searchInputRef.current && searchInputRef.current.focus) {
      searchInputRef.current.focus();
    }
  }, []);

  // Layout: header + controls
  return (
    <View style={[styles.container, { backgroundColor: colores.fondo, paddingTop: insets.top }]}>
      <View style={{ paddingHorizontal: COMPACT ? 12 : 20, paddingTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={[styles.headerTitle, { color: colores.textoPrincipal, fontSize: COMPACT ? 20 : 28 }]}>Mi Historial de Citas</Text>
          <BotonRecargarCitas onPress={fetchCitas} />
        </View>

        <View style={[styles.tabContainer, COMPACT ? styles.tabContainerCompact : null]}>
          <TouchableOpacity onPress={() => setActiveTab('Activas')} style={[styles.tabButton, activeTab === 'Activas' && { backgroundColor: colores.principal }, COMPACT ? styles.tabButtonCompact : null]}>
            <Text style={[styles.tabText, { color: activeTab === 'Activas' ? '#FFF' : colores.textoSecundario }]}>{COMPACT ? 'Activas' : 'Citas Activas'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('Historial')} style={[styles.tabButton, activeTab === 'Historial' && { backgroundColor: colores.principal }, COMPACT ? styles.tabButtonCompact : null]}>
            <Text style={[styles.tabText, { color: activeTab === 'Historial' ? '#FFF' : colores.textoSecundario }]}>{COMPACT ? 'Atendidas' : 'Atendidas'}</Text>
          </TouchableOpacity>
        </View>

        {/* CONTROL BAR */}
        <View style={styles.controlBar}>
          {/* Search */}
          <View style={[styles.searchWrapper, { backgroundColor: esOscuro ? '#151517' : '#FFFFFF' }]}>
            {/* ICONO 1: search */}
            <FontAwesome name="search" size={16} color={colores.textoSecundario} />
            <TextInput
              ref={searchInputRef}
              style={[styles.searchInput, { color: colores.textoPrincipal, fontSize: COMPACT ? 14 : 16 }]}
              placeholder="Buscar por médico, especialidad o motivo..."
              placeholderTextColor={colores.textoSecundario}
              value={busqueda}
              onChangeText={setBusqueda}
              accessibilityLabel="Buscar citas"
              accessibilityHint="Filtra por médico, especialidad o motivo"
              returnKeyType="search"
              underlineColorAndroid="transparent"
            />
            {busqueda ? (
              <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }} accessibilityLabel="Limpiar búsqueda">
                {/* ICONO 2: times-circle */}
                <FontAwesome name="times-circle" size={18} color={colores.textoSecundario} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Filter chip */}
          <TouchableOpacity
            onPress={() => setModalEstatusVisible(true)}
            style={[styles.filterChip, { borderColor: colores.textoSecundario, paddingHorizontal: COMPACT ? 12 : 16 }]}
            accessibilityRole="button"
            accessibilityLabel="Filtrar por estado"
          >
            {/* ICONO 3: filter */}
            <FontAwesome name="filter" size={14} color={colores.textoSecundario} />
            <Text style={[styles.filterChipText, { color: colores.textoSecundario, fontSize: COMPACT ? 13 : 14 }]}>{filtroEstatus}</Text>
          </TouchableOpacity>
        </View>
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
                if ((item?.estatus || '').toLowerCase() === 'atendida' || (item?.estatus || '').toLowerCase() === 'cancelada') abrirDetalleDirecto(item);
                else abrirModalAccion(item);
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
            <EstadoVacioCitas
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
              onPress={() => abrirDetalleDirecto(item)}
              compact={COMPACT}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 4, paddingTop: 10, paddingBottom: Math.max(insets.bottom + 80, 120) }}
          ListEmptyComponent={
            <EstadoVacioCitas
              texto="No has solicitado ninguna cita atendida."
              subtitulo="Cuando completes una consulta, aparecerá aquí."
            />
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colores.principal} />}
        />
      )}

      {/* MODALES controlados desde la pantalla — paso de props para que la lógica quede aquí */}
      <ModalAccionesCita
        visible={modalAccionVisible}
        onClose={() => setModalAccionVisible(false)}
        cita={citaSeleccionada}
        onVerDetalle={abrirDetalleDesdeAccion}
        onReprogramar={() => abrirGestionDesdeAccion('reprogramar')}
        onCancelar={() => {
          setTipoAccion('cancelar');
          setJustificacion('');
          setModalAccionVisible(false);
          setModalGestionVisible(true);
        }}
      />

      <ModalGestionCita
        visible={modalGestionVisible}
        onClose={() => setModalGestionVisible(false)}
        tipoAccion={tipoAccion}
        nuevaFecha={nuevaFecha}
        showDatePicker={showDatePicker}
        onMostrarPicker={() => setShowDatePicker(true)}
        onChangeDate={onDateChange}
        usarHoraActual={usarHoraActual}
        setUsarHoraActual={setUsarHoraActual}
        hour12={hour12}
        setHour12={setHour12}
        minute={minute}
        setMinute={setMinute}
        ampm={ampm}
        setAmpm={setAmpm}
        permitirFueraHorario={permitirFueraHorario}
        setPermitirFueraHorario={setPermitirFueraHorario}
        justificacion={justificacion}
        setJustificacion={setJustificacion}
        onConfirmar={handleConfirmarAccion}
        isSubmitting={isSubmitting}
        compact={COMPACT}
        colores={colores}
        esOscuro={esOscuro}
      />

      <ModalDetalleCita
        visible={modalDetalleVisible}
        onClose={() => setModalDetalleVisible(false)}
        cita={citaSeleccionada}
        colores={colores}
        esOscuro={esOscuro}
        insets={insets}
      />

      <ModalFiltroEstatus
        visible={modalEstatusVisible}
        onClose={() => setModalEstatusVisible(false)}
        filtroActual={filtroEstatus}
        onSeleccionar={setFiltroDesdeModal}
      />
    </View>
  );
}