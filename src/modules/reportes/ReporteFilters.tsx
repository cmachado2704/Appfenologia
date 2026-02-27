import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { ProcesoReporte, ReporteFiltros } from "./types";

type ReporteFiltersProps = {
  filtros: ReporteFiltros;
  setFiltros: React.Dispatch<React.SetStateAction<ReporteFiltros>>;
  cultivos: string[];
  lotes: Array<{ nombre_lote: string }>;
};

const procesos: ProcesoReporte[] = ["fenologia", "calibracion", "conteo"];

const ReporteFilters: React.FC<ReporteFiltersProps> = ({
  filtros,
  setFiltros,
  cultivos,
  lotes,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.tabsRow}>
        {procesos.map((proceso) => (
          <TouchableOpacity
            key={proceso}
            style={[styles.tab, filtros.proceso === proceso && styles.tabActive]}
            onPress={() => setFiltros((prev) => ({ ...prev, proceso }))}
          >
            <Text style={[styles.tabText, filtros.proceso === proceso && styles.tabTextActive]}>
              {proceso}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Cultivo</Text>
      <View style={styles.pickerWrap}>
        <Picker
          style={styles.picker}
          dropdownIconColor="#234d20"
          selectedValue={filtros.cultivo ?? ""}
          onValueChange={(value) =>
            setFiltros((prev) => ({ ...prev, cultivo: value ? String(value) : null }))
          }
        >
          <Picker.Item label="Todos" value="" />
          {cultivos.map((cultivo) => (
            <Picker.Item key={cultivo} label={cultivo} value={cultivo} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Lote</Text>
      <View style={styles.pickerWrap}>
        <Picker
          style={styles.picker}
          dropdownIconColor="#234d20"
          selectedValue={filtros.lote ?? ""}
          onValueChange={(value) =>
            setFiltros((prev) => ({ ...prev, lote: value ? String(value) : null }))
          }
        >
          <Picker.Item label="Todos" value="" />
          {lotes.map((lote) => (
            <Picker.Item key={lote.nombre_lote} label={lote.nombre_lote} value={lote.nombre_lote} />
          ))}
        </Picker>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: "#fff", borderRadius: 10, padding: 10, marginBottom: 10 },
  tabsRow: { flexDirection: "row", marginBottom: 8 },
  tab: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: "#d9d9d9",
    borderRadius: 8,
    marginRight: 6,
    alignItems: "center",
  },
  tabActive: { backgroundColor: "#234d20" },
  tabText: { color: "#1f1f1f", textTransform: "capitalize" },
  tabTextActive: { color: "#fff", fontWeight: "700" },
  label: { color: "#234d20", fontWeight: "700", marginBottom: 4, marginTop: 4 },
  pickerWrap: { backgroundColor: "#eee", borderRadius: 8 },
  picker: { color: "#1b1b1b" },
});

export default ReporteFilters;
