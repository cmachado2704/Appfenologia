// APROBAR / EDITAR / ELIMINAR TOMAS (FINAL: formato PE + acordeones + dropdown)
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { supabase } from "../../services/supabaseClient";

// Habilitar animaciones en Android
if (Platform.OS === "android") {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

type Toma = {
  id_toma: string;
  n_de_toma: string;
  nombre_lote: string;
  codigo_lote: string;
  variedad: string;
  fecha_creacion: string | null;
  estado: string | null;
  registros: number;
};

/* -------------------------------------------------------------
   FORMATEO DE FECHA PERÚ (DD/MM/YYYY)
------------------------------------------------------------- */
const formatDatePE = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const AprobarEditarTomas: React.FC = () => {
  const [todasTomas, setTodasTomas] = useState<Toma[]>([]);
  const [tomasAgrupadas, setTomasAgrupadas] = useState<Record<string, Toma[]>>(
    {}
  );

  const [variedades, setVariedades] = useState<string[]>([]);
  const [variedadFiltro, setVariedadFiltro] = useState<string>("TODOS");

  const [loading, setLoading] = useState<boolean>(true);
  const [cargandoVariedades, setCargandoVariedades] = useState<boolean>(true);

  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  const [openAccordions, setOpenAccordions] = useState<
    Record<string, boolean>
  >({});

  /* -------------------------------------------------------------
     Contar registros en tablas asociadas a la toma
  ------------------------------------------------------------- */
  const contarRegistros = async (n_de_toma: string): Promise<number> => {
    const tablas = [
      "tomas_fenologicas",
      "calibracion_frutos",
      "conteo_frutos_caidos",
    ];

    let total = 0;

    for (const tabla of tablas) {
      const { count } = await supabase
        .from(tabla)
        .select("*", { count: "exact", head: true })
        .eq("n_de_toma", n_de_toma);

      total += count ?? 0;
    }

    return total;
  };

  /* -------------------------------------------------------------
     Cargar variedades de la tabla LOTES
  ------------------------------------------------------------- */
  const fetchVariedades = async () => {
    const { data, error } = await supabase
      .from("lotes")
      .select("variedad")
      .order("variedad", { ascending: true });

    if (!error && data) {
      const unicas = Array.from(
        new Set(data.map((x) => x.variedad).filter(Boolean))
      );
      setVariedades(["TODOS", ...unicas]);
    }

    setCargandoVariedades(false);
  };

  /* -------------------------------------------------------------
     Cargar tomas creadas + add registro count
  ------------------------------------------------------------- */
  const fetchTomas = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("tomas")
      .select("*")
      .eq("estado", "creada")
      .order("n_de_toma", { ascending: true });

    if (error) {
      Alert.alert("Error", "No se pudieron obtener las tomas.");
      setLoading(false);
      return;
    }

    const lista: Toma[] = [];

    for (const t of data as Toma[]) {
      const registros = await contarRegistros(t.n_de_toma);
      lista.push({ ...t, registros });
    }

    setTodasTomas(lista);
    agruparPorVariedad(lista, variedadFiltro);
    setLoading(false);
  };

  /* -------------------------------------------------------------
     Agrupar por variedad
  ------------------------------------------------------------- */
  const agruparPorVariedad = (lista: Toma[], filtro: string) => {
    const filtradas =
      filtro === "TODOS"
        ? lista
        : lista.filter((t) => t.variedad === filtro);

    const agrupadas: Record<string, Toma[]> = {};

    filtradas.forEach((toma) => {
      const clave = toma.variedad || "SIN VARIEDAD";

      if (!agrupadas[clave]) agrupadas[clave] = [];
      agrupadas[clave].push(toma);
    });

    setTomasAgrupadas(agrupadas);
  };

  useEffect(() => {
    fetchVariedades();
    fetchTomas();
  }, []);

  /* -------------------------------------------------------------
     Cambiar filtro de variedad
  ------------------------------------------------------------- */
  const cambiarFiltroVariedad = (v: string) => {
    setVariedadFiltro(v);
    agruparPorVariedad(todasTomas, v);
  };

  /* -------------------------------------------------------------
     Manejo de acordeones
  ------------------------------------------------------------- */
  const toggleAccordion = (variedad: string) => {
    LayoutAnimation.easeInEaseOut();
    setOpenAccordions((prev) => ({
      ...prev,
      [variedad]: !prev[variedad],
    }));
  };

  /* -------------------------------------------------------------
     Validaciones y acciones (aprobar, editar, eliminar)
  ------------------------------------------------------------- */

  const validarTomaSinDatos = async (n_de_toma: string) => {
    return (await contarRegistros(n_de_toma)) === 0;
  };

  const aprobarToma = async (id_toma: string) => {
    const { error } = await supabase
      .from("tomas")
      .update({
        estado: "aprobada",
        fecha_aprobacion: new Date().toISOString(),
      })
      .eq("id_toma", id_toma);

    if (error) Alert.alert("Error", "No se pudo aprobar la toma.");
    else {
      Alert.alert("Éxito", "La toma fue aprobada.");
      fetchTomas();
    }
  };

  const editarToma = async (toma: Toma) => {
    const permitido = await validarTomaSinDatos(toma.n_de_toma);

    if (!permitido) {
      Alert.alert(
        "Edición bloqueada",
        "Esta toma ya tiene registros asociados."
      );
      return;
    }

    Alert.alert("Edición", "Aquí abrirías la pantalla de edición.");
  };

  const eliminarToma = async (toma: Toma) => {
    const permitido = await validarTomaSinDatos(toma.n_de_toma);

    if (!permitido) {
      Alert.alert(
        "Eliminación bloqueada",
        "La toma ya tiene registros asociados."
      );
      return;
    }

    Alert.alert("Confirmación", "¿Desea eliminar esta toma?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase
            .from("tomas")
            .update({ estado: "eliminada" })
            .eq("id_toma", toma.id_toma);

          if (error) Alert.alert("Error", "No se pudo eliminar.");
          else {
            Alert.alert("Éxito", "Toma eliminada.");
            fetchTomas();
          }
        },
      },
    ]);
  };

  /* -------------------------------------------------------------
     UI
  ------------------------------------------------------------- */
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Aprobación / Edición de Tomas</Text>

      <Text style={styles.info}>
        Solo pueden editarse o eliminarse tomas sin registros ingresados.
      </Text>
      <Text style={styles.info}>
        Al aprobar una toma, se cierra y ya no admite registros.
      </Text>

      {/* ---------------------- BUSCADOR DESPLEGABLE ---------------------- */}
      <View style={styles.filterBox}>
        <Text style={styles.filterLabel}>Filtrar variedad:</Text>

        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setShowDropdown(!showDropdown)}
        >
          <Text style={styles.dropdownButtonText}>{variedadFiltro}</Text>
        </TouchableOpacity>

        {showDropdown && (
          <View style={styles.dropdownList}>
            {cargandoVariedades ? (
              <ActivityIndicator color="#fff" />
            ) : (
              variedades.map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[
                    styles.dropdownItem,
                    v === variedadFiltro && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    cambiarFiltroVariedad(v);
                    setShowDropdown(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      v === variedadFiltro && styles.dropdownItemTextActive,
                    ]}
                  >
                    {v}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </View>

      {/* ---------------------- ACORDEONES ---------------------- */}
      {loading ? (
        <ActivityIndicator size="large" color="#fff" />
      ) : (
        Object.keys(tomasAgrupadas).map((variedad) => {
          const abierto = openAccordions[variedad] ?? false;

          return (
            <View key={variedad} style={{ marginBottom: 18 }}>
              <TouchableOpacity
                style={styles.accordionHeader}
                onPress={() => toggleAccordion(variedad)}
              >
                <Text style={styles.accordionTitle}>VARIEDAD: {variedad}</Text>
                <Text style={styles.accordionArrow}>
                  {abierto ? "▲" : "▼"}
                </Text>
              </TouchableOpacity>

              {abierto && (
                <View style={{ marginTop: 6 }}>
                  {tomasAgrupadas[variedad].map((toma) => (
                    <View key={toma.id_toma} style={styles.card}>
                      <Text style={styles.cardTitle}>
                        {toma.n_de_toma} – {toma.nombre_lote}
                      </Text>

                      {/* FECHA DE CREACIÓN CON FORMATO PERÚ */}
                      <Text style={styles.cardDetail}>
                        Fecha creación: {formatDatePE(toma.fecha_creacion)}
                      </Text>

                      <Text style={styles.cardDetail}>
                        Registros vinculados: {toma.registros}
                      </Text>

                      <View style={styles.row}>
                        <TouchableOpacity
                          style={styles.btnApprove}
                          onPress={() => aprobarToma(toma.id_toma)}
                        >
                          <Text style={styles.btnText}>Aprobar</Text>
                        </TouchableOpacity>

                        {toma.registros === 0 && (
                          <>
                            <TouchableOpacity
                              style={styles.btnEdit}
                              onPress={() => editarToma(toma)}
                            >
                              <Text style={styles.btnText}>Editar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.btnDelete}
                              onPress={() => eliminarToma(toma)}
                            >
                              <Text style={styles.btnText}>Eliminar</Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
};

export default AprobarEditarTomas;

/* ---------------------- ESTILOS ---------------------- */
const styles = StyleSheet.create({
  container: {
    backgroundColor: "#2f5d2c",
    padding: 16,
    flexGrow: 1,
  },
  title: {
    fontSize: 23,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 8,
  },
  info: {
    textAlign: "center",
    color: "#e0f2e9",
    marginBottom: 10,
    fontSize: 13,
  },

  /* --- Dropdown --- */
  filterBox: {
    backgroundColor: "#3c6b3d",
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  filterLabel: {
    color: "#d5ffdb",
    marginBottom: 6,
    fontWeight: "700",
  },
  dropdownButton: {
    backgroundColor: "#2f5d2c",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  dropdownButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  dropdownList: {
    backgroundColor: "#3c6b3d",
    marginTop: 8,
    borderRadius: 8,
    paddingVertical: 4,
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dropdownItemActive: {
    backgroundColor: "#6bc46d",
  },
  dropdownItemText: {
    color: "#fff",
    fontSize: 14,
  },
  dropdownItemTextActive: {
    color: "#000",
    fontWeight: "700",
  },

  /* --- Acordeón --- */
  accordionHeader: {
    backgroundColor: "#396b39",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  accordionTitle: {
    color: "#d5ffdb",
    fontSize: 16,
    fontWeight: "700",
  },
  accordionArrow: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  /* --- Tarjetas de tomas --- */
  card: {
    backgroundColor: "#4a7c59",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  cardDetail: {
    color: "#e8f3eb",
    marginTop: 3,
    fontSize: 13,
  },
  row: {
    flexDirection: "row",
    marginTop: 10,
    justifyContent: "space-between",
  },

  /* --- Botones --- */
  btnApprove: {
    backgroundColor: "#1b8a2f",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  btnEdit: {
    backgroundColor: "#1f78d1",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  btnDelete: {
    backgroundColor: "#b82d2d",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
});
