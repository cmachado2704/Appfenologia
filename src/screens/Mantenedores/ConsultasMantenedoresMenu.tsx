import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { ConsultasMantenedoresStackParamList } from "../../navigation/ConsultasMantenedoresStack";

const ConsultasMantenedoresMenu = () => {

  const navigation = useNavigation<NavigationProp<ConsultasMantenedoresStackParamList>>();

  return (
    <ScrollView contentContainerStyle={styles.container}>

      <Text style={styles.title}>Consultas y Mantenedores</Text>

      {/* ZONAS */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("MantenedorZonas")}
      >
        <Text style={styles.buttonText}>Zonas</Text>
      </TouchableOpacity>

      {/* ORIENTACIONES */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("MantenedorOrientaciones")}
      >
        <Text style={styles.buttonText}>Orientaciones</Text>
      </TouchableOpacity>

      {/* TIPOS DE ESTADO */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("MantenedorTiposEstado")}
      >
        <Text style={styles.buttonText}>Tipos de Estado</Text>
      </TouchableOpacity>

      {/* INSPECTORES */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("MantenedorInspectores")}
      >
        <Text style={styles.buttonText}>Inspectores</Text>
      </TouchableOpacity>

      {/* LOTES */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("MantenedorLotes")}
      >
        <Text style={styles.buttonText}>Lotes</Text>
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
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 25,
  },
  button: {
    backgroundColor: "#4a7c59",
    paddingVertical: 18,
    marginBottom: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
});

export default ConsultasMantenedoresMenu;
