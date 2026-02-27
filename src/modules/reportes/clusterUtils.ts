import { ReporteCluster, ReporteRegistro } from "./types";

const toRad = (deg: number) => (deg * Math.PI) / 180;

const distanceMeters = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const clusterPoints = (
  points: ReporteRegistro[],
  toleranceMeters = 8
): ReporteCluster[] => {
  const clusters: ReporteCluster[] = [];

  points.forEach((point) => {
    const found = clusters.find(
      (cluster) =>
        distanceMeters(cluster.lat, cluster.lng, point.lat, point.lng) <=
        toleranceMeters
    );

    if (!found) {
      clusters.push({
        lat: point.lat,
        lng: point.lng,
        total: 1,
        registros: [point],
      });
      return;
    }

    found.registros.push(point);
    found.total = found.registros.length;

    const acc = found.registros.reduce(
      (sum, row) => ({ lat: sum.lat + row.lat, lng: sum.lng + row.lng }),
      { lat: 0, lng: 0 }
    );

    found.lat = acc.lat / found.total;
    found.lng = acc.lng / found.total;
  });

  return clusters;
};
