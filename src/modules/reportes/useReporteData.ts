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

const normalizeRegistro = (
  row: Record<string, unknown>,
  proceso: ReporteRegistro["proceso"],
  fechaColumn: string
): ReporteRegistro | null => {
  const lat = Number(row.latitud);
  const lng = Number(row.longitud);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    lat,
    lng,
    loteNombre: String(row.nombre_lote || "").trim() || "Sin lote",
    proceso,
    fecha: (row[fechaColumn] as string | null) ?? null,
  };
};

export const useReporteData = (filtros: ReporteFiltros) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registros, setRegistros] = useState<ReporteRegistro[]>([]);
  const [allLotes, setAllLotes] = useState<LoteRow[]>([]);
  const [catalogosLoaded, setCatalogosLoaded] = useState(false);
  const [cultivos, setCultivos] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<ReporteMetric[]>([]);

  useEffect(() => {
    const loadCatalogos = async () => {
      const { data } = await supabase
        .from("lotes")
        .select("id_lote, nombre_lote, variedad, latitud, longitud, geom")
        .order("nombre_lote");

      const rows = (data || []) as LoteRow[];
      setAllLotes(rows);

      const variedades = Array.from(new Set(rows.map((l) => (l.variedad || "").trim()).filter(Boolean))).sort();
      setCultivos(variedades);
      setCatalogosLoaded(true);
    };

    loadCatalogos();
  }, []);

  const visibleLotes = useMemo(() => {
    if (!filtros.cultivo) {
      return allLotes;
    }

    return allLotes.filter((l) => (l.variedad || "").trim() === filtros.cultivo);
  }, [allLotes, filtros.cultivo]);

  useEffect(() => {
    if (!catalogosLoaded) {
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const procesos: ReporteRegistro["proceso"][] =
          filtros.proceso === "todos" ? ["fenologia", "calibracion", "conteo"] : [filtros.proceso];

        const loteNamesByCultivo = filtros.cultivo
          ? new Set(
              allLotes
                .filter((l) => (l.variedad || "").trim() === filtros.cultivo)
                .map((l) => l.nombre_lote)
            )
          : null;

        let allData: ReporteRegistro[] = [];

        for (const proceso of procesos) {
          const table = procesoToTable[proceso];
          const fechaColumn = procesoToFechaColumn[proceso];

          let query = supabase
            .from(table)
            .select(`latitud,longitud,${fechaColumn},nombre_lote`)
            .not("latitud", "is", null)
            .not("longitud", "is", null);

          if (filtros.lote) {
            query = query.eq("nombre_lote", filtros.lote);
          }

          const { data, error: queryError } = await query;
          if (queryError) {
            throw queryError;
          }

          const normalized = ((data || []) as Record<string, unknown>[])
            .map((row) => normalizeRegistro(row, proceso, fechaColumn))
            .filter(Boolean) as ReporteRegistro[];

          allData = allData.concat(normalized);
        }

        const filteredRegistros = allData.filter((registro) => {
          if (filtros.cultivo) {
            if (registro.loteNombre === "Sin lote") {
              return false;
            }

            if (!loteNamesByCultivo?.has(registro.loteNombre)) {
              return false;
            }
          }

          if (filtros.lote && registro.loteNombre !== filtros.lote) {
            return false;
          }

          return true;
        });

        setRegistros(filteredRegistros);

        if (filtros.proceso === "todos") {
          setMetrics([]);
        } else {
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
                key: filtros.lote ? r.es_estado || "Sin estado" : `${r.nombre_lote} - ${r.es_estado || "Sin estado"}`,
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
                key: filtros.lote ? "avg_n_frutos_caidos" : r.nombre_lote || "Sin lote",
                value: Number(r.avg || 0),
              }))
              .filter((r) => Number.isFinite(r.value));
          }

          setMetrics(metricRows);
        }
      } catch (e: any) {
        setError(e?.message || "No se pudo cargar reporte");
        setRegistros([]);
        setMetrics([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [allLotes, catalogosLoaded, filtros, visibleLotes]);

  const clusters: ReporteCluster[] = useMemo(() => clusterPoints(registros), [registros]);

  useEffect(() => {
    const fenologiaCount = registros.filter((r) => r.proceso === "fenologia").length;
    const calibracionCount = registros.filter((r) => r.proceso === "calibracion").length;
    const conteoCount = registros.filter((r) => r.proceso === "conteo").length;

    console.debug("[ReporteDebug]", {
      filtros,
      fenologiaCount,
      calibracionCount,
      conteoCount,
      filteredCount: registros.length,
      clustersCount: clusters.length,
    });
  }, [clusters.length, filtros, registros]);

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
