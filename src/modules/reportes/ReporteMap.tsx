import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Callout, Marker, Polygon, Region } from "react-native-maps";
import { ReporteCluster } from "./types";

type ReporteMapProps = {
  clusters: ReporteCluster[];
  selectedLoteCoords?: { latitud: number | null; longitud: number | null } | null;
  lotes?: Array<{
    id_lote?: string;
    nombre_lote: string;
    variedad?: string | null;
    latitud: number | null;
    longitud: number | null;
    geom?: any;
  }>;
};

const markerColorByProceso = {
  fenologia: "#2e7d32",
  calibracion: "#1976d2",
  conteo: "#ef6c00",
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

const parseGeomToPolygonRings = (geom: any): Array<Array<{ latitude: number; longitude: number }>> => {
  if (!geom) return [];

  let parsed = geom;
  if (typeof geom === "string") {
    try {
      parsed = JSON.parse(geom);
    } catch {
      return [];
    }
  }

  if (!parsed?.type || !parsed?.coordinates) return [];

  if (parsed.type === "Polygon") {
    return (parsed.coordinates || [])
      .map((ring: any[]) =>
        (ring || [])
          .map((coord: any[]) => ({ latitude: Number(coord[1]), longitude: Number(coord[0]) }))
          .filter((c: any) => Number.isFinite(c.latitude) && Number.isFinite(c.longitude))
      )
      .filter((ring: any[]) => ring.length > 2);
  }

  if (parsed.type === "MultiPolygon") {
    return (parsed.coordinates || [])
      .flatMap((poly: any[]) => poly || [])
      .map((ring: any[]) =>
        (ring || [])
          .map((coord: any[]) => ({ latitude: Number(coord[1]), longitude: Number(coord[0]) }))
          .filter((c: any) => Number.isFinite(c.latitude) && Number.isFinite(c.longitude))
      )
      .filter((ring: any[]) => ring.length > 2);
  }

  return [];
};

const getLoteBaseColor = (variedad?: string | null) => {
  const v = (variedad || "").trim().toUpperCase();

  // PALTOS → verde agrícola visible sobre satélite
  if (v === "PALTOS") {
    return {
      fill: "rgba(56,142,60,0.38)",     // verde translúcido visible
      stroke: "rgba(27,94,32,1)",       // borde verde fuerte
    };
  }

  // CÍTRICOS → amarillo cultivo
  if (v === "CITRICOS" || v === "CÍTRICOS") {
    return {
      fill: "rgba(255,235,59,0.38)",    // amarillo translúcido
      stroke: "rgba(245,127,23,1)",     // borde naranja intenso
    };
  }

  // fallback
  return {
    fill: "rgba(158,158,158,0.25)",
    stroke: "rgba(97,97,97,0.9)",
  };
};

const withOpacity = (rgba: string, alpha: number) => {
  const m = rgba.match(/rgba\((\d+),(\d+),(\d+),([0-9.]+)\)/i);
  if (!m) return rgba;
  return `rgba(${m[1]},${m[2]},${m[3]},${alpha})`;
};

const ReporteMap: React.FC<ReporteMapProps> = ({
  clusters,
  selectedLoteCoords,
  lotes = [],
}) => {
  const loteNameByCoords = useMemo(() => {
    if (selectedLoteCoords?.latitud == null || selectedLoteCoords?.longitud == null) return null;

    const match = lotes.find(
      (l) =>
        l.latitud != null &&
        l.longitud != null &&
        Math.abs(Number(l.latitud) - Number(selectedLoteCoords.latitud)) < 0.000001 &&
        Math.abs(Number(l.longitud) - Number(selectedLoteCoords.longitud)) < 0.000001
    );

    return match?.nombre_lote || null;
  }, [lotes, selectedLoteCoords]);

  const visibleClusters = useMemo(() => {
    if (!loteNameByCoords) return clusters;
    return clusters.filter((c) => c.registros[0]?.loteNombre === loteNameByCoords);
  }, [clusters, loteNameByCoords]);

  const fallbackClusters = useMemo<ReporteCluster[]>(() => {
    if (visibleClusters.length > 0) return visibleClusters;

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
  }, [visibleClusters, lotes]);

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

    const firstLoteWithCoords = lotes.find(
      (l) => l.latitud != null && l.longitud != null
    );
    if (firstLoteWithCoords) {
      return {
        latitude: Number(firstLoteWithCoords.latitud),
        longitude: Number(firstLoteWithCoords.longitud),
        latitudeDelta: 0.2,
        longitudeDelta: 0.2,
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
  }, [selectedLoteCoords, lotes, fallbackClusters]);

  return (
    <View style={styles.wrapper}>
      <MapView style={styles.map} mapType="satellite" initialRegion={initialRegion}>
        {lotes.map((lote) => {
          const rings = parseGeomToPolygonRings(lote.geom);
          if (!rings.length) return null;

          const baseColor = getLoteBaseColor(lote.variedad);
          const isSelected = loteNameByCoords ? lote.nombre_lote === loteNameByCoords : false;

          const fillColor = loteNameByCoords
            ? isSelected
              ? baseColor.fill
              : withOpacity(baseColor.fill, 0.1)
            : baseColor.fill;

          const strokeColor = loteNameByCoords
            ? isSelected
              ? baseColor.stroke
              : withOpacity(baseColor.stroke, 0.35)
            : baseColor.stroke;

          return rings.map((coords, idx) => (
           <Polygon
  key={`${lote.nombre_lote}-${idx}`}
  coordinates={coords}
  fillColor={
    isSelected
      ? "rgba(255,255,255,0.15)" // efecto foco
      : fillColor
  }
  strokeColor={
    isSelected
      ? "#000000" // borde negro fuerte
      : strokeColor
  }
  strokeWidth={isSelected ? 4 : 2}
  strokeDashPattern={isSelected ? [12, 6] : undefined}
/>
          ));
        })}

        {fallbackClusters.map((cluster, idx) => {
          const firstProcess = cluster.registros[0]?.proceso || "fenologia";
          const firstFecha = cluster.registros[0]?.fecha ?? null;
          const monthLabel = formatMonthYear(firstFecha);

          return (
            <Marker
              key={`${cluster.lat}-${cluster.lng}-${idx}`}
              coordinate={{ latitude: cluster.lat, longitude: cluster.lng }}
            >
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      markerColorByProceso[firstProcess as keyof typeof markerColorByProceso],
                  },
                ]}
              />
              <Callout>
                <View style={styles.callout}>
                  <Text style={styles.calloutText}>{monthLabel}</Text>
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
  dot: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },
  callout: { minWidth: 110, padding: 2 },
  calloutText: { fontSize: 12, color: "#1b1b1b", fontWeight: "600" },
});

export default ReporteMap;
