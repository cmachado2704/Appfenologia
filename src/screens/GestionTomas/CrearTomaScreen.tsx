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
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../services/supabaseClient";

type Lote = {
  id_lote: string;
  codigo_lote: string;
  nombre_lote: string;
  variedad?: string | null;
  plantas_calculadas?: number | null;
};

const CrearTomaScreen: React.FC = () => {
  const navigation = useNavigation();
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedLoteId, setSelectedLoteId] = useState<string | null>(null);

  const [variedad, setVariedad] = useState<string>("");
  const [plantasCalculadas, setPlantasCalculadas] = useState<string>("");
  const [cantidadSugerida, setCantidadSugerida] = useState<string>("");
  const [fundo, setFundo] = useState<string>("");

  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");

  const convertirFecha = (f: string) => {
    if (!f || !f.includes("/")) return null;
    const [d, m, y] = f.split("/");
    return `${y}-${m}-${d}`;
  };

  useEffect(() => {
    const fetchLotes = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("lotes")
          .select("id_lote, codigo_lote, nombre_lote, variedad, plantas_calculadas")
          .order("nombre_lote", { ascending: true });

        if (error) throw error;

        setLotes(data as any[]);
      } catch {
        Alert.alert("Error", "No se pudieron cargar los lotes.");
      } finally {
        setLoading(false);
      }
    };

    fetchLotes();
  }, []);

  const handleSelectLote = (loteId: string | null) => {
    setSelectedLoteId(loteId);

    const lote = lotes.find((l) => l.id_lote === loteId);

    if (lote) {
      setVariedad(lote.variedad ?? "");
      const plantas = lote.plantas_calculadas ?? 0;
      setPlantasCalculadas(plantas.toString());
      const sugerida = Math.round((plantas * 4) / 20);
      setCantidadSugerida(sugerida.toString());
    } else {
      setVariedad("");
      setPlantasCalculadas("");
      setCantidadSugerida("");
    }
  };

  const generarCodigoToma = async () => {
    const { data, error } = await supabase
      .from("tomas")
      .select("n_de_toma");

    if (error || !data) return "T001";

    const numeros = data
      .map((t) => t.n_de_toma)
      .filter((c) => typeof c === "string" && c.startsWith("T"))
      .map((c) => parseInt(c.replace("T", "")))
      .filter((n) => !isNaN(n));

    if (numeros.length === 0) return "T001";

    const maximo = Math.max(...numeros);
    return `T${(maximo + 1).toString().padStart(3, "0")}`;
  };

  const guardarToma = async () => {
    if (!selectedLoteId) {
      Alert.alert("Falta información", "Seleccione un lote.");
      return;
    }
    if (!fechaInicio || !fechaFin || !fundo || !cantidadSugerida) {
      Alert.alert("Falta información", "Complete todos los campos.");
      return;
    }

    const fechaInicioConv = convertirFecha(fechaInicio);
    const fechaFinConv = convertirFecha(fechaFin);

    if (!fechaInicioConv || !fechaFinConv) {
      Alert.alert("Formato incorrecto", "Use dd/mm/aaaa. Ej: 23/11/2025");
      return;
    }

    const lote = lotes.find((l) => l.id_lote === selectedLoteId);
    const codigo = await generarCodigoToma();

    const { error } = await supabase.from("tomas").insert([
      {
        n_de_toma: codigo,
        codigo_lote: lote?.codigo_lote || "",
        nombre_lote: lote?.nombre_lote || "",
        muestra_sugerida: cantidadSugerida,
        fundo: fundo,
        variedad: variedad,
        estado: "creada",
        fecha_creacion: fechaInicioConv,
        fecha_fin: fechaFinConv,
        fecha_aprobacion: null,
        usuario_aprobador: null,
      },
    ]);

    if (error) {
      Alert.alert("Error Supabase", JSON.stringify(error, null, 2));
      return;
    }

    Alert.alert("Éxito", `Toma creada correctamente (${codigo})`);

    setSelectedLoteId(null);
    setVariedad("");
    setPlantasCalculadas("");
    setCantidadSugerida("");
    setFundo("");
    setFechaInicio("");
    setFechaFin("");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "android" ? "height" : "padding"}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.container}>
          <Text style={styles.title}>Crear Toma Fenológica</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#234d20" />
          ) : (
            <>
              <Text style={styles.label}>Nombre de lote</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedLoteId ?? ""}
                  onValueChange={(value) =>
                    handleSelectLote(value === "" ? null : (value as string))
                  }
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

              <Text style={styles.label}>Cultivo / Variedad</Text>
              <TextInput style={styles.input} value={variedad} editable={false} />

              <Text style={styles.label}>Plantas calculadas</Text>
              <TextInput style={styles.input} value={plantasCalculadas} editable={false} />

              <Text style={styles.label}>Cantidad de tomas sugeridas</Text>
              <TextInput
                style={styles.input}
                value={cantidadSugerida}
                keyboardType="numeric"
                onChangeText={setCantidadSugerida}
              />

              <Text style={styles.label}>Fundo</Text>
              <TextInput
                style={styles.input}
                value={fundo}
                onChangeText={setFundo}
              />

              <Text style={styles.label}>Fecha inicio (dd/mm/aaaa)</Text>
              <TextInput
                style={styles.input}
                value={fechaInicio}
                onChangeText={setFechaInicio}
              />

              <Text style={styles.label}>Fecha fin (dd/mm/aaaa)</Text>
              <TextInput
                style={styles.input}
                value={fechaFin}
                onChangeText={setFechaFin}
              />

              <TouchableOpacity style={styles.btn} onPress={guardarToma}>
                <Text style={styles.btnText}>Generar toma nueva</Text>
              </TouchableOpacity>

              {/* 🔥 NUEVO BOTÓN */}
              <TouchableOpacity
                style={styles.btnSecundario}
                onPress={() => navigation.navigate("AprobarEditarTomas" as never)}
              >
                <Text style={styles.btnSecundarioText}>
                  Aprobar / editar tomas
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scroll: { flexGrow: 1 },
  container: { flex: 1, backgroundColor: "#e8f3eb", padding: 16 },
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
    backgroundColor: "#ffffff",
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
    color: "#ffffff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
  },

  // 🔥 BOTÓN SECUNDARIO (nuevo)
  btnSecundario: {
    backgroundColor: "#4a7c59",
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 8,
  },
  btnSecundarioText: {
    color: "#ffffff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default CrearTomaScreen;
