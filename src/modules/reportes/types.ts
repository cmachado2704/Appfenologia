export type ProcesoReporte = "fenologia" | "calibracion" | "conteo";

export type ReporteFiltros = {
  proceso: ProcesoReporte;
  cultivo: string | null;
  lote: string | null;
};

export type ReporteRegistro = {
  lat: number;
  lng: number;
  loteNombre: string;
  proceso: ProcesoReporte;
  fecha: string | null;
};

export type ReporteCluster = {
  lat: number;
  lng: number;
  total: number;
  registros: ReporteRegistro[];
};
