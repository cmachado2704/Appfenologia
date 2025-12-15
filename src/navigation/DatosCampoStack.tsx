import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import DatosCampoMenuScreen from "../screens/DatosCampo/DatosCampoMenuScreen";
import InsertarRegistroTomaScreen from "../screens/DatosCampo/InsertarRegistroTomaScreen";
import VerEditarRegistrosScreen from "../screens/DatosCampo/VerEditarRegistrosScreen";
import GaleriaTomaScreen from "../screens/DatosCampo/GaleriaTomaScreen";
import InsertarConteoFrutosCaidosScreen from "../screens/DatosCampo/InsertarConteoFrutosCaidosScreen";
// ⭐ NUEVO: Calibración de frutos
import InsertarCalibracionFrutosScreen from "../screens/DatosCampo/InsertarCalibracionFrutosScreen";

// ⭐ (Pendiente): Conteo de frutos caídos
// import InsertarConteoFrutosCaidosScreen from "../screens/DatosCampo/InsertarConteoFrutosCaidosScreen";

const Stack = createNativeStackNavigator();

const DatosCampoStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#234d20" },
        headerTintColor: "#fff",
      }}
    >
      <Stack.Screen
        name="DatosCampoMenu"
        component={DatosCampoMenuScreen}
        options={{ title: "Datos de campo" }}
      />

      <Stack.Screen
        name="InsertarRegistroTomaScreen"
        component={InsertarRegistroTomaScreen}
        options={{ title: "Insertar registro" }}
      />

      {/* ⭐ NUEVO: INSERTAR CALIBRACIÓN DE FRUTOS */}
      <Stack.Screen
        name="InsertarCalibracionFrutosScreen"
        component={InsertarCalibracionFrutosScreen}
        options={{ title: "Calibración de Frutos" }}
      />

     <Stack.Screen
  name="InsertarConteoFrutosCaidosScreen"
  component={InsertarConteoFrutosCaidosScreen}
  options={{ title: "Conteo de Frutos Caídos" }}
/>

      <Stack.Screen
        name="VerEditarRegistros"
        component={VerEditarRegistrosScreen}
        options={{ title: "Ver / editar" }}
      />

      <Stack.Screen
        name="GaleriaToma"
        component={GaleriaTomaScreen}
        options={{ title: "Galería" }}
      />
    </Stack.Navigator>
  );
};

export default DatosCampoStack;
