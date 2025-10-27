// src/navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import PantallaSplash from '../screens/pantallaSplash';
import PantallaInicio from '../screens/pantallaInicio';
import NavegadorBottomBar from './navegadorBottomBar';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isAuthenticated ? (
          // --- GRUPO DE PANTALLAS POST-AUTENTICACIÓN ---
          // El BottomTabNavigator es ahora la pantalla principal.
          // Todas las sub-pantallas son manejadas DENTRO de sus respectivas pestañas.
          <Stack.Screen
            name="MainApp"
            component={NavegadorBottomBar}
            options={{ headerShown: false }}
          />
        ) : (
          // --- GRUPO DE PANTALLAS DE AUTENTICACIÓN ---
          <>
            <Stack.Screen
              name="Splash"
              component={PantallaSplash}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Inicio"
              component={PantallaInicio}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
