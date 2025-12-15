import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { SafeAreaView } from "react-native-safe-area-context";
import { View } from "react-native";

import InicioScreen from "../screens/InicioScreen";
import ReportesScreen from "../screens/ReportesScreen";
import GestionTomasStack from "./GestionTomasStack";
import DatosCampoStack from "./DatosCampoStack";
import ConsultasMantenedoresStack from "./ConsultasMantenedoresStack";

const Tab = createBottomTabNavigator();

type Props = { onLogout: () => void };

const AppNavigator: React.FC<Props> = ({ onLogout }) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#234d20" }}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,

            tabBarItemStyle: {
              justifyContent: "center",
              alignItems: "center",
            },

            tabBarIconStyle: {
              width: 30,
              height: 26,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: -2,
            },

            tabBarLabelStyle: {
              fontSize: 13,
              fontWeight: "600",
              marginTop: -2,
            },

            tabBarStyle: {
              backgroundColor: "#1e4020",
              borderTopWidth: 0,
              height: 68,
              paddingBottom: 8,
              paddingTop: 6,
              elevation: 12,
            },

            tabBarActiveTintColor: "#ffffff",
            tabBarInactiveTintColor: "#9abfa4",
          }}
        >

          {/* 🟢 INICIO */}
          <Tab.Screen
            name="Inicio"
            options={{
              tabBarIcon: ({ color }) => (
                <View style={{ width: 30, alignItems: "center" }}>
                  <Icon name="sprout" size={22} color={color} />
                </View>
              ),
            }}
          >
            {() => <InicioScreen onLogout={onLogout} />}
          </Tab.Screen>

          {/* 🟢 PROCESOS */}
          <Tab.Screen
            name="Procesos"
            component={GestionTomasStack}
            options={{
              tabBarIcon: ({ color }) => (
                <View style={{ width: 30, alignItems: "center" }}>
                  <Icon name="file-tree" size={22} color={color} />
                </View>
              ),
            }}
          />

          {/* 🔵 DATOS CAMPO (OCULTO – YA NO RESERVA ESPACIO) */}
          <Tab.Screen
            name="DatosCampo"
            component={DatosCampoStack}
            options={{
              tabBarButton: () => null,
              tabBarStyle: { display: "none" },  // 🔥 ELIMINA ESPACIO FANTASMA
              tabBarIcon: ({ color }) => (
                <View style={{ width: 30, alignItems: "center" }}>
                  <Icon name="account-hard-hat" size={22} color={color} />
                </View>
              ),
            }}
          />

          {/* 🔵 CONSULTAS (OCULTO – YA NO RESERVA ESPACIO) */}
          <Tab.Screen
            name="ConsultasMantenedores"
            component={ConsultasMantenedoresStack}
            options={{
              tabBarButton: () => null,
              tabBarStyle: { display: "none" }, // 🔥 ELIMINA ESPACIO FANTASMA
              tabBarIcon: ({ color }) => (
                <View style={{ width: 30, alignItems: "center" }}>
                  <Icon name="database-cog" size={22} color={color} />
                </View>
              ),
            }}
          />

          {/* 🟢 REPORTES */}
          <Tab.Screen
            name="Reportes"
            component={ReportesScreen}
            options={{
              tabBarIcon: ({ color }) => (
                <View style={{ width: 30, alignItems: "center" }}>
                  <Icon name="chart-line" size={22} color={color} />
                </View>
              ),
            }}
          />

        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
};

export default AppNavigator;
