import React from "react";
import { Text, View, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";

const CAMPANAS = ["2025-2026", "2026-2027", "2027-2028", "2028-2029", "2029-2030"];

type CampanaSelectProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
};

const CampanaSelect: React.FC<CampanaSelectProps> = ({ value, onChange, label = "Campaña" }) => {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={value} onValueChange={(v) => onChange(String(v || ""))}>
          <Picker.Item label="Seleccionar campaña" value="" />
          {CAMPANAS.map((campana) => (
            <Picker.Item key={campana} label={campana} value={campana} />
          ))}
        </Picker>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    marginTop: 12,
    marginBottom: 4,
    fontWeight: "600",
    color: "#234d20",
  },
  pickerContainer: {
    backgroundColor: "#eee",
    borderRadius: 8,
  },
});

export default CampanaSelect;
