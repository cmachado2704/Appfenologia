import React, { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import ReporteFilters from "../modules/reportes/ReporteFilters";
import ReporteMap from "../modules/reportes/ReporteMap";
import { useReporteData } from "../modules/reportes/useReporteData";

const ReportesScreen = () => {
  const [filtros, setFiltros] = useState({
    proceso: "fenologia" as "fenologia" | "calibracion" | "conteo",
    cultivo: null as string | null,
    lote: null as string | null,
  });

  const { loading, error, clusters, cultivos, lotes } = useReporteData(filtros);

  const selectedLoteCoords = useMemo(() => {
    if (!filtros.lote) return null;
    const lote = lotes.find((l) => l.nombre_lote === filtros.lote);
    if (!lote) return null;
    return { latitud: lote.latitud ?? null, longitud: lote.longitud ?? null };
  }, [filtros.lote, lotes]);

  return (
    <View style={styles.container}>
      <ReporteFilters
        filtros={filtros}
        setFiltros={setFiltros}
        cultivos={cultivos}
        lotes={lotes}
      />

      <View style={styles.mapContainer}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <ReporteMap clusters={clusters} selectedLoteCoords={selectedLoteCoords} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2f5d2c",
    padding: 12,
  },
  mapContainer: { flex: 1 },
  error: { color: "#fff" },
});

export default ReportesScreen;
