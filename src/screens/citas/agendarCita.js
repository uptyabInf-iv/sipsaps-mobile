import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FontAwesome } from '@expo/vector-icons';
import { useTemasPersonalizado } from '../../hooks/useTemasPersonalizado';
import { useSelector } from 'react-redux';
import api from '../../utils/api';
import IndicadorCarga from '../../components/indicadorCarga';
import ModalGeneral from '../../components/modalGeneral';

// Utils
const toISODate = (d) => {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const isPastDate = (d) => {
  if (!d) return false;
  const today = new Date(); today.setHours(0,0,0,0);
  const dd = new Date(d); dd.setHours(0,0,0,0);
  return dd < today;
};
const periodOf = (hhmm) => {
  const h = parseInt(hhmm.split(':')[0], 10);
  if (h < 12) return 'Mañana';
  if (h < 18) return 'Tarde';
  return 'Noche';
};
const fmt12h = (hhmm) => {
  const [H, M] = hhmm.split(':').map((n) => parseInt(n, 10));
  let h = H % 12; if (h === 0) h = 12;
  const ampm = H >= 12 ? 'PM' : 'AM';
  return `${h}:${String(M).padStart(2,'0')} ${ampm}`;
};

// Input simple con guía
const Field = ({ label, help, error, children }) => {
  const { colores } = useTemasPersonalizado();
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: colores.textoPrincipal }}>{label}</Text>
      {help ? <Text style={{ fontSize: 12, color: colores.textoSecundario, marginTop: 2 }}>{help}</Text> : null}
      <View style={{ marginTop: 8 }}>{children}</View>
      {error ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
          <FontAwesome name="exclamation-circle" size={12} color="#DC2626" />
          <Text style={{ color: '#DC2626', marginLeft: 6, fontSize: 12 }}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
};

export default function AgendarCita() {
  const insets = useSafeAreaInsets();
  const { colores, fuentes } = useTemasPersonalizado();
  const reduxUser = useSelector((s) => s.user?.user);
  const id_persona = reduxUser?.id_persona;

  // Datos
  const [especialidades, setEspecialidades] = useState([]);
  const [medicos, setMedicos] = useState([]);

  // Selecciones
  const [selEspecialidad, setSelEspecialidad] = useState(null);
  const [selMedico, setSelMedico] = useState(null);
  const [fecha, setFecha] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotSel, setSlotSel] = useState(null);
  const [motivo, setMotivo] = useState('');

  // UI/estado
  const [loading, setLoading] = useState(false);
  const [modalLista, setModalLista] = useState({ visible: false, tipo: null });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [modalMsg, setModalMsg] = useState({ visible: false, msg: '', type: 'info' });
  const [autoSeleccionAviso, setAutoSeleccionAviso] = useState(false);

  // Opción para proponer un horario manual (fuera de agenda)
  const [proponerOtroHorario, setProponerOtroHorario] = useState(false);
  const [horaPropuesta, setHoraPropuesta] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Errores campo a campo
  const [errors, setErrors] = useState({ especialidad: '', medico: '', fecha: '', slot: '', motivo: '' });

  // Cargar especialidades
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await api.get('/especialidades');
        if (!mounted) return;
        setEspecialidades(Array.isArray(data) ? data : data?.data || []);
      } catch (e) {
        api.handleError?.(e);
      } finally {
        setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  // Cuando cambia especialidad, cargar médicos y limpiar dependencias
  useEffect(() => {
    if (!selEspecialidad) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setSelMedico(null);
        setFecha(null);
        setSlots([]);
        setSlotSel(null);
        setAutoSeleccionAviso(false);
        setProponerOtroHorario(false);
        setHoraPropuesta(null);
        const data = await api.get(`/medicos?especialidad=${encodeURIComponent(selEspecialidad.id_especialidad)}`);
        if (!mounted) return;
        setMedicos(Array.isArray(data) ? data : data?.data || []);
      } catch (e) {
        api.handleError?.(e);
      } finally {
        setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [selEspecialidad]);

  // Disponibilidad: médico + fecha
  useEffect(() => {
    if (!selMedico || !fecha) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setSlots([]);
        setSlotSel(null);
        setAutoSeleccionAviso(false);
        // reset propuesta manual al cambiar fecha/médico
        setProponerOtroHorario(false);
        setHoraPropuesta(null);

        const f = toISODate(fecha);
        const data = await api.get(`/medicos/${selMedico.id_medico}/disponibilidad?fecha=${encodeURIComponent(f)}`);
        const arr = Array.isArray(data) ? data : data?.slots || [];
        if (!mounted) return;
        setSlots(arr);
        if (arr.length > 0) {
          setSlotSel(arr[0]);
          setAutoSeleccionAviso(true);
        }
      } catch (e) {
        api.handleError?.(e);
      } finally {
        setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [selMedico, fecha]);

  // Validación en tiempo real
  useEffect(() => setErrors((p) => ({ ...p, especialidad: selEspecialidad ? '' : 'Selecciona una especialidad.' })), [selEspecialidad]);
  useEffect(() => setErrors((p) => ({ ...p, medico: selMedico ? '' : 'Elige al médico de tu preferencia.' })), [selMedico]);
  useEffect(() => setErrors((p) => ({ ...p, fecha: fecha ? '' : 'Selecciona una fecha futura.' })), [fecha]);
  useEffect(() => setErrors((p) => ({ ...p, slot: (slotSel || horaPropuesta) ? '' : (selMedico && fecha ? 'Selecciona un horario disponible o propone uno manual.' : '') })), [slotSel, horaPropuesta, selMedico, fecha]);
  useEffect(() => {
    const clean = (motivo || '').trim();
    let err = '';
    if (clean.length === 0) err = 'Cuéntanos el motivo de tu consulta.';
    else if (clean.length < 10) err = 'Añade un poco más de detalle (mínimo 10 caracteres).';
    else if (clean.length > 1000) err = 'Demasiado largo (máximo 1000 caracteres).';
    setErrors((p) => ({ ...p, motivo: err }));
  }, [motivo]);

  const fechaLegible = useMemo(() => {
    if (!fecha) return '';
    try {
      return fecha.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
      return toISODate(fecha);
    }
  }, [fecha]);

  // Habilita envío cuando hay slot o propuesta manual
  const puedeEnviar = useMemo(() => {
    const tieneHora = !!(slotSel || horaPropuesta);
    return !!(id_persona && selEspecialidad && selMedico && fecha && tieneHora && !errors.motivo && (motivo || '').trim().length >= 10);
  }, [id_persona, selEspecialidad, selMedico, fecha, slotSel, horaPropuesta, errors.motivo, motivo]);

  const razonesDesactivado = useMemo(() => {
    const list = [];
    if (!selEspecialidad) list.push('Selecciona una especialidad.');
    if (!selMedico) list.push('Elige un médico.');
    if (!fecha) list.push('Elige una fecha.');
    if (!(slotSel || horaPropuesta)) list.push('Selecciona un horario disponible o propone uno manual.');
    if ((motivo || '').trim().length < 10) list.push('Describe el motivo (mínimo 10 caracteres).');
    if (!id_persona) list.push('No pudimos detectar tu perfil. Inicia sesión nuevamente.');
    return list;
  }, [selEspecialidad, selMedico, fecha, slotSel, horaPropuesta, motivo, id_persona]);

  // Acciones
  const abrirSelectorEspecialidad = () => setModalLista({ visible: true, tipo: 'especialidad' });
  const abrirSelectorMedico = () => {
    if (!selEspecialidad) {
      setModalMsg({ visible: true, msg: 'Primero selecciona una especialidad.', type: 'info' });
      return;
    }
    setModalLista({ visible: true, tipo: 'medico' });
  };
  const onSelectEspecialidad = (e) => { setSelEspecialidad(e); setModalLista({ visible: false, tipo: null }); };
  const onSelectMedico = (m) => { setSelMedico(m); setModalLista({ visible: false, tipo: null }); };
  const onChangeFecha = (event, selectedDate) => {
    if (Platform.OS !== 'ios') setShowDatePicker(false);
    if (event?.type === 'dismissed') return;
    const d = selectedDate || new Date();
    if (isPastDate(d)) {
      setErrors((prev) => ({ ...prev, fecha: 'La fecha seleccionada ya pasó.' }));
      return;
    }
    setFecha(d);
  };
  const moverDia = (delta) => {
    const base = fecha || new Date();
    const n = new Date(base);
    n.setDate(n.getDate() + delta);
    if (isPastDate(n)) {
      setErrors((prev) => ({ ...prev, fecha: 'No puedes seleccionar fechas pasadas.' }));
      return;
    }
    setFecha(n);
  };

  // Buscar primer día con disponibilidad (hasta 30 días hacia adelante)
  const buscarPrimerDiaConDisponibilidad = useCallback(async () => {
    if (!selMedico) {
      setModalMsg({ visible: true, msg: 'Primero elige un médico.', type: 'info' });
      return;
    }
    try {
      setLoading(true);
      const start = new Date(fecha || new Date());
      for (let i = 0; i < 30; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const f = toISODate(d);
        const data = await api.get(`/medicos/${selMedico.id_medico}/disponibilidad?fecha=${encodeURIComponent(f)}`);
        const arr = Array.isArray(data) ? data : data?.slots || [];
        if (arr.length > 0) {
          setFecha(d);
          setSlots(arr);
          setSlotSel(arr[0]);
          setAutoSeleccionAviso(true);
          setProponerOtroHorario(false);
          setHoraPropuesta(null);
          setModalMsg({ visible: true, msg: `Encontramos disponibilidad el ${d.toLocaleDateString('es-ES')}.`, type: 'success' });
          return;
        }
      }
      setModalMsg({ visible: true, msg: 'No encontramos horarios en los próximos 30 días para este médico.', type: 'info' });
    } catch (e) {
      api.handleError?.(e);
    } finally {
      setLoading(false);
    }
  }, [selMedico, fecha]);

  // Time picker para propuesta manual
  const onChangeHoraPropuesta = (event, selectedDate) => {
    if (Platform.OS !== 'ios') setShowTimePicker(false);
    if (event?.type === 'dismissed') return;
    const d = selectedDate || new Date();
    const hh = String(d.getHours()).padStart(2,'0');
    const mm = String(d.getMinutes()).padStart(2,'0');
    setHoraPropuesta(`${hh}:${mm}`);
    setSlotSel(null); // deselecciona slot si propone manual
  };

  const enviar = async () => {
    if (!puedeEnviar) {
      setModalMsg({ visible: true, msg: 'Revisa las indicaciones en rojo para completar tu solicitud.', type: 'error' });
      return;
    }
    try {
      setLoading(true);
      const horaEnviar = slotSel || horaPropuesta;
      const payload = {
        id_medico: selMedico.id_medico,
        fecha: toISODate(fecha),
        hora: horaEnviar, // HH:mm
        detalles: (motivo || '').trim(),
        allow_out_of_schedule: !!horaPropuesta, // true si es propuesta manual
      };
      await api.post('/citas', payload);
      setModalMsg({ visible: true, msg: 'Tu cita fue solicitada como Pendiente. El médico revisará el horario propuesto.', type: 'success' });

      // Reset cómodo (mantenemos especialidad por UX si quieres, aquí limpiamos todo)
      setSelMedico(null);
      setFecha(null);
      setSlots([]);
      setSlotSel(null);
      setMotivo('');
      setAutoSeleccionAviso(false);
      setProponerOtroHorario(false);
      setHoraPropuesta(null);
    } catch (e) {
      api.handleError?.(e);
    } finally {
      setLoading(false);
    }
  };

  // Grupos de slots por periodo
  const slotsPorPeriodo = useMemo(() => {
    const map = { Mañana: [], Tarde: [], Noche: [] };
    for (const s of slots) map[periodOf(s)].push(s);
    return map;
  }, [slots]);

  return (
    <View style={[styles.container, { backgroundColor: colores.fondo, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={[styles.headerTitle, { color: colores.textoPrincipal, fontSize: fuentes.tamanos?.titulo || 24 }]}>
          Agendar Nueva Cita
        </Text>

        {/* Paso 1: Especialidad */}
        <Field
          label="1. Especialidad"
          help="¿Con qué especialidad necesitas atención? Puedes cambiarla en cualquier momento."
          error={errors.especialidad}
        >
          <TouchableOpacity
            onPress={abrirSelectorEspecialidad}
            style={[styles.selector, { borderColor: errors.especialidad ? '#DC2626' : '#E5E5E7', backgroundColor: '#F2F2F7' }]}
          >
            <FontAwesome name="stethoscope" size={16} color={colores.textoSecundario} />
            <Text style={[styles.selectorText, { color: selEspecialidad ? colores.textoPrincipal : colores.textoSecundario }]}>
              {selEspecialidad?.especialidad_nombre || 'Selecciona especialidad'}
            </Text>
            <FontAwesome name="chevron-down" size={14} color={colores.textoSecundario} />
          </TouchableOpacity>
        </Field>

        {/* Paso 2: Médico */}
        <Field
          label="2. Médico de preferencia"
          help="Te mostraremos los médicos disponibles de esta especialidad."
          error={errors.medico}
        >
          <TouchableOpacity
            onPress={abrirSelectorMedico}
            style={[styles.selector, { borderColor: errors.medico ? '#DC2626' : '#E5E5E7', backgroundColor: '#F2F2F7' }]}
          >
            <FontAwesome name="user-md" size={16} color={colores.textoSecundario} />
            <Text style={[styles.selectorText, { color: selMedico ? colores.textoPrincipal : colores.textoSecundario }]}>
              {selMedico?.nombre_completo || selMedico?.nombre || 'Selecciona médico'}
            </Text>
            <FontAwesome name="chevron-down" size={14} color={colores.textoSecundario} />
          </TouchableOpacity>
        </Field>

        {/* Paso 3: Fecha */}
        <Field
          label="3. Fecha"
          help="Elige el día de tu preferencia. Luego verás los horarios disponibles para ese día."
          error={errors.fecha}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity onPress={() => moverDia(-1)} style={[styles.smallBtn, { borderColor: '#E5E5E7' }]}>
              <FontAwesome name="chevron-left" size={12} color={colores.textoSecundario} />
              <Text style={{ marginLeft: 6, color: colores.textoSecundario }}>Anterior</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={[styles.selector, { flex: 1, borderColor: errors.fecha ? '#DC2626' : '#E5E5E7', backgroundColor: '#F2F2F7' }]}
            >
              <FontAwesome name="calendar" size={16} color={colores.textoSecundario} />
              <Text style={[styles.selectorText, { color: fecha ? colores.textoPrincipal : colores.textoSecundario }]}>
                {fecha ? fechaLegible : 'Seleccionar fecha'}
              </Text>
              <FontAwesome name="chevron-down" size={14} color={colores.textoSecundario} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => moverDia(1)} style={[styles.smallBtn, { borderColor: '#E5E5E7' }]}>
              <Text style={{ marginRight: 6, color: colores.textoSecundario }}>Siguiente</Text>
              <FontAwesome name="chevron-right" size={12} color={colores.textoSecundario} />
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={fecha || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
              onChange={onChangeFecha}
              minimumDate={new Date()}
            />
          )}
        </Field>

        {/* Paso 4: Horario disponible / Propuesta manual */}
        <Field
          label="4. Horario"
          help={
            selMedico && fecha
              ? 'Selecciona la hora disponible o propone una hora manual. Si no hay horarios, usa el buscador.'
              : 'Primero elige médico y fecha para ver horarios.'
          }
          error={errors.slot}
        >
          <View style={{ gap: 8 }}>
            <TouchableOpacity
              onPress={buscarPrimerDiaConDisponibilidad}
              style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: colores.principal }}
            >
              <FontAwesome name="search" size={14} color={colores.principal} />
              <Text style={{ marginLeft: 8, color: colores.principal, fontWeight: '700' }}>Buscar primer día con disponibilidad</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setProponerOtroHorario(!proponerOtroHorario); if (!proponerOtroHorario) setShowTimePicker(true); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <FontAwesome name={proponerOtroHorario ? 'toggle-on' : 'toggle-off'} size={22} color={colores.principal} />
              <Text style={{ color: colores.textoPrincipal, fontWeight: '700' }}>
                {proponerOtroHorario ? 'Proponer otro horario (activado)' : 'Proponer otro horario'}
              </Text>
            </TouchableOpacity>

            {proponerOtroHorario && (
              <View>
                <TouchableOpacity
                  onPress={() => setShowTimePicker(true)}
                  style={{ marginTop: 8, alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E5E7', flexDirection:'row', alignItems:'center' }}
                >
                  <FontAwesome name="clock-o" size={14} color={colores.textoSecundario} />
                  <Text style={{ marginLeft: 8, color: colores.textoPrincipal, fontWeight: '700' }}>
                    {horaPropuesta ? `Propuesto: ${fmt12h(horaPropuesta)}` : 'Seleccionar hora'}
                  </Text>
                </TouchableOpacity>

                {showTimePicker && (
                  <DateTimePicker
                    value={new Date()}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
                    onChange={onChangeHoraPropuesta}
                  />
                )}
                <Text style={{ marginTop: 6, fontSize: 12, color: colores.textoSecundario }}>
                  Esta hora puede estar fuera de la agenda del médico; él podrá aprobarla, reprogramarla o rechazarla.
                </Text>
              </View>
            )}

            {/* Chips de slots disponibles */}
            {slots.length === 0 ? (
              <Text style={{ color: colores.textoSecundario }}>
                {selMedico && fecha ? 'No hay horarios para esta fecha. Prueba otro día, busca disponibilidad o propone tu hora.' : 'Aún no hay horarios que mostrar.'}
              </Text>
            ) : (
              ['Mañana', 'Tarde', 'Noche'].map((p) =>
                (slotsPorPeriodo[p] || []).length ? (
                  <View key={p} style={{ marginBottom: 10 }}>
                    <Text style={{ fontSize: 12, color: colores.textoSecundario, marginBottom: 6 }}>{p}</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {slotsPorPeriodo[p].map((h) => {
                        const active = slotSel === h;
                        return (
                          <TouchableOpacity
                            key={h}
                            onPress={() => { setSlotSel(h); setProponerOtroHorario(false); setHoraPropuesta(null); }}
                            style={[
                              styles.slotBtn,
                              { borderColor: active ? colores.principal : '#E5E5E7', backgroundColor: active ? colores.principal + '15' : 'transparent' },
                            ]}
                          >
                            <Text style={{ color: active ? colores.principal : colores.textoPrincipal, fontWeight: '700' }}>
                              {fmt12h(h)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ) : null
              )
            )}

            {autoSeleccionAviso && slotSel ? (
              <View style={styles.infoBanner}>
                <FontAwesome name="lightbulb-o" size={14} color="#2563EB" />
                <Text style={styles.infoBannerText}>
                  Seleccionamos por ti {fmt12h(slotSel)} como primer horario disponible. Puedes escoger otro o proponer tu hora.
                </Text>
              </View>
            ) : null}
          </View>
        </Field>

        {/* Paso 5: Motivo */}
        <Field
          label="5. Motivo de la consulta"
          help="Sé breve y claro. Ejemplo: “Dolor en el pecho desde hace 2 días” o “Control de presión”."
          error={errors.motivo}
        >
          <View style={[styles.textArea, { borderColor: errors.motivo ? '#DC2626' : '#E5E5E7', backgroundColor: '#F2F2F7' }]}>
            <FontAwesome name="commenting-o" size={16} color={colores.textoSecundario} style={{ marginRight: 8 }} />
            <TextInput
              value={motivo}
              onChangeText={setMotivo}
              placeholder="Escribe aquí el motivo..."
              placeholderTextColor={colores.textoSecundario + '80'}
              style={{ flex: 1, minHeight: 90, textAlignVertical: 'top', color: colores.textoPrincipal }}
              multiline
              maxLength={1000}
            />
          </View>
        </Field>

        {!puedeEnviar && (
          <View style={styles.hintsBox}>
            <FontAwesome name="info-circle" size={14} color="#0EA5E9" />
            <View style={{ marginLeft: 8 }}>
              <Text style={{ color: colores.textoPrincipal, fontWeight: '700' }}>Te faltan estos pasos:</Text>
              {razonesDesactivado.map((r) => (
                <Text key={r} style={{ color: colores.textoSecundario, marginTop: 2 }}>• {r}</Text>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: puedeEnviar ? colores.principal : '#9CA3AF' }]}
          onPress={enviar}
          disabled={!puedeEnviar || loading}
          testID="btn-confirmar-cita"
        >
          <Text style={styles.submitButtonText}>Confirmar Solicitud</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de selección (especialidades / médicos) */}
      <Modal
        visible={modalLista.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalLista({ visible: false, tipo: null })}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setModalLista({ visible: false, tipo: null })}>
          <Pressable style={[styles.modalCard, { backgroundColor: colores.superficie }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: colores.textoPrincipal }]}>
              {modalLista.tipo === 'especialidad' ? 'Selecciona Especialidad' : 'Selecciona Médico'}
            </Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {(modalLista.tipo === 'especialidad' ? especialidades : medicos).map((item) => (
                <Pressable
                  key={modalLista.tipo === 'especialidad' ? item.id_especialidad : item.id_medico}
                  onPress={() =>
                    modalLista.tipo === 'especialidad' ? onSelectEspecialidad(item) : onSelectMedico(item)
                  }
                  style={styles.modalOption}
                >
                  <Text style={{ color: colores.textoPrincipal, fontWeight: '600' }}>
                    {modalLista.tipo === 'especialidad'
                      ? item.especialidad_nombre
                      : item.nombre_completo || `${item.nombre || ''} ${item.apellido || ''}`.trim()}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setModalLista({ visible: false, tipo: null })}>
              <Text style={{ color: colores.textoSecundario, fontWeight: '700' }}>Cerrar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Mensajes simples */}
      <ModalGeneral
        visible={modalMsg.visible}
        type={modalMsg.type}
        message={modalMsg.msg}
        onClose={() => setModalMsg({ visible: false, msg: '', type: 'info' })}
      />

      {loading && (
        <IndicadorCarga
          visible
          texto="Cargando..."
          tamaño="grande"
          tipo="bloques"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerTitle: { fontWeight: '800', marginBottom: 16 },
  selector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 48,
  },
  selectorText: { flex: 1, marginHorizontal: 10, fontSize: 16 },
  smallBtn: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, height: 40,
    borderWidth: 1, borderRadius: 10,
  },
  slotBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5 },
  textArea: { flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderRadius: 12, padding: 10 },
  submitButton: { marginTop: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  hintsBox: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#E0F2FE', borderRadius: 12,
    padding: 10, marginTop: 8,
  },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 420, borderRadius: 12, padding: 16 },
  modalTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  modalOption: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E5E5' },
  modalClose: { alignSelf: 'flex-end', marginTop: 10, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E5E5E5' },
  infoBanner: { flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: '#DBEAFE', borderRadius: 8, marginTop: 8 },
  infoBannerText: { marginLeft: 8, color: '#1E3A8A', fontSize: 12, flex: 1 },
});