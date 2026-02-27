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
  codigo_lote?: string | null;
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

  useEffect(() => {
    const loadCatalogos = async () => {
      const { data: lotesData } = await supabase
        .from("lotes")
        .select("id_lote, nombre_lote, codigo_lote, variedad, latitud, longitud, geom")
        .order("nombre_lote");

      const lotesRows = (lotesData || []) as LoteRow[];
      setAllLotes(lotesRows);

      const uniqueVariedades = Array.from(
        new Set(
          lotesRows
            .map((l) => (l.variedad || "").trim())
            .filter((v) => v.length > 0)
        )
      ).sort();

      setCultivos(uniqueVariedades);
    };

    loadCatalogos();
  }, []);

  const visibleLotes = useMemo(() => {
    if (!filtros.cultivo) return allLotes;
    return allLotes.filter((l) => (l.variedad || "").trim() === filtros.cultivo);
  }, [allLotes, filtros.cultivo]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const table = procesoToTable[filtros.proceso];
        const fechaColumn = procesoToFechaColumn[filtros.proceso];

        let query = supabase
          .from(table)
          .select(`latitud,longitud,${fechaColumn},nombre_lote,codigo_lote`)
          .not("latitud", "is", null)
          .not("longitud", "is", null);

        if (filtros.lote) {
          query = query.eq("nombre_lote", filtros.lote);
        }

        const { data, error: dbError } = await query;
        if (dbError) throw dbError;

        const lotesByCodigo = new Map(
          allLotes
            .filter((l) => l.codigo_lote)
            .map((l) => [String(l.codigo_lote), l.nombre_lote])
        );

        const visibleLoteNames = new Set(visibleLotes.map((l) => l.nombre_lote));

        let normalized: ReporteRegistro[] = ((data || []) as any[])
          .map((row) => {
            const lat = Number(row.latitud);
            const lng = Number(row.longitud);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

            const loteNombreDirecto =
              typeof row.nombre_lote === "string" && row.nombre_lote.trim().length
                ? row.nombre_lote.trim()
                : null;

            const loteNombrePorCodigo =
              row.codigo_lote != null
                ? lotesByCodigo.get(String(row.codigo_lote)) || String(row.codigo_lote)
                : null;

            return {
              lat,
              lng,
              loteNombre: loteNombreDirecto || loteNombrePorCodigo || "Sin lote",
              proceso: filtros.proceso,
              fecha: row[fechaColumn] ?? null,
            } as ReporteRegistro;
          })
          .filter(Boolean) as ReporteRegistro[];

        normalized = normalized.filter((r) => {
          if (r.loteNombre === "Sin lote") return !filtros.cultivo;
          return visibleLoteNames.has(r.loteNombre);
        });

        if (filtros.lote) {
          normalized = normalized.filter((r) => r.loteNombre === filtros.lote);
        }

        setRegistros(normalized);

        const lotesForMetrics = filtros.lote
          ? [filtros.lote]
          : visibleLotes.map((l) => l.nombre_lote);

        let metricRows: ReporteMetric[] = [];

        if (filtros.proceso === "fenologia") {
          let mQuery = supabase
            .from("tomas_fenologicas")
            .select("nombre_lote,es_estado,avg_cantidad:cantidad.avg()")
            .not("cantidad", "is", null);

          if (lotesForMetrics.length) {
            mQuery = mQuery.in("nombre_lote", lotesForMetrics);
          }

          const { data: mData } = await mQuery;
          metricRows = ((mData || []) as any[])
            .map((row) => ({
              key:
                filtros.lote
                  ? row.es_estado || "Sin estado"
                  : `${row.nombre_lote || "Sin lote"} - ${row.es_estado || "Sin estado"}`,
              value: Number(row.avg_cantidad || 0),
            }))
            .filter((r) => Number.isFinite(r.value));
        }

        if (filtros.proceso === "calibracion") {
          let mQuery = supabase
            .from("calibracion_frutos")
            .select("nombre_lote,clasificacion,avg_calibre:calibre.avg()")
            .not("calibre", "is", null);

          if (lotesForMetrics.length) {
            mQuery = mQuery.in("nombre_lote", lotesForMetrics);
          }

          const { data: mData } = await mQuery;
          metricRows = ((mData || []) as any[])
            .map((row) => ({
              key:
                filtros.lote
                  ? row.clasificacion || "Sin clasificacion"
                  : `${row.nombre_lote || "Sin lote"} - ${row.clasificacion || "Sin clasificacion"}`,
              value: Number(row.avg_calibre || 0),
            }))
            .filter((r) => Number.isFinite(r.value));
        }

        if (filtros.proceso === "conteo") {
          let mQuery = supabase
            .from("conteo_frutos_caidos")
            .select("nombre_lote,avg_conteo:n_frutos_caidos.avg()")
            .not("n_frutos_caidos", "is", null);

          if (lotesForMetrics.length) {
            mQuery = mQuery.in("nombre_lote", lotesForMetrics);
          }

          const { data: mData } = await mQuery;
          metricRows = ((mData || []) as any[])
            .map((row) => ({
              key: filtros.lote ? "avg_n_frutos_caidos" : row.nombre_lote || "Sin lote",
              value: Number(row.avg_conteo || 0),
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

    load();
  }, [filtros, allLotes, visibleLotes]);

  const clusters: ReporteCluster[] = useMemo(() => clusterPoints(registros), [registros]);

  return { loading, error, registros, clusters, cultivos, lotes: visibleLotes, metrics };
};
