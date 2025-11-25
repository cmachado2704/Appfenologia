import NetInfo from "@react-native-community/netinfo";
import { getOfflineQueue, clearOfflineQueue } from "./offlineQueue";
import { supabase } from "../services/supabaseClient";
import { subirFotoSupabase } from "./uploadPhoto";

export const syncOfflineQueue = async () => {
  const net = await NetInfo.fetch();
  const isOnline = net.isConnected && net.isInternetReachable;

  if (!isOnline) return;

  const queue = await getOfflineQueue();
  if (!queue || queue.length === 0) return;

  for (const item of queue) {
    if (item.tipo === "toma_fenologica") {
      const { selectedToma, zonaSeleccionada, fila, orientacionSeleccionada, plantaNum, ramas, foto1, foto2 } = item.datos;

      let fotoUrl1: string | null = null;
      let fotoUrl2: string | null = null;

      // SUBIR FOTOS SI EXISTEN
      if (foto1) {
        fotoUrl1 = await subirFotoSupabase(selectedToma.id_toma, plantaNum, foto1);
      }
      if (foto2) {
        fotoUrl2 = await subirFotoSupabase(selectedToma.id_toma, plantaNum, foto2);
      }

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

          temperatura_actual_c: null,
          humedad_relativa_pct: null,
          presion_atmosferica_hpa: null,

          foto1: fotoUrl1,
          foto2: fotoUrl2,

          zona: zonaSeleccionada,
          orientacion: orientacionSeleccionada,
          inspector: "SINCRONIZADO_OFFLINE",
        }));

      await supabase.from("tomas_fenologicas").insert(filasInsert);
    }
  }

  await clearOfflineQueue();
  console.log("Sincronización completada.");
};
