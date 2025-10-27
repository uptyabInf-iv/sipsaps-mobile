// src/navigation/navegadorBottomBar.js
// Bottom bar dinámica para móvil: Tabs inferiores con iconos FontAwesome, badges futuros.
// Ahora respeta safe-area (home indicator / gesture bar) y oculta con teclado (mejor UX).

import React, { useMemo } from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tabsConfig } from '../constants/configNavegacion';

const Tab = createBottomTabNavigator();

export default function NavegadorBottomBar() {
  // Memo para tabs (evita re-creación en re-renders).
  const tabs = useMemo(() => tabsConfig, []);
  const insets = useSafeAreaInsets();

  // Calcula un padding y altura del tabBar que respete el safe-area inferior.
  // En iOS con notch/indicator, insets.bottom suele ser > 0; en Android puede ser 0.
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 12);
  const baseHeight = 56; // altura base visual del tab bar
  const tabBarHeight = baseHeight + bottomInset; // altura total

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#4F46E5', // Indigo activo.
        tabBarInactiveTintColor: '#64748B', // Gris inactivo.
        // Usamos height calculada y paddingBottom igual al inset para evitar superposición.
        tabBarStyle: {
          height: tabBarHeight,
          paddingBottom: bottomInset,
          paddingTop: 6,
          borderTopWidth: 0,
          elevation: 8,
          shadowOpacity: 0.08,
          backgroundColor: '#FFF',
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
        },
        headerShown: false, // Sin header (usa custom si necesitas).
        tabBarHideOnKeyboard: true, // Oculta el tab bar cuando aparece el teclado (mejor UX).
        safeAreaInsets: { bottom: 0 }, // Ya manejamos insets manualmente arriba.
      }}
    >
      {tabs.map(({ name, label, icon, component }) => (
        <Tab.Screen
          key={name}
          name={name}
          component={component}
          options={{
            tabBarLabel: label, // Label accesible.
            tabBarIcon: ({ focused, color }) => icon(focused, color), // Icono dinámico.
            tabBarAccessibilityLabel: `Navegar a ${label}`, // Accesible.
          }}
        />
      ))}
    </Tab.Navigator>
  );
}