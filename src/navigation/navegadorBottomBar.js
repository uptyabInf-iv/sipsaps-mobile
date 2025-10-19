// src/navigation/navegadorBottomBar.js
// Bottom bar dinámica para móvil: Tabs inferiores con iconos FontAwesome, badges futuros.
// Reutilizable: Config de tabsConfig. Optimizada: useMemo para tabs, accesible (labels).

import React, { useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { tabsConfig } from '../constants/configNavegacion';

const Tab = createBottomTabNavigator();

export default function NavegadorBottomBar() {
  // Memo para tabs (evita re-creación en re-renders).
  const tabs = useMemo(() => tabsConfig, []);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#4F46E5', // Indigo activo.
        tabBarInactiveTintColor: '#64748B', // Gris inactivo.
        tabBarStyle: { paddingBottom: 10, height: 60 }, // Altura accesible.
        headerShown: false, // Sin header (usa custom si necesitas).
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
