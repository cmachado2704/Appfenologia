import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";

const GaleriaTomaScreen = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.text}>Pantalla Galería fotográfica (placeholder)</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f4f7f5",
  },
  text: {
    fontSize: 16,
    color: "#234d20",
    fontWeight: "600",
  },
});

export default GaleriaTomaScreen;
