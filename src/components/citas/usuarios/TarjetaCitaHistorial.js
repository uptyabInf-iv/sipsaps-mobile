import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTemasPersonalizado } from '../../../hooks/useTemasPersonalizado';
import EstadoEtiqueta, { ESTATUS_INFO } from './EstadoEtiqueta';
import { styles } from './estilosCitas';
import { formatISOCaracas, formatDateFromYYYYMMDDCaracas } from '../../../utils/fechas';

/**
 * TarjetaCitaHistorial.js
 *
 * - Ajustes para evitar que texto y fecha se salgan del contenedor en pantallas pequeñas.
 * - Mejor manejo de flex/shrink y límites para la columna derecha (estado/fecha).
 * - Uso centralizado de util fechas para presentar consistentemente en America/Caracas.
 */

/* Prefijo del doctor/a */
function doctorPrefix(sexo) {
  if (sexo === 'M') return 'Dr.';
  if (sexo === 'F') return 'Dra.';
  return 'Dr(a).';
}

/* Formatea HH:mm a 12h con AM/PM */
function fmt12h(hhmm) {
  if (!hhmm) return '—';
  const [H, M] = hhmm.split(':').map((n) => parseInt(n, 10));
  if (Number.isNaN(H) || Number.isNaN(M)) return '—';
  let h = H % 12;
  if (h === 0) h = 12;
  const ampm = H >= 12 ? 'PM' : 'AM';
  return `${h}:${String(M).padStart(2, '0')} ${ampm}`;
}

/* Sanea texto removiendo tags entre [] o {} y limpiando espacios */
const stripBracketsAndCurly = (s = '') => {
  if (!s) return '';
  return String(s).replace(/\[[^\]]*\]|\{[^}]*\}/g, '').replace(/\s{2,}/g, ' ').trim();
};

/* Corta texto pero intenta no romper palabras */
const snippet = (text = '', max = 120) => {
  if (!text) return '';
  const t = String(text).trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > Math.floor(max * 0.5)) return cut.slice(0, lastSpace).trim() + '…';
  return cut.trim() + '…';
};

const TarjetaCitaHistorial = React.memo(({ item, onPress, compact }) => {
  const { colores, esOscuro } = useTemasPersonalizado();
  const infoEstatus = ESTATUS_INFO[item?.estatus] || ESTATUS_INFO.Pendiente;

  // Preferir campos humanizados que el backend produce
  const justHuman = item?.justificacion_human || item?.justificacion || '';
  const comentarioHuman = item?.comentario_medico_human || item?.comentario_medico || '';
  const motivoCancelHuman = item?.motivo_cancelacion_human || item?.motivo_cancelacion || '';
  const diagnosticoHuman = item?.diagnostico_clean || item?.diagnostico || '';

  // Sanitizar para evitar mostrar corchetes/JSON
  const justificacionClean = stripBracketsAndCurly(justHuman);
  const comentarioClean = stripBracketsAndCurly(comentarioHuman);
  const motivoCancelClean = stripBracketsAndCurly(motivoCancelHuman);
  const diagnosticoClean = stripBracketsAndCurly(diagnosticoHuman);

  // Preview prioriza justificacion humanizada, luego motivo y luego nota corta
  const previewSource = justificacionClean || item?.motivo || '';
  const preview = previewSource ? snippet(previewSource, compact ? 100 : 140) : '';

  const fueraHorario = !!item?.fueraHorario;
  const horaChip = item?.horaStr ? fmt12h(item.horaStr) : '—';
  const medDisplay = item?.medico ? `${doctorPrefix(item.med_sexo)} ${item.medico}` : '—';

  // Sizes tuned for compact screens
  const titleSize = compact ? 14 : 16;
  const subSize = compact ? 11 : 13;
  const bodySize = compact ? 12 : 14;
  const paddingBase = compact ? 10 : 14;

  // Width constraint for right column to avoid overflow (helps on very narrow devices)
  const rightColWidth = compact ? 110 : 150;

  // Fecha presentada en America/Caracas (si existe fechaStr)
  const fechaHeaderShort = item?.fechaStr ? formatDateFromYYYYMMDDCaracas(item.fechaStr, { weekday: compact ? undefined : 'short', day: '2-digit', month: compact ? 'short' : 'short' }) : '—';
  const fechaProgramadaFull = item?.fechaStr ? formatDateFromYYYYMMDDCaracas(item.fechaStr, { weekday: compact ? undefined : 'long', day: '2-digit', month: compact ? 'short' : 'long', year: compact ? undefined : 'numeric' }) : '—';

  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Abrir detalles de la cita con ${medDisplay}`}
      activeOpacity={0.92}
      style={[
        styles.card,
        compact ? styles.cardCompact : null,
        {
          backgroundColor: colores.superficie,
          shadowColor: esOscuro ? '#000' : '#555',
          padding: paddingBase,
          overflow: 'hidden', // asegura que nada se salga visualmente
        },
      ]}
    >
      {/* Línea de estado a la izquierda */}
      <View style={[styles.cardStateBorder, { backgroundColor: infoEstatus.color }]} />

      <View style={[styles.cardBody, compact ? styles.cardBodyCompact : null]}>
        {/* Header: título + status */}
        <View style={[styles.cardHeaderRow, { alignItems: 'flex-start' }]}>
          <View style={[styles.cardHeaderLeft, { marginRight: 8, flexShrink: 1 }]}>
            <Text
              style={{ fontSize: titleSize, fontWeight: '700', color: colores.textoPrincipal, marginBottom: 4 }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item?.especialidad ?? '—'}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <FontAwesome name="user-md" size={compact ? 12 : 14} color={colores.textoSecundario} />
              <Text
                style={{
                  color: colores.textoSecundario,
                  fontSize: subSize,
                  flexShrink: 1,
                  marginLeft: 8,
                }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {medDisplay}
              </Text>
            </View>
          </View>

          {/* Right column: constrained width to avoid pushing out of card */}
          <View style={{ width: rightColWidth, minWidth: 90, alignItems: 'flex-end' }}>
            <View
              style={[
                styles.statusPill,
                {
                  borderColor: infoEstatus.color,
                  backgroundColor: infoEstatus.color + '20',
                  paddingHorizontal: compact ? 8 : 10,
                  paddingVertical: compact ? 6 : 8,
                  alignSelf: 'flex-end',
                },
              ]}
            >
              <FontAwesome name={infoEstatus.icon} size={12} color={infoEstatus.color} />
              <Text
                style={[
                  styles.statusPillText,
                  { color: colores.textoPrincipal, fontSize: subSize, marginLeft: 6, maxWidth: rightColWidth - 36, flexShrink: 1 },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item?.estatus ?? 'Pendiente'}
              </Text>
            </View>

            {/* Small helper: scheduled datetime compact; allow wrap to two lines instead of overflowing */}
            <Text
              style={{
                marginTop: 8,
                color: colores.textoSecundario,
                fontSize: compact ? 11 : 12,
                textAlign: 'right',
                maxWidth: rightColWidth,
                flexWrap: 'wrap',
              }}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {fechaHeaderShort} • {horaChip}
            </Text>
          </View>
        </View>

        {/* Programada (row) - hide on very small as header shows brief date; otherwise show full */}
        {!Platform.isPad && compact ? null : (
          <View style={[styles.dateRow, { marginTop: 12 }]}>
            <View style={styles.dateIconWrap}>
              <FontAwesome name="calendar-o" size={12} color="#17a2b8" />
            </View>
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={[styles.metaLabel, { color: colores.textoSecundario, fontSize: subSize }]}>Programada</Text>
              <Text
                style={[styles.metaValue, { color: colores.textoPrincipal, fontSize: bodySize }]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {fechaProgramadaFull} • {horaChip}
              </Text>
            </View>
          </View>
        )}

        {/* Fuera de horario badge */}
        {fueraHorario ? (
          <View style={[styles.outOfSchedule, { marginTop: 10, alignSelf: 'flex-start' }]}>
            <FontAwesome name="exclamation-triangle" size={12} color="#F59E0B" />
            <Text style={[styles.outOfScheduleText, { fontSize: subSize, marginLeft: 6 }]}>
              Fuera de horario • {horaChip}
            </Text>
          </View>
        ) : null}

        {/* Motivo / Nota / Justificación (normalizada) */}
        {item?.motivo ? (
          <View style={{ marginTop: 12 }}>
            <Text style={[styles.sectionLabel, { color: colores.textoSecundario, fontSize: subSize }]}>Motivo</Text>
            <Text
              style={[styles.sectionText, { color: colores.textoPrincipal, fontSize: bodySize, marginTop: 6 }]}
              numberOfLines={compact ? 2 : 3}
            >
              {item.motivo}
            </Text>
          </View>
        ) : preview ? (
          <View style={{ marginTop: 12 }}>
            <Text style={[styles.sectionLabel, { color: colores.textoSecundario, fontSize: subSize }]}>
              {item.justificacion_human ? 'Motivo modificación' : 'Nota'}
            </Text>
            <Text
              style={[styles.sectionText, { color: colores.textoPrincipal, fontSize: bodySize, marginTop: 6 }]}
              numberOfLines={compact ? 2 : 3}
            >
              {preview}
            </Text>
          </View>
        ) : null}

        {/* Small area for cancellation / comment preview (if present) */}
        {motivoCancelClean ? (
          <View style={{ marginTop: 10 }}>
            <Text style={{ color: '#6c2a2a', fontSize: subSize, fontWeight: '700', marginBottom: 4 }}>Cancelación</Text>
            <Text style={{ color: '#6c2a2a', fontSize: bodySize }}>{snippet(motivoCancelClean, compact ? 80 : 120)}</Text>
          </View>
        ) : comentarioClean ? (
          <View style={{ marginTop: 10 }}>
            <Text style={{ color: colores.textoSecundario, fontSize: subSize, fontWeight: '700', marginBottom: 4 }}>Comentario</Text>
            <Text style={{ color: colores.textoPrincipal, fontSize: bodySize }}>{snippet(comentarioClean, compact ? 80 : 120)}</Text>
          </View>
        ) : null}

        {/* Diagnóstico - only if attended and available */}
        {item?.estatus === 'Atendida' && diagnosticoClean ? (
          <View style={{ marginTop: 10 }}>
            <Text style={{ color: colores.textoSecundario, fontSize: subSize, fontWeight: '700', marginBottom: 4 }}>Diagnóstico</Text>
            <Text style={{ color: colores.textoPrincipal, fontSize: bodySize }}>{snippet(diagnosticoClean, compact ? 80 : 120)}</Text>
          </View>
        ) : null}

        {/* Footer - actions */}
        <View style={[styles.cardFooter, { marginTop: 12 }]}>
          <TouchableOpacity
            onPress={onPress}
            style={[
              styles.detailButton,
              compact ? styles.detailButtonCompact : null,
              {
                backgroundColor: colores.principal,
                paddingVertical: compact ? 8 : 10,
                paddingHorizontal: compact ? 10 : 14,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Ver detalle de la cita"
          >
            <FontAwesome name="eye" size={12} color="#fff" />
            <Text style={[styles.detailButtonText, { marginLeft: 8, fontSize: compact ? 12 : 13 }]}>Ver detalle</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default TarjetaCitaHistorial;