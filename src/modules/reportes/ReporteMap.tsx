import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ReporteCluster } from "./types";

type ReporteMapProps = {
  clusters: ReporteCluster[];
  selectedLoteCoords?: { latitud: number | null; longitud: number | null } | null;
};

const colorByProceso = {
  fenologia: "#2e7d32",
  calibracion: "#1976d2",
  conteo: "#ef6c00",
} as const;

const formatMonthYear = (iso: string | null) => {
  if (!iso) return "Sin fecha";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(date);
};

const toPosition = (
  value: number,
  min: number,
  max: number,
  fallback: number
): number => {
  if (!Number.isFinite(value) || min === max) return fallback;
  const pct = ((value - min) / (max - min)) * 100;
  const clamped = Math.max(5, Math.min(95, pct));
  return clamped;
};

const ReporteMap: React.FC<ReporteMapProps> = ({ clusters, selectedLoteCoords }) => {
  const [selected, setSelected] = useState<ReporteCluster | null>(null);

  const bounds = useMemo(() => {
    if (!clusters.length) {
      return { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 };
    }

    return clusters.reduce(
      (acc, c) => ({
        minLat: Math.min(acc.minLat, c.lat),
        maxLat: Math.max(acc.maxLat, c.lat),
        minLng: Math.min(acc.minLng, c.lng),
        maxLng: Math.max(acc.maxLng, c.lng),
      }),
      {
        minLat: clusters[0].lat,
        maxLat: clusters[0].lat,
        minLng: clusters[0].lng,
        maxLng: clusters[0].lng,
      }
    );
  }, [clusters]);

  const center = useMemo(() => {
    if (
      selectedLoteCoords?.latitud != null &&
      selectedLoteCoords?.longitud != null
    ) {
      return { lat: selectedLoteCoords.latitud, lng: selectedLoteCoords.longitud };
    }

    if (!clusters.length) return null;

    const total = clusters.length;
    const acc = clusters.reduce(
      (sum, c) => ({ lat: sum.lat + c.lat, lng: sum.lng + c.lng }),
      { lat: 0, lng: 0 }
    );

    return { lat: acc.lat / total, lng: acc.lng / total };
  }, [clusters, selectedLoteCoords]);

  const summaryByMonth = useMemo(() => {
    if (!selected) return [] as Array<{ label: string; total: number }>;

    const byMonth = new Map<string, number>();

    selected.registros.forEach((r) => {
      const key = formatMonthYear(r.fecha);
      byMonth.set(key, (byMonth.get(key) || 0) + 1);
    });

    return Array.from(byMonth.entries()).map(([label, total]) => ({ label, total }));
  }, [selected]);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.centerLabel}>
        {center ? `Centro: ${center.lat.toFixed(5)}, ${center.lng.toFixed(5)}` : "Sin coordenadas"}
      </Text>

      <View style={styles.mapArea}>
        {clusters.map((cluster, idx) => {
          const firstProcess = cluster.registros[0]?.proceso || "fenologia";
          const top = toPosition(cluster.lat, bounds.minLat, bounds.maxLat, 50);
          const left = toPosition(cluster.lng, bounds.minLng, bounds.maxLng, 50);

          return (
            <TouchableOpacity
              key={`${cluster.lat}-${cluster.lng}-${idx}`}
              style={[
                styles.marker,
                {
                  backgroundColor:
                    colorByProceso[firstProcess as keyof typeof colorByProceso] || "#2e7d32",
                  top: `${top}%` as any,
                  left: `${left}%` as any,
                },
              ]}
              onPress={() => setSelected(cluster)}
            >
              <Text style={styles.markerText}>{cluster.total}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal visible={!!selected} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setSelected(null)}>
          <View style={styles.modalCard}>
            <Text style={styles.title}>{selected?.registros[0]?.loteNombre || "Sin lote"}</Text>
            <Text style={styles.body}>Proceso: {selected?.registros[0]?.proceso || "-"}</Text>
            <Text style={styles.body}>Total registros: {selected?.total || 0}</Text>

            {summaryByMonth.map((item) => (
              <Text key={item.label} style={styles.body}>
                {item.label} — {item.total}
              </Text>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  centerLabel: { color: "#fff", marginBottom: 8, fontSize: 12 },
  mapArea: {
    flex: 1,
    backgroundColor: "#d7e8d2",
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  marker: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -14,
    marginTop: -14,
  },
  markerText: { color: "#fff", fontWeight: "700", fontSize: 11 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: { backgroundColor: "#fff", borderRadius: 10, padding: 16 },
  title: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  body: { fontSize: 14, marginBottom: 4 },
});

export default ReporteMap;
