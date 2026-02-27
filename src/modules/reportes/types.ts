export type ProcesoReporte = "fenologia" | "calibracion" | "conteo" | "todos";

export type ReporteFiltros = {
  proceso: ProcesoReporte;
  cultivo: string | null;
  lote: string | null;
};

export type ReporteRegistro = {
  lat: number;
  lng: number;
  loteNombre: string;
  proceso: Exclude<ProcesoReporte, "todos">;
  fecha: string | null;
};

export type ReporteCluster = {
  lat: number;
  lng: number;
  total: number;
  registros: ReporteRegistro[];
};