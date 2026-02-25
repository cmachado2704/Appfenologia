import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { clusterPoints } from "./clusterUtils";
import { ReporteCluster, ReporteFiltros, ReporteRegistro } from "./types";

const procesoToTable = {
  fenologia: "tomas_fenologicas",
  calibracion: "calibracion_frutos",
  conteo: "conteo_frutos_caidos",
} as const;

type LoteRow = {
  id_lote?: string;
  nombre_lote: string;
  latitud: number | null;
  longitud: number | null;
  variedad?: string | null;
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
          .select("id_lote, nombre_lote, latitud, longitud, variedad")
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
        const { data, error: dbError } = await supabase
          .from(table)
          .select("latitud,longitud,fecha,lote_id")
          .not("latitud", "is", null)
          .not("longitud", "is", null);

        if (dbError) throw dbError;

        const base = (data || []) as any[];

        const lotesById = new Map(
          lotes
            .filter((l) => l.id_lote)
            .map((l) => [String(l.id_lote), l])
        );
        const lotesByName = new Map(lotes.map((l) => [l.nombre_lote, l]));

        let normalized: ReporteRegistro[] = base
          .map((row) => {
            const lote = row.lote_id ? lotesById.get(String(row.lote_id)) : undefined;
            const loteNombre = lote?.nombre_lote || (row.lote_id as string) || "Sin lote";
            return {
              lat: Number(row.latitud),
              lng: Number(row.longitud),
              loteNombre,
              proceso: filtros.proceso,
              fecha: row.fecha ?? null,
            };
          })
          .filter((row) => Number.isFinite(row.lat) && Number.isFinite(row.lng));

        if (filtros.lote) {
          normalized = normalized.filter((r) => r.loteNombre === filtros.lote);
        }

        if (filtros.cultivo) {
          normalized = normalized.filter((r) => {
            const lote = lotesByName.get(r.loteNombre);
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
