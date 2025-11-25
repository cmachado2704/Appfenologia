import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import DatosCampoMenuScreen from "../screens/DatosCampo/DatosCampoMenuScreen";
import InsertarRegistroTomaScreen from "../screens/DatosCampo/InsertarRegistroTomaScreen";
import VerEditarRegistrosScreen from "../screens/DatosCampo/VerEditarRegistrosScreen";
import GaleriaTomaScreen from "../screens/DatosCampo/GaleriaTomaScreen";


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
        name="InsertarRegistroToma"
        component={InsertarRegistroTomaScreen}
        options={{ title: "Insertar registro" }}
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
