import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { clusterPoints } from "./clusterUtils";
import { ReporteCluster, ReporteFiltros, ReporteRegistro } from "./types";

const procesoToTable = {
  fenologia: "tomas_fenologicas",
  calibracion: "calibracion_frutos",
  conteo: "conteo_frutos_caidos",
} as const;

const procesoToFechaColumn = {
  fenologia: "fecha_y_hora",
  calibracion: "fecha_evaluacion",
  conteo: "fecha_evaluacion",
} as const;

type LoteRow = {
  id_lote?: string;
  nombre_lote: string;
  variedad?: string | null;
  latitud: number | null;
  longitud: number | null;
  geom?: any;
};

type ReporteMetric = {
  key: string;
  value: number;
};

export const useReporteData = (filtros: ReporteFiltros) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registros, setRegistros] = useState<ReporteRegistro[]>([]);
  const [allLotes, setAllLotes] = useState<LoteRow[]>([]);
  const [cultivos, setCultivos] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<ReporteMetric[]>([]);

  // -------------------------
  // CARGAR LOTES
  // -------------------------
  useEffect(() => {
    const loadCatalogos = async () => {
      const { data } = await supabase
        .from("lotes")
        .select("id_lote, nombre_lote, variedad, latitud, longitud, geom")
        .order("nombre_lote");

      const rows = (data || []) as LoteRow[];
      setAllLotes(rows);

      const variedades = Array.from(
        new Set(
          rows.map((l) => (l.variedad || "").trim()).filter(Boolean)
        )
      ).sort();

      setCultivos(variedades);
    };

    loadCatalogos();
  }, []);

  // -------------------------
  // FILTRO DE LOTES
  // -------------------------
  const visibleLotes = useMemo(() => {
    if (!filtros.cultivo) return allLotes;
    return allLotes.filter(
      (l) => (l.variedad || "").trim() === filtros.cultivo
    );
  }, [allLotes, filtros.cultivo]);

  // -------------------------
  // CARGAR REGISTROS
  // -------------------------
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const procesos =
          filtros.proceso === "todos"
            ? ["fenologia", "calibracion", "conteo"]
            : [filtros.proceso];

        let allData: ReporteRegistro[] = [];

        for (const p of procesos) {
          const table = procesoToTable[p as keyof typeof procesoToTable];
          const fechaColumn =
            procesoToFechaColumn[p as keyof typeof procesoToFechaColumn];

          let query = supabase
            .from(table)
            .select(`latitud,longitud,${fechaColumn},nombre_lote`)
            .not("latitud", "is", null)
            .not("longitud", "is", null);

          if (filtros.lote) {
            query = query.eq("nombre_lote", filtros.lote);
          }

          const { data, error } = await query;
          if (error) throw error;

          const normalized: ReporteRegistro[] = ((data || []) as any[])
            .map((row) => {
              const lat = Number(row.latitud);
              const lng = Number(row.longitud);
              if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

              return {
                lat,
                lng,
                loteNombre:
                  row.nombre_lote?.trim() || "Sin lote",
                proceso: p as Exclude<
                  typeof filtros.proceso,
                  "todos"
                >,
                fecha: row[fechaColumn] ?? null,
              };
            })
            .filter(Boolean) as ReporteRegistro[];

          allData.push(...normalized);
        }

        // filtro cultivo
        const visibleNames = new Set(
          visibleLotes.map((l) => l.nombre_lote)
        );

        allData = allData.filter((r) =>
          r.loteNombre === "Sin lote"
            ? !filtros.cultivo
            : visibleNames.has(r.loteNombre)
        );

        // filtro lote
        if (filtros.lote) {
          allData = allData.filter(
            (r) => r.loteNombre === filtros.lote
          );
        }

        setRegistros(allData);

        // -------------------------
        // METRICS (solo cuando no es "todos")
        // -------------------------
        if (filtros.proceso === "todos") {
          setMetrics([]);
          return;
        }

        const lotesForMetrics = filtros.lote
          ? [filtros.lote]
          : visibleLotes.map((l) => l.nombre_lote);

        let metricRows: ReporteMetric[] = [];

        if (filtros.proceso === "fenologia") {
          let q = supabase
            .from("tomas_fenologicas")
            .select("nombre_lote,es_estado,avg:cantidad.avg()")
            .not("cantidad", "is", null);

          if (lotesForMetrics.length) {
            q = q.in("nombre_lote", lotesForMetrics);
          }

          const { data } = await q;

          metricRows = ((data || []) as any[])
            .map((r) => ({
              key: filtros.lote
                ? r.es_estado || "Sin estado"
                : `${r.nombre_lote} - ${r.es_estado || "Sin estado"}`,
              value: Number(r.avg || 0),
            }))
            .filter((r) => Number.isFinite(r.value));
        }

        if (filtros.proceso === "calibracion") {
          let q = supabase
            .from("calibracion_frutos")
            .select("nombre_lote,clasificacion,avg:calibre.avg()")
            .not("calibre", "is", null);

          if (lotesForMetrics.length) {
            q = q.in("nombre_lote", lotesForMetrics);
          }

          const { data } = await q;

          metricRows = ((data || []) as any[])
            .map((r) => ({
              key: filtros.lote
                ? r.clasificacion || "Sin clasificacion"
                : `${r.nombre_lote} - ${r.clasificacion || "Sin clasificacion"}`,
              value: Number(r.avg || 0),
            }))
            .filter((r) => Number.isFinite(r.value));
        }

        if (filtros.proceso === "conteo") {
          let q = supabase
            .from("conteo_frutos_caidos")
            .select("nombre_lote,avg:n_frutos_caidos.avg()")
            .not("n_frutos_caidos", "is", null);

          if (lotesForMetrics.length) {
            q = q.in("nombre_lote", lotesForMetrics);
          }

          const { data } = await q;

          metricRows = ((data || []) as any[])
            .map((r) => ({
              key: filtros.lote
                ? "avg_n_frutos_caidos"
                : r.nombre_lote || "Sin lote",
              value: Number(r.avg || 0),
            }))
            .filter((r) => Number.isFinite(r.value));
        }

        setMetrics(metricRows);
      } catch (e: any) {
        setError(e?.message || "No se pudo cargar reporte");
        setRegistros([]);
        setMetrics([]);
      } finally {
        setLoading(false);
      }
    };

    if (allLotes.length) load();
  }, [filtros, allLotes]);

  const clusters: ReporteCluster[] = useMemo(
    () => clusterPoints(registros),
    [registros]
  );

  return {
    loading,
    error,
    registros,
    clusters,
    cultivos,
    lotes: visibleLotes,
    metrics,
  };
};