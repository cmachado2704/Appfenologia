import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../services/supabaseClient";

// 🔑 Claves internas para almacenamiento local
const KEYS = {
  LOTES: "cache_lotes",
  TOMAS: "cache_tomas",
  ZONAS: "cache_zonas",
  ORIENTACIONES: "cache_orientaciones",
  TIPOS_ESTADO: "cache_tipos_estado",
  CLASIF_TAMANO: "cache_clasificacion_tamano",

  // 🆕 NUEVOS CATÁLOGOS
  SECTOR: "cache_sector",
  LADO_VARIEDAD: "cache_lado_variedad",
};

// ---------------------------------------------------------
// GUARDAR
// ---------------------------------------------------------
async function save(key: string, data: any[]) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.log("Error guardando cache:", key, e);
  }
}

// ---------------------------------------------------------
// LEER
// ---------------------------------------------------------
async function load(key: string) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.log("Error leyendo cache:", key, e);
    return [];
  }
}

// ---------------------------------------------------------
// ⭐ OPCIONAL: MIGRACIÓN PARA CACHE ANTIGUO SIN tipo_toma
// ---------------------------------------------------------
async function migrateOldTomasCache() {
  const raw = await load(KEYS.TOMAS);

  if (!raw || raw.length === 0) return raw;

  const needsMigration = raw.some((t: any) => !t.tipo_toma);

  if (!needsMigration) return raw;

  console.log("♻️ Migrando cache de TOMAS (faltaba tipo_toma)…");

  const updated = raw.map((t: any) => ({
    ...t,
    tipo_toma: t.tipo_toma || "generica",
  }));

  await save(KEYS.TOMAS, updated);
  return updated;
}

// ---------------------------------------------------------
// 🔥 DESCARGA Y GUARDA TODOS LOS CATÁLOGOS
// ---------------------------------------------------------
export async function updateCatalogCache() {
  console.log("📥 Actualizando catálogos desde Supabase...");

  /* ================= LOTES ================= */
  const { data: lotes, error: errLotes } = await supabase
    .from("lotes")
    .select("id_lote, nombre_lote, variedad, codigo_lote, latitud, longitud");

  if (errLotes) console.log("❌ Error cargando LOTES:", errLotes);
  if (lotes) await save(KEYS.LOTES, lotes);

  /* ================= TOMAS ================= */
  const { data: tomas, error: errTomas } = await supabase
    .from("tomas")
    .select(`
      id_toma,
      n_de_toma,
      codigo_lote,
      nombre_lote,
      variedad,
      muestra_sugerida,
      estado,
      tipo_toma
    `)
    .eq("estado", "creada");

  if (errTomas) console.log("❌ Error cargando TOMAS:", errTomas);

  if (tomas) {
    const normalizadas = tomas.map((t) => ({
      ...t,
      tipo_toma: t.tipo_toma || "generica",
    }));
    await save(KEYS.TOMAS, normalizadas);
  }

  /* ================= ZONAS ================= */
  const { data: zonas, error: errZonas } = await supabase
    .from("zonas")
    .select("id_zona, nombre_zona");

  if (errZonas) console.log("❌ Error cargando ZONAS:", errZonas);
  if (zonas) await save(KEYS.ZONAS, zonas);

  /* ================= ORIENTACIONES ================= */
  const { data: orient, error: errOrient } = await supabase
    .from("orientaciones")
    .select("id_orientacion, nombre_orientacion");

  if (errOrient) console.log("❌ Error cargando ORIENTACIONES:", errOrient);
  if (orient) await save(KEYS.ORIENTACIONES, orient);

  /* ================= TIPOS ESTADO ================= */
  const { data: tipos, error: errTipos } = await supabase
    .from("tipos_estado")
    .select("id_estado, cultivo, es_estado, tipo_estado");

  if (errTipos) console.log("❌ Error cargando TIPOS_ESTADO:", errTipos);

  await save(
    KEYS.TIPOS_ESTADO,
    Array.isArray(tipos) ? tipos : []
  );

  /* ================= CLASIFICACION TAMAÑO ================= */
  const { data: clasifTam, error: errClasif } = await supabase
    .from("clasificacion_tamano")
    .select("codigo, tamano");

  if (errClasif)
    console.log("❌ Error cargando CLASIFICACION_TAMANO:", errClasif);
  if (clasifTam) await save(KEYS.CLASIF_TAMANO, clasifTam);

  /* ================= 🆕 SECTOR ================= */
  const { data: sectores, error: errSector } = await supabase
    .from("sector")
    .select("id, nombre");

  if (errSector) console.log("❌ Error cargando SECTOR:", errSector);
  if (sectores) await save(KEYS.SECTOR, sectores);

  /* ================= 🆕 LADO VARIEDAD ================= */
  const { data: lados, error: errLado } = await supabase
    .from("lado_variedad")
    .select("id, nombre");

  if (errLado) console.log("❌ Error cargando LADO_VARIEDAD:", errLado);
  if (lados) await save(KEYS.LADO_VARIEDAD, lados);

  /* ================= MIGRACIONES ================= */
  await migrateOldTomasCache();

  console.log("✅ Catálogos OFFLINE actualizados correctamente");
}

// ---------------------------------------------------------
// 📦 MÉTODOS DE LECTURA OFFLINE
// ---------------------------------------------------------
export const CatalogCache = {
  loadLotes: () => load(KEYS.LOTES),
  loadTomas: () => load(KEYS.TOMAS),
  loadZonas: () => load(KEYS.ZONAS),
  loadOrientaciones: () => load(KEYS.ORIENTACIONES),
  loadTiposEstado: () => load(KEYS.TIPOS_ESTADO),
  loadClasificacionTamano: () => load(KEYS.CLASIF_TAMANO),

  // 🆕 NUEVOS LOADERS
  loadSector: () => load(KEYS.SECTOR),
  loadLadoVariedad: () => load(KEYS.LADO_VARIEDAD),
};
