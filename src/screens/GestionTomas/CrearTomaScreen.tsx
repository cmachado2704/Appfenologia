// CrearTomaScreen — MODO CREAR + MODO EDITAR + BOTÓN A APROBAR/EDITAR TOMAS
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { supabase } from "../../services/supabaseClient";
import { useRoute, useNavigation } from "@react-navigation/native";

type Lote = {
  id_lote: string;
  codigo_lote: string;
  nombre_lote: string;
  variedad?: string | null;
  plantas_calculadas?: number | null;
};

const CrearTomaScreen: React.FC = () => {
  /* -------------------------------------------------------------
     RECIBIR PARÁMETROS (crear / editar)
  ------------------------------------------------------------- */
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const modo = route.params?.modo ?? "crear"; // "crear" | "editar"
  const tomaEditar = route.params?.toma ?? null;

  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedLoteId, setSelectedLoteId] = useState<string | null>(null);
  const [variedad, setVariedad] = useState<string>("");
  const [plantasCalculadas, setPlantasCalculadas] = useState<string>("");

  const [tipoToma, setTipoToma] = useState<string>("fenologica");

  const [tomasFenologicas, setTomasFenologicas] = useState("");
  const [tomasConteo, setTomasConteo] = useState("");
  const [tomasCalibracion, setTomasCalibracion] = useState("");

  const [fundo] = useState("LA CANDELARIA");

  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");

  const [showInicioPicker, setShowInicioPicker] = useState(false);
  const [showFinPicker, setShowFinPicker] = useState(false);

  const formatDMY = (date: Date) => {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const convertirFecha = (f: string) => {
    if (!f.includes("/")) return null;
    const [d, m, y] = f.split("/");
    return `${y}-${m}-${d}`;
  };

  /* -------------------------------------------------------------
     CARGAR LOTES
  ------------------------------------------------------------- */
  useEffect(() => {
    const fetchLotes = async () => {
      try {
        setLoading(true);
        const { data } = await supabase
          .from("lotes")
          .select("*")
          .order("nombre_lote", { ascending: true });

        setLotes(data || []);
      } catch {
        Alert.alert("Error", "No se pudieron cargar los lotes.");
      } finally {
        setLoading(false);
      }
    };
    fetchLotes();
  }, []);

  /* -------------------------------------------------------------
     FÓRMULA AGRÍCOLA REALISTA
  ------------------------------------------------------------- */
  const calcularMuestras = (plantas: number) => {
    const base = Math.round(Math.sqrt(plantas) * 2);
    return {
      fen: base,
      cont: Math.round(base * 0.8),
      calib: Math.round(base * 1.0),
    };
  };

  /* -------------------------------------------------------------
     AL SELECCIONAR UN LOTE
  ------------------------------------------------------------- */
  const handleSelectLote = (loteId: string | null) => {
    setSelectedLoteId(loteId);

    const lote = lotes.find((l) => l.id_lote === loteId);

    if (!lote) {
      setVariedad("");
      setPlantasCalculadas("");
      setTomasFenologicas("");
      setTomasConteo("");
      setTomasCalibracion("");
      return;
    }

    const plantas = lote.plantas_calculadas ?? 0;
    setVariedad(lote.variedad ?? "");
    setPlantasCalculadas(String(plantas));

    const { fen, cont, calib } = calcularMuestras(plantas);

    if (tipoToma === "fenologica") setTomasFenologicas(String(fen));
    if (tipoToma === "conteo") setTomasConteo(String(cont));
    if (tipoToma === "calibracion") setTomasCalibracion(String(calib));
    if (tipoToma === "generica") setTomasFenologicas(String(fen));
  };

  /* -------------------------------------------------------------
     MODO EDICIÓN → precargar valores
  ------------------------------------------------------------- */
  useEffect(() => {
    if (modo !== "editar" || !tomaEditar || !lotes.length) return;

    const lote = lotes.find((l) => l.nombre_lote === tomaEditar.nombre_lote);

    if (lote) {
      setSelectedLoteId(lote.id_lote);
      setVariedad(lote.variedad ?? "");
      setPlantasCalculadas(String(lote.plantas_calculadas ?? 0));
    }

    setTipoToma(tomaEditar.tipo_toma ?? "fenologica");
    setTomasFenologicas(tomaEditar.muestra_sugerida ?? "");

    setFechaInicio(
      tomaEditar.fecha_creacion?.split("-").reverse().join("/") || ""
    );

    setFechaFin(
      tomaEditar.fecha_fin?.split("-").reverse().join("/") || ""
    );
  }, [modo, tomaEditar, lotes]);

  /* -------------------------------------------------------------
     VALIDAR SI LA TOMA PUEDE EDITARSE (no debe tener registros)
  ------------------------------------------------------------- */
  const validarTomaSinDatos = async (n_de_toma: string) => {
    const tablas = [
      "tomas_fenologicas",
      "calibracion_frutos",
      "conteo_frutos_caidos",
    ];

    for (const tabla of tablas) {
      const { count } = await supabase
        .from(tabla)
        .select("*", { count: "exact", head: true })
        .eq("n_de_toma", n_de_toma);

      if ((count ?? 0) > 0) return false;
    }

    return true;
  };

  /* -------------------------------------------------------------
     GENERAR Código Txxx
  ------------------------------------------------------------- */
  const generarCodigoToma = async () => {
    const { data } = await supabase.from("tomas").select("n_de_toma");

    const nums =
      data
        ?.map((t) => parseInt(t.n_de_toma.replace("T", "")))
        .filter((n) => !isNaN(n)) ?? [];

    const maximo = nums.length ? Math.max(...nums) : 0;
    return `T${(maximo + 1).toString().padStart(3, "0")}`;
  };

  /* -------------------------------------------------------------
     GUARDAR TOMA (crear / editar)
  ------------------------------------------------------------- */
  const guardarToma = async () => {
    if (!selectedLoteId) return Alert.alert("Error", "Seleccione un lote.");
    if (!fechaInicio || !fechaFin)
      return Alert.alert("Error", "Debe ingresar fecha inicio y fin.");

    const fInicio = convertirFecha(fechaInicio);
    const fFin = convertirFecha(fechaFin);

    if (!fInicio || !fFin)
      return Alert.alert("Formato incorrecto", "Use dd/mm/aaaa");

    const lote = lotes.find((l) => l.id_lote === selectedLoteId);

    let muestra =
      tipoToma === "fenologica"
        ? tomasFenologicas
        : tipoToma === "conteo"
        ? tomasConteo
        : tipoToma === "calibracion"
        ? tomasCalibracion
        : tomasFenologicas;

    /* ----- MODO EDITAR ----- */
    if (modo === "editar" && tomaEditar) {
      const permitido = await validarTomaSinDatos(tomaEditar.n_de_toma);

      if (!permitido)
        return Alert.alert(
          "No editable",
          "La toma ya tiene registros asociados."
        );

      const { error } = await supabase
        .from("tomas")
        .update({
          tipo_toma: tipoToma,
          muestra_sugerida: muestra,
          fecha_creacion: fInicio,
          fecha_fin: fFin,
          variedad: variedad,
        })
        .eq("id_toma", tomaEditar.id_toma);

      if (error) return Alert.alert("Error", JSON.stringify(error));

      Alert.alert("Éxito", "Toma actualizada correctamente.");
      navigation.goBack();
      return;
    }

    /* ----- MODO CREAR ----- */
    const codigo = await generarCodigoToma();

    const { error } = await supabase.from("tomas").insert([
      {
        n_de_toma: codigo,
        codigo_lote: lote?.codigo_lote,
        nombre_lote: lote?.nombre_lote,
        variedad,
        tipo_toma: tipoToma,
        muestra_sugerida: muestra,
        fundo,
        fecha_creacion: fInicio,
        fecha_fin: fFin,
        estado: "creada",
      },
    ]);

    if (error) return Alert.alert("Error Supabase", JSON.stringify(error));

    Alert.alert("Éxito", `Toma creada (${codigo})`);
    navigation.goBack();
  };

  /* -------------------------------------------------------------
     UI
  ------------------------------------------------------------- */
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "android" ? "height" : "padding"}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.container}>
          <Text style={styles.title}>
            {modo === "editar" ? "Editar Toma" : "Crear Nueva Toma"}
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color="#234d20" />
          ) : (
            <>
              {/* LOTE */}
              <Text style={styles.label}>Nombre de lote</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedLoteId ?? ""}
                  onValueChange={(value) =>
                    handleSelectLote(value === "" ? null : (value as string))
                  }
                  enabled={modo === "crear"}
                >
                  <Picker.Item label="Seleccione un lote..." value="" />
                  {lotes.map((lote) => (
                    <Picker.Item
                      key={lote.id_lote}
                      label={lote.nombre_lote}
                      value={lote.id_lote}
                    />
                  ))}
                </Picker>
              </View>

              {/* VARIEDAD */}
              <Text style={styles.label}>Cultivo / Variedad</Text>
              <TextInput style={styles.input} value={variedad} editable={false} />

              {/* PLANTAS */}
              <Text style={styles.label}>Plantas calculadas</Text>
              <TextInput style={styles.input} value={plantasCalculadas} editable={false} />

              {/* TIPO DE TOMA */}
              <Text style={styles.label}>Tipo de toma</Text>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={tipoToma} onValueChange={setTipoToma}>
                  <Picker.Item label="Fenológica" value="fenologica" />
                  <Picker.Item label="Conteo de frutos" value="conteo" />
                  <Picker.Item label="Calibración de frutos" value="calibracion" />
                  <Picker.Item label="Genérica" value="generica" />
                </Picker>
              </View>

              {/* CANTIDADES */}
              <Text style={styles.label}>Cantidad de tomas</Text>

              {tipoToma === "fenologica" && (
                <TextInput
                  style={styles.input}
                  value={tomasFenologicas}
                  onChangeText={setTomasFenologicas}
                  keyboardType="numeric"
                />
              )}

              {tipoToma === "conteo" && (
                <TextInput
                  style={styles.input}
                  value={tomasConteo}
                  onChangeText={setTomasConteo}
                  keyboardType="numeric"
                />
              )}

              {tipoToma === "calibracion" && (
                <TextInput
                  style={styles.input}
                  value={tomasCalibracion}
                  onChangeText={setTomasCalibracion}
                  keyboardType="numeric"
                />
              )}

              {tipoToma === "generica" && (
                <TextInput
                  style={styles.input}
                  value={tomasFenologicas}
                  onChangeText={setTomasFenologicas}
                  keyboardType="numeric"
                />
              )}

              {/* FECHAS */}
              <Text style={styles.label}>Fecha inicio</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowInicioPicker(true)}
              >
                <Text>{fechaInicio || "Seleccione fecha"}</Text>
              </TouchableOpacity>

              {showInicioPicker && (
                <DateTimePicker
                  value={new Date()}
                  mode="date"
                  onChange={(e, selected) => {
                    setShowInicioPicker(false);
                    if (selected) setFechaInicio(formatDMY(selected));
                  }}
                />
              )}

              <Text style={styles.label}>Fecha fin</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowFinPicker(true)}
              >
                <Text>{fechaFin || "Seleccione fecha"}</Text>
              </TouchableOpacity>

              {showFinPicker && (
                <DateTimePicker
                  value={new Date()}
                  mode="date"
                  onChange={(e, selected) => {
                    setShowFinPicker(false);
                    if (selected) setFechaFin(formatDMY(selected));
                  }}
                />
              )}

              {/* GUARDAR */}
              <TouchableOpacity style={styles.btn} onPress={guardarToma}>
                <Text style={styles.btnText}>
                  {modo === "editar" ? "Guardar cambios" : "Crear toma"}
                </Text>
              </TouchableOpacity>

              {/* 🔥 BOTÓN RESTAURADO: APROBAR / EDITAR TOMAS */}
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: "#1f78d1", marginTop: 15 }]}
                onPress={() => navigation.navigate("AprobarEditarTomas")}
              >
                <Text style={styles.btnText}>Aprobar / Editar Tomas</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CrearTomaScreen;

/* -------------------------------------------------------------
   ESTILOS
------------------------------------------------------------- */

const styles = StyleSheet.create({
  scroll: { flexGrow: 1 },
  container: {
    flex: 1,
    backgroundColor: "#e8f3eb",
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#234d20",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: "#234d20",
    marginTop: 10,
    marginBottom: 6,
    fontWeight: "600",
  },
  pickerContainer: {
    backgroundColor: "#a198b9ff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#c3d6c3",
  },
  input: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#c3d6c3",
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: "#234d20",
  },
  btn: {
    backgroundColor: "#234d20",
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 8,
  },
  btnText: {
    color: "#f7f8faff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
  },
});
