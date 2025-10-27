import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  Platform,
  useColorScheme,
  Modal,
  Pressable,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { useTemasPersonalizado } from '../hooks/useTemasPersonalizado';
import { FontAwesome } from '@expo/vector-icons';
import { useManejoCarga } from '../hooks/useManejoCarga';
import ModalGeneral from '../components/modalGeneral';
import IndicadorCarga from '../components/indicadorCarga';
import { setUser, logout } from '../redux/slices/userSlice';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PantallaPerfil() {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const reduxUser = useSelector((state) => state.user?.user);
  const token = useSelector((state) => state.user?.token);

  const { user } = { user: reduxUser };
  const {
    colores = {},
    fuentes = {},
    espaciados = {},
    sombras = {},
  } = useTemasPersonalizado();
  const { estaCargando, ejecutarConCarga } = useManejoCarga(false);

  const colorScheme = useColorScheme?.() || 'light';
  const isDarkModeLocal = colorScheme === 'dark';

  const [editingMode, setEditingMode] = useState(false);
  const [originalData, setOriginalData] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    telefono: '',
    direccion: '',
    estado_salud: '',
    estatus_laboral: '',
    fecha_nacimiento: '',
    sexo: '',
    correo: '',
    imagen: '',
  });

  const [errorsInput, setErrorsInput] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('error');
  const [modalMessage, setModalMessage] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [sexoModalVisible, setSexoModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Guía visual superior
  const scrollRef = useRef(null);
  const arrowY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(arrowY, { toValue: 6, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(arrowY, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [arrowY]);
  const irASeguridad = useCallback(() => scrollRef.current?.scrollToEnd({ animated: true }), []);

  useEffect(() => {
    if (!user) return;

    let initialNombre = user.nombre || '';
    let initialApellido = user.apellido || '';

    if (initialNombre && (!initialApellido || initialApellido.trim() === '')) {
      const tokens = initialNombre.trim().split(/\s+/);
      if (tokens.length > 1) {
        initialNombre = tokens[0];
        initialApellido = tokens.slice(1).join(' ');
      }
    }

    const snapshot = {
      nombre: initialNombre || '',
      apellido: initialApellido || '',
      cedula: user.cedula || '',
      telefono: user.telefono || '',
      direccion: user.direccion || '',
      estado_salud: user.estado_salud || '',
      estatus_laboral: user.estatus_laboral || '',
      fecha_nacimiento: user.fecha_nacimiento || '',
      sexo: user.sexo || '',
      correo: user.correo || '',
      imagen: user.imagen || '',
    };

    setOriginalData(snapshot);
    setFormData(snapshot);
  }, [user]);

  const formatName = useCallback((text) => {
    return text
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }, []);

  const formatTelefono = useCallback((text) => {
    const digits = text.replace(/\D/g, '');
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
  }, []);

  const formatCedula = useCallback((text) => {
    const digits = text.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8)
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length === 9)
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}-${digits.slice(8)}`;
    return digits;
  }, []);

  const emailRegex = useMemo(
    () => /^[^\s@]+@[^\s@]+\.(com|ve|org|co|net|edu|gov|mil)$/i,
    []
  );

  const onChangeName = (value) =>
    setFormData((p) => ({ ...p, nombre: formatName(value) }));
  const onChangeApellido = (value) =>
    setFormData((p) => ({ ...p, apellido: formatName(value) }));

  const onChangeTelefono = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length > 11) return;
    setFormData((p) => ({ ...p, telefono: formatTelefono(value) }));
  };

  const onChangeCedula = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length > 9) return;
    setFormData((p) => ({ ...p, cedula: formatCedula(value) }));
  };

  const onChangeSexo = (value) => {
    if (!value) {
      setFormData((p) => ({ ...p, sexo: '' }));
      return;
    }
    const v = value.toUpperCase();
    if (!['F', 'M'].includes(v)) return;
    setFormData((p) => ({ ...p, sexo: v }));
  };

  const onChangeCorreo = (value) => {
    setFormData((p) => ({ ...p, correo: value.toLowerCase() }));
    setErrorsInput((err) => ({
      ...err,
      correo: emailRegex.test(value) ? '' : 'Email inválido',
    }));
  };

  const onChangeGeneral = useCallback((campo, value) => {
    setFormData((p) => ({ ...p, [campo]: value }));
    validarInput(campo, value);
  }, []);

  const maxDate = new Date();
  const onChangeFechaNacimiento = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (event?.type === 'dismissed') return;
    const date =
      selectedDate || new Date(formData.fecha_nacimiento || Date.now());
    if (date > maxDate) {
      setErrorsInput((e) => ({
        ...e,
        fecha_nacimiento: 'La fecha no puede ser futura.',
      }));
      return;
    }
    setErrorsInput((e) => ({ ...e, fecha_nacimiento: '' }));
    setFormData((p) => ({ ...p, fecha_nacimiento: date.toISOString() }));
  };

  const validarInput = useCallback(
    (campo, value) => {
      setErrorsInput((prev) => {
        const errors = { ...prev };
        delete errors[campo];
        switch (campo) {
          case 'nombre':
          case 'apellido':
            if ((value || '').trim().length < 2)
              errors[campo] =
                `${campo[0].toUpperCase() + campo.slice(1)} mínimo 2 caracteres.`;
            break;
          case 'cedula': {
            const d = (value || '').replace(/\D/g, '');
            if (d.length < 8 || d.length > 9)
              errors.cedula = 'Cédula 8 o 9 dígitos.';
            break;
          }
          case 'telefono': {
            const d = (value || '').replace(/\D/g, '');
            if (d.length !== 11)
              errors.telefono = 'Teléfono debe tener 11 dígitos.';
            break;
          }
          case 'correo':
            if (!emailRegex.test(value || ''))
              errors.correo = 'Email inválido.';
            break;
          case 'fecha_nacimiento': {
            const d = new Date(value);
            if (isNaN(d.getTime()) || d > maxDate)
              errors.fecha_nacimiento = 'Fecha inválida o futura.';
            break;
          }
          case 'sexo':
            if (value && !['F', 'M'].includes((value || '').toUpperCase()))
              errors.sexo = 'Sexo inválido.';
            break;
          default:
            break;
        }
        return errors;
      });
    },
    [emailRegex]
  );

  const detectChanges = useCallback(() => {
    const changes = {};
    if (!originalData) return changes;
    Object.keys(formData).forEach((key) => {
      const a = (formData[key] ?? '').toString();
      const b = (originalData[key] ?? '').toString();
      if (a !== b) changes[key] = formData[key];
    });
    return changes;
  }, [formData, originalData]);

  const handleCancelEdit = useCallback(() => {
    if (originalData) setFormData({ ...originalData });
    setErrorsInput({});
    setEditingMode(false);
  }, [originalData]);

  const sexoDisplay = useCallback((val) => {
    if (!val) return '';
    const v = val.toUpperCase();
    if (v === 'M') return 'MASCULINO';
    if (v === 'F') return 'FEMENINO';
    return val;
  }, []);

  const manejarUpdate = async () => {
    const changes = detectChanges();
    if (Object.keys(errorsInput).some((k) => errorsInput[k])) {
      setModalType('error');
      setModalMessage(
        'Hay errores de validación. Por favor corrige antes de guardar.'
      );
      setModalVisible(true);
      return;
    }
    if (Object.keys(changes).length === 0) {
      setModalType('info');
      setModalMessage('No se detectaron cambios en el perfil.');
      setModalVisible(true);
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await ejecutarConCarga(async () => {
        const json = await api.put('/user/profile', changes);

        setModalType('success');
        setModalMessage(json.message || 'Perfil actualizado correctamente');
        setModalVisible(true);
        setEditingMode(false);

        const updatedSnapshot = { ...originalData, ...changes };
        setOriginalData(updatedSnapshot);

        let newUserObject = null;
        if (json && (json.datos_persona || json.datos_usuario)) {
          const dp = json.datos_persona || {};
          const du = json.datos_usuario || {};
          newUserObject = {
            id_persona: dp.id_persona ?? user?.id_persona,
            nombre: dp.nombre ?? user?.nombre,
            apellido: dp.apellido ?? user?.apellido,
            cedula: dp.cedula ?? user?.cedula,
            telefono: dp.telefono ?? user?.telefono,
            fecha_nacimiento: dp.fecha_nacimiento ?? user?.fecha_nacimiento,
            direccion: dp.direccion ?? user?.direccion,
            sexo: dp.sexo ?? user?.sexo,
            id_usuario: du.id_usuario ?? user?.id_usuario,
            nombre_usuario: du.nombre_usuario ?? user?.nombre_usuario,
            correo: du.correo ?? user?.correo,
            tipo_usuario: du.tipo_usuario ?? user?.tipo_usuario,
            imagen: du.imagen ?? user?.imagen,
            fechaIngreso: du.fechaIngreso ?? user?.fechaIngreso,
            permiso_usuario: du.permiso_usuario ?? user?.permiso_usuario,
            rol: du.rol ?? user?.rol,
            id_medico: du.id_medico ?? user?.id_medico,
            especialidad_nombre:
              du.especialidad_nombre ?? user?.especialidad_nombre,
          };
        } else {
          newUserObject = { ...user, ...changes };
        }

        dispatch(setUser({ user: newUserObject, token }));
      });
    } catch (error) {
      const message =
        (error?.response && (error.response.error || error.response.message)) ||
        error?.message ||
        'Error al actualizar perfil. Intenta nuevamente.';
      setModalType('error');
      setModalMessage(message);
      setModalVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditToggle = () => {
    if (editingMode) {
      manejarUpdate();
      return;
    }
    setEditingMode(true);
  };

  const limpiarSesionLocal = async () => {
    try {
      await AsyncStorage.multiRemove(['jwt', 'user']);
    } catch {}
    dispatch(logout());
  };

  const confirmarYLogout = (tipo = 'actual') => {
    const titulo =
      tipo === 'todos'
        ? 'Cerrar sesión en todos los dispositivos'
        : 'Cerrar sesión';
    const cuerpo =
      tipo === 'todos'
        ? 'Esto cerrará tu sesión en este y otros dispositivos. ¿Deseas continuar?'
        : 'Cerrarás tu sesión en este dispositivo. ¿Deseas continuar?';
    Alert.alert(titulo, cuerpo, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Aceptar',
        style: 'destructive',
        onPress: async () => {
          try {
            await ejecutarConCarga(async () => {
              if (tipo === 'todos') {
                await api.post('/auth/logout-all', {});
              } else {
                await api.post('/auth/logout', {});
              }
              await limpiarSesionLocal();
            });
          } catch (e) {
            await limpiarSesionLocal();
          }
        },
      },
    ]);
  };

  const nombreCompleto = user
    ? `${user.nombre || ''} ${user.apellido || ''}`.trim()
    : 'No disponible';
  const fechaIngreso = user?.fechaIngreso
    ? new Date(user.fechaIngreso).toLocaleDateString('es-ES')
    : 'No disponible';
  const esMedico = user?.rol === 'MEDICO';

  const estilos = useMemo(
    () =>
      StyleSheet.create({
        contenedor: { flex: 1 },
        scroll: { flex: 1 },
        content: { padding: espaciados.medio || 20 },
        header: {
          alignItems: 'center',
          marginBottom: espaciados.extraGrande || 30,
        },
        fotoContainer: { marginBottom: espaciados.medio || 15 },
        foto: {
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: colores.secundario || '#E5E5E5',
        },
        nombreHeader: {
          fontSize: fuentes.tamanos?.titulo || 24,
          textAlign: 'center',
          marginBottom: espaciados.extraPequenio || 5,
        },
        rolHeader: {
          fontSize: fuentes.tamanos?.medio || 16,
          textAlign: 'center',
        },
        botonEditar: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colores.superficie || '#FFFFFF',
          borderRadius: 12,
          padding: espaciados.medio || 15,
          marginBottom: espaciados.extraGrande || 30,
          ...(sombras?.pequena || {}),
        },
        botonTextoEditar: {
          fontSize: fuentes.tamanos?.medio || 16,
          fontWeight: 'bold',
          marginLeft: espaciados.pequeno || 8,
          color: colores.principal || '#4F46E5',
        },
        section: { marginBottom: espaciados.extraGrande || 30 },
        sectionTitle: {
          fontSize: fuentes.tamanos?.grande || 18,
          fontWeight: 'bold',
          marginBottom: espaciados.medio || 15,
        },
        field: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colores.superficie || '#FFFFFF',
          borderRadius: 12,
          padding: espaciados.medio || 15,
          marginBottom: espaciados.pequeno || 10,
          ...(sombras?.pequena || {}),
        },
        fieldIcon: { marginRight: espaciados.pequeno || 10 },
        fieldContent: { flex: 1 },
        fieldLabel: {
          fontSize: fuentes.tamanos?.pequeno || 14,
          marginBottom: 4,
        },
        fieldValue: { fontSize: fuentes.tamanos?.medio || 16, lineHeight: 20 },
        editButton: { padding: 5 },
        errorText: {
          fontSize: fuentes.tamanos?.pequeno || 12,
          color: colores.error || '#FF3B30',
          marginTop: espaciados.extraPequenio || 4,
        },
        overlay: {
          position: 'absolute',
          inset: 0,
          backgroundColor: '#00000066',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        },
        overlayBox: {
          backgroundColor: colores.superficie || '#fff',
          padding: 20,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
        },
        sexOption: {
          paddingVertical: 12,
          paddingHorizontal: 18,
          width: 220,
          alignItems: 'center',
        },
        sexOptionText: { fontSize: 16, fontWeight: '600' },
        seguridadCard: {
          backgroundColor: colores.superficie || '#FFFFFF',
          borderRadius: 12,
          padding: espaciados.grande || 16,
          ...(sombras?.pequena || {}),
        },
        seguridadTitulo: {
          fontSize: fuentes.tamanos?.grande || 18,
          fontWeight: '700',
          marginBottom: 10,
          color: colores.textoPrincipal || '#111827',
        },
        logoutBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 12,
          borderRadius: 10,
          backgroundColor: '#EF4444',
        },
        logoutAllBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 12,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: '#EF4444',
          marginTop: 10,
          backgroundColor: 'transparent',
        },
        logoutText: {
          color: '#fff',
          fontWeight: '700',
          marginLeft: 8,
        },
        logoutAllText: {
          color: '#EF4444',
          fontWeight: '700',
          marginLeft: 8,
        },
      }),
    [colores, fuentes, espaciados, sombras]
  );

  const renderField = useCallback(
    (label, value, iconName = null, editable = true, inputKey) => {
      const isEditingThis = editable && editingMode;
      const displayValue =
        inputKey === 'fecha_nacimiento' && value
          ? (() => {
              try {
                const d = new Date(value);
                if (!isNaN(d)) return d.toLocaleDateString('es-ES');
              } catch (e) {}
              return value;
            })()
          : value;

      if (inputKey === 'sexo') {
        const display = sexoDisplay(value);
        return (
          <View key={inputKey} style={{ marginBottom: 6 }}>
            <View
              style={[
                estilos.field,
                isEditingThis && {
                  borderWidth: 1,
                  borderColor: (colores.principal || '#4F46E5') + '88',
                  backgroundColor: isEditingThis
                    ? isDarkModeLocal
                      ? '#111827'
                      : '#ffffff'
                    : undefined,
                },
              ]}
            >
              {iconName && (
                <FontAwesome
                  name={iconName}
                  size={20}
                  color={colores.textoSecundario || '#64748B'}
                  style={estilos.fieldIcon}
                />
              )}
              <View style={estilos.fieldContent}>
                <Text
                  style={[
                    estilos.fieldLabel,
                    { color: colores.textoSecundario || '#64748B' },
                  ]}
                >
                  {label}
                </Text>

                {isEditingThis ? (
                  <TouchableOpacity
                    onPress={() => setSexoModalVisible(true)}
                    accessible
                    accessibilityLabel={`Seleccionar ${label}`}
                    style={{ paddingVertical: 8 }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Text
                        style={[
                          estilos.fieldValue,
                          { color: colores.textoPrincipal || '#1E293B' },
                        ]}
                      >
                        {display || 'Seleccionar'}
                      </Text>
                      <FontAwesome
                        name="caret-down"
                        size={18}
                        color={colores.textoSecundario || '#64748B'}
                      />
                    </View>
                  </TouchableOpacity>
                ) : (
                  <Text
                    style={[
                      estilos.fieldValue,
                      { color: colores.textoPrincipal || '#1E293B' },
                    ]}
                  >
                    {display || 'No disponible'}
                  </Text>
                )}
              </View>

              {editable && editingMode && (
                <FontAwesome
                  name="edit"
                  size={16}
                  color={colores.principal || '#4F46E5'}
                />
              )}
              {!editable && (
                <FontAwesome
                  name="lock"
                  size={16}
                  color={colores.textoSecundario || '#64748B'}
                />
              )}
            </View>

            {errorsInput[inputKey] ? (
              <Text style={estilos.errorText}>{errorsInput[inputKey]}</Text>
            ) : null}
          </View>
        );
      }

      return (
        <View key={inputKey} style={{ marginBottom: 6 }}>
          <View
            style={[
              estilos.field,
              isEditingThis && {
                borderWidth: 1,
                borderColor: (colores.principal || '#4F46E5') + '88',
                backgroundColor: isEditingThis
                  ? isDarkModeLocal
                    ? '#111827'
                    : '#ffffff'
                  : undefined,
              },
            ]}
          >
            {iconName && (
              <FontAwesome
                name={iconName}
                size={20}
                color={colores.textoSecundario || '#64748B'}
                style={estilos.fieldIcon}
              />
            )}
            <View style={estilos.fieldContent}>
              <Text
                style={[
                  estilos.fieldLabel,
                  { color: colores.textoSecundario || '#64748B' },
                ]}
              >
                {label}
              </Text>

              {editable ? (
                inputKey === 'fecha_nacimiento' ? (
                  <TouchableOpacity
                    onPress={() => {
                      if (editingMode) setShowDatePicker(true);
                    }}
                    accessible
                    accessibilityLabel={`Editar ${label}`}
                  >
                    <TextInput
                      pointerEvents="none"
                      style={[
                        estilos.fieldValue,
                        { color: colores.textoPrincipal || '#1E293B' },
                      ]}
                      value={displayValue || ''}
                      editable={false}
                    />
                  </TouchableOpacity>
                ) : (
                  <TextInput
                    style={[
                      estilos.fieldValue,
                      { color: colores.textoPrincipal || '#1E293B' },
                    ]}
                    value={value}
                    onChangeText={(text) => {
                      switch (inputKey) {
                        case 'nombre':
                          return onChangeName(text);
                        case 'apellido':
                          return onChangeApellido(text);
                        case 'telefono':
                          return onChangeTelefono(text);
                        case 'cedula':
                          return onChangeCedula(text);
                        case 'sexo':
                          return onChangeSexo(text);
                        case 'correo':
                          return onChangeCorreo(text);
                        default:
                          return onChangeGeneral(inputKey, text);
                      }
                    }}
                    editable={editingMode}
                    placeholder="Edita aquí"
                    placeholderTextColor={
                      (colores.textoSecundario || '#64748B') + '88'
                    }
                    accessible
                    accessibilityLabel={`Edita ${label}`}
                    keyboardType={
                      inputKey === 'telefono' || inputKey === 'cedula'
                        ? 'numeric'
                        : inputKey === 'correo'
                          ? 'email-address'
                          : 'default'
                    }
                  />
                )
              ) : (
                <Text
                  style={[
                    estilos.fieldValue,
                    { color: colores.textoPrincipal || '#1E293B' },
                  ]}
                >
                  {displayValue || 'No disponible'}
                </Text>
              )}
            </View>

            {editable && editingMode && (
              <FontAwesome
                name="edit"
                size={16}
                color={colores.principal || '#4F46E5'}
              />
            )}
            {!editable && (
              <FontAwesome
                name="lock"
                size={16}
                color={colores.textoSecundario || '#64748B'}
              />
            )}
          </View>

          {errorsInput[inputKey] ? (
            <Text style={estilos.errorText}>{errorsInput[inputKey]}</Text>
          ) : null}
        </View>
      );
    },
    [
      colores,
      estilos,
      editingMode,
      errorsInput,
      isDarkModeLocal,
      formData,
      sexoModalVisible,
    ]
  );

  const handleFotoPress = () =>
    Alert.alert('Feature en desarrollo', 'Subida de foto con zoom pronto.');

  return (
    <LinearGradient
      colors={[
        colores.fondo || '#F8FAFC',
        (colores.secundario || '#7C3AED') + '10',
      ]}
      style={[estilos.contenedor, { paddingTop: insets.top }]}
    >
      <ScrollView
        ref={scrollRef}
        style={estilos.scroll}
        contentContainerStyle={[estilos.content, { paddingBottom: 40 }]}
      >
        <View style={estilos.header}>
          <TouchableOpacity
            onPress={handleFotoPress}
            style={estilos.fotoContainer}
          >
            <Image
              source={{
                uri:
                  formData.imagen ||
                  'https://via.placeholder.com/80?text=Perfil',
              }}
              style={estilos.foto}
              accessible
              accessibilityLabel="Foto de perfil (presiona para editar)"
            />
          </TouchableOpacity>

          <Text
            style={[
              estilos.nombreHeader,
              {
                color: colores.principal || '#4F46E5',
                fontFamily: fuentes.negrita || 'System',
              },
            ]}
          >
            {nombreCompleto}
          </Text>

          <Text
            style={[
              estilos.rolHeader,
              { color: colores.textoSecundario || '#64748B' },
            ]}
          >
            {user?.rol || 'Rol no definido'}
          </Text>
        </View>

        {/* Guía visual + acción rápida para cerrar sesión */}
        <View
          style={{
            backgroundColor: colores.superficie || '#FFFFFF',
            borderRadius: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: (colores.principal || '#4F46E5') + '22',
            marginBottom: espaciados.medio || 16,
            ...(sombras?.pequena || {}),
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 }}>
              <FontAwesome name="info-circle" size={16} color={colores.principal || '#4F46E5'} />
              <Text style={{ marginLeft: 8, color: colores.textoPrincipal || '#111827', fontWeight: '600' }}>
                Desliza hacia abajo para cerrar sesión en Seguridad.
              </Text>
            </View>

          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>



            <TouchableOpacity
              onPress={irASeguridad}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: colores.principal || '#4F46E5', marginLeft: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Ir a seguridad"
            >
              <FontAwesome name="shield" size={14} color={colores.principal || '#4F46E5'} />
              <Text style={{ color: colores.principal || '#4F46E5', fontWeight: '700', marginLeft: 6 }}>Ir a seguridad</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            marginBottom: espaciados.extraGrande || 30,
            gap: 10,
          }}
        >
          {editingMode ? (
            <>
              <TouchableOpacity
                onPress={() => manejarUpdate()}
                disabled={isSubmitting}
                style={{
                  backgroundColor: isSubmitting
                    ? '#9aa4e6'
                    : colores.principal || '#4F46E5',
                  paddingHorizontal: 18,
                  paddingVertical: 10,
                  borderRadius: 10,
                }}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '700' }}>
                    Guardar
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCancelEdit}
                disabled={isSubmitting}
                style={{
                  backgroundColor: 'transparent',
                  borderWidth: 1,
                  borderColor: colores.principal || '#4F46E5',
                  paddingHorizontal: 18,
                  paddingVertical: 10,
                  borderRadius: 10,
                }}
              >
                <Text
                  style={{
                    color: colores.principal || '#4F46E5',
                    fontWeight: '700',
                  }}
                >
                  Cancelar
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={() => setEditingMode(true)}
              style={{
                backgroundColor: colores.superficie || '#ffffff',
                paddingHorizontal: 18,
                paddingVertical: 10,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colores.principal || '#4F46E5',
              }}
            >
              <Text
                style={{
                  color: colores.principal || '#4F46E5',
                  fontWeight: '700',
                }}
              >
                Editar Perfil
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={estilos.section}>
          <Text
            style={[
              estilos.sectionTitle,
              { color: colores.principal || '#4F46E5' },
            ]}
          >
            Información Personal
          </Text>

          {renderField('Nombre', formData.nombre, 'user', true, 'nombre')}
          {renderField('Apellido', formData.apellido, 'user', true, 'apellido')}
          {renderField(
            'Correo Electrónico',
            formData.correo,
            'envelope',
            true,
            'correo'
          )}
          {renderField(
            'Teléfono',
            formData.telefono,
            'phone',
            true,
            'telefono'
          )}
          {renderField(
            'Cédula / Documento',
            formData.cedula,
            'id-card',
            true,
            'cedula'
          )}
          {renderField(
            'Fecha de Ingreso',
            fechaIngreso,
            'calendar-check-o',
            false,
            'fechaIngreso'
          )}
          {renderField(
            'Fecha de Nacimiento',
            formData.fecha_nacimiento,
            'birthday-cake',
            true,
            'fecha_nacimiento'
          )}
          {renderField('Sexo', formData.sexo, 'venus-mars', true, 'sexo')}
          {renderField(
            'Tipo de Usuario (Rol)',
            user?.rol || '',
            'user-circle',
            false,
            'rol'
          )}
          {renderField(
            'Nombre de Usuario',
            user?.nombre_usuario || '',
            'user',
            false,
            'nombre_usuario'
          )}
        </View>

        {esMedico && (
          <View style={estilos.section}>
            <Text
              style={[
                estilos.sectionTitle,
                { color: colores.principal || '#4F46E5' },
              ]}
            >
              Información Médica
            </Text>
            {renderField(
              'Especialidad',
              user?.especialidad_nombre || '',
              'stethoscope',
              false,
              'especialidad_nombre'
            )}
            {renderField(
              'ID Médico',
              user?.id_medico || '',
              'medkit',
              false,
              'id_medico'
            )}
          </View>
        )}

        <View style={[estilos.section, estilos.seguridadCard]}>
          <Text style={estilos.seguridadTitulo}>Seguridad de la cuenta</Text>

          <TouchableOpacity
            onPress={() => confirmarYLogout('actual')}
            style={estilos.logoutBtn}
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
          >
            <FontAwesome name="sign-out" size={18} color="#fff" />
            <Text style={estilos.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => confirmarYLogout('todos')}
            style={estilos.logoutAllBtn}
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión en todos los dispositivos"
          >
            <FontAwesome name="ban" size={18} color="#EF4444" />
            <Text style={estilos.logoutAllText}>
              Cerrar sesión en todos los dispositivos
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={
            formData.fecha_nacimiento
              ? new Date(formData.fecha_nacimiento)
              : new Date(1990, 0, 1)
          }
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
          maximumDate={maxDate}
          onChange={onChangeFechaNacimiento}
        />
      )}

      <Modal
        visible={sexoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSexoModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: '#00000066',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              backgroundColor: colores.superficie || '#fff',
              borderRadius: 12,
              padding: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontWeight: '700', marginBottom: 8 }}>
              Seleccionar Sexo
            </Text>
            <Pressable
              style={estilos.sexOption}
              onPress={() => {
                setFormData((p) => ({ ...p, sexo: 'M' }));
                setSexoModalVisible(false);
              }}
            >
              <Text
                style={[
                  estilos.sexOptionText,
                  { color: colores.textoPrincipal || '#1E293B' },
                ]}
              >
                MASCULINO
              </Text>
            </Pressable>
            <Pressable
              style={estilos.sexOption}
              onPress={() => {
                setFormData((p) => ({ ...p, sexo: 'F' }));
                setSexoModalVisible(false);
              }}
            >
              <Text
                style={[
                  estilos.sexOptionText,
                  { color: colores.textoPrincipal || '#1E293B' },
                ]}
              >
                FEMENINO
              </Text>
            </Pressable>
            <Pressable
              style={[estilos.sexOption, { marginTop: 8 }]}
              onPress={() => setSexoModalVisible(false)}
            >
              <Text style={{ color: colores.textoSecundario || '#64748B' }}>
                Cancelar
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {isSubmitting && (
        <View style={estilos.overlay} pointerEvents="none">
          <View style={estilos.overlayBox}>
            <ActivityIndicator
              size="large"
              color={colores.principal || '#4F46E5'}
            />
            <Text
              style={{
                marginTop: 12,
                color: colores.textoSecundario || '#64748B',
              }}
            >
              Guardando cambios…
            </Text>
          </View>
        </View>
      )}

      {estaCargando && (
        <IndicadorCarga
          visible
          texto="Procesando…"
          tamaño="grande"
          tipo="bloques"
        />
      )}

      <ModalGeneral
        visible={modalVisible}
        type={modalType}
        message={modalMessage}
        onClose={() => setModalVisible(false)}
      />
    </LinearGradient>
  );
}