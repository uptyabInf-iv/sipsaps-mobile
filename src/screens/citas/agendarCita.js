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
  Dimensions,
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dd = new Date(d);
  dd.setHours(0, 0, 0, 0);
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
  let h = H % 12;
  if (h === 0) h = 12;
  const ampm = H >= 12 ? 'PM' : 'AM';
  return `${h}:${String(M).padStart(2, '0')} ${ampm}`;
};

// Small responsive Field
const Field = ({ label, help, error, children, theme }) => {
  const colores = theme?.colores;
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[styles.fieldLabel, { color: colores.textoPrincipal }]}>{label}</Text>
      {help ? <Text style={[styles.fieldHelp, { color: colores.textoSecundario }]}>{help}</Text> : null}
      <View style={{ marginTop: 8 }}>{children}</View>
      {error ? (
        <View style={styles.fieldErrorRow}>
          <FontAwesome name="exclamation-circle" size={12} color="#DC2626" />
          <Text style={styles.fieldErrorText}>{error}</Text>
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

  // Responsive breakpoint
  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const COMPACT = SCREEN_WIDTH <= 360;
  const H_PAD = COMPACT ? 12 : 20;

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

  // Propuesta manual
  const [proponerOtroHorario, setProponerOtroHorario] = useState(false);
  const [horaPropuesta, setHoraPropuesta] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Errores campo a campo
  const [errors, setErrors] = useState({ especialidad: '', medico: '', fecha: '', slot: '', motivo: '' });

  // Load specialities
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

  // When specialty changes, load doctors
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

  // Availability
  useEffect(() => {
    if (!selMedico || !fecha) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setSlots([]);
        setSlotSel(null);
        setAutoSeleccionAviso(false);
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

  // Validations
  useEffect(() => setErrors((p) => ({ ...p, especialidad: selEspecialidad ? '' : 'Selecciona una especialidad.' })), [selEspecialidad]);
  useEffect(() => setErrors((p) => ({ ...p, medico: selMedico ? '' : 'Elige al médico de tu preferencia.' })), [selMedico]);
  useEffect(() => setErrors((p) => ({ ...p, fecha: fecha ? '' : 'Selecciona una fecha futura.' })), [fecha]);
  useEffect(
    () =>
      setErrors((p) => ({
        ...p,
        slot: (slotSel || horaPropuesta) ? '' : (selMedico && fecha ? 'Selecciona un horario disponible o propone uno manual.' : ''),
      })),
    [slotSel, horaPropuesta, selMedico, fecha]
  );
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

  // Actions
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

  const onChangeHoraPropuesta = (event, selectedDate) => {
    if (Platform.OS !== 'ios') setShowTimePicker(false);
    if (event?.type === 'dismissed') return;
    const d = selectedDate || new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    setHoraPropuesta(`${hh}:${mm}`);
    setSlotSel(null);
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
        hora: horaEnviar,
        detalles: (motivo || '').trim(),
        allow_out_of_schedule: !!horaPropuesta,
      };
      await api.post('/citas', payload);
      setModalMsg({ visible: true, msg: 'Tu cita fue solicitada como Pendiente. El médico revisará el horario propuesto.', type: 'success' });

      // Reset cómodo
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

  // Slots grouped by period
  const slotsPorPeriodo = useMemo(() => {
    const map = { Mañana: [], Tarde: [], Noche: [] };
    for (const s of slots) map[periodOf(s)].push(s);
    return map;
  }, [slots]);

  // --- Render ---
  return (
    <View style={[styles.container, { backgroundColor: colores.fondo, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: H_PAD, paddingTop: 20, paddingBottom: Math.max(insets.bottom + 120, 160) }}>
        <Text style={[styles.headerTitle, { color: colores.textoPrincipal, fontSize: COMPACT ? 18 : fuentes.tamanos?.titulo || 24 }]}>
          Agendar Nueva Cita
        </Text>

        {/* 1. Especialidad */}
        <Field label="1. Especialidad" help="¿Con qué especialidad necesitas atención?" error={errors.especialidad} theme={{ colores }}>
          <TouchableOpacity onPress={abrirSelectorEspecialidad} style={[styles.selector, { borderColor: errors.especialidad ? '#DC2626' : '#E5E5E7', backgroundColor: '#F2F2F7', height: COMPACT ? 44 : 48 }]}>
            <FontAwesome name="stethoscope" size={COMPACT ? 14 : 16} color={colores.textoSecundario} />
            <Text style={[styles.selectorText, { color: selEspecialidad ? colores.textoPrincipal : colores.textoSecundario }]}>
              {selEspecialidad?.especialidad_nombre || 'Selecciona especialidad'}
            </Text>
            <FontAwesome name="chevron-down" size={COMPACT ? 12 : 14} color={colores.textoSecundario} />
          </TouchableOpacity>
        </Field>

        {/* 2. Médico */}
        <Field label="2. Médico de preferencia" help="Te mostraremos los médicos disponibles." error={errors.medico} theme={{ colores }}>
          <TouchableOpacity onPress={abrirSelectorMedico} style={[styles.selector, { borderColor: errors.medico ? '#DC2626' : '#E5E5E7', backgroundColor: '#F2F2F7', height: COMPACT ? 44 : 48 }]}>
            <FontAwesome name="user-md" size={COMPACT ? 14 : 16} color={colores.textoSecundario} />
            <Text style={[styles.selectorText, { color: selMedico ? colores.textoPrincipal : colores.textoSecundario }]}>
              {selMedico?.nombre_completo || selMedico?.nombre || 'Selecciona médico'}
            </Text>
            <FontAwesome name="chevron-down" size={COMPACT ? 12 : 14} color={colores.textoSecundario} />
          </TouchableOpacity>
        </Field>

        {/* 3. Fecha */}
        <Field label="3. Fecha" help="Elige el día de tu preferencia." error={errors.fecha} theme={{ colores }}>
          <View style={[styles.row, { gap: 8 }]}>
            <TouchableOpacity onPress={() => moverDia(-1)} style={[styles.smallBtn, { borderColor: '#E5E5E7', height: COMPACT ? 36 : 40 }]}>
              <FontAwesome name="chevron-left" size={COMPACT ? 10 : 12} color={colores.textoSecundario} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.selector, { flex: 1, borderColor: errors.fecha ? '#DC2626' : '#E5E5E7', backgroundColor: '#F2F2F7', height: COMPACT ? 44 : 48 }]}>
              <FontAwesome name="calendar" size={COMPACT ? 14 : 16} color={colores.textoSecundario} />
              <Text style={[styles.selectorText, { color: fecha ? colores.textoPrincipal : colores.textoSecundario }]}>
                {fecha ? fechaLegible : 'Seleccionar fecha'}
              </Text>
              <FontAwesome name="chevron-down" size={COMPACT ? 12 : 14} color={colores.textoSecundario} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => moverDia(1)} style={[styles.smallBtn, { borderColor: '#E5E5E7', height: COMPACT ? 36 : 40 }]}>
              <FontAwesome name="chevron-right" size={COMPACT ? 10 : 12} color={colores.textoSecundario} />
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

        {/* 4. Horario */}
        <Field
          label="4. Horario"
          help={selMedico && fecha ? 'Selecciona la hora disponible o propone una hora manual.' : 'Primero elige médico y fecha para ver horarios.'}
          error={errors.slot}
          theme={{ colores }}
        >
          <View style={{ gap: 8 }}>
            <TouchableOpacity onPress={buscarPrimerDiaConDisponibilidad} style={[styles.actionPrimary, { alignSelf: 'flex-start' }]}>
              <FontAwesome name="search" size={COMPACT ? 14 : 16} color={colores.principal} />
              <Text style={[styles.actionPrimaryText, { color: colores.principal }]}>Buscar primer día con disponibilidad</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setProponerOtroHorario(!proponerOtroHorario); if (!proponerOtroHorario) setShowTimePicker(true); }} style={styles.row}>
              <FontAwesome name={proponerOtroHorario ? 'toggle-on' : 'toggle-off'} size={COMPACT ? 20 : 22} color={colores.principal} />
              <Text style={{ marginLeft: 8, color: colores.textoPrincipal, fontWeight: '700' }}>
                {proponerOtroHorario ? 'Proponer otro horario (activado)' : 'Proponer otro horario'}
              </Text>
            </TouchableOpacity>

            {proponerOtroHorario && (
              <View>
                <TouchableOpacity onPress={() => setShowTimePicker(true)} style={[styles.selector, { marginTop: 8, alignSelf: 'flex-start', height: COMPACT ? 44 : 48, backgroundColor: '#fff' }]}>
                  <FontAwesome name="clock-o" size={COMPACT ? 14 : 16} color={colores.textoSecundario} />
                  <Text style={[styles.selectorText, { color: horaPropuesta ? colores.textoPrincipal : colores.textoSecundario }]}>
                    {horaPropuesta ? `Propuesto: ${fmt12h(horaPropuesta)}` : 'Seleccionar hora'}
                  </Text>
                </TouchableOpacity>

                {showTimePicker && (
                  <DateTimePicker value={new Date()} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'clock'} onChange={onChangeHoraPropuesta} />
                )}
                <Text style={[styles.smallHelp, { color: colores.textoSecundario }]}>
                  Esta hora puede estar fuera de la agenda del médico; él podrá aprobarla, reprogramarla o rechazarla.
                </Text>
              </View>
            )}

            {/* Slots */}
            {slots.length === 0 ? (
              <Text style={[styles.smallHelp, { color: colores.textoSecundario }]}>
                {selMedico && fecha ? 'No hay horarios para esta fecha. Prueba otro día, busca disponibilidad o propone tu hora.' : 'Aún no hay horarios que mostrar.'}
              </Text>
            ) : (
              ['Mañana', 'Tarde', 'Noche'].map((p) =>
                (slotsPorPeriodo[p] || []).length ? (
                  <View key={p} style={{ marginBottom: 10 }}>
                    <Text style={[styles.periodLabel, { color: colores.textoSecundario }]}>{p}</Text>
                    <View style={[styles.slotsWrap, COMPACT ? styles.slotsWrapCompact : null]}>
                      {slotsPorPeriodo[p].map((h) => {
                        const active = slotSel === h;
                        return (
                          <TouchableOpacity
                            key={h}
                            onPress={() => { setSlotSel(h); setProponerOtroHorario(false); setHoraPropuesta(null); }}
                            style={[
                              styles.slotBtn,
                              COMPACT ? styles.slotBtnCompact : null,
                              { borderColor: active ? colores.principal : '#E5E5E7', backgroundColor: active ? colores.principal + '15' : 'transparent' },
                            ]}
                          >
                            <Text style={[styles.slotBtnText, { color: active ? colores.principal : colores.textoPrincipal }]}>
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
              <View style={[styles.infoBanner, { backgroundColor: '#DBEAFE' }]}>
                <FontAwesome name="lightbulb-o" size={14} color="#2563EB" />
                <Text style={[styles.infoBannerText, { color: '#1E3A8A' }]}>
                  Seleccionamos por ti {fmt12h(slotSel)} como primer horario disponible. Puedes escoger otro o proponer tu hora.
                </Text>
              </View>
            ) : null}
          </View>
        </Field>

        {/* 5. Motivo */}
        <Field label="5. Motivo de la consulta" help="Sé breve y claro." error={errors.motivo} theme={{ colores }}>
          <View style={[styles.textArea, { borderColor: errors.motivo ? '#DC2626' : '#E5E5E7', backgroundColor: '#F2F2F7' }]}>
            <FontAwesome name="commenting-o" size={COMPACT ? 14 : 16} color={colores.textoSecundario} style={{ marginRight: 8 }} />
            <TextInput
              value={motivo}
              onChangeText={setMotivo}
              placeholder="Escribe aquí el motivo..."
              placeholderTextColor={colores.textoSecundario + '80'}
              style={[styles.textInputArea, { color: colores.textoPrincipal }]}
              multiline
              maxLength={1000}
            />
          </View>
        </Field>

        {!puedeEnviar && (
          <View style={[styles.hintsBox, { backgroundColor: '#E0F2FE' }]}>
            <FontAwesome name="info-circle" size={14} color="#0EA5E9" />
            <View style={{ marginLeft: 8 }}>
              <Text style={{ color: colores.textoPrincipal, fontWeight: '700' }}>Te faltan estos pasos:</Text>
              {razonesDesactivado.map((r) => (
                <Text key={r} style={{ color: colores.textoSecundario, marginTop: 2, fontSize: COMPACT ? 12 : 14 }}>• {r}</Text>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: puedeEnviar ? colores.principal : '#9CA3AF', marginBottom: COMPACT ? 24 : 36 }]}
          onPress={enviar}
          disabled={!puedeEnviar || loading}
          testID="btn-confirmar-cita"
        >
          <Text style={styles.submitButtonText}>Confirmar Solicitud</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Selector modal */}
      <Modal visible={modalLista.visible} transparent animationType="fade" onRequestClose={() => setModalLista({ visible: false, tipo: null })}>
        <Pressable style={styles.modalBackdrop} onPress={() => setModalLista({ visible: false, tipo: null })}>
          <Pressable style={[styles.modalCard, { backgroundColor: colores.superficie, maxWidth: COMPACT ? '94%' : 420 }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: colores.textoPrincipal }]}>
              {modalLista.tipo === 'especialidad' ? 'Selecciona Especialidad' : 'Selecciona Médico'}
            </Text>
            <ScrollView style={{ maxHeight: COMPACT ? 300 : 360 }}>
              {(modalLista.tipo === 'especialidad' ? especialidades : medicos).map((item) => (
                <Pressable
                  key={modalLista.tipo === 'especialidad' ? item.id_especialidad : item.id_medico}
                  onPress={() =>
                    modalLista.tipo === 'especialidad' ? onSelectEspecialidad(item) : onSelectMedico(item)
                  }
                  style={[styles.modalOption, { borderBottomColor: '#E5E5E5' }]}
                >
                  <Text style={{ color: colores.textoPrincipal, fontWeight: '600', fontSize: COMPACT ? 14 : 16 }}>
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

      {/* Simple messages */}
      <ModalGeneral visible={modalMsg.visible} type={modalMsg.type} message={modalMsg.msg} onClose={() => setModalMsg({ visible: false, msg: '', type: 'info' })} />

      {loading && <IndicadorCarga visible texto="Cargando..." tamaño="grande" tipo="bloques" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerTitle: { fontWeight: '800', marginBottom: 12 },

  // Fields
  fieldLabel: { fontSize: 14, fontWeight: '700' },
  fieldHelp: { fontSize: 12, marginTop: 4 },
  fieldErrorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  fieldErrorText: { color: '#DC2626', marginLeft: 6, fontSize: 12 },

  // Selectors
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  selectorText: { flex: 1, marginHorizontal: 10, fontSize: 15 },

  row: { flexDirection: 'row', alignItems: 'center' },

  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    justifyContent: 'center',
  },

  actionPrimary: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  actionPrimaryText: { marginLeft: 8, fontWeight: '700' },

  // Slots
  slotsWrap: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  slotsWrapCompact: { justifyContent: 'flex-start' },
  slotBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    marginRight: 8,
    marginBottom: 8,
  },
  slotBtnCompact: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: 84,
  },
  slotBtnText: { fontWeight: '700' },

  periodLabel: { fontSize: 12, marginBottom: 6 },

  // Text area
  textArea: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  textInputArea: { flex: 1, minHeight: 90, textAlignVertical: 'top', fontSize: 14 },

  // Hints and info
  hintsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
  },
  smallHelp: { marginTop: 6, fontSize: 12 },

  infoBanner: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, marginTop: 8 },
  infoBannerText: { marginLeft: 8, fontSize: 12, flex: 1 },

  // Submit
  submitButton: { marginTop: 16, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 12 },
  modalCard: { width: '100%', maxWidth: 420, borderRadius: 12, padding: 16 },
  modalTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  modalOption: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E5E5' },
  modalClose: { alignSelf: 'flex-end', marginTop: 10, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E5E5E5' },

  // Misc
  reloadButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1 },
});