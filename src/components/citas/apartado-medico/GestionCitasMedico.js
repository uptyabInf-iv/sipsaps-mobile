import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  FlatList,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useTemasPersonalizado } from '../../../hooks/useTemasPersonalizado';

import TarjetaCita from './TarjetaCita';
import CabeceraSeccion from './SectionHeader'; // <-- ruta corregida (archivo en la misma carpeta)
import GuiaVisualColapsable from './GuiaVisualColapsable'; // <-- ruta corregida
import {
  ModalAcciones,
  ModalGestion,
  ModalPacientes,
  ModalEstatus,
  ModalDetalle,
  ModalHorario,
} from './ModalesGestion'; // <-- ruta corregida
import { existeSolapamiento, esFechaPasada } from './validacionesFechas'; // <-- ruta corregida
import { ESTATUS_INFO } from './constantesEstatus';

// -- datos de ejemplo (puedes reemplazar por prop o fetch)
const CITAS_PACIENTES_MOCK = [
  {
    id: 'p1',
    paciente: {
      nombre: 'Elena Rodriguez',
      cedula: 'V-25.123.456',
      tipoUsuario: 'Afiliado',
    },
    motivo: 'Chequeo anual.',
    fechaSolicitud: '2025-10-28T10:00:00Z',
    fechaAtencion: null,
    estatus: 'Pendiente',
  },
  {
    id: 'p2',
    paciente: {
      nombre: 'Carlos Gomez',
      cedula: 'V-18.987.654',
      tipoUsuario: 'Particular',
    },
    motivo: 'Seguimiento post-operatorio.',
    fechaSolicitud: '2025-10-22T11:00:00Z',
    estatus: 'Aprobada',
  },
  {
    id: 'p3',
    paciente: {
      nombre: 'Ana Martinez',
      cedula: 'V-21.456.789',
      tipoUsuario: 'Beneficiario',
    },
    motivo: 'Consulta pediátrica.',
    fechaSolicitud: '2025-11-12T09:30:00Z',
    estatus: 'Reprogramada',
    modificadoPor: 'Paciente',
    justificacion: 'Conflicto horario.',
  },
  {
    id: 'p4',
    paciente: {
      nombre: 'Luis Fernandez',
      cedula: 'V-15.789.123',
      tipoUsuario: 'Director',
    },
    motivo: 'Resultados de laboratorio.',
    fechaSolicitud: '2025-09-01T16:00:00Z',
    estatus: 'Cancelada',
    justificacion: 'Paciente no asistió.',
  },
  {
    id: 'p5',
    paciente: {
      nombre: 'Maria Peña',
      cedula: 'V-12.345.678',
      tipoUsuario: 'Afiliado',
    },
    motivo: 'Resonancia magnética.',
    fechaSolicitud: '2025-08-20T14:00:00Z',
    fechaAtencion: '2025-08-20T14:00:00Z',
    estatus: 'Atendida',
  },
];

const ORDEN_SECCIONES = ['Pendiente', 'Reprogramada', 'Aprobada', 'Cancelada'];

export default function GestionCitasMedico() {
  const insets = useSafeAreaInsets();
  const { colores, esOscuro } = useTemasPersonalizado();

  const [citas, setCitas] = useState(CITAS_PACIENTES_MOCK);
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

  // derived lists
  const { citasActivas, citasAtendidas, citasAprobadas } = useMemo(() => {
    const arr = Array.isArray(citas) ? citas : [];
    return {
      citasActivas: arr.filter((c) => c?.estatus !== 'Atendida'),
      citasAtendidas: arr.filter((c) => c?.estatus === 'Atendida'),
      citasAprobadas: arr.filter((c) => c?.estatus === 'Aprobada'),
    };
  }, [citas]);

  // pacientes únicos
  const pacientesUnicos = useMemo(() => {
    const map = new Map();
    for (const c of citas || [])
      if (c?.paciente?.cedula) map.set(c.paciente.cedula, c.paciente);
    return Array.from(map.values());
  }, [citas]);

  // secciones (actives)
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

  // handlers
  const abrirModalAcciones = useCallback((cita) => {
    setCitaSeleccionada(cita);
    setModalAccionVisible(true);
  }, []);
  const abrirModalGestion = useCallback(
    (accion) => {
      setTipoAccion(accion);
      setJustificacion(
        citaSeleccionada?.justificacion
          ? citaSeleccionada.justificacion.replace(/\[Horario:.*?\]\s*/, '')
          : ''
      );
      setFechaCita(new Date(citaSeleccionada?.fechaSolicitud || Date.now()));
      setHoraInicio('09:00');
      setHoraFin('09:30');
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
  }, []);

  // confirm with validations (reprogramacion checks)
  const handleConfirmarAccion = useCallback(
    (accionInmediata) => {
      const accionFinal = accionInmediata || tipoAccion;
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
      setTimeout(() => {
        setCitas((prev) =>
          prev.map((c) => {
            if (c.id === citaSeleccionada?.id) {
              let nuevoEstatus = c.estatus;
              if (
                accionFinal === 'aprobar' ||
                accionFinal === 'aprobarReprogramacion'
              )
                nuevoEstatus = 'Aprobada';
              else if (accionFinal === 'reprogramar')
                nuevoEstatus = 'Reprogramada';
              else if (accionFinal === 'cancelar') nuevoEstatus = 'Cancelada';
              else if (accionFinal === 'atender') nuevoEstatus = 'Atendida';

              const actualizada = {
                ...c,
                estatus: nuevoEstatus,
                justificacion:
                  accionFinal !== 'aprobar' ? justificacion : c.justificacion,
                ultimaModificacion: 'Médico',
                modificadoPor: 'Médico',
                fueReprogramada:
                  accionFinal === 'reprogramar' ? true : c.fueReprogramada,
              };
              if (accionFinal === 'reprogramar') {
                const inicio = new Date(fechaCita);
                const [h, m] = horaInicio.split(':').map(Number);
                inicio.setHours(h, m, 0, 0);
                actualizada.fechaSolicitud = inicio.toISOString();
              }
              if (accionFinal === 'atender')
                actualizada.fechaAtencion = new Date().toISOString();
              return actualizada;
            }
            return c;
          })
        );
        setIsSubmitting(false);
        cerrarTodosModales();
        alert('La cita ha sido actualizada');
      }, 700);
    },
    [
      tipoAccion,
      justificacion,
      fechaCita,
      horaInicio,
      horaFin,
      citas,
      citaSeleccionada,
      cerrarTodosModales,
    ]
  );

  // renderers
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

  // pacientes modal filter
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
        <Text
          style={{
            fontSize: 32,
            fontWeight: '700',
            color: colores.textoPrincipal,
            marginBottom: 12,
          }}
        >
          Panel de Citas
        </Text>

        <View
          style={{
            flexDirection: 'row',
            backgroundColor: '#E5E5EA',
            borderRadius: 10,
            padding: 4,
            marginBottom: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => setActiveTab('Activas')}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 8,
              alignItems: 'center',
              backgroundColor:
                activeTab === 'Activas' ? colores.principal : 'transparent',
            }}
          >
            <Text
              style={{
                fontWeight: '700',
                color:
                  activeTab === 'Activas' ? '#FFF' : colores.textoSecundario,
              }}
            >
              Activas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('Aprobadas')}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 8,
              alignItems: 'center',
              backgroundColor:
                activeTab === 'Aprobadas' ? colores.principal : 'transparent',
            }}
          >
            <Text
              style={{
                fontWeight: '700',
                color:
                  activeTab === 'Aprobadas' ? '#FFF' : colores.textoSecundario,
              }}
            >
              Aprobadas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('Atendidas')}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 8,
              alignItems: 'center',
              backgroundColor:
                activeTab === 'Atendidas' ? colores.principal : 'transparent',
            }}
          >
            <Text
              style={{
                fontWeight: '700',
                color:
                  activeTab === 'Atendidas' ? '#FFF' : colores.textoSecundario,
              }}
            >
              Atendidas
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'Activas' ? (
        <SectionList
          sections={seccionesFiltradas}
          keyExtractor={(item) => item.id}
          renderItem={renderItemActivas}
          renderSectionHeader={({ section }) => (
            <CabeceraSeccion title={section.title} />
          )}
          ListHeaderComponent={
            <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
              <GuiaVisualColapsable />
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: 12,
                  paddingHorizontal: 15,
                  marginBottom: 16,
                  backgroundColor: esOscuro ? '#1C1C1E' : '#FFF',
                }}
              >
                <FontAwesome
                  name="search"
                  size={18}
                  color={colores.textoSecundario}
                />
                <TextInput
                  placeholder="Buscar por paciente o motivo..."
                  placeholderTextColor={colores.textoSecundario}
                  style={{
                    flex: 1,
                    height: 50,
                    marginLeft: 10,
                    color: colores.textoPrincipal,
                  }}
                  value={busquedaGeneral}
                  onChangeText={setBusquedaGeneral}
                />
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-around',
                  marginBottom: 20,
                }}
              >
                <TouchableOpacity
                  onPress={() => setModalEstatusVisible(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 20,
                    borderWidth: 1.5,
                    borderColor: colores.textoSecundario,
                  }}
                >
                  <FontAwesome
                    name="filter"
                    size={14}
                    color={colores.textoSecundario}
                  />
                  <Text
                    style={{
                      marginLeft: 8,
                      fontWeight: '700',
                      color: colores.textoSecundario,
                    }}
                  >
                    {filtroEstatus}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setModalPacienteVisible(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 20,
                    borderWidth: 1.5,
                    borderColor: colores.principal,
                  }}
                >
                  <FontAwesome
                    name="user"
                    size={14}
                    color={colores.principal}
                  />
                  <Text
                    style={{
                      marginLeft: 8,
                      fontWeight: '700',
                      color: colores.principal,
                    }}
                  >
                    {pacienteSeleccionado
                      ? pacienteSeleccionado.nombre.split(' ')[0]
                      : 'Paciente'}
                  </Text>
                </TouchableOpacity>

                {pacienteSeleccionado ? (
                  <TouchableOpacity
                    onPress={() => setPacienteSeleccionado(null)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 20,
                      borderWidth: 1.5,
                      borderColor: '#dc3545',
                    }}
                  >
                    <FontAwesome name="undo" size={14} color="#dc3545" />
                    <Text
                      style={{
                        marginLeft: 8,
                        fontWeight: '700',
                        color: '#dc3545',
                      }}
                    >
                      Mostrar todos
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 50 }}
          ListEmptyComponent={
            <Text
              style={{
                textAlign: 'center',
                marginTop: 50,
                color: colores.textoSecundario,
              }}
            >
              No se encontraron citas activas.
            </Text>
          }
          stickySectionHeadersEnabled={false}
        />
      ) : activeTab === 'Aprobadas' ? (
        <FlatList
          data={citasAprobadas}
          keyExtractor={(i) => i.id}
          renderItem={renderItemAprobadas}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20 }}
          ListEmptyComponent={
            <Text
              style={{
                textAlign: 'center',
                marginTop: 50,
                color: colores.textoSecundario,
              }}
            >
              No hay citas aprobadas.
            </Text>
          }
        />
      ) : (
        <FlatList
          data={citasAtendidas}
          keyExtractor={(i) => i.id}
          renderItem={renderItemAtendidas}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20 }}
          ListEmptyComponent={
            <Text
              style={{
                textAlign: 'center',
                marginTop: 50,
                color: colores.textoSecundario,
              }}
            >
              No hay citas en el historial.
            </Text>
          }
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
    </View>
  );
}