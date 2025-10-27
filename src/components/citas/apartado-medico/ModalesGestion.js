import React from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTemasPersonalizado } from '../../../hooks/useTemasPersonalizado';
import { ESTATUS_INFO } from './constantesEstatus';

const ModalOverlay = ({ children, onClose }) => (
  <View style={styles.modalContainer}>
    <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
    {children}
  </View>
);

export function ModalAcciones({ visible, cita, onClose, onAprobar, onReprogramar, onCancelar, onMarcarAtendida, isSubmitting = false }) {
  const { colores } = useTemasPersonalizado();
  const disabledStyle = { opacity: isSubmitting ? 0.6 : 1 };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <ModalOverlay onClose={onClose}>
        <View style={{ width: '100%', maxWidth: 420, borderRadius: 16, padding: 20, backgroundColor: colores.superficie }}>
          <TouchableOpacity onPress={onClose} style={{ position: 'absolute', right: 12, top: 12, padding: 8, zIndex: 1 }}>
            <FontAwesome name="close" size={22} color={colores.textoSecundario} />
          </TouchableOpacity>

          <Text style={{ fontSize: 20, fontWeight: '700', color: colores.textoPrincipal, textAlign: 'center', marginBottom: 8 }}>Gestionar Cita</Text>
          <Text style={{ color: colores.textoSecundario, textAlign: 'center', marginBottom: 16 }}>Paciente: {cita?.paciente?.nombre ?? '—'}</Text>

          {cita?.estatus === 'Pendiente' && (
            <TouchableOpacity disabled={isSubmitting} onPress={onAprobar} style={[{ flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1, borderColor: '#D5ECD8', borderRadius: 10, marginBottom: 10 }, disabledStyle]}>
              <FontAwesome name="check-circle" size={20} color="#28a745" />
              <Text style={{ marginLeft: 12, fontWeight: '700', color: colores.textoPrincipal }}>Aprobar Cita</Text>
            </TouchableOpacity>
          )}

          {cita?.estatus === 'Reprogramada' && (
            <TouchableOpacity disabled={isSubmitting} onPress={onAprobar} style={[{ flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1, borderColor: '#D5ECD8', borderRadius: 10, marginBottom: 10 }, disabledStyle]}>
              <FontAwesome name="check-circle" size={20} color="#28a745" />
              <Text style={{ marginLeft: 12, fontWeight: '700', color: colores.textoPrincipal }}>Aprobar Reprogramación</Text>
            </TouchableOpacity>
          )}

          {(cita?.estatus === 'Aprobada' || cita?.estatus === 'Reprogramada') && (
            <TouchableOpacity disabled={isSubmitting} onPress={onMarcarAtendida} style={[{ flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1, borderColor: '#E8E8E8', borderRadius: 10, marginBottom: 10 }, disabledStyle]}>
              <FontAwesome name="history" size={20} color="#6c757d" />
              <Text style={{ marginLeft: 12, fontWeight: '700', color: colores.textoPrincipal }}>Marcar como Atendida</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity disabled={isSubmitting} onPress={onReprogramar} style={[{ flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1, borderColor: '#D9F0FF', borderRadius: 10, marginBottom: 10 }, disabledStyle]}>
            <FontAwesome name="calendar" size={20} color="#17a2b8" />
            <Text style={{ marginLeft: 12, fontWeight: '700', color: colores.textoPrincipal }}>Reprogramar Cita</Text>
          </TouchableOpacity>

          <TouchableOpacity disabled={isSubmitting} onPress={onCancelar} style={[{ flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1, borderColor: '#F8E6E6', borderRadius: 10 }, disabledStyle]}>
            <FontAwesome name="times-circle" size={20} color="#dc3545" />
            <Text style={{ marginLeft: 12, fontWeight: '700', color: colores.textoPrincipal }}>Cancelar Cita</Text>
          </TouchableOpacity>

          {isSubmitting ? (
            <View style={{ marginTop: 14, alignItems: 'center' }}>
              <ActivityIndicator color={colores.principal} />
              <Text style={{ marginTop: 6, color: colores.textoSecundario }}>Procesando...</Text>
            </View>
          ) : null}
        </View>
      </ModalOverlay>
    </Modal>
  );
}

export function ModalGestion({
  visible,
  tipoAccion,
  cita,
  fechaCita,
  setFechaCita,
  horaInicio,
  setHoraInicio,
  horaFin,
  setHoraFin,
  showDatePicker,
  setShowDatePicker,
  justificacion,
  setJustificacion,
  onConfirm,
  onClose,
  onOpenHorarioInicio,
  onOpenHorarioFin,
  isSubmitting = false,
}) {
  const { colores } = useTemasPersonalizado();
  const formatFecha = (d) => (d && !isNaN(d) ? d.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long' }) : '');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <ModalOverlay onClose={onClose}>
        <View style={{ width: '100%', maxWidth: 420, borderRadius: 16, padding: 20, backgroundColor: colores.superficie }}>
          <TouchableOpacity onPress={onClose} style={{ position: 'absolute', right: 12, top: 12, padding: 8, zIndex: 1 }}>
            <FontAwesome name="close" size={22} color={colores.textoSecundario} />
          </TouchableOpacity>

          <Text style={{ fontSize: 20, fontWeight: '700', color: colores.textoPrincipal, textAlign: 'center', marginBottom: 8 }}>
            {(tipoAccion || '').charAt(0).toUpperCase() + (tipoAccion || '').slice(1)} cita
          </Text>
          <Text style={{ color: colores.textoSecundario, marginBottom: 12 }}>Paciente: {cita?.paciente?.nombre ?? '—'}</Text>

          {tipoAccion === 'reprogramar' && (
            <>
              <Text style={{ color: colores.textoSecundario, marginBottom: 8 }}>Nueva Fecha</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{ borderWidth: 1, borderRadius: 10, borderColor: colores.principal, padding: 12, alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ color: colores.principal }}>{formatFecha(fechaCita)}</Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <TouchableOpacity onPress={onOpenHorarioInicio} style={{ flex: 1, borderWidth: 1, borderRadius: 10, borderColor: '#DDD', padding: 12, marginRight: 6, alignItems: 'center' }}>
                  <Text>Desde: {horaInicio}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onOpenHorarioFin} style={{ flex: 1, borderWidth: 1, borderRadius: 10, borderColor: '#DDD', padding: 12, marginLeft: 6, alignItems: 'center' }}>
                  <Text>Hasta: {horaFin}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <Text style={{ color: colores.textoSecundario, marginBottom: 8 }}>
            Justificación {tipoAccion === 'cancelar' ? '(obligatoria)' : '(opcional)'}
          </Text>
          <View style={{ borderWidth: 1, borderColor: '#CCC', borderRadius: 10, padding: 12, minHeight: 80, backgroundColor: colores.superficie }}>
            <TextInput
              value={justificacion}
              onChangeText={setJustificacion}
              multiline
              placeholder="Escribe la justificación..."
              placeholderTextColor={colores.textoSecundario}
              style={{ color: colores.textoPrincipal, minHeight: 40 }}
            />
          </View>

          <TouchableOpacity
            disabled={isSubmitting}
            onPress={onConfirm}
            style={{ marginTop: 12, padding: 14, borderRadius: 10, backgroundColor: colores.principal, alignItems: 'center', opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Confirmar</Text>}
          </TouchableOpacity>
        </View>
      </ModalOverlay>
    </Modal>
  );
}

export function ModalPacientes({ visible, pacientes, onSelect, onClose, busqueda, setBusqueda }) {
  const { colores } = useTemasPersonalizado();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <ModalOverlay onClose={onClose}>
        <View style={{ width: '100%', maxWidth: 420, borderRadius: 16, padding: 20, backgroundColor: colores.superficie }}>
          <TouchableOpacity onPress={onClose} style={{ position: 'absolute', right: 12, top: 12, padding: 8, zIndex: 1 }}>
            <FontAwesome name="close" size={22} color={colores.textoSecundario} />
          </TouchableOpacity>

          <Text style={{ fontSize: 20, fontWeight: '700', color: colores.textoPrincipal, marginBottom: 12 }}>Seleccionar Paciente</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <FontAwesome name="search" size={16} color={colores.textoSecundario} />
            <TextInput placeholder="Buscar..." placeholderTextColor={colores.textoSecundario} value={busqueda} onChangeText={setBusqueda} style={{ flex: 1, marginLeft: 8, paddingVertical: 6, color: colores.textoPrincipal }} />
          </View>

          <FlatList
            data={pacientes}
            keyExtractor={(i) => i.cedula}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => onSelect(item)} style={{ padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#EEE', marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ fontWeight: '700', color: colores.textoPrincipal }}>{item.nombre}</Text>
                  <Text style={{ color: colores.textoSecundario }}>{item.cedula}</Text>
                </View>
                <View style={{ backgroundColor: colores.principal + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                  <Text style={{ color: colores.principal, fontWeight: '700' }}>{item.tipoUsuario}</Text>
                </View>
              </TouchableOpacity>
            )}
          />

          <View style={{ marginTop: 8 }}>
            <TouchableOpacity onPress={() => onSelect(null)} style={{ padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: colores.principal, alignItems: 'center' }}>
              <Text style={{ color: colores.principal, fontWeight: '700' }}>Mostrar todos</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ModalOverlay>
    </Modal>
  );
}

export function ModalEstatus({ visible, current, onSelect, onClose }) {
  const { colores } = useTemasPersonalizado();
  const ESTADOS = ['Pendiente', 'Aprobada', 'Reprogramada', 'Cancelada'];

  const getVisual = (estado) => {
    const info = ESTATUS_INFO[estado] || { color: '#999', icon: 'circle' };
    return {
      icon: info.icon,
      color: info.color,
      borderColor: info.color,
      backgroundColor: info.color + '15',
    };
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <ModalOverlay onClose={onClose}>
        <View style={{ width: '100%', maxWidth: 420, borderRadius: 16, padding: 20, backgroundColor: colores.superficie }}>
          <TouchableOpacity onPress={onClose} style={{ position: 'absolute', right: 12, top: 12, padding: 8, zIndex: 1 }}>
            <FontAwesome name="close" size={22} color={colores.textoSecundario} />
          </TouchableOpacity>

          <Text style={{ fontSize: 20, fontWeight: '700', color: colores.textoPrincipal, marginBottom: 12 }}>Filtrar por Estado</Text>
          {ESTADOS.map((e) => {
            const visual = getVisual(e);
            const isActive = current === e;
            return (
              <TouchableOpacity
                key={e}
                onPress={() => onSelect(e)}
                style={{
                  padding: 12,
                  borderRadius: 10,
                  borderWidth: 1.5,
                  borderColor: visual.borderColor,
                  backgroundColor: visual.backgroundColor,
                  marginBottom: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <FontAwesome name={visual.icon} size={16} color={visual.color} />
                  <Text style={{ marginLeft: 12, color: colores.textoPrincipal, fontWeight: '700' }}>{e}</Text>
                </View>
                {isActive ? <FontAwesome name="check" size={16} color={visual.color} /> : null}
              </TouchableOpacity>
            );
          })}
          {current !== 'Todos' && (
            <TouchableOpacity
              onPress={() => onSelect('Todos')}
              style={{ padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#EEE', marginTop: 8, alignItems: 'center' }}
            >
              <Text style={{ color: colores.textoSecundario, fontWeight: '700' }}>Mostrar todos</Text>
            </TouchableOpacity>
          )}
        </View>
      </ModalOverlay>
    </Modal>
  );
}

export function ModalDetalle({ visible, cita, onClose }) {
  const { colores } = useTemasPersonalizado();

  const toDate = (val) => {
    if (!val) return null;
    const d = val instanceof Date ? val : new Date(val);
    return isNaN(d) ? null : d;
  };

  const formatDateTimeAMPM = (val, fallbackFecha, fallbackHora) => {
    let d = toDate(val);
    if (!d && fallbackFecha && fallbackHora) {
      // fallback extra si el item traía crudos (por redundancia)
      const fm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(fallbackFecha));
      const hm = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(String(fallbackHora));
      if (fm && hm) {
        d = new Date(parseInt(fm[1], 10), parseInt(fm[2], 10) - 1, parseInt(fm[3], 10), parseInt(hm[1], 10), parseInt(hm[2], 10), hm[3] ? parseInt(hm[3], 10) : 0);
      }
    }
    return d
      ? d.toLocaleString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
      : 'N/A';
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colores.superficie }}>
        <View style={{ paddingTop: 20, paddingHorizontal: 20, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
          <TouchableOpacity onPress={onClose} style={{ position: 'absolute', right: 16, top: 28, padding: 8, zIndex: 1 }}>
            <FontAwesome name="close" size={24} color={colores.textoPrincipal} />
          </TouchableOpacity>
          <Text style={{ fontSize: 28, fontWeight: '700', color: colores.textoPrincipal, marginBottom: 8 }}>Detalle de Consulta</Text>
          <Text style={{ color: colores.textoSecundario, marginBottom: 8 }}>{cita?.paciente?.nombre ?? ''} • {cita?.paciente?.cedula ?? ''}</Text>
        </View>

        {cita && (
          <ScrollView style={{ padding: 20 }}>
            <View style={{ marginBottom: 18 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colores.principal, marginBottom: 8 }}>Información del paciente</Text>
              <Text style={{ color: colores.textoSecundario }}>Nombre y Apellido</Text>
              <Text style={{ fontWeight: '700', color: colores.textoPrincipal }}>{cita.paciente.nombre}</Text>
              <Text style={{ color: colores.textoSecundario, marginTop: 8 }}>Cédula</Text>
              <Text style={{ fontWeight: '700', color: colores.textoPrincipal }}>{cita.paciente.cedula}</Text>
              <Text style={{ color: colores.textoSecundario, marginTop: 8 }}>Teléfono</Text>
              <Text style={{ fontWeight: '700', color: colores.textoPrincipal }}>{cita.paciente.telefono ?? 'N/A'}</Text>
              <Text style={{ color: colores.textoSecundario, marginTop: 8 }}>Correo</Text>
              <Text style={{ fontWeight: '700', color: colores.textoPrincipal }}>{cita.paciente.correo ?? 'N/A'}</Text>
            </View>

            <View style={{ marginBottom: 18 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colores.principal, marginBottom: 8 }}>Cita</Text>
              <Text style={{ color: colores.textoSecundario }}>Motivo</Text>
              <Text style={{ fontWeight: '700', color: colores.textoPrincipal }}>{cita.motivo || '—'}</Text>
              <Text style={{ color: colores.textoSecundario, marginTop: 8 }}>Programada el</Text>
              <Text style={{ fontWeight: '700', color: colores.textoPrincipal }}>
                {formatDateTimeAMPM(cita.fechaSolicitud, cita.fecha, cita.hora)}
              </Text>
              {/* <Text style={{ color: colores.textoSecundario, marginTop: 8 }}>Fecha de Atención</Text>
              <Text style={{ fontWeight: '700', color: colores.textoPrincipal }}>
                {formatDateTimeAMPM(cita.fechaAtencion)}
              </Text> */}
            </View>

            <View style={{ marginBottom: 18 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colores.principal, marginBottom: 8 }}>Justificación</Text>
              <View style={{ borderWidth: 1, borderColor: '#EEE', borderRadius: 10, padding: 12, backgroundColor: colores.superficie }}>
                <Text style={{ color: colores.textoSecundario }}>{cita.justificacion || 'Sin justificación'}</Text>
              </View>
            </View>

            <View style={{ marginBottom: 30 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colores.principal, marginBottom: 8 }}>Estado</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <FontAwesome name={ESTATUS_INFO[cita.estatus]?.icon ?? 'question'} size={14} color={ESTATUS_INFO[cita.estatus]?.color ?? '#999'} />
                <Text style={{ marginLeft: 8, fontWeight: '700', color: colores.textoPrincipal }}>{cita.estatus}</Text>
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

export function ModalHorario({ visible, tipo, horarios, onSelect, onClose }) {
  const { colores } = useTemasPersonalizado();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <ModalOverlay onClose={onClose}>
        <View style={{ width: '100%', maxWidth: 420, borderRadius: 16, padding: 20, backgroundColor: colores.superficie }}>
          <TouchableOpacity onPress={onClose} style={{ position: 'absolute', right: 12, top: 12, padding: 8, zIndex: 1 }}>
            <FontAwesome name="close" size={22} color={colores.textoSecundario} />
          </TouchableOpacity>

          <Text style={{ fontSize: 18, fontWeight: '700', color: colores.textoPrincipal, marginBottom: 12 }}>Seleccionar Hora</Text>
          <FlatList
            data={horarios}
            keyExtractor={(i) => i}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => onSelect(item)} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' }}>
                <Text style={{ color: colores.textoPrincipal }}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </ModalOverlay>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});