import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// =============================================================
//   TIPADO DE RUTAS DEL STACK
// =============================================================
export type ConsultasMantenedoresStackParamList = {
  ConsultasMantenedoresMenu: undefined;
  MantenedorZonas: undefined;
  MantenedorOrientaciones: undefined;
  MantenedorTiposEstado: undefined;
  MantenedorInspectores: undefined;
  MantenedorLotes: undefined;
};

// =============================================================
//   IMPORTS DE PANTALLAS
// =============================================================
// Usa rutas absolutas basadas en tu estructura real
import ConsultasMantenedoresMenu from "../screens/Mantenedores/ConsultasMantenedoresMenu.tsx";
import MantenedorZonas from "../screens/Mantenedores/MantenedorZonas.tsx";
import MantenedorOrientaciones from "../screens/Mantenedores/MantenedorOrientaciones.tsx";
import MantenedorTiposEstado from "../screens/Mantenedores/MantenedorTiposEstado.tsx";
import MantenedorInspectores from "../screens/Mantenedores/MantenedorInspectores.tsx";
import MantenedorLotes from "../screens/Mantenedores/MantenedorLotes.tsx";

// Crear stack tipado
const Stack = createNativeStackNavigator<ConsultasMantenedoresStackParamList>();

const ConsultasMantenedoresStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      
      <Stack.Screen
        name="ConsultasMantenedoresMenu"
        component={ConsultasMantenedoresMenu}
      />

      <Stack.Screen name="MantenedorZonas" component={MantenedorZonas} />
      <Stack.Screen name="MantenedorOrientaciones" component={MantenedorOrientaciones} />

      <Stack.Screen name="MantenedorTiposEstado" component={MantenedorTiposEstado} />

      <Stack.Screen
        name="MantenedorInspectores"
        component={MantenedorInspectores}
      />

      <Stack.Screen name="MantenedorLotes" component={MantenedorLotes} />

    </Stack.Navigator>
  );
};

export default ConsultasMantenedoresStack;
