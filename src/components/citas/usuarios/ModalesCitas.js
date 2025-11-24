import React from 'react';
import {
  Modal,
  Pressable,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FontAwesome } from '@expo/vector-icons';
import { styles } from './estilosCitas';
import { ESTATUS_INFO } from './EstadoEtiqueta';
import EstadoEtiqueta from './EstadoEtiqueta';
import ChipSegmentado from './ChipSegmentado';
import { formatISOCaracas, stripBracketsAndCurly } from '../../../utils/fechas';
import { useTemasPersonalizado } from '../../../hooks/useTemasPersonalizado';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COMPACT_LOCAL = SCREEN_WIDTH <= 360;

/* Nota: stripBracketsAndCurly también está exportado desde src/utils/fechas,
   si no lo estuviera en tu versión, mantén la función local. */

export function ModalAccionesCita({ visible, onClose, cita, onVerDetalle, onReprogramar, onCancelar }) {
  const { colores, esOscuro } = useTemasPersonalizado();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.actionModalContainer, { backgroundColor: colores.superficie }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <FontAwesome name="close" size={24} color={colores.textoSecundario} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colores.textoPrincipal }]}>Gestionar Cita</Text>
          <Text style={{ color: colores.textoSecundario, marginBottom: 18, textAlign: 'center' }}>
            {cita?.especialidad ?? ''} — {cita?.medico ?? '—'}
          </Text>

          <View style={{ width: '100%' }}>
            <TouchableOpacity
              style={[
                styles.actionCard,
                {
                  borderColor: colores.borde,
                  backgroundColor: esOscuro ? colores.superficieFuerte : colores.superficieClara,
                },
              ]}
              onPress={onVerDetalle}
            >
              <FontAwesome name="info-circle" size={20} color={colores.principal} />
              <Text style={[styles.actionCardTitle, { color: colores.textoPrincipal, marginLeft: 12 }]}>Ver detalles</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionCard,
                {
                  borderColor: ESTATUS_INFO.Reprogramada.color,
                  backgroundColor: esOscuro ? colores.superficieFuerte : colores.superficieClara,
                },
              ]}
              onPress={onReprogramar}
            >
              <FontAwesome name="calendar" size={20} color={ESTATUS_INFO.Reprogramada.color} />
              <Text style={[styles.actionCardTitle, { color: colores.textoPrincipal, marginLeft: 12 }]}>Reprogramar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionCard,
                {
                  borderColor: ESTATUS_INFO.Cancelada.color,
                  backgroundColor: esOscuro ? colores.superficieFuerte : colores.superficieClara,
                },
              ]}
              onPress={onCancelar}
            >
              <FontAwesome name="times-circle" size={20} color={ESTATUS_INFO.Cancelada.color} />
              <Text style={[styles.actionCardTitle, { color: colores.textoPrincipal, marginLeft: 12 }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function ModalGestionCita({
  visible,
  onClose,
  tipoAccion,
  nuevaFecha,
  showDatePicker,
  onMostrarPicker,
  onChangeDate,
  usarHoraActual,
  setUsarHoraActual,
  hour12,
  setHour12,
  minute,
  setMinute,
  ampm,
  setAmpm,
  permitirFueraHorario,
  setPermitirFueraHorario,
  justificacion,
  setJustificacion,
  onConfirmar,
  isSubmitting,
  compact,
  colores,
  esOscuro,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={[styles.gestionModalContainer, { backgroundColor: colores.superficie }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <FontAwesome name="close" size={24} color={colores.textoSecundario} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colores.textoPrincipal }]}>
            {tipoAccion === 'reprogramar' ? 'Reprogramar Cita' : 'Cancelar Cita'}
          </Text>

          {tipoAccion === 'reprogramar' && (
            <>
              <Text style={[styles.label, { color: colores.textoSecundario, marginBottom: 6 }]}>Nueva Fecha</Text>
              <TouchableOpacity
                onPress={onMostrarPicker}
                style={[styles.datePickerButton, { borderColor: colores.borde, backgroundColor: esOscuro ? colores.superficieFuerte : colores.superficieClara }]}
              >
                <Text style={{ color: colores.textoPrincipal, fontSize: 16 }}>
                  {formatISOCaracas(nuevaFecha, { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>
              </TouchableOpacity>
              {showDatePicker && <DateTimePicker value={nuevaFecha} mode="date" display="calendar" onChange={onChangeDate} />}

              <View style={{ marginTop: 10, width: '100%' }}>
                <TouchableOpacity onPress={() => setUsarHoraActual(!usarHoraActual)} style={{ flexDirection: 'row', alignItems: 'center' }} accessibilityRole="button">
                  <FontAwesome name={usarHoraActual ? 'toggle-on' : 'toggle-off'} size={28} color={colores.principal} />
                  <Text style={{ marginLeft: 8, color: colores.textoPrincipal, fontWeight: '700' }}>
                    {usarHoraActual ? 'Usar la misma hora' : 'Elegir nueva hora'}
                  </Text>
                </TouchableOpacity>

                {!usarHoraActual && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={[styles.label, { color: colores.textoSecundario }]}>Hora</Text>
                    <View style={[styles.chipsContainer, { flexDirection: 'row', flexWrap: 'wrap' }]}>
                      {[...Array(12)].map((_, idx) => {
                        const val = idx + 1;
                        return (
                          <ChipSegmentado key={`h-${val}`} label={String(val)} activo={hour12 === val} alPresionar={() => setHour12(val)} color={colores.principal} compact={compact} />
                        );
                      })}
                    </View>

                    <Text style={[styles.label, { color: colores.textoSecundario, marginTop: 6 }]}>Minutos</Text>
                    <View style={[styles.chipsContainer, { flexDirection: 'row', flexWrap: 'wrap' }]}>
                      {['00', '15', '30', '45'].map((mm) => (
                        <ChipSegmentado key={`m-${mm}`} label={mm} activo={minute === mm} alPresionar={() => setMinute(mm)} color={colores.principal} compact={compact} />
                      ))}
                    </View>

                    <Text style={[styles.label, { color: colores.textoSecundario, marginTop: 6 }]}>Periodo</Text>
                    <View style={[styles.chipsContainer, { flexDirection: 'row', flexWrap: 'wrap' }]}>
                      {['AM', 'PM'].map((p) => (
                        <ChipSegmentado key={`p-${p}`} label={p} activo={ampm === p} alPresionar={() => setAmpm(p)} color={colores.principal} compact={compact} />
                      ))}
                    </View>
                  </View>
                )}

                <TouchableOpacity onPress={() => setPermitirFueraHorario(!permitirFueraHorario)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                  <FontAwesome name={permitirFueraHorario ? 'check-square' : 'square-o'} size={18} color={'#F59E0B'} />
                  <Text style={{ marginLeft: 8, color: '#A16207', fontWeight: '700' }}>Permitir fuera de horario</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <Text style={[styles.label, { color: colores.textoSecundario, marginTop: 12 }]}>Justificación {tipoAccion === 'cancelar' ? '(obligatoria)' : '(obligatoria)'}</Text>
          <TextInput
            style={[styles.modalInput, { borderColor: colores.borde, color: colores.textoPrincipal, backgroundColor: esOscuro ? colores.superficieFuerte : colores.superficieClara }]}
            value={justificacion}
            onChangeText={setJustificacion}
            multiline
            placeholder="Explica por qué reprogramas o cancelas..."
            placeholderTextColor={colores.textoSecundario}
            accessibilityLabel="Escribe la justificación"
          />

          <TouchableOpacity style={[styles.modalButton, { backgroundColor: isSubmitting ? colores.principal + '80' : colores.principal }]} onPress={onConfirmar} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalButtonText}>Confirmar</Text>}
          </TouchableOpacity>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function ModalDetalleCita({ visible, onClose, cita, colores, esOscuro, insets }) {
  function fmt12h(hhmm) {
    if (!hhmm) return '—';
    const [H, M] = hhmm.split(':').map((n) => parseInt(n, 10));
    if (Number.isNaN(H) || Number.isNaN(M)) return '—';
    let h = H % 12;
    if (h === 0) h = 12;
    const ampm = H >= 12 ? 'PM' : 'AM';
    return `${h}:${String(M).padStart(2, '0')} ${ampm}`;
  }
  function fmtFechaLarga(yyyyMmDd) {
    if (!yyyyMmDd) return '—';
    try {
      const d = new Date(yyyyMmDd + 'T00:00:00');
      return d.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
      return yyyyMmDd;
    }
  }
  function doctorPrefix(sexo) {
    if (sexo === 'M') return 'Dr.';
    if (sexo === 'F') return 'Dra.';
    return 'Dr(a).';
  }

  const comentarioMedicoToShow = cita?.comentario_medico_human || (cita?.comentario_medico ? stripBracketsAndCurly(cita.comentario_medico) : '');
  const justificacionToShow = cita?.justificacion_human || (cita?.justificacion ? stripBracketsAndCurly(cita.justificacion) : '');
  const motivoCancelToShow = cita?.motivo_cancelacion_human || (cita?.motivo_cancelacion ? stripBracketsAndCurly(cita.motivo_cancelacion) : '');
  const diagnosticoToShow = cita?.diagnostico_clean || (cita?.diagnostico ? stripBracketsAndCurly(cita.diagnostico) : '');

  // Nuevo: mostrar los detalles que registra el paciente (columna 'detalles' en BD -> 'motivo' en API)
  const detallePacienteRaw = (cita && (cita.motivo ?? cita.detalles ?? cita.detalles_raw ?? cita.detalle)) || '';
  const detallePacienteToShow = detallePacienteRaw ? stripBracketsAndCurly(detallePacienteRaw) : null;

  const fechaAtencionHuman = cita?.fechaAtencion_human || (cita?.fechaAtencion ? formatISOCaracas(cita.fechaAtencion) : null);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView style={{ flex: 1, backgroundColor: colores.fondo }}>
        <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 20 }}>
          <TouchableOpacity onPress={onClose} style={styles.detalleCloseButton} accessibilityLabel="Cerrar detalle">
            <FontAwesome name="close" size={28} color={colores.textoPrincipal} />
          </TouchableOpacity>
          <Text style={[styles.detalleHeaderTitle, { color: colores.textoPrincipal, fontSize: COMPACT_LOCAL ? 20 : 22 }]}>Detalle de la Cita</Text>
        </View>

        {cita ? (
          <View style={{ padding: COMPACT_LOCAL ? 12 : 20 }}>
            <View style={[styles.detalleSection, { padding: COMPACT_LOCAL ? 12 : 16, borderRadius: 12, backgroundColor: colores.superficie }]}>
              <Text style={[styles.detalleSectionTitle, { color: colores.principal }]}>Cita</Text>

              <View style={styles.detalleRow}>
                <Text style={[styles.detalleLabel, { color: colores.textoSecundario }]}>Especialidad</Text>
                <Text style={[styles.detalleValue, { color: colores.textoPrincipal }]}>{cita.especialidad ?? '—'}</Text>
              </View>

              <View style={styles.detalleRow}>
                <Text style={[styles.detalleLabel, { color: colores.textoSecundario }]}>Médico</Text>
                <Text style={[styles.detalleValue, { color: colores.textoPrincipal }]}>{cita.medico ? `${doctorPrefix(cita.med_sexo)} ${cita.medico}` : '—'}</Text>
              </View>

              <View style={styles.detalleRow}>
                <Text style={[styles.detalleLabel, { color: colores.textoSecundario }]}>Fecha</Text>
                <Text style={[styles.detalleValue, { color: colores.textoPrincipal }]}>{fmtFechaLarga(cita.fechaStr)}</Text>
              </View>

              <View style={styles.detalleRow}>
                <Text style={[styles.detalleLabel, { color: colores.textoSecundario }]}>Hora</Text>
                <Text style={[styles.detalleValue, { color: colores.textoPrincipal }]}>{fmt12h(cita.horaStr)}</Text>
              </View>

              {/* Detalle del paciente debajo de Hora (nuevo) */}
              <View style={[styles.detalleRow, { borderBottomWidth: 0, paddingTop: 8 }]}>
                <Text style={[styles.detalleLabel, { color: colores.textoSecundario }]}>Detalle del paciente</Text>
                <Text style={[styles.detalleValue, { color: colores.textoPrincipal }]} numberOfLines={6} ellipsizeMode="tail">
                  {detallePacienteToShow || '—'}
                </Text>
              </View>

              <View style={[styles.detalleRow, { borderBottomWidth: 0 }]}>
                <Text style={[styles.detalleLabel, { color: colores.textoSecundario }]}>Estado</Text>
                <EstadoEtiqueta estatus={cita.estatus ?? 'Pendiente'} />
              </View>

              {cita.fueraHorario ? (
                <View style={[styles.detalleRow, { borderBottomWidth: 0, paddingVertical: 10 }]}>
                  <Text style={[styles.detalleLabel, { color: colores.textoSecundario }]}>Observación</Text>
                  <Text style={[styles.detalleValue, { color: '#A16207', fontWeight: '800' }]}>Fuera de horario: {fmt12h(cita.horaStr)}</Text>
                </View>
              ) : null}
            </View>

            {justificacionToShow ? (
              <View style={[styles.detalleSection, { marginTop: 18, padding: COMPACT_LOCAL ? 12 : 16, borderRadius: 12, backgroundColor: colores.superficie }]}>
                <Text style={[styles.detalleSectionTitle, { color: colores.principal }]}>Motivo de Modificación</Text>
                <Text style={{ color: colores.textoSecundario }}>{justificacionToShow}</Text>
              </View>
            ) : null}

            {comentarioMedicoToShow ? (
              <View style={[styles.detalleSection, { marginTop: 18, padding: COMPACT_LOCAL ? 12 : 16, borderRadius: 12, backgroundColor: colores.superficie }]}>
                <Text style={[styles.detalleSectionTitle, { color: colores.principal }]}>Comentario del Médico</Text>
                <Text style={{ color: colores.textoSecundario }}>{comentarioMedicoToShow}</Text>
              </View>
            ) : null}

            {motivoCancelToShow ? (
              <View style={[styles.detalleSection, { marginTop: 18, padding: COMPACT_LOCAL ? 12 : 16, borderRadius: 12, backgroundColor: colores.superficie }]}>
                <Text style={[styles.detalleSectionTitle, { color: cita.canceladoPor === 'Paciente' ? '#A16207' : '#dc3545' }]}>
                  Motivo de Cancelación ({cita.canceladoPor ?? '—'})
                </Text>
                <Text style={{ color: colores.textoSecundario }}>{motivoCancelToShow}</Text>
              </View>
            ) : null}

            {cita.estatus === 'Atendida' && diagnosticoToShow ? (
              <View style={[styles.detalleSection, { marginTop: 18, padding: COMPACT_LOCAL ? 12 : 16, borderRadius: 12, backgroundColor: colores.superficie }]}>
                <Text style={[styles.detalleSectionTitle, { color: colores.principal }]}>Diagnóstico</Text>
                <Text style={{ color: colores.textoSecundario }}>{diagnosticoToShow}</Text>
              </View>
            ) : null}

            {fechaAtencionHuman ? (
              <View style={[styles.detalleSection, { marginTop: 18, padding: COMPACT_LOCAL ? 12 : 16, borderRadius: 12, backgroundColor: colores.superficie }]}>
                <Text style={{ fontSize: COMPACT_LOCAL ? 13 : 14, color: colores.textoSecundario }}>Fecha de Acción / Atención</Text>
                <Text style={{ fontWeight: '700', color: colores.textoPrincipal, fontSize: 16 }}>{fechaAtencionHuman}</Text>
              </View>
            ) : null}

            <View style={{ marginBottom: 30 }} />
          </View>
        ) : (
          <Text style={{ padding: 20, color: colores.textoSecundario }}>Selecciona una cita para ver detalles.</Text>
        )}
      </ScrollView>
    </Modal>
  );
}

export function ModalFiltroEstatus({ visible, onClose, filtroActual, onSeleccionar }) {
  const { colores, esOscuro } = useTemasPersonalizado();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.actionModalContainer, { backgroundColor: colores.superficie }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <FontAwesome name="close" size={24} color={colores.textoSecundario} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colores.textoPrincipal }]}>Filtrar por Estado</Text>
          <View style={{ width: '100%' }}>
            {['Todos', 'Pendiente', 'Reprogramada', 'Aprobada', 'Cancelada', 'Atendida'].map((estado) => (
              <TouchableOpacity
                key={estado}
                style={[styles.actionCard, { borderColor: filtroActual === estado ? colores.principal : colores.borde, backgroundColor: esOscuro ? colores.superficieFuerte : colores.superficieClara }]}
                onPress={() => onSeleccionar(estado)}
                accessibilityLabel={`Filtrar por ${estado}`}
              >
                <FontAwesome name={ESTATUS_INFO[estado]?.icon || 'list'} size={18} color={filtroActual === estado ? colores.principal : colores.textoSecundario} />
                <Text style={[styles.actionCardTitle, { color: colores.textoPrincipal, marginLeft: 12 }]}>{estado}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}