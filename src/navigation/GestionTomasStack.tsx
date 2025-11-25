import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import GestionTomasMenu from "../screens/GestionTomas/GestionTomasMenu";
import CrearTomaScreen from "../screens/GestionTomas/CrearTomaScreen";
import AprobarEditarTomas from "../screens/GestionTomas/AprobarEditarTomas";
import PlanificacionTomasScreen from "../screens/GestionTomas/PlanificacionTomasScreen";

const Stack = createNativeStackNavigator();

const GestionTomasStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GestionTomasMenu" component={GestionTomasMenu} />
      <Stack.Screen name="CrearToma" component={CrearTomaScreen} />
      <Stack.Screen name="AprobarEditarTomas" component={AprobarEditarTomas} />
      <Stack.Screen name="PlanificacionTomas" component={PlanificacionTomasScreen} />
    </Stack.Navigator>
  );
};

export default GestionTomasStack;
