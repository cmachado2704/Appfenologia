import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { clusterPoints } from "./clusterUtils";
import { ReporteCluster, ReporteFiltros, ReporteRegistro } from "./types";

const procesoToTable = {
  fenologia: "tomas_fenologicas",
  calibracion: "calibracion_frutos",
  conteo: "conteo_frutos_caidos",
} as const;

const candidateFechaColumns = ["fecha_y_hora", "fecha_evaluacion", "fecha"] as const;
const candidateLoteColumns = ["lote_id", "nombre_lote", "codigo_lote"] as const;
const requiredCoordColumns = ["latitud", "longitud"] as const;

type LoteRow = {
  id_lote?: string;
  nombre_lote: string;
  codigo_lote?: string | null;
  latitud: number | null;
  longitud: number | null;
  variedad?: string | null;
};

type DetectedColumns = {
  latitud: boolean;
  longitud: boolean;
  fechaColumn: string | null;
  loteColumn: string | null;
};

const probeColumnExists = async (table: string, column: string): Promise<boolean> => {
  const { error } = await supabase.from(table).select(column).limit(1);
  if (!error) return true;

  const message = String(error.message || "").toLowerCase();
  if (message.includes("does not exist") || message.includes("column")) {
    return false;
  }

  return false;
};

const resolveColumns = async (table: string): Promise<DetectedColumns> => {
  const coordChecks = await Promise.all(
    requiredCoordColumns.map((col) => probeColumnExists(table, col))
  );

  const fechaChecks = await Promise.all(
    candidateFechaColumns.map((col) => probeColumnExists(table, col))
  );

  const loteChecks = await Promise.all(
    candidateLoteColumns.map((col) => probeColumnExists(table, col))
  );

  const fechaColumn =
    candidateFechaColumns.find((_, idx) => fechaChecks[idx]) ?? null;

  const loteColumn =
    candidateLoteColumns.find((_, idx) => loteChecks[idx]) ?? null;

  return {
    latitud: coordChecks[0],
    longitud: coordChecks[1],
    fechaColumn,
    loteColumn,
  };
};

export const resolveLoteColumn = async (tableName: string): Promise<string> => {
  const detected = await resolveColumns(tableName);
  return detected.loteColumn || "nombre_lote";
};

export const useReporteData = (filtros: ReporteFiltros) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registros, setRegistros] = useState<ReporteRegistro[]>([]);
  const [lotes, setLotes] = useState<LoteRow[]>([]);
  const [cultivos, setCultivos] = useState<string[]>([]);

  useEffect(() => {
    const loadCatalogos = async () => {
      const [{ data: cultivosData }, { data: lotesData }] = await Promise.all([
        supabase.from("cultivos").select("nombre").order("nombre"),
        supabase
          .from("lotes")
          .select("id_lote, nombre_lote, codigo_lote, latitud, longitud, variedad")
          .order("nombre_lote"),
      ]);

      setCultivos((cultivosData || []).map((c: any) => String(c.nombre)));
      setLotes((lotesData || []) as LoteRow[]);
    };

    loadCatalogos();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const table = procesoToTable[filtros.proceso];
        const detected = await resolveColumns(table);

        if (!detected.latitud || !detected.longitud) {
          setRegistros([]);
          setError("Tabla sin columnas de coordenadas requeridas.");
          return;
        }

        const selectFields = [
          "latitud",
          "longitud",
          detected.fechaColumn,
          detected.loteColumn,
        ].filter(Boolean) as string[];

        const { data, error: dbError } = await supabase
          .from(table)
          .select(selectFields.join(","));

        if (dbError) throw dbError;

        const base = (data || []) as any[];

        const lotesById = new Map(
          lotes
            .filter((l) => l.id_lote)
            .map((l) => [String(l.id_lote), l.nombre_lote])
        );

        const lotesByCodigo = new Map(
          lotes
            .filter((l) => l.codigo_lote)
            .map((l) => [String(l.codigo_lote), l.nombre_lote])
        );

        const lotesByNombre = new Map(lotes.map((l) => [l.nombre_lote, l]));

        let normalized: ReporteRegistro[] = base
          .map((row) => {
            const lat = Number(row.latitud);
            const lng = Number(row.longitud);

            if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
              return null;
            }

            const loteRaw = detected.loteColumn
              ? row[detected.loteColumn]
              : null;

            let loteNombre = "Sin lote";

            if (detected.loteColumn === "nombre_lote" && loteRaw) {
              loteNombre = String(loteRaw);
            } else if (detected.loteColumn === "codigo_lote" && loteRaw) {
              loteNombre = lotesByCodigo.get(String(loteRaw)) || String(loteRaw);
            } else if (detected.loteColumn === "lote_id" && loteRaw) {
              loteNombre = lotesById.get(String(loteRaw)) || String(loteRaw);
            }

            return {
              lat,
              lng,
              loteNombre,
              proceso: filtros.proceso,
              fecha: detected.fechaColumn ? row[detected.fechaColumn] ?? null : null,
            } as ReporteRegistro;
          })
          .filter(Boolean) as ReporteRegistro[];

        if (filtros.lote) {
          normalized = normalized.filter((r) => r.loteNombre === filtros.lote);
        }

        if (filtros.cultivo) {
          normalized = normalized.filter((r) => {
            const lote = lotesByNombre.get(r.loteNombre);
            return (lote?.variedad || "") === filtros.cultivo;
          });
        }

        setRegistros(normalized);
      } catch (e: any) {
        setError(e?.message || "No se pudo cargar reporte");
        setRegistros([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [filtros, lotes]);

  const clusters: ReporteCluster[] = useMemo(() => clusterPoints(registros), [registros]);

  return { loading, error, registros, clusters, cultivos, lotes };
};
