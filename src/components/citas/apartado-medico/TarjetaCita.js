import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTemasPersonalizado } from '../../../hooks/useTemasPersonalizado';
import { ESTATUS_INFO } from './constantesEstatus';

export default memo(function TarjetaCita({ item, onPress, onViewDetails }) {
  const { colores, esOscuro } = useTemasPersonalizado();
  const status = item?.estatus ?? 'Pendiente';
  const infoEstatus = ESTATUS_INFO[status] || ESTATUS_INFO.Pendiente;

  // Fechas disponibles
  const fechaProgramada = item?.fechaSolicitud ? new Date(item.fechaSolicitud) : null;
  const fechaAtendida = item?.fechaAtencion ? new Date(item.fechaAtencion) : null;
  const fueReprogramada = !!item?.fueReprogramada || item?.estatus === 'Reprogramada';
  const reprogramadaPor = item?.modificadoPor || item?.ultimaModificacion || ''; // preferimos "modificadoPor" si existe

  // Helpers
  const fmtFecha = (d) =>
    d ? d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  // Hora en formato accesible 12h con AM/PM (consistente en iOS/Android)
  const fmtHora12 = (d) => {
    if (!d) return '';
    let h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    const mm = String(m).padStart(2, '0');
    return `${h}:${mm} ${ampm}`;
  };

  const chipBg = (hex) => hex + '20';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={{
        flexDirection: 'row',
        borderRadius: 12,
        marginHorizontal: 20,
        marginTop: 12,
        marginBottom: 16,
        backgroundColor: colores.superficie,
        shadowColor: esOscuro ? '#000' : '#555',
        elevation: 2,
      }}
    >
      {/* Borde de estado */}
      <View
        style={{
          width: 6,
          backgroundColor: infoEstatus.color,
          borderTopLeftRadius: 12,
          borderBottomLeftRadius: 12,
        }}
      />

      <View style={{ flex: 1, padding: 16 }}>
        {/* Encabezado: Nombre + Estado */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: colores.textoPrincipal,
              }}
              numberOfLines={1}
            >
              {item?.paciente?.nombre ?? '—'}
            </Text>
            {item?.paciente?.cedula ? (
              <Text
                style={{
                  marginTop: 2,
                  color: colores.textoSecundario,
                  fontSize: 12,
                }}
                numberOfLines={1}
              >
                {item.paciente.cedula}
              </Text>
            ) : null}
          </View>

          {/* Chip de estado */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: infoEstatus.color,
              backgroundColor: chipBg(infoEstatus.color),
            }}
          >
            <FontAwesome name={infoEstatus.icon} size={14} color={infoEstatus.color} />
            <Text
              style={{
                marginLeft: 6,
                fontWeight: '700',
                color: colores.textoPrincipal,
              }}
            >
              {status}
            </Text>
          </View>
        </View>

        {/* Línea de chips: Tipo de usuario */}
        <View style={{ flexDirection: 'row', marginTop: 10 }}>
          <View
            style={{
              backgroundColor: colores.principal + '10',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colores.principal,
            }}
          >
            <Text
              style={{
                color: colores.principal,
                fontWeight: '700',
                fontSize: 12,
              }}
              numberOfLines={1}
            >
              {item?.paciente?.tipoUsuario ?? '—'}
            </Text>
          </View>
        </View>

        {/* Motivo */}
        {item?.motivo ? (
          <View style={{ marginTop: 12 }}>
            <Text
              style={{
                color: colores.textoSecundario,
                fontSize: 12,
                marginBottom: 4,
              }}
            >
              Motivo
            </Text>
            <Text
              style={{
                color: colores.textoPrincipal,
                fontSize: 15,
                lineHeight: 22,
              }}
              numberOfLines={3}
            >
              {item.motivo}
            </Text>
          </View>
        ) : null}

        {/* Justificación (si existe) */}
        {item?.justificacion ? (
          <View
            style={{
              marginTop: 12,
              borderWidth: 1,
              borderColor: '#ECECEC',
              borderRadius: 10,
              padding: 10,
              backgroundColor: esOscuro ? '#111' : '#FAFAFA',
            }}
          >
            <Text
              style={{
                color: colores.textoSecundario,
                fontSize: 12,
                marginBottom: 4,
              }}
            >
              Justificación
            </Text>
            <Text style={{ color: colores.textoPrincipal }}>{item.justificacion}</Text>
          </View>
        ) : null}

        {/* Separador */}
        <View
          style={{
            height: 1,
            backgroundColor: '#F0F0F0',
            marginTop: 14,
            marginBottom: 10,
          }}
        />

        {/* Bloque de Fechas clave orientadas a flujo clínico */}
        <View style={{ gap: 8 }}>
          {/* Programada / Próxima atención */}
          {fechaProgramada ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: chipBg('#17a2b8'),
                  borderWidth: 1,
                  borderColor: '#17a2b8',
                }}
              >
                <FontAwesome name="calendar-o" size={14} color="#17a2b8" />
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={{ color: colores.textoSecundario, fontSize: 12 }}>
                  Programada
                </Text>
                <Text style={{ color: colores.textoPrincipal, fontWeight: '700' }}>
                  {fmtFecha(fechaProgramada)} • {fmtHora12(fechaProgramada)}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Reprogramada */}
          {fueReprogramada && fechaProgramada ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: chipBg('#ff9800'),
                  borderWidth: 1,
                  borderColor: '#ff9800',
                }}
              >
                <FontAwesome name="exchange" size={14} color="#ff9800" />
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={{ color: colores.textoSecundario, fontSize: 12 }}>
                  Reprogramada {reprogramadaPor ? `• por ${reprogramadaPor}` : ''}
                </Text>
                <Text style={{ color: colores.textoPrincipal, fontWeight: '700' }}>
                  {fmtFecha(fechaProgramada)} • {fmtHora12(fechaProgramada)}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Atendida */}
          {fechaAtendida ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: chipBg('#28a745'),
                  borderWidth: 1,
                  borderColor: '#28a745',
                }}
              >
                <FontAwesome name="stethoscope" size={14} color="#28a745" />
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={{ color: colores.textoSecundario, fontSize: 12 }}>
                  Atendida
                </Text>
                <Text style={{ color: colores.textoPrincipal, fontWeight: '700' }}>
                  {fmtFecha(fechaAtendida)} • {fmtHora12(fechaAtendida)}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Pie: última mod y acción */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 14,
          }}
        >
          {item?.ultimaModificacion ? (
            <Text style={{ color: '#888', fontSize: 11 }}>
              Modificado por: {item.ultimaModificacion}
            </Text>
          ) : <View />}

          <TouchableOpacity
            onPress={() => onViewDetails && onViewDetails(item)}
            style={{
              backgroundColor: colores.principal,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <FontAwesome name="eye" size={12} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', marginLeft: 6 }}>
              Ver detalle
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});