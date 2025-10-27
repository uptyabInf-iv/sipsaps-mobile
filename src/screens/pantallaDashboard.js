// src/screens/pantallaDashboard.js
// Dashboard optimizado: responsive, avatar Cloudinary, navegación anidada robusta,
// padding lateral para que no choque con bordes del teléfono y acción "Perfil" eliminada de la fila.

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { useTemasPersonalizado } from '../hooks/useTemasPersonalizado';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';

import BotonPrincipal from '../components/botonPrincipal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function StatCard({ color, icon, title, value, colores }) {
  return (
    <View style={[s.statCard, { borderLeftColor: color, backgroundColor: colores.superficie }]}>
      <View style={[s.statIcon, { backgroundColor: color + '15' }]}>
        <FontAwesome name={icon} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.statTitle, { color: colores.textoSecundario }]}>{title}</Text>
        <Text style={[s.statValue, { color: colores.textoPrincipal }]}>{value}</Text>
      </View>
    </View>
  );
}

function ActionButton({ icon, label, onPress, colores }) {
  return (
    <TouchableOpacity
      style={[s.actionButton, { backgroundColor: colores.superficie, borderColor: colores.borde || 'rgba(0,0,0,0.04)' }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <MaterialIcons name={icon} size={22} color={colores.principal} />
      <Text style={[s.actionLabel, { color: colores.textoPrincipal }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function PantallaDashboard() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colores, fuentes, espaciados, sombras, esOscuro } = useTemasPersonalizado();

  // Usuario desde Redux
  const authState = useSelector((state) => state.user) || {};
  const user = authState?.user || {};

  // Datos básicos
  const nombre = (user?.nombre || user?.firstName || '').toString().trim();
  const apellido = (user?.apellido || user?.lastName || '').toString().trim();
  const username = (user?.nombre_usuario || user?.username || user?.userName || '').toString().trim();
  const rolRaw = String(user?.rol || user?.tipo_usuario_nombre || user?.tipoUsuarioNombre || user?.tipo_usuario || '').trim();
  const rolNormalized = rolRaw ? rolRaw.toUpperCase() : '';
  const tipoId = user?.tipo_usuario ?? user?.tipoUsuario ?? user?.tipo ?? null;
  const esMedicoOPresidente = rolNormalized === 'MEDICO' || rolNormalized === 'PRESIDENTE' || tipoId === 4 || tipoId === 1;

  // Avatar: imagen de la DB (Cloudinary URL) o iniciales
  const imageUrl = user?.imagen || null;
  const initials = useMemo(() => {
    if (nombre || apellido) {
      const n = nombre.split(' ')[0] || '';
      const a = apellido.split(' ')[0] || '';
      return (n.charAt(0) + (a.charAt(0) || '')).toUpperCase();
    }
    if (username) return username.slice(0, 2).toUpperCase();
    return 'US';
  }, [nombre, apellido, username]);

  const [imgLoading, setImgLoading] = useState(!!imageUrl);
  const [imgError, setImgError] = useState(false);

  // Datos estáticos / placeholder (puedes reemplazarlos por llamadas reales al API)
  const stats = useMemo(() => {
    return {
      proximas: 2,
      pendientes: esMedicoOPresidente ? 5 : 1,
      completadas: 34,
      perfilCompleto: !!(nombre && apellido && username),
    };
  }, [esMedicoOPresidente, nombre, apellido, username]);

  // Navegación robusta hacia pantallas dentro de la pestaña "Citas"
  // Intenta navegación directa a la pestaña 'Citas' (si existe) y si no, navega a MainApp con params.
  // Asegúrate de que la pestaña de bottom bar donde están las pantallas de citas se llame 'Citas'.
  const navigateToNested = (tabName, screenName, params = {}) => {
    // Intenta navegación directa a la tab (funciona si esta pantalla ya está dentro del mismo contenedor)
    try {
      navigation.navigate(tabName, { screen: screenName, params });
      return;
    } catch (err) {
      // fallback: dispatch con estructura anidada usando MainApp
      navigation.dispatch(
        CommonActions.navigate({
          name: 'MainApp',
          params: {
            screen: tabName,
            params: {
              screen: screenName,
              params,
            },
          },
        })
      );
    }
  };

  const goAgendar = () => navigateToNested('Citas', 'AgendarCita');
  const goMisCitas = () => navigateToNested('Citas', 'HistorialCitas');
  const goGestion = () => navigateToNested('Citas', 'GestionCitasMedico');
  const goPerfil = () => {
    // Perfil podría estar como tab o pantalla propia; probamos 'Perfil' directo y fallback a MainApp->Perfil
    try {
      navigation.navigate('Perfil');
    } catch {
      navigation.dispatch(
        CommonActions.navigate({
          name: 'MainApp',
          params: { screen: 'Perfil' },
        })
      );
    }
  };

  return (
    <LinearGradient colors={[colores.fondo, colores.secundario + '08']} style={[s.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={{ paddingVertical: espaciados.mediano, paddingHorizontal: espaciados.mediano }}>
        {/* Header */}
        <View style={[s.header, sombras.media, { backgroundColor: colores.superficie }]}>
          <View style={s.headerLeft}>
            <View style={[s.avatarWrap, { backgroundColor: colores.principal + '10' }]}>
              {imageUrl && !imgError ? (
                <>
                  {imgLoading && (
                    <View style={s.avatarLoader}>
                      <ActivityIndicator size="small" color={colores.principal} />
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
                  <Text style={[s.initials, { color: colores.principal }]}>{initials}</Text>
                </View>
              )}
            </View>

            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text
                style={[s.welcome, { color: colores.textoPrincipal, fontSize: fuentes.tamanos.grande, fontFamily: fuentes.negrita }]}
                numberOfLines={1}
              >
                {nombre || apellido ? `${nombre} ${apellido}`.trim() : username || 'Usuario'}
              </Text>
              <Text style={[s.username, { color: colores.textoSecundario }]}>@{username || '—'}</Text>
              <View style={[s.rolePill, { backgroundColor: colores.principal + '12' }]}>
                <Text style={{ color: colores.principal, fontWeight: '700', fontSize: 12 }}>
                  {rolNormalized ? rolNormalized : 'INVITADO'}
                </Text>
              </View>
            </View>
          </View>

          <View style={s.headerRight}>
            <BotonPrincipal titulo="Mi Perfil" onPress={goPerfil} small />
          </View>
        </View>

        {/* Resumen */}
        <View style={{ marginTop: espaciados.mediano }}>
          <Text style={[s.sectionTitle, { color: colores.textoPrincipal }]}>Resumen</Text>

          <View style={s.statsGrid}>
            <StatCard color="#17a2b8" icon="calendar" title="Próximas citas" value={stats.proximas} colores={colores} />
            <StatCard color="#ffc107" icon="clock-o" title="Pendientes" value={stats.pendientes} colores={colores} />
            <StatCard color="#28a745" icon="check-circle" title="Completadas" value={stats.completadas} colores={colores} />
            <StatCard color="#6c757d" icon="user" title="Perfil" value={stats.perfilCompleto ? 'Completo' : 'Incompleto'} colores={colores} />
          </View>
        </View>

        {/* Acciones rápidas (REMOVIDO: tercer botón Perfil según tu petición)
        <View style={{ marginTop: espaciados.mediano }}>
          <Text style={[s.sectionTitle, { color: colores.textoPrincipal }]}>Acciones rápidas</Text>

          <View style={s.actionsRow}>
            {esMedicoOPresidente ? (
              <>
                <ActionButton icon="people" label="Gestionar pacientes" onPress={goGestion} colores={colores} />
                <ActionButton icon="calendar-today" label="Ver mi agenda" onPress={goMisCitas} colores={colores} />
              </>
            ) : (
              <>
                <ActionButton icon="add-circle" label="Agendar cita" onPress={goAgendar} colores={colores} />
                <ActionButton icon="history" label="Mis citas" onPress={goMisCitas} colores={colores} />
              </>
            )}
          </View>
        </View> */}

        {/* Última actividad */}
        <View style={{ marginTop: espaciados.mediano, marginBottom: espaciados.grande }}>
          <Text style={[s.sectionTitle, { color: colores.textoPrincipal }]}>Última actividad</Text>

          <View style={[s.activityCard, { backgroundColor: colores.superficie }, sombras.pequena]}>
            <View style={s.activityRow}>
              <View style={s.activityLeft}>
                <FontAwesome name="calendar" size={18} color={colores.principal} />
                <View style={{ marginLeft: 10 }}>
                  <Text style={[s.activityTitle, { color: colores.textoPrincipal }]}>Solicitud: Consulta Dermatología</Text>
                  <Text style={[s.activitySubtitle, { color: colores.textoSecundario }]}>Pendiente de aprobación • 31 oct 2025 • 11:30</Text>
                </View>
              </View>
            </View>

            <View style={s.activityRow}>
              <View style={s.activityLeft}>
                <FontAwesome name="check" size={18} color="#28a745" />
                <View style={{ marginLeft: 10 }}>
                  <Text style={[s.activityTitle, { color: colores.textoPrincipal }]}>Cita atendida: Juan Pérez</Text>
                  <Text style={[s.activitySubtitle, { color: colores.textoSecundario }]}>30 oct 2025 • 09:00</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    marginLeft: 12,
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarLoader: {
    position: 'absolute',
    zIndex: 2,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  initialsWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  initials: {
    fontSize: 26,
    fontWeight: '800',
  },
  welcome: {
    fontSize: 18,
  },
  username: {
    marginTop: 4,
    fontSize: 13,
  },
  rolePill: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
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
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
  },
  statValue: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '800',
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    width: SCREEN_WIDTH > 420 ? '48%' : '48%',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
  },
  actionLabel: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  activityCard: {
    borderRadius: 12,
    padding: 12,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityTitle: {
    fontWeight: '700',
  },
  activitySubtitle: {
    marginTop: 4,
    fontSize: 12,
  },
});