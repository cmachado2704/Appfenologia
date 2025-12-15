import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  onLogout: () => void;
};

const InicioScreen: React.FC<Props> = ({ onLogout }) => {
  const navigation = useNavigation<NavigationProp<any>>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* ENCABEZADO */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AgroCheck</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>

        {/* BOTONES PRINCIPALES */}
        <ScrollView contentContainerStyle={styles.scroll}>
          <TouchableOpacity
            style={styles.mainButton}
            onPress={() => navigation.navigate("Procesos")}
          >
            <Text style={styles.mainButtonText}>Gestión de Tomas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mainButton}
            onPress={() => navigation.navigate("DatosCampo")}
          >
            <Text style={styles.mainButtonText}>Datos de campo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mainButton}
            onPress={() => navigation.navigate("ConsultasMantenedores")}
          >
            <Text style={styles.mainButtonText}>Consultas y mantenedores</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.mainButton}>
            <Text style={styles.mainButtonText}>Capacitación</Text>
          </TouchableOpacity>

          {/* ESPACIO PARA QUE NO LO CUBRA LA BARRA DEL CELULAR */}
          <View style={{ height: 40 }} />
        </ScrollView>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#2f5d2c", // evita ver fondo blanco detrás del notch
  },
  container: {
    flex: 1,
    backgroundColor: "#2f5d2c",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#234d20",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
  },
  logoutButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ffffff",
  },
  logoutText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  scroll: {
    padding: 20,
    paddingBottom: 90, // ← NECESARIO para evitar que lo tape la barra inferior
  },
  mainButton: {
    backgroundColor: "#4a7c59",
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 15,
    borderRadius: 10,
  },
  mainButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
});

export default InicioScreen;
