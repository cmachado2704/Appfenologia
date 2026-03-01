import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { SafeAreaView } from "react-native-safe-area-context";

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
            tabBarLabelPosition: "below-icon",
            tabBarItemStyle: {
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            },
            tabBarIconStyle: {
              justifyContent: "center",
              alignItems: "center",
            },
            tabBarLabelStyle: {
              fontSize: 13,
              fontWeight: "600",
              textAlign: "center",
            },
            tabBarStyle: {
              backgroundColor: "#1e4020",
              borderTopWidth: 0,
              height: 66,
              paddingVertical: 8,
              elevation: 12,
            },
            tabBarActiveTintColor: "#ffffff",
            tabBarInactiveTintColor: "#9abfa4",
          }}
        >
          <Tab.Screen
            name="Inicio"
            options={{
              tabBarIcon: ({ color }) => <Icon name="sprout" size={22} color={color} />,
            }}
          >
            {() => <InicioScreen onLogout={onLogout} />}
          </Tab.Screen>

          <Tab.Screen
            name="Procesos"
            component={GestionTomasStack}
            options={{
              tabBarIcon: ({ color }) => <Icon name="file-tree" size={22} color={color} />,
            }}
          />

          <Tab.Screen
            name="DatosCampo"
            component={DatosCampoStack}
            options={{
              tabBarButton: () => null,
              tabBarStyle: { display: "none" },
              tabBarIcon: ({ color }) => <Icon name="account-hard-hat" size={22} color={color} />,
            }}
          />

          <Tab.Screen
            name="ConsultasMantenedores"
            component={ConsultasMantenedoresStack}
            options={{
              tabBarButton: () => null,
              tabBarStyle: { display: "none" },
              tabBarIcon: ({ color }) => <Icon name="database-cog" size={22} color={color} />,
            }}
          />

          <Tab.Screen
            name="Reportes"
            component={ReportesScreen}
            options={{
              tabBarIcon: ({ color }) => <Icon name="chart-line" size={22} color={color} />,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
};

export default AppNavigator;
