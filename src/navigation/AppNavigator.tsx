import React from "react";
import { StyleSheet, View } from "react-native";
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

const TabIcon = ({ name, color }: { name: string; color: string }) => (
  <View style={styles.iconWrap}>
    <Icon name={name} size={22} color={color} />
  </View>
);

const AppNavigator: React.FC<Props> = ({ onLogout }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarLabelPosition: "below-icon",
            tabBarShowLabel: true,
            tabBarItemStyle: styles.tabItem,
            tabBarIconStyle: styles.tabIcon,
            tabBarLabelStyle: styles.tabLabel,
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: "#ffffff",
            tabBarInactiveTintColor: "#9abfa4",
            tabBarAllowFontScaling: false,
          }}
        >
          <Tab.Screen
            name="Inicio"
            options={{
              tabBarIcon: ({ color }) => <TabIcon name="sprout" color={color} />,
            }}
          >
            {() => <InicioScreen onLogout={onLogout} />}
          </Tab.Screen>

          <Tab.Screen
            name="Procesos"
            component={GestionTomasStack}
            options={{
              tabBarIcon: ({ color }) => <TabIcon name="file-tree" color={color} />,
            }}
          />

          <Tab.Screen
            name="DatosCampo"
            component={DatosCampoStack}
            options={{
              tabBarButton: () => null,
              tabBarItemStyle: styles.hiddenTabItem,
              tabBarIcon: ({ color }) => <TabIcon name="account-hard-hat" color={color} />,
            }}
          />

          <Tab.Screen
            name="ConsultasMantenedores"
            component={ConsultasMantenedoresStack}
            options={{
              tabBarButton: () => null,
              tabBarItemStyle: styles.hiddenTabItem,
              tabBarIcon: ({ color }) => <TabIcon name="database-cog" color={color} />,
            }}
          />

          <Tab.Screen
            name="Reportes"
            component={ReportesScreen}
            options={{
              tabBarIcon: ({ color }) => <TabIcon name="chart-line" color={color} />,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#234d20",
  },
  tabBar: {
    backgroundColor: "#1e4020",
    borderTopWidth: 0,
    height: 68,
    paddingTop: 6,
    paddingBottom: 6,
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 0,
  },
  hiddenTabItem: {
    display: "none",
  },
  tabIcon: {
    marginTop: 0,
    marginBottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  tabLabel: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 0,
    marginBottom: 0,
    includeFontPadding: false,
  },
  iconWrap: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default AppNavigator;
