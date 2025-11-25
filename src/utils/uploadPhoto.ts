import RNFS from "react-native-fs";
import { supabase } from "../services/supabaseClient";

// Convierte base64 a Uint8Array (compatible con RN)
function base64ToUint8Array(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const subirFotoSupabase = async (
  id_toma: number,
  planta: number,
  uri: string
) => {
  try {
    // NOMBRE SIMPLE (sin carpetas)
    const filePath = `toma_${id_toma}_planta_${planta}_${Date.now()}.jpg`;

    // Leer la foto como base64 desde el dispositivo
    const base64Data = await RNFS.readFile(uri, "base64");

    // Convertir a binario Uint8Array
    const uint8Data = base64ToUint8Array(base64Data);

    // Subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from("fotos_registros")
      .upload(filePath, uint8Data, {
        contentType: "image/jpeg",
      });

    if (error) throw error;

    // Obtener URL pública
    const { publicUrl } = supabase.storage
      .from("fotos_registros")
      .getPublicUrl(filePath).data;

    return publicUrl;

  } catch (err) {
    console.error("Error subiendo foto:", err);
    throw err;
  }
};
