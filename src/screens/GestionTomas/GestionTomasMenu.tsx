import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";

const GestionTomasMenu: React.FC = () => {
  const navigation = useNavigation<NavigationProp<any>>();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Gestión de Tomas</Text>

      {/* 1. CREAR / APROBAR TOMA */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("CrearToma")}
      >
        <Text style={styles.buttonText}>1. Crear / aprobar toma</Text>
      </TouchableOpacity>

      {/* 2. PLANIFICACIÓN DE TOMAS */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("PlanificacionTomas")}
      >
        <Text style={styles.buttonText}>2. Planificación de tomas</Text>
      </TouchableOpacity>

      {/* 3. CUMPLIMIENTO DEL PLAN (AÚN SIN CODIGO) */}
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>3. Cumplimiento del plan</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#2f5d2c",
    flexGrow: 1,
  },
  title: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#4a7c59",
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default GestionTomasMenu;
