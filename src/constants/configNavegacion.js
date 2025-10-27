// src/constants/configNavegacion.js
import { FontAwesome } from '@expo/vector-icons';
import PantallaDashboard from '../screens/pantallaDashboard';
import PantallaPerfil from '../screens/pantallaPerfil';
import CitasStackNavigator from '../navigation/citasStackNavigator'; // <-- IMPORTANTE: Apunta al nuevo Stack

export const tabsConfig = [
  {
    name: 'Dashboard',
    label: 'Inicio',
    icon: (focused, color) => (
      <FontAwesome name="home" size={24} color={color} />
    ),
    component: PantallaDashboard,
  },
  {
    name: 'CitasTab',
    label: 'Citas',
    icon: (focused, color) => (
      <FontAwesome name="calendar" size={24} color={color} />
    ),
    component: CitasStackNavigator, // <-- IMPORTANTE: El componente es el Stack Navigator completo
  },
  {
    name: 'Perfil',
    label: 'Perfil',
    icon: (focused, color) => (
      <FontAwesome name="user" size={24} color={color} />
    ),
    component: PantallaPerfil,
  },
];
