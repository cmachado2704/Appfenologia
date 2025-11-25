import React from "react";
import { View, Text, StyleSheet } from "react-native";

const InicioScreen = () => {
  return (
    <View style={styles.container}>
<Text style={styles.text}>Pantalla Reportes</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2f5d2c", // verde profesional agroindustrial
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
  },
});

export default InicioScreen;
