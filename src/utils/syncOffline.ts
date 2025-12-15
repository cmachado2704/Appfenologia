// src/utils/syncOfflineQueue.ts
import { getOfflineQueue, clearOfflineQueue } from "./offlineQueue";
import NetInfo from "@react-native-community/netinfo";
import { supabase } from "../services/supabaseClient";
import { subirFotoSupabase } from "./uploadPhoto";
import { getCurrentPosition } from "./location";

/* -------------------------------------------------------------
   ⭐ FUNCIONES AUXILIARES
------------------------------------------------------------- */

function diffDias(fActual: string, fAnterior: string): number {
  const fa = new Date(fActual);
  const fp = new Date(fAnterior);
  const diffMs = fa.getTime() - fp.getTime();
  const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return dias < 1 ? 1 : dias;
}

/* -------------------------------------------------------------
   ⭐ PROCESAR REGISTRO: CONTEO FRUTOS CAIDOS (CON FOTOS)
------------------------------------------------------------- */
async function procesarConteoFrutosCaidos(item: any) {
  try {
    const {
      lote,
      lado,
      fila,
      n_planta,
      fecha_evaluacion,
      n_frutos_caidos,
      fotos
    } = item;

    let fotoUrl1: string | null = null;
    let fotoUrl2: string | null = null;

    try {
      if (fotos?.foto1) {
        fotoUrl1 = await subirFotoSupabase(
          Number(item.n_de_toma),
          Number(n_planta),
          fotos.foto1
        );
      }

      if (fotos?.foto2) {
        fotoUrl2 = await subirFotoSupabase(
          Number(item.n_de_toma),
          Number(n_planta),
          fotos.foto2
        );
      }
    } catch (e) {
      console.log("❌ Error subiendo fotos conteo frutos caídos:", e);
      return false;
    }

    const { data: prevData } = await supabase
      .from("conteo_frutos_caidos")
      .select("fecha_evaluacion, n_frutos_caidos_dia")
      .eq("lote", lote)
      .eq("lado", lado)
      .eq("fila", fila)
      .eq("n_planta", n_planta)
      .order("fecha_evaluacion", { ascending: false })
      .limit(1);

    let fechaAnterior = null;
    let diasEvaluacion = null;
    let frutosDia = null;
    let diferencia = null;

    if (prevData && prevData.length > 0) {
      fechaAnterior = prevData[0].fecha_evaluacion;
      diasEvaluacion = diffDias(fecha_evaluacion, fechaAnterior);
      frutosDia = Number((n_frutos_caidos / diasEvaluacion).toFixed(2));
      const prevN = prevData[0].n_frutos_caidos_dia ?? 0;
      diferencia = Number((frutosDia - prevN).toFixed(2));
    }

    const { error } = await supabase.from("conteo_frutos_caidos").insert([
      {
        ...item,
        fotos: {
          foto1: fotoUrl1,
          foto2: fotoUrl2
        },
        fecha_evaluacion_anterior: fechaAnterior,
        dias_evaluaciones: diasEvaluacion,
        n_frutos_caidos_dia: frutosDia,
        diferencia_frutos_caidos_dia: diferencia
      }
    ]);

    return !error;

  } catch (e) {
    console.log("❌ Error procesando conteo frutos caídos:", e);
    return false;
  }
}

/* -------------------------------------------------------------
   ⭐ PROCESAR REGISTRO: CALIBRACIÓN DE FRUTOS (CON FOTOS OFFLINE)
------------------------------------------------------------- */
async function procesarCalibracionFrutos(item: any) {
  try {
    const {
      lote,
      fila,
      fecha_evaluacion,
      calibre,
      fotos,
      n_de_toma,
      n_planta
    } = item;

    /* ===== SUBIR FOTOS (OFFLINE) ===== */
    let fotoUrl1: string | null = null;
    let fotoUrl2: string | null = null;

    try {
      if (fotos?.foto1) {
        fotoUrl1 = await subirFotoSupabase(
          Number(n_de_toma),
          Number(n_planta) || 0,
          fotos.foto1
        );
      }

      if (fotos?.foto2) {
        fotoUrl2 = await subirFotoSupabase(
          Number(n_de_toma),
          Number(n_planta) || 0,
          fotos.foto2
        );
      }
    } catch (e) {
      console.log("❌ Error subiendo fotos calibración:", e);
      return false;
    }

    const { data: prevData } = await supabase
      .from("calibracion_frutos")
      .select("fecha_evaluacion, calibre")
      .eq("lote", lote)
      .eq("fila", fila)
      .order("fecha_evaluacion", { ascending: false })
      .limit(1);

    let fechaAnterior = null;
    let diasEvaluacion = null;
    let tcReal = null;
    let tcSemanal = null;
    let tcProyectado = null;
    let calibreFinal = null;

    if (prevData && prevData.length > 0) {
      fechaAnterior = prevData[0].fecha_evaluacion;
      diasEvaluacion = diffDias(fecha_evaluacion, fechaAnterior);
      const prevCalibre = prevData[0].calibre ?? 0;
      tcReal = Number(((calibre - prevCalibre) / diasEvaluacion).toFixed(2));
      tcSemanal = Number((tcReal * 7).toFixed(2));
      tcProyectado = tcSemanal;
      calibreFinal = Number((calibre + tcSemanal).toFixed(2));
    }

    const { error } = await supabase.from("calibracion_frutos").insert([
      {
        ...item,
        fotos: {
          foto1: fotoUrl1,
          foto2: fotoUrl2
        },
        fecha_evaluacion_anterior: fechaAnterior,
        dias_evaluaciones: diasEvaluacion,
        tc_real: tcReal,
        tc_semanal: tcSemanal,
        tc_proyectado: tcProyectado,
        calibre_final: calibreFinal
      }
    ]);

    return !error;

  } catch (e) {
    console.log("❌ Error procesando calibración frutos:", e);
    return false;
  }
}

/* -------------------------------------------------------------
   ⭐ PROCESAR REGISTRO: TOMA FENOLÓGICA (SIN CAMBIOS)
------------------------------------------------------------- */
async function procesarTomaFenologica(item: any) {
  const {
    selectedToma,
    zonaSeleccionada,
    fila,
    orientacionSeleccionada,
    plantaNum,
    ramas,
    fotos
  } = item;

  let lat = null;
  let lon = null;

  try {
    const gps = await getCurrentPosition();
    lat = gps.lat;
    lon = gps.lon;
  } catch {}

  let fotoUrl1 = null;
  let fotoUrl2 = null;

  if (fotos?.foto1)
    fotoUrl1 = await subirFotoSupabase(selectedToma.id_toma, plantaNum, fotos.foto1);

  if (fotos?.foto2)
    fotoUrl2 = await subirFotoSupabase(selectedToma.id_toma, plantaNum, fotos.foto2);

  const filasInsert = ramas
    .filter((r: any) => r.tipo_estado && r.cantidad && Number(r.cantidad) > 0)
    .map((r: any) => ({
      id_toma: selectedToma.id_toma,
      n_de_toma: selectedToma.n_de_toma,
      variedad: selectedToma.variedad,
      codigo_lote: selectedToma.codigo_lote,
      nombre_lote: selectedToma.nombre_lote,
      muestra_sugerida: selectedToma.muestra_sugerida,
      planta: plantaNum,
      fila: fila.trim(),
      n_rama: r.n_rama,
      tipo_estado: r.tipo_estado,
      es_estado: r.es_estado,
      cantidad: Number(r.cantidad),
      latitud: lat,
      longitud: lon,
      fecha_y_hora: new Date().toISOString(),
      fuente_de_datos: "Sin datos",
      inspector: "SINCRONIZADO_OFFLINE",
      zona: zonaSeleccionada,
      orientacion: orientacionSeleccionada,
      fotos: {
        foto1: fotoUrl1,
        foto2: fotoUrl2
      }
    }));

  const { error } = await supabase
    .from("tomas_fenologicas")
    .insert(filasInsert);

  return !error;
}

/* -------------------------------------------------------------
   ⭐ MASTER FUNCTION
------------------------------------------------------------- */
export const syncOfflineQueue = async () => {
  try {
    const net = await NetInfo.fetch();
    if (!(net.isConnected && net.isInternetReachable)) return;

    const queue = await getOfflineQueue();
    if (!queue || queue.length === 0) return;

    for (const item of queue) {
      if (item.tipo === "toma_fenologica")
        await procesarTomaFenologica(item.datos);

      if (item.tipo === "calibracion_frutos")
        await procesarCalibracionFrutos(item.datos);

      if (item.tipo === "conteo_frutos_caidos")
        await procesarConteoFrutosCaidos(item.datos);
    }

    await clearOfflineQueue();
    console.log("🧹 Cola offline limpiada correctamente");

  } catch (e) {
    console.log("❌ Error sincronizando cola offline:", e);
  }
};
