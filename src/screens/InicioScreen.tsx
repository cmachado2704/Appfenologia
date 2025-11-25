import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";

type Props = {
  onLogout: () => void;
};

const InicioScreen: React.FC<Props> = ({ onLogout }) => {
  const navigation = useNavigation<NavigationProp<any>>();

  return (
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
        
        {/* Gestión de Tomas */}
        <TouchableOpacity
          style={styles.mainButton}
          onPress={() => navigation.navigate("Procesos")}
        >
          <Text style={styles.mainButtonText}>Gestión de Tomas</Text>
        </TouchableOpacity>

        {/* Datos de campo */}
        <TouchableOpacity
          style={styles.mainButton}
          onPress={() => navigation.navigate("DatosCampo")}
        >
          <Text style={styles.mainButtonText}>Datos de campo</Text>
        </TouchableOpacity>

        {/* Consultas y mantenedores */}
        <TouchableOpacity style={styles.mainButton}>
          <Text style={styles.mainButtonText}>Consultas y mantenedores</Text>
        </TouchableOpacity>

        {/* Capacitación */}
        <TouchableOpacity style={styles.mainButton}>
          <Text style={styles.mainButtonText}>Capacitación</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
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
    fontSize: 18,
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
