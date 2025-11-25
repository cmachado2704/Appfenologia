import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";

const DatosCampoMenuScreen = ({ navigation }: any) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Datos de campo</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("InsertarRegistroToma")}
      >
        <Text style={styles.buttonText}>1. Insertar registros a una toma</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("VerEditarRegistros")}
      >
        <Text style={styles.buttonText}>2. Ver / editar registros</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("GaleriaToma")}
      >
        <Text style={styles.buttonText}>3. Galería fotográfica</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: "#f4f7f5",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#234d20",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#ef6c00",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 14,
    elevation: 2,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});

export default DatosCampoMenuScreen;
