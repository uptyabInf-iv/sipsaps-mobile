// src/screens/pantallaDashboard.js
// Dashboard dinámico (ajustes para vista médico + "Citas reprogramadas")
//
// Cambios principales realizados:
// - Si el usuario es médico (tipo_usuario/tipoId o rol contiene 'MEDICO'), llamamos al endpoint /citas/medico/mias para obtener las citas que gestiona el médico.
// - Reemplacé la métrica "Próximas citas" por "Citas reprogramadas" y calculo su valor a partir de estados que contienen 'reprogram'.
// - Mantengo las métricas Pendientes, Aprobadas y Completadas (atendidas).
// - Normalización robusta para detectar estados independientemente de mayúsculas/acentos.
// - Si el médico no tiene citas, ahora mostramos un mensaje específico para rol médico.
// - Mantengo la sección "Última actividad" no interactiva con iconos diferenciados.
// - Pequeñas defensas frente a valores nulos/indefinidos y preservo sorting/normalización previa.
//
// Nota: asegúrate de que el objeto user en Redux incluya un campo que identifique si es médico.
// Este código detecta médico si: user.rol contiene 'MEDICO' (case-insensitive) o user.tipo_usuario === 4 o user.tipoUsuario === 4.
//
// Si necesitas que la métrica "Citas reprogramadas" incluya algún otro criterio, dime cuál y lo ajusto.

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Dimensions,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { useTemasPersonalizado } from '../hooks/useTemasPersonalizado';
import { FontAwesome } from '@expo/vector-icons';

import BotonPrincipal from '../components/botonPrincipal';
import api from '../utils/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function StatCard({ color, icon, title, value, colores }) {
  return (
    <View
      style={[
        s.statCard,
        { borderLeftColor: color, backgroundColor: colores.superficie },
      ]}
    >
      <View style={[s.statIcon, { backgroundColor: color + '15' }]}>
        <FontAwesome name={icon} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[s.statTitle, { color: colores.textoSecundario }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text style={[s.statValue, { color: colores.textoPrincipal }]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

// Normaliza texto: lowercase + remove diacritics
const normalizeText = (s) => {
  if (s === null || s === undefined) return '';
  try {
    return String(s)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  } catch {
    return String(s).toLowerCase();
  }
};

export default function PantallaDashboard() {
  const insets = useSafeAreaInsets();
  const { colores, fuentes, espaciados, sombras } = useTemasPersonalizado();

  // Usuario desde Redux
  const authState = useSelector((state) => state.user) || {};
  const user = authState?.user || {};

  // Datos básicos
  const nombre = (user?.nombre || user?.firstName || '').toString().trim();
  const apellido = (user?.apellido || user?.lastName || '').toString().trim();
  const username = (
    user?.nombre_usuario ||
    user?.username ||
    user?.userName ||
    ''
  )
    .toString()
    .trim();

  // Detectar si es médico
  const rolRaw = String(
    user?.rol || user?.tipo_usuario_nombre || user?.tipoUsuarioNombre || ''
  ).trim();
  const rolNormalized = rolRaw ? rolRaw.toLowerCase() : '';
  const tipoId = user?.tipo_usuario ?? user?.tipoUsuario ?? user?.tipo ?? null;
  const esMedico =
    rolNormalized.includes('medic') || tipoId === 4 || tipoId === '4';

  // Avatar
  const imageUrl = user?.imagen || null;
  const initials = (() => {
    if (nombre || apellido) {
      const n = nombre.split(' ')[0] || '';
      const a = apellido.split(' ')[0] || '';
      return (n.charAt(0) + (a.charAt(0) || '')).toUpperCase();
    }
    if (username) return username.slice(0, 2).toUpperCase();
    return 'US';
  })();

  const [imgLoading, setImgLoading] = useState(!!imageUrl);
  const [imgError, setImgError] = useState(false);

  // Estado de citas
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Normalizador de objetos de cita recibidos
  const normalizeCita = useCallback((r) => {
    if (!r) return null;
    return {
      id_cita: r.id_cita ?? r.id ?? null,
      fecha: String(r.fecha ?? '').slice(0, 10),
      hora: String(r.hora ?? '')
        .slice(0, 8)
        .slice(0, 5), // keep HH:MM
      estatusRaw: r.estatus ?? r.estado ?? r.status ?? '',
      justificacionRaw: r.justificacion ?? r.motivo_modificacion ?? '',
      motivoRaw: r.motivo ?? r.detalles ?? '',
      fueraHorario: !!(r.fueraHorario ?? r.fuera_horario),
      // si backend devuelve fechaSolicitud ISO, lo conservamos para checks
      fechaSolicitudIso:
        r.fechaSolicitud ?? r.fecha_solicitud ?? r.fechasolicitud ?? null,
    };
  }, []);

  const fetchCitas = useCallback(
    async (opts = { showAlertOnError: true }) => {
      setError(null);
      if (!refreshing) setLoading(true);
      try {
        // Si es médico, usar endpoint médico para traer las citas que gestiona
        let endpoint = esMedico ? '/citas/medico/mias?status=all' : '/citas/mias';
        let res = await api.get(endpoint, { timeout: 60000 });

        // Normalizar formas de respuesta
        if (!Array.isArray(res)) {
          if (res && Array.isArray(res.citas)) res = res.citas;
          else if (res && Array.isArray(res.data)) res = res.data;
          else res = [];
        }

        const normalized = res.map(normalizeCita).filter(Boolean);

        // Ordenar cronológicamente (por fecha/hora si disponibles, fallback a fechaSolicitudIso)
        normalized.sort((a, b) => {
          try {
            const da = a.fecha && a.hora ? new Date(`${a.fecha}T${a.hora}:00`) : new Date(a.fechaSolicitudIso || 0);
            const db = b.fecha && b.hora ? new Date(`${b.fecha}T${b.hora}:00`) : new Date(b.fechaSolicitudIso || 0);
            return da - db;
          } catch {
            return 0;
          }
        });

        setCitas(normalized);
        setLoading(false);
        setRefreshing(false);
        setError(null);
      } catch (e) {
        setLoading(false);
        setRefreshing(false);
        setError(e);
        console.warn('[PantallaDashboard] fetchCitas error', e);
        if (opts.showAlertOnError) api.handleError?.(e);
      }
    },
    [normalizeCita, refreshing, esMedico]
  );

  useEffect(() => {
    fetchCitas({ showAlertOnError: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esMedico]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCitas({ showAlertOnError: true });
  }, [fetchCitas]);

  // Estadísticas:
  // - reprogramadas: estatus contiene 'reprogram'
  // - pendientes: estatus contiene 'pend'
  // - aprobadas: estatus contiene 'aprob'
  // - completadas: atendidas (detecta 'atend' en estatus/justificacion/motivo)
  const stats = useMemo(() => {
    let reprogramadas = 0;
    let pendientes = 0;
    let aprobadas = 0;
    let completadas = 0;

    for (const c of citas) {
      const est = normalizeText(c.estatusRaw);
      const just = normalizeText(c.justificacionRaw);
      const motivo = normalizeText(c.motivoRaw);

      const isReprogram = est.includes('reprogram');
      const isPending = est.includes('pend');
      const isApproved = est.includes('aprob');
      const isAttendedInStatus = est.includes('atend');
      const isAttendedInJust = just.includes('atend');
      const isAttendedInMotivo = motivo.includes('atend');

      if (isReprogram) reprogramadas++;
      if (isPending) pendientes++;
      if (isApproved) aprobadas++;
      if (isAttendedInStatus || isAttendedInJust || isAttendedInMotivo)
        completadas++;
    }

    return {
      reprogramadas,
      pendientes,
      aprobadas,
      completadas,
      perfilCompleto: !!(nombre && apellido && username),
    };
  }, [citas, nombre, apellido, username]);

  // Activity items: determinamos icono + color por estatus:
  // - aprobada: check-circle (green)
  // - atendida: bookmark (indigo)
  // - reprogramada: refresh (cyan/different)
  // - pendiente/otro: calendar (principal color)
  const activity = useMemo(() => {
    if (!citas || !citas.length) return [];
    return citas
      .slice()
      .reverse()
      .map((c) => {
        const est = normalizeText(c.estatusRaw);
        let title = '';
        if (est.includes('pend')) title = `Solicitud: ${c.motivoRaw || 'Consulta'}`;
        else if (est.includes('aprob')) title = `Cita aprobada: ${c.motivoRaw || 'Consulta'}`;
        else if (est.includes('reprogram')) title = `Reprogramada: ${c.motivoRaw || 'Consulta'}`;
        else if (est.includes('cancel')) title = `Cancelada: ${c.motivoRaw || 'Consulta'}`;
        else if (est.includes('atend')) title = `Cita atendida: ${c.motivoRaw || 'Consulta'}`;
        else title = `${c.estatusRaw || 'Actividad'}: ${c.motivoRaw || ''}`;

        const subtitleParts = [];
        if (c.fecha) subtitleParts.push(c.fecha);
        if (c.hora) subtitleParts.push(c.hora);
        if (c.fueraHorario) subtitleParts.push('Fuera de horario');

        return {
          id: c.id_cita,
          title,
          subtitle: subtitleParts.join(' • '),
          estatusRaw: c.estatusRaw,
          estNormalized: est,
        };
      })
      .slice(0, 6);
  }, [citas]);

  return (
    <LinearGradient
      colors={[colores.fondo, colores.secundario + '08']}
      style={[s.container, { paddingTop: insets.top }]}
    >
      <ScrollView
        contentContainerStyle={{
          paddingVertical: espaciados.mediano,
          paddingHorizontal: Math.max(12, espaciados.mediano / 1.5),
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colores.principal}
          />
        }
      >
        {/* Header */}
        <View
          style={[
            s.header,
            sombras.media,
            { backgroundColor: colores.superficie },
          ]}
        >
          <View style={s.headerLeft}>
            <View
              style={[
                s.avatarWrap,
                { backgroundColor: colores.principal + '10' },
              ]}
            >
              {imageUrl && !imgError ? (
                <>
                  {imgLoading && (
                    <View style={s.avatarLoader}>
                      <ActivityIndicator
                        size="small"
                        color={colores.principal}
                      />
                    </View>
                  )}
                  <Image
                    source={{ uri: imageUrl }}
                    style={[s.avatarImage]}
                    onLoadEnd={() => setImgLoading(false)}
                    onError={() => {
                      setImgLoading(false);
                      setImgError(true);
                    }}
                  />
                </>
              ) : (
                <View style={s.initialsWrap}>
                  <Text style={[s.initials, { color: colores.principal }]}>
                    {initials}
                  </Text>
                </View>
              )}
            </View>

            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text
                style={[
                  s.welcome,
                  {
                    color: colores.textoPrincipal,
                    fontSize: fuentes.tamanos.grande,
                    fontFamily: fuentes.negrita,
                  },
                ]}
                numberOfLines={1}
              >
                {nombre || apellido
                  ? `${nombre} ${apellido}`.trim()
                  : username || 'Usuario'}
              </Text>
              <Text
                style={[s.username, { color: colores.textoSecundario }]}
                numberOfLines={1}
              >
                @{username || '—'} {esMedico ? '• Médico' : ''}
              </Text>
            </View>
          </View>

          <View style={s.headerRight}>
            {/* Perfil button left intentionally empty for doctor view */}
          </View>
        </View>

        {/* Estado de carga / error */}
        {loading && (
          <View style={{ marginTop: espaciados.mediano, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={colores.principal} />
            <Text style={{ color: colores.textoSecundario, marginTop: 8 }}>
              Obteniendo tus citas...
            </Text>
          </View>
        )}

        {error && !loading && (
          <View style={{ marginTop: espaciados.mediano }}>
            <Text style={{ color: colores.error || '#c0392b' }}>
              No se pudieron cargar las citas.
            </Text>
          </View>
        )}

        {/* Resumen */}
        <View style={{ marginTop: espaciados.mediano, marginTop: 12 }}>
          <View style={s.statsGrid}>
            <StatCard
              color="#06b6d4"
              icon="refresh"
              title="Reprogramadas"
              value={stats.reprogramadas}
              colores={colores}
            />
            <StatCard
              color="#ffc107"
              icon="clock-o"
              title="Pendientes"
              value={stats.pendientes}
              colores={colores}
            />
            <StatCard
              color="#28a745"
              icon="check-circle"
              title="Aprobadas"
              value={stats.aprobadas}
              colores={colores}
            />
            <StatCard
              color="#4f46e5"
              icon="bookmark"
              title="Atendidas"
              value={stats.completadas}
              colores={colores}
            />
          </View>
        </View>

        {/* Última actividad (NO interactiva) */}
        <View
          style={{
            marginTop: espaciados.mediano,
            marginBottom: espaciados.grande,
          }}
        >
          <Text style={[s.sectionTitle, { color: "#4f46e5", marginTop: 12, marginBottom: 12, marginLeft: 12 }]}>
            Última actividad
          </Text>

          <View
            style={[
              s.activityCard,
              { backgroundColor: colores.superficie },
              sombras.pequena,
            ]}
          >
            {activity.length === 0 && !loading ? (
              <View style={{ padding: 12 }}>
                <Text
                  style={[
                    s.activitySubtitle,
                    { color: colores.textoSecundario },
                  ]}
                >
                  {esMedico
                    ? 'No tienes citas asignadas para gestionar.'
                    : 'Aún no hay actividad reciente.'}
                </Text>
              </View>
            ) : (
              activity.map((a, idx) => {
                const est = a.estNormalized;
                // Decide icon + color
                let icon = 'calendar';
                let color = colores.principal;
                if (est.includes('aprob')) {
                  icon = 'check-circle'; // aprobada -> verde
                  color = '#28a745';
                } else if (est.includes('atend')) {
                  icon = 'bookmark'; // atendida/completada -> indigo
                  color = '#4f46e5';
                } else if (est.includes('reprogram')) {
                  icon = 'refresh'; // reprogramada -> cyan
                  color = '#06b6d4';
                } else if (est.includes('cancel')) {
                  icon = 'times-circle';
                  color = '#dc3545';
                } else if (est.includes('pend')) {
                  icon = 'clock-o';
                  color = '#ffc107';
                }

                return (
                  <View
                    key={String(a.id) + '-' + idx}
                    style={[
                      s.activityRow,
                      idx === activity.length - 1
                        ? { borderBottomWidth: 0 }
                        : {},
                    ]}
                  >
                    <View style={s.activityLeft}>
                      <FontAwesome name={icon} size={18} color={color} />
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text
                          style={[
                            s.activityTitle,
                            { color: colores.textoPrincipal },
                          ]}
                          numberOfLines={1}
                        >
                          {a.title}
                        </Text>
                        <Text
                          style={[
                            s.activitySubtitle,
                            { color: colores.textoSecundario },
                          ]}
                          numberOfLines={1}
                        >
                          {a.subtitle}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerRight: { marginLeft: 12 },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  avatarLoader: {
    position: 'absolute',
    zIndex: 2,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  initials: { fontSize: 22, fontWeight: '800' },
  welcome: { fontSize: 16 },
  username: { marginTop: 4, fontSize: 13 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    width: SCREEN_WIDTH > 420 ? '48%' : '48%',
    minHeight: 80,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  statTitle: { fontSize: 12, color: '#666' },
  statValue: { marginTop: 4, fontSize: 18, fontWeight: '800' },
  activityCard: { borderRadius: 12, padding: 4 },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  activityLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  activityTitle: { fontWeight: '700' },
  activitySubtitle: { marginTop: 4, fontSize: 12 },
});