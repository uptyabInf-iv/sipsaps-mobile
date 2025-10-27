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
} from 'react-native';
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

const toTitle = (s = '') => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s);
const normalizeKeysLower = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const out = Array.isArray(obj) ? [] : {};
  Object.keys(obj).forEach((k) => {
    const v = obj[k];
    out[k.toLowerCase()] = v && typeof v === 'object' ? normalizeKeysLower(v) : v;
  });
  return out;
};

// Componer fecha segura (Android/Hermes-safe) desde fecha y hora crudos.
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

// Extraer fechaAtencion desde justificación si fuese necesario
const fechaAtencionFromJust = (just = '') => {
  const m = String(just || '').match(/\[FECHA_ATENCION:([^\]]+)\]/i);
  if (m && m[1]) {
    const d = new Date(m[1]);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
};

export default function GestionCitasMedico() {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { colores, esOscuro } = useTemasPersonalizado();

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
  const [fechaCita, setFechaCita] = useState(new Date());
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFin, setHoraFin] = useState('09:30');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Mapeo robusto (compose desde fecha/hora crudos; deja también los crudos por si se necesitan)
  const mapServerToFront = useCallback((arr = []) => {
    return (arr || []).map((row) => {
      const r = normalizeKeysLower(row);
      const p = normalizeKeysLower(r.paciente || {});
      const est = toTitle(r.estatus || 'Pendiente');

      // SIEMPRE: componer desde los crudos fecha/hora si existen
      let fechaSolicitud = null;
      if (r.fecha && r.hora) {
        fechaSolicitud = composeLocalDateTime(r.fecha, r.hora);
      } else if (r.fechasolicitud || r.fechaSolicitud) {
        // fallback: si viene iso de backend
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
        fecha: r.fecha || null,     // crudos para redundancia
        hora: r.hora || null,       // crudos para redundancia
        fechaSolicitud: fechaSolicitud,
        fechaAtencion: fechaAtencion,
        estatus: est,
        justificacion: r.justificacion || '',
        fueReprogramada: !!r.fuereprogramada || est.toLowerCase() === 'reprogramada',
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
    if (filtroEstatus !== 'Todos') base = base.filter((c) => c?.estatus === filtroEstatus);
    if (pacienteSeleccionado) base = base.filter((c) => c?.paciente?.cedula === pacienteSeleccionado.cedula);
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

  const abrirModalGestion = useCallback((accion) => {
    setTipoAccion(accion);
    setJustificacion(
      citaSeleccionada?.justificacion
        ? String(citaSeleccionada.justificacion).replace(/\[Horario:.*?\]\s*/, '')
        : ''
    );
    setFechaCita(new Date(citaSeleccionada?.fechaSolicitud || Date.now()));
    setHoraInicio('09:00');
    setHoraFin('09:30');
    setModalAccionVisible(false);
    setModalGestionVisible(true);
  }, [citaSeleccionada]);

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
  }, []);

  const abrirHorario = useCallback((tipo) => {
    setModalHorarioVisible({ visible: true, tipo });
  }, []);

  const handleConfirmarAccion = useCallback(
    async (accionInmediata) => {
      const accionFinal = accionInmediata || tipoAccion;
      if (!citaSeleccionada) return;

      try {
        if (accionFinal === 'cancelar' && !justificacion.trim()) {
          alert('Justificación obligatoria para cancelar');
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
            alert('No puede reprogramar a una fecha/hora pasada');
            return;
          }
          if (existeSolapamiento(citas, inicio, fin, citaSeleccionada?.id)) {
            alert('Conflicto: horario ocupado por otra cita');
            return;
          }
        }

        setIsSubmitting(true);

        if (accionFinal === 'aprobar' || accionFinal === 'aprobarReprogramacion') {
          await api.patch(`/citas/${citaSeleccionada.id}/aprobar`);
        } else if (accionFinal === 'reprogramar') {
          const yyyy = fechaCita.getFullYear();
          const mm = String(fechaCita.getMonth() + 1).padStart(2, '0');
          const dd = String(fechaCita.getDate()).padStart(2, '0');
          const fecha = `${yyyy}-${mm}-${dd}`;
          await api.patch(`/citas/${citaSeleccionada.id}/reprogramar-medico`, {
            fecha,
            hora: horaInicio,
            justificacion: justificacion || 'Reprogramación',
            allow_out_of_schedule: false,
          });
        } else if (accionFinal === 'cancelar') {
          await api.patch(`/citas/${citaSeleccionada.id}/cancelar`, {
            justificacion: justificacion.trim(),
          });
        } else if (accionFinal === 'atender') {
          await api.patch(`/citas/${citaSeleccionada.id}/atender`);
        }

        await fetchCitas();
        cerrarTodosModales();
        alert('La cita ha sido actualizada');
      } catch (error) {
        api.handleError(error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [tipoAccion, justificacion, fechaCita, horaInicio, horaFin, citas, citaSeleccionada, cerrarTodosModales, fetchCitas]
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
    <View style={{ flex: 1, backgroundColor: esOscuro ? '#000' : '#F2F2F7' }}>
      <View style={{ paddingTop: insets.top, paddingHorizontal: 20 }}>
        <Text style={{ fontSize: 32, fontWeight: '700', color: colores.textoPrincipal, marginBottom: 12 }}>
          Panel de Citas
        </Text>

        <View style={{ flexDirection: 'row', backgroundColor: '#E5E5EA', borderRadius: 10, padding: 4, marginBottom: 12 }}>
          <TouchableOpacity
            onPress={() => setActiveTab('Activas')}
            style={{ flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: activeTab === 'Activas' ? colores.principal : 'transparent' }}
          >
            <Text style={{ fontWeight: '700', color: activeTab === 'Activas' ? '#FFF' : colores.textoSecundario }}>Activas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('Aprobadas')}
            style={{ flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: activeTab === 'Aprobadas' ? colores.principal : 'transparent' }}
          >
            <Text style={{ fontWeight: '700', color: activeTab === 'Aprobadas' ? '#FFF' : colores.textoSecundario }}>Aprobadas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('Atendidas')}
            style={{ flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: activeTab === 'Atendidas' ? colores.principal : 'transparent' }}
          >
            <Text style={{ fontWeight: '700', color: activeTab === 'Atendidas' ? '#FFF' : colores.textoSecundario }}>Atendidas</Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'Activas' ? (
        <SectionList
          sections={seccionesFiltradas}
          keyExtractor={(item) => item.id}
          renderItem={renderItemActivas}
          renderSectionHeader={({ section }) => <CabeceraSeccion title={section.title} />}
          ListHeaderComponent={
            <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
              <GuiaVisualColapsable />
              <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 15, marginBottom: 16, backgroundColor: esOscuro ? '#1C1C1E' : '#FFF' }}>
                <FontAwesome name="search" size={18} color={colores.textoSecundario} />
                <TextInput
                  placeholder="Buscar por paciente o motivo..."
                  placeholderTextColor={colores.textoSecundario}
                  style={{ flex: 1, height: 50, marginLeft: 10, color: colores.textoPrincipal }}
                  value={busquedaGeneral}
                  onChangeText={setBusquedaGeneral}
                />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 }}>
                <TouchableOpacity
                  onPress={() => setModalEstatusVisible(true)}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.5, borderColor: colores.textoSecundario }}
                >
                  <FontAwesome name="filter" size={14} color={colores.textoSecundario} />
                  <Text style={{ marginLeft: 8, fontWeight: '700', color: colores.textoSecundario }}>{filtroEstatus}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setModalPacienteVisible(true)}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.5, borderColor: colores.principal }}
                >
                  <FontAwesome name="user" size={14} color={colores.principal} />
                  <Text style={{ marginLeft: 8, fontWeight: '700', color: colores.principal }}>
                    {pacienteSeleccionado ? pacienteSeleccionado.nombre.split(' ')[0] : 'Paciente'}
                  </Text>
                </TouchableOpacity>

                {pacienteSeleccionado ? (
                  <TouchableOpacity
                    onPress={() => setPacienteSeleccionado(null)}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.5, borderColor: '#dc3545' }}
                  >
                    <FontAwesome name="undo" size={14} color="#dc3545" />
                    <Text style={{ marginLeft: 8, fontWeight: '700', color: '#dc3545' }}>Mostrar todos</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 50 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 50, color: colores.textoSecundario }}>No se encontraron citas activas.</Text>}
          stickySectionHeadersEnabled={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      ) : activeTab === 'Aprobadas' ? (
        <FlatList
          data={citasAprobadas}
          keyExtractor={(i) => i.id}
          renderItem={renderItemAprobadas}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 50, color: colores.textoSecundario }}>No hay citas aprobadas.</Text>}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      ) : (
        <FlatList
          data={citasAtendidas}
          keyExtractor={(i) => i.id}
          renderItem={renderItemAtendidas}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 50, color: colores.textoSecundario }}>No hay citas en el historial.</Text>}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

      {/* Modales */}
      <ModalAcciones
        visible={modalAccionVisible}
        cita={citaSeleccionada}
        onClose={cerrarTodosModales}
        onAprobar={() => handleConfirmarAccion('aprobar')}
        onReprogramar={() => abrirModalGestion('reprogramar')}
        onCancelar={() => abrirModalGestion('cancelar')}
        onMarcarAtendida={() => handleConfirmarAccion('atender')}
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
        onConfirm={() => handleConfirmarAccion()}
        onClose={cerrarTodosModales}
        onOpenHorarioInicio={() => abrirHorario('inicio')}
        onOpenHorarioFin={() => abrirHorario('fin')}
        isSubmitting={isSubmitting}
      />

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
          '07:00','07:30','08:00','08:30','09:00','09:30',
          '10:00','10:30','11:00','11:30','12:00','12:30',
          '13:00','13:30','14:00','14:30','15:00','15:30',
          '16:00','16:30','17:00','17:30','18:00',
        ]}
        onSelect={(h) => {
          if (modalHorarioVisible.tipo === 'inicio') setHoraInicio(h);
          else setHoraFin(h);
          setModalHorarioVisible({ visible: false, tipo: 'inicio' });
        }}
        onClose={() => setModalHorarioVisible({ visible: false, tipo: 'inicio' })}
      />

      {/* Overlay de carga global */}
      <Modal visible={loading || isSubmitting} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ backgroundColor: '#000', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 10, opacity: 0.85, flexDirection: 'row', alignItems: 'center' }}>
            <ActivityIndicator color="#fff" />
            <Text style={{ color: '#fff', marginLeft: 10, fontWeight: '700' }}>
              {isSubmitting ? 'Procesando...' : 'Cargando...'}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}