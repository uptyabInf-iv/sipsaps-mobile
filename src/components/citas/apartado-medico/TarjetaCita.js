import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTemasPersonalizado } from '../../../hooks/useTemasPersonalizado';
import { ESTATUS_INFO } from './constantesEstatus';

/**
 * TarjetaCita.js
 *
 * - Muestra preferentemente los campos *_human que ahora entrega el backend.
 * - Si backend no los envía, hace un fallback local y sanitiza cadenas para evitar corchetes/llaves.
 * - Mejora la responsividad para dispositivos muy pequeños (COMPACT).
 */

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COMPACT = SCREEN_WIDTH <= 360;

const stripBracketsAndCurly = (s = "") => {
  if (!s) return "";
  return String(s).replace(/\[[^\]]*\]|\{[^}]*\}/g, "").replace(/\s{2,}/g, " ").trim();
};

const snippet = (text = '', max = 160) => {
  if (!text) return '';
  const t = String(text).trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > Math.floor(max * 0.6)) return cut.slice(0, lastSpace).trim() + '…';
  return cut.trim() + '…';
};

export default memo(function TarjetaCita({ item, onPress, onViewDetails }) {
  const { colores, esOscuro } = useTemasPersonalizado();
  const status = item?.estatus ?? 'Pendiente';
  const infoEstatus = ESTATUS_INFO[status] || ESTATUS_INFO.Pendiente;

  const fechaProgramada =
    item?.fechaSolicitud
      ? (item.fechaSolicitud instanceof Date ? item.fechaSolicitud : new Date(item.fechaSolicitud))
      : null;

  const fechaAtendida =
    item?.fechaAtencion
      ? (item.fechaAtencion instanceof Date ? item.fechaAtencion : new Date(item.fechaAtencion))
      : null;

  const fueReprogramada = !!item?.fueReprogramada || item?.estatus === 'Reprogramada';
  const reprogramadaPor = item?.modificadoPor || item?.ultimaModificacion || '';

  const titleSize = COMPACT ? 15 : 16;
  const smallSize = COMPACT ? 11 : 12;
  const bodySize = COMPACT ? 13 : 14;
  const paddingBase = COMPACT ? 10 : 12;

  // Preferir campos humanizados del backend
  const comentarioMedicoPresentable = item?.comentario_medico_human
    ? String(item.comentario_medico_human).trim()
    : (item?.comentario_medico ? stripBracketsAndCurly(item.comentario_medico) : '');

  const motivoCancelPresentable = item?.motivo_cancelacion_human
    ? String(item.motivo_cancelacion_human).trim()
    : (item?.motivo_cancelacion ? stripBracketsAndCurly(item.motivo_cancelacion) : '');

  const motivoModPresentable = item?.justificacion_human
    ? String(item.justificacion_human).trim()
    : (item?.justificacion ? stripBracketsAndCurly(item.justificacion) : '');

  const diagnosticoPresentable = item?.diagnostico_clean
    ? String(item.diagnostico_clean).trim()
    : (item?.diagnostico ? stripBracketsAndCurly(item.diagnostico) : '');

  const fechaAtencionHuman = item?.fechaAtencion_human || '';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[
        styles.card,
        {
          backgroundColor: colores.superficie,
          padding: paddingBase,
          marginHorizontal: COMPACT ? 12 : 20,
          borderRadius: 12,
          shadowColor: esOscuro ? '#000' : '#555',
        },
      ]}
    >
      <View style={[styles.indicator, { backgroundColor: infoEstatus.color }]} />

      <View style={{ flex: 1, paddingLeft: 12 }}>
        <View style={styles.rowSpace}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={{ fontSize: titleSize, fontWeight: '700', color: colores.textoPrincipal }} numberOfLines={1}>
              {item?.paciente?.nombre ?? '—'}
            </Text>
            {item?.paciente?.cedula ? (
              <Text style={{ marginTop: 2, color: colores.textoSecundario, fontSize: smallSize }} numberOfLines={1}>
                {item.paciente.cedula}
              </Text>
            ) : null}
          </View>

          <View style={[styles.statusBadge, { borderColor: infoEstatus.color, backgroundColor: infoEstatus.color + '20' }]}>
            <FontAwesome name={infoEstatus.icon} size={COMPACT ? 12 : 14} color={infoEstatus.color} />
            <Text style={{ marginLeft: 6, fontWeight: '700', color: colores.textoPrincipal, fontSize: smallSize }}>{status}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', marginTop: 8 }}>
          <View style={[styles.chip, { backgroundColor: colores.principal + '10', borderColor: colores.principal }]}>
            <Text style={{ color: colores.principal, fontWeight: '700', fontSize: smallSize }} numberOfLines={1}>
              {item?.paciente?.tipousuario ?? item?.paciente?.tipoUsuario ?? '—'}
            </Text>
          </View>
        </View>

        {item?.motivo ? (
          <View style={{ marginTop: 8 }}>
            <Text style={{ color: colores.textoSecundario, fontSize: smallSize, marginBottom: 4 }}>Motivo</Text>
            <Text style={{ color: colores.textoPrincipal, fontSize: bodySize, lineHeight: bodySize + 6 }} numberOfLines={3}>
              {item.motivo}
            </Text>
          </View>
        ) : null}

        {comentarioMedicoPresentable ? (
          <View style={[styles.boxLight, { marginTop: 10, backgroundColor: esOscuro ? '#111' : '#FAFAFA' }]}>
            <Text style={{ color: colores.textoSecundario, fontSize: smallSize, marginBottom: 4 }}>Comentario médico</Text>
            <Text style={{ color: colores.textoPrincipal, fontSize: COMPACT ? 12 : 13 }}>{snippet(comentarioMedicoPresentable, COMPACT ? 140 : 220)}</Text>
            {fechaAtencionHuman ? (
              <Text style={{ color: colores.textoSecundario, fontSize: 11, marginTop: 6 }}>{fechaAtencionHuman}</Text>
            ) : null}
          </View>
        ) : null}

        {motivoCancelPresentable ? (
          <View style={[styles.boxWarning, { marginTop: 10 }]}>
            <Text style={{ color: '#6c2a2a', fontSize: smallSize, marginBottom: 4 }}>Motivo de cancelación</Text>
            <Text style={{ color: '#6c2a2a', fontSize: COMPACT ? 12 : 13 }}>{snippet(motivoCancelPresentable, COMPACT ? 140 : 220)}</Text>
          </View>
        ) : null}

        {motivoModPresentable ? (
          <View style={[styles.boxAlt, { marginTop: 10 }]}>
            <Text style={{ color: '#8a6d00', fontSize: smallSize, marginBottom: 4 }}>Justificación / Reprogramación</Text>
            <Text style={{ color: '#5c4a00', fontSize: COMPACT ? 12 : 13 }}>{snippet(motivoModPresentable, COMPACT ? 140 : 220)}</Text>
          </View>
        ) : null}

        <View style={{ height: 1, backgroundColor: '#F0F0F0', marginTop: 12, marginBottom: 8 }} />

        <View style={{ gap: 8 }}>
          {fechaProgramada ? (
            <View style={styles.rowItem}>
              <View style={styles.iconCircle('#17a2b8')}>
                <FontAwesome name="calendar-o" size={14} color="#17a2b8" />
              </View>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={{ color: colores.textoSecundario, fontSize: smallSize }}>Programada</Text>
                <Text style={{ color: colores.textoPrincipal, fontWeight: '700', fontSize: bodySize }}>
                  {fechaProgramada.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })} • {fechaProgramada.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </Text>
              </View>
            </View>
          ) : null}

          {fueReprogramada && fechaProgramada ? (
            <View style={styles.rowItem}>
              <View style={styles.iconCircle('#ff9800')}>
                <FontAwesome name="exchange" size={14} color="#ff9800" />
              </View>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={{ color: colores.textoSecundario, fontSize: smallSize }}>
                  Reprogramada {reprogramadaPor ? `• por ${reprogramadaPor}` : ''}
                </Text>
                <Text style={{ color: colores.textoPrincipal, fontWeight: '700', fontSize: bodySize }}>
                  {fechaProgramada.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })} • {fechaProgramada.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </Text>
              </View>
            </View>
          ) : null}

          {fechaAtendida ? (
            <View style={styles.rowItem}>
              <View style={styles.iconCircle('#28a745')}>
                <FontAwesome name="stethoscope" size={14} color="#28a745" />
              </View>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={{ color: colores.textoSecundario, fontSize: smallSize }}>Atendida</Text>
                <Text style={{ color: colores.textoPrincipal, fontWeight: '700', fontSize: bodySize }}>
                  {fechaAtendida.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })} • {fechaAtendida.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </Text>
                {diagnosticoPresentable ? (
                  <Text style={{ color: colores.textoSecundario, fontSize: smallSize, marginTop: 4 }}>Diagnóstico: {diagnosticoPresentable.length > 60 ? diagnosticoPresentable.slice(0, 57) + '…' : diagnosticoPresentable}</Text>
                ) : null}
              </View>
            </View>
          ) : null}
        </View>

        <View style={[styles.rowSpace, { marginTop: 12 }]}>
          {item?.modificadoPor ? (
            <Text style={{ color: '#888', fontSize: COMPACT ? 10 : 11 }}>
              Modificado por: {item.modificadoPor}
            </Text>
          ) : <View />}

          <TouchableOpacity
            onPress={() => onViewDetails && onViewDetails(item)}
            style={{ backgroundColor: colores.principal, paddingVertical: COMPACT ? 6 : 8, paddingHorizontal: COMPACT ? 10 : 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}
          >
            <FontAwesome name="eye" size={12} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', marginLeft: 6, fontSize: COMPACT ? 12 : 13 }}>
              Ver detalle
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 16,
    elevation: 2,
  },
  indicator: {
    width: 6,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  rowSpace: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  boxLight: {
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 8,
    padding: 8,
  },
  boxWarning: {
    borderWidth: 1,
    borderColor: '#F3DAD9',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#FFF5F5',
  },
  boxAlt: {
    borderWidth: 1,
    borderColor: '#EEE8D5',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#FFFBF2',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: (color) => ({
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color + '20',
    borderWidth: 1,
    borderColor: color,
  }),
});