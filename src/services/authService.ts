import { supabase } from "./supabaseClient";

export const loginInspector = async (email: string, password: string) => {
  const { data, error } = await supabase
    .from("inspectores")
    .select("*")
    .eq("usuario", email)
    .single();

  if (error || !data) {
    return { ok: false, message: "Usuario no encontrado" };
  }

  if (data.clave !== password) {
    return { ok: false, message: "Contraseña incorrecta" };
  }

  return {
    ok: true,
    nombre: data.nombre,
    rol: data.tipo_de_usuario,
    id: data.id_inspector,
    email: data.usuario,
  };
};
