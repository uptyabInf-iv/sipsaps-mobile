// src/navigation/citasStackNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import PantallaCitas from '../screens/pantallaCitas';
import AgendarCita from '../screens/citas/agendarCita';
import HistorialCitas from '../screens/citas/historialCitas';
import GestionCitasMedico from '../screens/citas/gestionCitasMedico';

const CitasStack = createNativeStackNavigator();

export default function CitasStackNavigator() {
  return (
    <CitasStack.Navigator
      screenOptions={{
        headerShown: false, // Ocultamos los headers aquí para que cada pantalla los controle
      }}
    >
      {/* --- CORRECCIÓN: Se cambió PantallaCita a PantallaCitas --- */}
      <CitasStack.Screen name="CitasHome" component={PantallaCitas} />

      <CitasStack.Screen
        name="AgendarCita"
        component={AgendarCita}
        options={{
          headerShown: true,
          title: 'Agendar Nueva Cita',
          headerBackTitle: 'Volver',
        }}
      />
      <CitasStack.Screen
        name="HistorialCitas"
        component={HistorialCitas}
        options={{
          headerShown: true,
          title: 'Historial de Citas',
          headerBackTitle: 'Volver',
        }}
      />
      <CitasStack.Screen
        name="GestionCitasMedico"
        component={GestionCitasMedico}
        options={{
          headerShown: true,
          title: 'Panel de Citas',
          headerBackTitle: 'Volver',
        }}
      />
    </CitasStack.Navigator>
  );
}
