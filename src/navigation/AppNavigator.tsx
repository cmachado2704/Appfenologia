import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";

// Screens principales
import InicioScreen from "../screens/InicioScreen";
import ReportesScreen from "../screens/ReportesScreen";

// STACKS
import GestionTomasStack from "./GestionTomasStack";
import DatosCampoStack from "./DatosCampoStack";  // ← NUEVO

const Tab = createBottomTabNavigator();

type Props = {
  onLogout: () => void;
};

const AppNavigator: React.FC<Props> = ({ onLogout }) => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#234d20",
            borderTopWidth: 0,
            height: 65,
          },
          tabBarActiveTintColor: "#ffffff",
          tabBarInactiveTintColor: "#c7e6b9",
          tabBarLabelStyle: {
            fontSize: 14,
            fontWeight: "600",
          },
        }}
      >

        {/* INICIO */}
        <Tab.Screen name="Inicio">
          {() => <InicioScreen onLogout={onLogout} />}
        </Tab.Screen>

        {/* PROCESOS → STACK DE TOMAS */}
        <Tab.Screen 
          name="Procesos" 
          component={GestionTomasStack} 
        />

        {/* DATOS DE CAMPO → STACK OCULTO */}
        <Tab.Screen
          name="DatosCampo"
          component={DatosCampoStack}
          options={{
            tabBarButton: () => null,    // ← OCULTA EL TAB
          }}
        />

        {/* REPORTES */}
        <Tab.Screen name="Reportes" component={ReportesScreen} />

      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
