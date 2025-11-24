// src/components/citas/apartado-medico/GestionCitasMedico.js
// NOTAS: Se respeta la integridad de tu archivo original. Sólo se ajusta:
// - Al abrir modal de 'atender' el campo de comentario permanecerá vacío (no precargar comentario_medico).
// - Se prefiere mostrar campos humanizados que el backend ahora envía.
// - No se alteró la firma de las funciones usadas por frontend/backend.

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  SectionList,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useTemasPersonalizado } from '../../../hooks/useTemasPersonalizado';
import api from '../../../utils/api';

import TarjetaCita from './TarjetaCita';
import CabeceraSeccion from './SectionHeader';
import GuiaVisualColapsable from './GuiaVisualColapsable';
import {
  ModalAcciones,
  ModalGestion,
  ModalPacientes,
  ModalEstatus,
  ModalDetalle,
  ModalHorario,
} from './ModalesGestion';
import { existeSolapamiento, esFechaPasada } from './validacionesFechas';

const ORDEN_SECCIONES = ['Pendiente', 'Reprogramada', 'Aprobada', 'Cancelada'];

const toTitle = (s = '') =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
const normalizeKeysLower = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const out = Array.isArray(obj) ? [] : {};
  Object.keys(obj).forEach((k) => {
    const v = obj[k];
    out[k.toLowerCase()] =
      v && typeof v === 'object' ? normalizeKeysLower(v) : v;
  });
  return out;
};

const composeLocalDateTime = (fecha = '', hora = '') => {
  const fm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(fecha));
  const hm = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(String(hora));
  if (!fm || !hm) return null;
  const y = parseInt(fm[1], 10);
  const m = parseInt(fm[2], 10) - 1;
  const d = parseInt(fm[3], 10);
  const hh = parseInt(hm[1], 10);
  const mm = parseInt(hm[2], 10);
  const ss = hm[3] ? parseInt(hm[3], 10) : 0;
  const dt = new Date(y, m, d, hh, mm, ss, 0);
  return isNaN(dt) ? null : dt;
};

const fechaAtencionFromJust = (just = '') => {
  const m = String(just || '').match(/\[FECHA_ATENCION:([^\]]+)\]/i);
  if (m && m[1]) {
    const d = new Date(m[1]);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COMPACT = SCREEN_WIDTH <= 360;

export default function GestionCitasMedico() {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { colores } = useTemasPersonalizado();

  const [citas, setCitas] = useState([]);
  const [activeTab, setActiveTab] = useState('Activas');
  const [busquedaGeneral, setBusquedaGeneral] = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState('Todos');
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);

  const [modalAccionVisible, setModalAccionVisible] = useState(false);
  const [modalGestionVisible, setModalGestionVisible] = useState(false);
  const [modalPacienteVisible, setModalPacienteVisible] = useState(false);
  const [modalEstatusVisible, setModalEstatusVisible] = useState(false);
  const [modalDetalleVisible, setModalDetalleVisible] = useState(false);
  const [modalHorarioVisible, setModalHorarioVisible] = useState({
    visible: false,
    tipo: 'inicio',
  });

  const [tipoAccion, setTipoAccion] = useState('');
  const [justificacion, setJustificacion] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [fechaCita, setFechaCita] = useState(new Date());
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFin, setHoraFin] = useState('09:30');

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const mapServerToFront = useCallback((arr = []) => {
    return (arr || []).map((row) => {
      const r = normalizeKeysLower(row);
      const p = normalizeKeysLower(r.paciente || {});
      const est = toTitle(r.estatus || 'Pendiente');

      let fechaSolicitud = null;
      if (r.fecha && r.hora) {
        fechaSolicitud = composeLocalDateTime(r.fecha, r.hora);
      } else if (r.fechasolicitud || r.fechaSolicitud) {
        const raw = r.fechasolicitud || r.fechaSolicitud;
        const d = raw instanceof Date ? raw : new Date(raw);
        if (!isNaN(d)) fechaSolicitud = d;
      }

      let fechaAtencion = null;
      if (r.fechaatencion || r.fechaAtencion) {
        const raw = r.fechaatencion || r.fechaAtencion;
        const d = raw instanceof Date ? raw : new Date(raw);
        if (!isNaN(d)) fechaAtencion = d;
      } else if (r.justificacion) {
        fechaAtencion = fechaAtencionFromJust(r.justificacion);
      }

      return {
        id: r.id || r.id_cita,
        paciente: {
          nombre: p.nombre || '',
          cedula: p.cedula || '',
          tipoUsuario: p.tipousuario || p.tipoUsuario || '—',
          telefono: p.telefono || null,
          correo: p.correo || null,
        },
        motivo: r.motivo || '',
        fecha: r.fecha || null,
        hora: r.hora || null,
        fechaSolicitud: fechaSolicitud,
        fechaAtencion: fechaAtencion,
        estatus: est,
        justificacion: r.justificacion || '',
        justificacion_human: r.justificacion_human || '',
        comentario_medico: r.comentario_medico || '',
        comentario_medico_human: r.comentario_medico_human || '',
        motivo_cancelacion: r.motivo_cancelacion || '',
        motivo_cancelacion_human: r.motivo_cancelacion_human || '',
        diagnostico: r.diagnostico || '',
        diagnostico_clean: r.diagnostico_clean || '',
        fechaAtencion_human: r.fechaatencion_human || r.fechaAtencion_human || '',
        fueReprogramada:
          !!r.fuereprogramada || est.toLowerCase() === 'reprogramada',
        modificadoPor: r.modificadopor || r.ultimamodificacion || null,
        fueraHorario: !!r.fuerahorario,
      };
    });
  }, []);

  const fetchCitas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/citas/medico/mias?status=all');
      setCitas(mapServerToFront(res));
    } catch (e) {
      api.handleError(e);
    } finally {
      setLoading(false);
    }
  }, [mapServerToFront]);

  useEffect(() => {
    if (isFocused) fetchCitas();
  }, [isFocused, fetchCitas]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCitas();
    setRefreshing(false);
  }, [fetchCitas]);

  const { citasActivas, citasAtendidas, citasAprobadas } = useMemo(() => {
    const arr = Array.isArray(citas) ? citas : [];
    return {
      citasActivas: arr.filter((c) => c?.estatus !== 'Atendida'),
      citasAtendidas: arr.filter((c) => c?.estatus === 'Atendida'),
      citasAprobadas: arr.filter((c) => c?.estatus === 'Aprobada'),
    };
  }, [citas]);

  const pacientesUnicos = useMemo(() => {
    const map = new Map();
    for (const c of citas || [])
      if (c?.paciente?.cedula) map.set(c.paciente.cedula, c.paciente);
    return Array.from(map.values());
  }, [citas]);

  const seccionesFiltradas = useMemo(() => {
    let base = Array.isArray(citasActivas) ? citasActivas : [];
    if (filtroEstatus !== 'Todos')
      base = base.filter((c) => c?.estatus === filtroEstatus);
    if (pacienteSeleccionado)
      base = base.filter(
        (c) => c?.paciente?.cedula === pacienteSeleccionado.cedula
      );
    if (busquedaGeneral) {
      const q = busquedaGeneral.toLowerCase();
      base = base.filter(
        (c) =>
          (c?.paciente?.nombre ?? '').toLowerCase().includes(q) ||
          (c?.motivo ?? '').toLowerCase().includes(q)
      );
    }
    const agrupado = {};
    for (const cita of base) {
      const key = cita.estatus || 'Otros';
      agrupado[key] = agrupado[key] || [];
      agrupado[key].push(cita);
    }
    return ORDEN_SECCIONES.map((k) =>
      agrupado[k] && agrupado[k].length ? { title: k, data: agrupado[k] } : null
    ).filter(Boolean);
  }, [citasActivas, busquedaGeneral, filtroEstatus, pacienteSeleccionado]);

  const abrirModalAcciones = useCallback((cita) => {
    setCitaSeleccionada(cita);
    setModalAccionVisible(true);
  }, []);

  const abrirModalGestion = useCallback(
    (accion) => {
      setTipoAccion(accion);

      // Importante: cuando vamos a 'atender', dejamos el campo de comentario en blanco (el médico
      // quiere escribir un nuevo comentario, no reusar el antiguo). Para las demás acciones
      // precargamos razonablemente (reprogramar -> justificacion actual, cancelar -> motivo si existe).
      if (accion === 'atender') {
        setJustificacion(''); // <-- CAMBIO: no precargar comentario_medico
        setDiagnostico('');
      } else if (accion === 'aprobar') {
        setJustificacion('');
      } else if (accion === 'reprogramar') {
        setJustificacion(citaSeleccionada?.justificacion || '');
      } else if (accion === 'cancelar') {
        setJustificacion(citaSeleccionada?.motivo_cancelacion || '');
      } else {
        setJustificacion('');
      }

      // presetear fecha y hora según la cita actual (no cambia el comentario)
      setFechaCita(citaSeleccionada?.fechaSolicitud ? new Date(citaSeleccionada.fechaSolicitud) : new Date());
      if (citaSeleccionada?.hora) {
        const hhmm = String(citaSeleccionada.hora).slice(0,5);
        setHoraInicio(hhmm);
        const [h, m] = hhmm.split(':').map(Number);
        const end = new Date();
        end.setHours(h, m + 30, 0, 0);
        setHoraFin(`${String(end.getHours()).padStart(2,'0')}:${String(end.getMinutes()).padStart(2,'0')}`);
      } else {
        setHoraInicio('09:00');
        setHoraFin('09:30');
      }
      setModalAccionVisible(false);
      setModalGestionVisible(true);
    },
    [citaSeleccionada]
  );

  const abrirDetalle = useCallback((cita) => {
    setCitaSeleccionada(cita);
    setModalDetalleVisible(true);
  }, []);

  const cerrarTodosModales = useCallback(() => {
    setModalAccionVisible(false);
    setModalGestionVisible(false);
    setModalPacienteVisible(false);
    setModalEstatusVisible(false);
    setModalDetalleVisible(false);
    setModalHorarioVisible({ visible: false, tipo: 'inicio' });
    setShowDatePicker(false);
    setTipoAccion('');
    setJustificacion('');
    setDiagnostico('');
  }, []);

  const abrirHorario = useCallback((tipo) => {
    setModalHorarioVisible({ visible: true, tipo });
  }, []);

  const onChangeFechaPicker = useCallback((event, selectedDate) => {
    if (event && event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    const currentDate = selectedDate || fechaCita;
    setShowDatePicker(Platform.OS === 'ios');
    setFechaCita(currentDate);
  }, [fechaCita]);

  const handleConfirmarAccion = useCallback(
    async (accionInmediata) => {
      const accionFinal = accionInmediata || tipoAccion;
      if (!citaSeleccionada) return;

      try {
        if (accionFinal === 'cancelar' && !justificacion.trim()) {
          Alert.alert('Justificación obligatoria para cancelar');
          return;
        }
        if (accionFinal === 'reprogramar') {
          const inicio = new Date(fechaCita);
          const [h, m] = horaInicio.split(':').map(Number);
          inicio.setHours(h, m, 0, 0);
          const fin = new Date(fechaCita);
          const [hh, mm] = horaFin.split(':').map(Number);
          fin.setHours(hh, mm, 0, 0);

          if (esFechaPasada(inicio)) {
            Alert.alert('No puede reprogramar a una fecha/hora pasada');
            return;
          }
          if (existeSolapamiento(citas, inicio, fin, citaSeleccionada?.id)) {
            Alert.alert('Conflicto: horario ocupado por otra cita');
            return;
          }
          if (!justificacion || String(justificacion).trim().length < 5) {
            Alert.alert('Justificación obligatoria para reprogramar (mínimo 5 caracteres).');
            return;
          }
        }

        if (accionFinal === 'aprobar' && (!justificacion || String(justificacion).trim().length < 1)) {
          Alert.alert('Comentario obligatorio al aprobar (1+ caracteres).');
          return;
        }

        if (accionFinal === 'atender') {
          if (justificacion && String(justificacion).trim().length > 500) {
            Alert.alert('El comentario no puede exceder 500 caracteres.');
            return;
          }
          if (diagnostico && String(diagnostico).trim().length > 500) {
            Alert.alert('El diagnóstico no puede exceder 500 caracteres.');
            return;
          }
        }

        setIsSubmitting(true);

        if (accionFinal === 'aprobar' || accionFinal === 'aprobarReprogramacion') {
          await api.patch(`/citas/${citaSeleccionada.id}/aprobar`, {
            comentario: String(justificacion).trim(),
          });
        } else if (accionFinal === 'reprogramar') {
          const yyyy = fechaCita.getFullYear();
          const mm = String(fechaCita.getMonth() + 1).padStart(2, '0');
          const dd = String(fechaCita.getDate()).padStart(2, '0');
          const fecha = `${yyyy}-${mm}-${dd}`;
          await api.patch(`/citas/${citaSeleccionada.id}/reprogramar-medico`, {
            fecha,
            hora: horaInicio,
            justificacion: String(justificacion).trim(),
            allow_out_of_schedule: false,
          });
        } else if (accionFinal === 'cancelar') {
          await api.patch(`/citas/${citaSeleccionada.id}/cancelar`, {
            justificacion: String(justificacion).trim(),
          });
        } else if (accionFinal === 'atender') {
          const body = {};
          if (justificacion && String(justificacion).trim().length > 0) body.comentario = String(justificacion).trim();
          if (diagnostico && String(diagnostico).trim().length > 0) body.diagnostico = String(diagnostico).trim();
          // Nota: dejamos comentario opcional; backend ahora reemplaza FECHA_APROBACION al marcar atendida.
          await api.patch(`/citas/${citaSeleccionada.id}/atender`, body);
        }

        await fetchCitas();
        cerrarTodosModales();
        Alert.alert('Éxito', 'La cita ha sido actualizada correctamente.');
      } catch (error) {
        api.handleError(error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      tipoAccion,
      justificacion,
      diagnostico,
      fechaCita,
      horaInicio,
      horaFin,
      citas,
      citaSeleccionada,
      cerrarTodosModales,
      fetchCitas,
    ]
  );

  const renderItemActivas = useCallback(
    ({ item }) => (
      <TarjetaCita
        item={item}
        onPress={() => abrirModalAcciones(item)}
        onViewDetails={() => abrirDetalle(item)}
      />
    ),
    [abrirModalAcciones, abrirDetalle]
  );
  const renderItemAprobadas = renderItemActivas;
  const renderItemAtendidas = useCallback(
    ({ item }) => (
      <TarjetaCita
        item={item}
        onPress={() => abrirDetalle(item)}
        onViewDetails={() => abrirDetalle(item)}
      />
    ),
    [abrirDetalle]
  );

  const [busquedaPacienteModal, setBusquedaPacienteModal] = useState('');
  const pacientesFiltradosModal = useMemo(() => {
    if (!busquedaPacienteModal) return pacientesUnicos;
    const q = busquedaPacienteModal.toLowerCase();
    return pacientesUnicos.filter(
      (p) =>
        (p.nombre ?? '').toLowerCase().includes(q) ||
        (p.cedula ?? '').toLowerCase().includes(q) ||
        (p.telefono ?? '').toLowerCase().includes(q)
    );
  }, [pacientesUnicos, busquedaPacienteModal]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            colores.fondo || (Platform.OS === 'android' ? '#fff' : '#F2F2F7'),
        },
      ]}
    >
      <View
        style={[
          styles.headerWrap,
          {
            paddingTop: insets.top + 8,
            paddingHorizontal: Math.max(insets.left, 12),
          },
        ]}
      >
        <Text
          style={[styles.title, { color: colores.textoPrincipal }]}
          numberOfLines={1}
        >
          Panel de Citas
        </Text>

        <View style={styles.tabRow}>
          <TouchableOpacity
            onPress={() => setActiveTab('Activas')}
            style={[
              styles.tabButton,
              activeTab === 'Activas'
                ? { backgroundColor: colores.principal }
                : null,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Ver citas activas"
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === 'Activas' ? '#FFF' : colores.textoSecundario,
                },
              ]}
            >
              Activas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('Aprobadas')}
            style={[
              styles.tabButton,
              activeTab === 'Aprobadas'
                ? { backgroundColor: colores.principal }
                : null,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Ver citas aprobadas"
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === 'Aprobadas'
                      ? '#FFF'
                      : colores.textoSecundario,
                },
              ]}
            >
              Aprobadas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('Atendidas')}
            style={[
              styles.tabButton,
              activeTab === 'Atendidas'
                ? { backgroundColor: colores.principal }
                : null,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Ver citas atendidas"
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === 'Atendidas'
                      ? '#FFF'
                      : colores.textoSecundario,
                },
              ]}
            >
              Atendidas
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'Activas' ? (
        <SectionList
          sections={seccionesFiltradas}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItemActivas}
          renderSectionHeader={({ section }) => (
            <CabeceraSeccion title={section.title} />
          )}
          ListHeaderComponent={
            <View
              style={[
                styles.listHeader,
                { paddingHorizontal: Math.max(insets.left, 12) },
              ]}
            >
              <GuiaVisualColapsable compact={COMPACT} />
              <View
                style={[
                  styles.searchRow,
                  { backgroundColor: colores.superficie },
                ]}
              >
                <FontAwesome
                  name="search"
                  size={16}
                  color={colores.textoSecundario}
                />
                <TextInput
                  placeholder="Buscar por paciente o motivo..."
                  placeholderTextColor={colores.textoSecundario}
                  style={[
                    styles.searchInput,
                    { color: colores.textoPrincipal },
                  ]}
                  value={busquedaGeneral}
                  onChangeText={setBusquedaGeneral}
                  returnKeyType="search"
                />
              </View>

              <View style={styles.filterRow}>
                <TouchableOpacity
                  onPress={() => setModalEstatusVisible(true)}
                  style={[
                    styles.filterButton,
                    { borderColor: colores.textoSecundario },
                  ]}
                >
                  <FontAwesome
                    name="filter"
                    size={14}
                    color={colores.textoSecundario}
                  />
                  <Text
                    style={[
                      styles.filterText,
                      { color: colores.textoSecundario },
                    ]}
                  >
                    {filtroEstatus}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setModalPacienteVisible(true)}
                  style={[
                    styles.filterButton,
                    { borderColor: colores.principal },
                  ]}
                >
                  <FontAwesome
                    name="user"
                    size={14}
                    color={colores.principal}
                  />
                  <Text
                    style={[styles.filterText, { color: colores.principal }]}
                  >
                    {pacienteSeleccionado
                      ? pacienteSeleccionado.nombre.split(' ')[0]
                      : 'Paciente'}
                  </Text>
                </TouchableOpacity>

                {pacienteSeleccionado ? (
                  <TouchableOpacity
                    onPress={() => setPacienteSeleccionado(null)}
                    style={[styles.filterButtonDanger]}
                  >
                    <FontAwesome name="undo" size={14} color="#dc3545" />
                    <Text style={[styles.filterTextDanger]}>Mostrar todos</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          }
          contentContainerStyle={{
            paddingBottom: Math.max(insets.bottom + 80, 120),
          }}
          ListEmptyComponent={
            <Text
              style={[styles.emptyText, { color: colores.textoSecundario }]}
            >
              No se encontraron citas activas.
            </Text>
          }
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : activeTab === 'Aprobadas' ? (
        <FlatList
          data={citasAprobadas}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderItemAprobadas}
          contentContainerStyle={{
            paddingHorizontal: Math.max(insets.left, 12),
            paddingTop: 12,
            paddingBottom: Math.max(insets.bottom + 80, 120),
          }}
          ListEmptyComponent={
            <Text
              style={[styles.emptyText, { color: colores.textoSecundario }]}
            >
              No hay citas aprobadas.
            </Text>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <FlatList
          data={citasAtendidas}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderItemAtendidas}
          contentContainerStyle={{
            paddingHorizontal: Math.max(insets.left, 12),
            paddingTop: 12,
            paddingBottom: Math.max(insets.bottom + 80, 120),
          }}
          ListEmptyComponent={
            <Text
              style={[styles.emptyText, { color: colores.textoSecundario }]}
            >
              No hay citas en el historial.
            </Text>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Modales */}
      <ModalAcciones
        visible={modalAccionVisible}
        cita={citaSeleccionada}
        onClose={cerrarTodosModales}
        onAprobar={() => abrirModalGestion('aprobar')}
        onReprogramar={() => abrirModalGestion('reprogramar')}
        onCancelar={() => abrirModalGestion('cancelar')}
        onMarcarAtendida={() => abrirModalGestion('atender')}
        isSubmitting={isSubmitting}
      />

      <ModalGestion
        visible={modalGestionVisible}
        tipoAccion={tipoAccion}
        cita={citaSeleccionada}
        fechaCita={fechaCita}
        setFechaCita={setFechaCita}
        horaInicio={horaInicio}
        setHoraInicio={setHoraInicio}
        horaFin={horaFin}
        setHoraFin={setHoraFin}
        showDatePicker={showDatePicker}
        setShowDatePicker={setShowDatePicker}
        justificacion={justificacion}
        setJustificacion={setJustificacion}
        diagnostico={diagnostico}
        setDiagnostico={setDiagnostico}
        onConfirm={() => handleConfirmarAccion()}
        onClose={cerrarTodosModales}
        onOpenHorarioInicio={() => abrirHorario('inicio')}
        onOpenHorarioFin={() => abrirHorario('fin')}
        isSubmitting={isSubmitting}
      />

      {showDatePicker && (
        <DateTimePicker
          value={fechaCita || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
          onChange={onChangeFechaPicker}
          minimumDate={new Date()}
        />
      )}

      <ModalPacientes
        visible={modalPacienteVisible}
        pacientes={pacientesFiltradosModal}
        onSelect={(p) => {
          setPacienteSeleccionado(p);
          setModalPacienteVisible(false);
        }}
        onClose={() => setModalPacienteVisible(false)}
        busqueda={busquedaPacienteModal}
        setBusqueda={setBusquedaPacienteModal}
      />

      <ModalEstatus
        visible={modalEstatusVisible}
        current={filtroEstatus}
        onSelect={(e) => {
          setFiltroEstatus(e);
          setModalEstatusVisible(false);
        }}
        onClose={() => setModalEstatusVisible(false)}
      />

      <ModalDetalle
        visible={modalDetalleVisible}
        cita={citaSeleccionada}
        onClose={() => setModalDetalleVisible(false)}
      />

      <ModalHorario
        visible={modalHorarioVisible.visible}
        tipo={modalHorarioVisible.tipo}
        horarios={[
          '07:00',
          '07:30',
          '08:00',
          '08:30',
          '09:00',
          '09:30',
          '10:00',
          '10:30',
          '11:00',
          '11:30',
          '12:00',
          '12:30',
          '13:00',
          '13:30',
          '14:00',
          '14:30',
          '15:00',
          '15:30',
          '16:00',
          '16:30',
          '17:00',
          '17:30',
          '18:00',
        ]}
        onSelect={(h) => {
          if (modalHorarioVisible.tipo === 'inicio') setHoraInicio(h);
          else setHoraFin(h);
          setModalHorarioVisible({ visible: false, tipo: 'inicio' });
        }}
        onClose={() =>
          setModalHorarioVisible({ visible: false, tipo: 'inicio' })
        }
      />

      <Modal visible={loading || isSubmitting} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.loadingText}>
              {isSubmitting ? 'Procesando...' : 'Cargando...'}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const basePadding = COMPACT ? 10 : 16;
const smallFont = COMPACT ? 13 : 15;
const titleFont = COMPACT ? 24 : 32;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerWrap: {
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: titleFont,
    fontWeight: '700',
    marginBottom: 8,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: COMPACT ? 8 : 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabText: {
    fontWeight: '700',
    fontSize: smallFont,
  },
  listHeader: {
    paddingTop: 6,
    paddingBottom: 6,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: COMPACT ? 8 : 10,
    marginTop: 8,
    marginBottom: 10,
    elevation: 0,
  },
  searchInput: {
    flex: 1,
    height: COMPACT ? 40 : 48,
    marginLeft: 10,
    fontSize: COMPACT ? 13 : 15,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: COMPACT ? 6 : 8,
    paddingHorizontal: 10,
    borderRadius: 18,
    borderWidth: 1.2,
    marginRight: 8,
  },
  filterText: {
    marginLeft: 8,
    fontWeight: '700',
    fontSize: COMPACT ? 12 : 13,
  },
  filterButtonDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: COMPACT ? 6 : 8,
    paddingHorizontal: 10,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#dc3545',
    marginRight: 8,
  },
  filterTextDanger: {
    marginLeft: 8,
    fontWeight: '700',
    color: '#dc3545',
    fontSize: COMPACT ? 12 : 13,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: COMPACT ? 13 : 15,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: basePadding,
  },
  loadingBox: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    opacity: 0.9,
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginLeft: 10,
    fontWeight: '700',
  },
});