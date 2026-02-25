import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Callout, Marker, Region } from "react-native-maps";
import { ReporteCluster } from "./types";

type ReporteMapProps = {
  clusters: ReporteCluster[];
  selectedLoteCoords?: { latitud: number | null; longitud: number | null } | null;
  lotes?: Array<{ nombre_lote: string; latitud: number | null; longitud: number | null }>;
};

const colorByProceso = {
  fenologia: "green",
  calibracion: "blue",
  conteo: "orange",
} as const;

const defaultPeruRegion: Region = {
  latitude: -9.19,
  longitude: -75.0152,
  latitudeDelta: 8,
  longitudeDelta: 8,
};

const formatMonthYear = (iso: string | null) => {
  if (!iso) return "Sin fecha";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(date);
};

const ReporteMap: React.FC<ReporteMapProps> = ({
  clusters,
  selectedLoteCoords,
  lotes = [],
}) => {
  const fallbackClusters = useMemo<ReporteCluster[]>(() => {
    if (clusters.length > 0) return clusters;

    return lotes
      .filter((l) => l.latitud != null && l.longitud != null)
      .map((l) => ({
        lat: Number(l.latitud),
        lng: Number(l.longitud),
        total: 0,
        registros: [
          {
            lat: Number(l.latitud),
            lng: Number(l.longitud),
            loteNombre: l.nombre_lote,
            proceso: "fenologia",
            fecha: null,
          },
        ],
      }));
  }, [clusters, lotes]);

  const initialRegion = useMemo<Region>(() => {
    if (
      selectedLoteCoords?.latitud != null &&
      selectedLoteCoords?.longitud != null
    ) {
      return {
        latitude: selectedLoteCoords.latitud,
        longitude: selectedLoteCoords.longitud,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    if (fallbackClusters.length > 0) {
      return {
        latitude: fallbackClusters[0].lat,
        longitude: fallbackClusters[0].lng,
        latitudeDelta: 0.2,
        longitudeDelta: 0.2,
      };
    }

    return defaultPeruRegion;
  }, [selectedLoteCoords, fallbackClusters]);

  return (
    <View style={styles.wrapper}>
      <MapView style={styles.map} initialRegion={initialRegion}>
        {fallbackClusters.map((cluster, idx) => {
          const firstProcess = cluster.registros[0]?.proceso || "fenologia";

          const summaryByMonth = new Map<string, number>();
          cluster.registros.forEach((r) => {
            const key = formatMonthYear(r.fecha);
            summaryByMonth.set(key, (summaryByMonth.get(key) || 0) + 1);
          });

          return (
            <Marker
              key={`${cluster.lat}-${cluster.lng}-${idx}`}
              coordinate={{ latitude: cluster.lat, longitude: cluster.lng }}
              pinColor={colorByProceso[firstProcess as keyof typeof colorByProceso]}
            >
              <Callout>
                <View style={styles.callout}>
                  <Text style={styles.title}>{cluster.registros[0]?.loteNombre || "Sin lote"}</Text>
                  <Text style={styles.body}>Proceso: {firstProcess}</Text>
                  <Text style={styles.body}>Total registros: {cluster.total}</Text>

                  {Array.from(summaryByMonth.entries()).map(([label, total]) => (
                    <Text key={label} style={styles.body}>
                      {label} — {total}
                    </Text>
                  ))}
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  map: { flex: 1, borderRadius: 10 },
  callout: { minWidth: 180, padding: 4 },
  title: { fontSize: 14, fontWeight: "700", color: "#1b1b1b", marginBottom: 4 },
  body: { fontSize: 12, color: "#1b1b1b", marginBottom: 2 },
});

export default ReporteMap;
