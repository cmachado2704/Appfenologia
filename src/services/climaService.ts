import NetInfo from "@react-native-community/netinfo";
import { getCurrentPosition } from "../utils/location";

export type ClimaUbicacionPayload = {
  latitud: number;
  longitud: number;
  pais: string | null;
  departamento: string | null;
  provincia: string | null;
  distrito: string | null;
  temperatura_actual_c: number | null;
  humedad_relativa_pct: number | null;
  presion_atmosferica_hpa: number | null;
  nubosidad_pct: number | null;
  velocidad_del_viento_mps: number | null;
  direccion_del_viento: string | null;
  radiacion_solar_uv: number | null;
};

const toNumber = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const toNullableString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const fetchClimaYUbicacion = async (): Promise<ClimaUbicacionPayload> => {
  const net = await NetInfo.fetch();
  const isOnline = !!(net.isConnected && net.isInternetReachable);

  if (!isOnline) {
    throw new Error("Sin conexión a internet para consultar el clima.");
  }

  const gps = await getCurrentPosition();
  if (gps.lat == null || gps.lon == null) {
    throw new Error("No se pudo obtener la ubicación GPS. Verifica permisos de ubicación.");
  }

  const lat = gps.lat;
  const lon = gps.lon;

  const climaUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,pressure_msl,cloud_cover,wind_speed_10m,wind_direction_10m,uv_index`;
  const geoUrl = `https://geocode.maps.co/reverse?lat=${lat}&lon=${lon}`;

  const [climaResp, geoResp] = await Promise.all([
    fetch(climaUrl),
    fetch(geoUrl),
  ]);

  if (!climaResp.ok) {
    throw new Error("No se pudo consultar Open-Meteo.");
  }

  if (!geoResp.ok) {
    throw new Error("No se pudo consultar geocodificación inversa.");
  }

  const climaJson: any = await climaResp.json();
  const geoJson: any = await geoResp.json();

  const current = climaJson?.current || {};
  const address = geoJson?.address || {};
  const direccion = toNumber(current?.wind_direction_10m);

  const payload: ClimaUbicacionPayload = {
    latitud: lat,
    longitud: lon,
    pais: toNullableString(address?.country),
    departamento: toNullableString(address?.state),
    provincia: toNullableString(address?.county),
    distrito:
      toNullableString(address?.city_district) ||
      toNullableString(address?.suburb) ||
      toNullableString(address?.city) ||
      toNullableString(address?.town) ||
      toNullableString(address?.village),
    temperatura_actual_c: toNumber(current?.temperature_2m),
    humedad_relativa_pct: toNumber(current?.relative_humidity_2m),
    presion_atmosferica_hpa: toNumber(current?.pressure_msl),
    nubosidad_pct: toNumber(current?.cloud_cover),
    velocidad_del_viento_mps: toNumber(current?.wind_speed_10m),
    direccion_del_viento: direccion == null ? null : `${Math.round(direccion)}°`,
    radiacion_solar_uv: toNumber(current?.uv_index),
  };

  console.log("[climaService] Clima y ubicación:", payload);
  return payload;
};
