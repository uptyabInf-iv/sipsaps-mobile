// src/navigation/AppNavigator.js
// Configuración principal de navegación: Stack con Splash inicial y pantallas principales.
// Usa React Navigation para stacks nativos, optimizados para mobile.

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PantallaSplash from '../screens/pantallaSplash';
import PantallaInicio from '../screens/pantallaInicio';
import PantallaDashboard from '../screens/pantallaDashboard';
const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen
          name="Splash"
          component={PantallaSplash}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Inicio"
          component={PantallaInicio}
          options={{ title: 'Inicio' }}
        />

        <Stack.Screen
          name="Dashboard"
          component={PantallaDashboard}
          options={{ title: 'Dashboard' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
