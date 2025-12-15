import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Modal,
  FlatList,
} from "react-native";

import NetInfo from "@react-native-community/netinfo";
import DateTimePicker from "@react-native-community/datetimepicker";
import { supabase } from "../../services/supabaseClient";
import { CatalogCache } from "../../utils/catalogCache";
import { getCurrentPosition } from "../../utils/location";
import { addToOfflineQueue } from "../../utils/offlineQueue";

/* ===== FOTOS (MISMO STACK QUE INSERTARREGISTROTOMASCREEN) ===== */
import { tomarFoto } from "../../utils/photoPicker";
import { subirFotoSupabase } from "../../utils/uploadPhoto";

type RegistroCaida = {
  n_planta: string;
  fila: string;
  n_frutos_caidos: string;
  calibre_min: string;
  calibre_max: string;
};

const InsertarConteoFrutosCaidosScreen = ({ navigation }: any) => {
  /* ================= RED ================= */
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((s) =>
      setIsOnline(!!(s.isConnected && s.isInternetReachable))
    );
    return () => unsub();
  }, []);

  /* ================= HELPERS ================= */
  const fixLocalDate = (d: Date) =>
    new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];

  const getISOWeek = (date: Date) => {
    const tmp = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    const dayNum = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    return Math.ceil(
      ((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
    );
  };

  /* ================= FOTOS ================= */
  const [foto1, setFoto1] = useState<string | null>(null);
  const [foto2, setFoto2] = useState<string | null>(null);
  const [subiendoFotos, setSubiendoFotos] = useState(false);

  const handleTomarFoto1 = async () => {
    try {
      const uri = await tomarFoto();
      if (uri) setFoto1(uri);
    } catch {
      Alert.alert("Error", "No se pudo tomar la foto 1");
    }
  };

  const handleTomarFoto2 = async () => {
    try {
      const uri = await tomarFoto();
      if (uri) setFoto2(uri);
    } catch {
      Alert.alert("Error", "No se pudo tomar la foto 2");
    }
  };

  /* ================= BUSCADOR ================= */
  const [searchMode, setSearchMode] = useState<"numero" | "lote">("numero");
  const [searchField, setSearchField] = useState("");
  const [tomasResults, setTomasResults] = useState<any[]>([]);
  const [selectedToma, setSelectedToma] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  const handleBuscarTomas = async () => {
    if (!searchField.trim()) return;
    setSearching(true);

    try {
      if (isOnline) {
        let query = supabase
          .from("tomas")
          .select("*")
          .eq("estado", "creada")
          .in("tipo_toma", ["conteo", null])
          .order("n_de_toma", { ascending: true });

        query =
          searchMode === "numero"
            ? query.ilike("n_de_toma", `%${searchField}%`)
            : query.ilike("nombre_lote", `%${searchField}%`);

        const { data } = await query;
        setTomasResults(data || []);
      } else {
        const cached = await CatalogCache.loadTomas();
        const filtered =
          searchMode === "numero"
            ? cached.filter((t: any) =>
                t.n_de_toma?.toLowerCase().includes(searchField.toLowerCase())
              )
            : cached.filter((t: any) =>
                t.nombre_lote?.toLowerCase().includes(searchField.toLowerCase())
              );

        const filteredByTipo = filtered.filter(
          (t: any) =>
            t.tipo_toma === "conteo" ||
            t.tipo_toma === null ||
            t.tipo_toma === "" ||
            t.tipo_toma === undefined
        );

        filteredByTipo.sort((a: any, b: any) =>
          a.n_de_toma.localeCompare(b.n_de_toma)
        );

        setTomasResults(filteredByTipo);
      }
    } catch (e) {
      console.log(e);
    }

    setSearching(false);
  };

  const handleSelectToma = (t: any) => {
    setSelectedToma(t);
    setTomasResults([]);
  };

  /* ================= CABECERA ================= */
  const [campania, setCampania] = useState("");
  const [fechaEval, setFechaEval] = useState<string | null>(null);
  const [showPickerEval, setShowPickerEval] = useState(false);

  const [sector, setSector] = useState("");
  const [lado, setLado] = useState("");

  const [sectores, setSectores] = useState<any[]>([]);
  const [ladosVariedad, setLadosVariedad] = useState<any[]>([]);
  const [modalSector, setModalSector] = useState(false);
  const [modalLado, setModalLado] = useState(false);

  useEffect(() => {
    const loadCatalogos = async () => {
      setSectores(await CatalogCache.loadSector());
      setLadosVariedad(await CatalogCache.loadLadoVariedad());
    };
    loadCatalogos();
  }, []);

  /* ================= REGISTRO DE CAÍDA ================= */
  const [registros, setRegistros] = useState<RegistroCaida[]>([
    { n_planta: "", fila: "", n_frutos_caidos: "", calibre_min: "", calibre_max: "" },
  ]);

  const handleAddRegistro = () => {
    if (registros.length >= 20) return;
    setRegistros([
      ...registros,
      { n_planta: "", fila: "", n_frutos_caidos: "", calibre_min: "", calibre_max: "" },
    ]);
  };

  const updateRegistro = (idx: number, patch: Partial<RegistroCaida>) => {
    const copy = [...registros];
    copy[idx] = { ...copy[idx], ...patch };
    setRegistros(copy);
  };

  const validarCalibre = (v: string) => {
    if (!v) return true;
    const n = Number(v);
    return n >= 1 && n <= 50;
  };

  /* ================= GUARDAR ================= */
  const [loading, setLoading] = useState(false);

  const handleGuardar = async () => {
    if (!selectedToma) return Alert.alert("Seleccione una toma");
    if (!fechaEval) return Alert.alert("Ingrese la fecha");
    if (!sector) return Alert.alert("Seleccione sector");
    if (!lado) return Alert.alert("Seleccione lado / variedad");

    const regsValidos = registros.filter(
      (r) => r.n_planta && r.fila && r.n_frutos_caidos
    );

    if (regsValidos.length === 0)
      return Alert.alert("Ingrese al menos un registro válido");

    for (const r of regsValidos) {
      if (!validarCalibre(r.calibre_min) || !validarCalibre(r.calibre_max)) {
        return Alert.alert("Calibre inválido", "Debe estar entre 1 y 50 mm");
      }
    }

    setLoading(true);

    let lat = null;
    let lon = null;
    try {
      const gps = await getCurrentPosition();
      lat = gps.lat;
      lon = gps.lon;
    } catch {}

    /* ===== FOTOS ===== */
    let fotosFinal: { foto1: string | null; foto2: string | null } = {
      foto1,
      foto2,
    };

    if (isOnline && (foto1 || foto2)) {
      try {
        setSubiendoFotos(true);
        const idRef = selectedToma.id || selectedToma.n_de_toma;

        if (foto1) fotosFinal.foto1 = await subirFotoSupabase(idRef, 1, foto1);
        if (foto2) fotosFinal.foto2 = await subirFotoSupabase(idRef, 2, foto2);
      } catch {
        fotosFinal = { foto1: null, foto2: null };
      } finally {
        setSubiendoFotos(false);
      }
    }

    const payloads = regsValidos.map((r) => ({
      cosecha: campania,
      num_semana: getISOWeek(new Date(fechaEval)),
      fecha_evaluacion: fechaEval,
      sector,
      lado,
      fila: r.fila,
      n_planta: Number(r.n_planta),
      lote: selectedToma.codigo_lote,
      variedad: selectedToma.variedad,
      n_de_toma: selectedToma.n_de_toma,
      n_frutos_caidos: Number(r.n_frutos_caidos),
      calibre_minimo: r.calibre_min ? Number(r.calibre_min) : null,
      calibre_maximo: r.calibre_max ? Number(r.calibre_max) : null,
      fotos: fotosFinal,
      inspector: "APP",
      latitud: lat,
      longitud: lon,
    }));

    if (!isOnline) {
      for (const p of payloads) {
        await addToOfflineQueue({
          tipo: "conteo_frutos_caidos",
          datos: p,
          timestamp: Date.now(),
        });
      }
      Alert.alert("Guardado offline", "Se sincronizará al recuperar la red.");
      setLoading(false);
      navigation.goBack();
      return;
    }

    await supabase.from("conteo_frutos_caidos").insert(payloads);
    Alert.alert("Éxito", "Registros guardados");
    setLoading(false);
    navigation.goBack();
  };

  /* ================= UI ================= */
  return (
    <ScrollView style={styles.container}>
      {/* BUSCADOR */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Seleccionar toma</Text>

        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              searchMode === "numero" && styles.toggleButtonActive,
            ]}
            onPress={() => setSearchMode("numero")}
          >
            <Text style={styles.toggleText}>Por N° de toma</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              searchMode === "lote" && styles.toggleButtonActive,
            ]}
            onPress={() => setSearchMode("lote")}
          >
            <Text style={styles.toggleText}>Por nombre de lote</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar…"
            value={searchField}
            onChangeText={setSearchField}
            placeholderTextColor="#666"
          />

          <TouchableOpacity style={styles.searchButton} onPress={handleBuscarTomas}>
            {searching ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.searchButtonText}>Buscar</Text>
            )}
          </TouchableOpacity>
        </View>

        {tomasResults.map((t, i) => (
          <TouchableOpacity
            key={i}
            style={styles.resultItem}
            onPress={() => handleSelectToma(t)}
          >
            <Text style={styles.resultItemText}>
              Toma {t.n_de_toma} - {t.nombre_lote}
            </Text>
            <Text style={styles.resultItemSub}>
              Lote: {t.codigo_lote} | Variedad: {t.variedad}
            </Text>
          </TouchableOpacity>
        ))}

        {selectedToma && (
          <View style={styles.selectedCard}>
            <Text style={styles.selectedTitle}>
              Toma seleccionada: {selectedToma.n_de_toma}
            </Text>
            <Text>
              Lote: {selectedToma.codigo_lote} - {selectedToma.nombre_lote}
            </Text>
            <Text>Variedad: {selectedToma.variedad}</Text>
            {selectedToma.muestra_sugerida && (
              <Text>Muestra sugerida: {selectedToma.muestra_sugerida}</Text>
            )}
          </View>
        )}
      </View>

      {/* FORMULARIO */}
      {selectedToma && (
        <>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Datos principales</Text>
        
            <Text style={styles.label}>Campaña</Text>
            <TextInput
              style={styles.input}
              placeholder="2024-2025"
              value={campania}
              onChangeText={setCampania}
              placeholderTextColor="#666"
            />

            <Text style={styles.label}>Fecha evaluación</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowPickerEval(true)}
            >
              <Text style={{ color: fechaEval ? "#000" : "#666" }}>
                {fechaEval || "Seleccionar fecha"}
              </Text>
            </TouchableOpacity>

            {showPickerEval && (
              <DateTimePicker
                mode="date"
                value={new Date()}
                onChange={(e, d) => {
                  setShowPickerEval(false);
                  if (d) setFechaEval(fixLocalDate(d));
                }}
              />
            )}

            <Text style={styles.label}>Sector</Text>
            <TouchableOpacity style={styles.input} onPress={() => setModalSector(true)}>
              <Text style={{ color: sector ? "#000" : "#666" }}>
                {sector || "Seleccionar sector"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>Lado / Variedad</Text>
            <TouchableOpacity style={styles.input} onPress={() => setModalLado(true)}>
              <Text style={{ color: lado ? "#000" : "#666" }}>
                {lado || "Seleccionar lado / variedad"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
  <Text style={styles.sectionTitle}>Registro de caída</Text>

  <View style={styles.regHeaderRow}>
    <Text style={styles.regHeaderText}>Planta</Text>
    <Text style={styles.regHeaderText}>Fila</Text>
    <Text style={styles.regHeaderText}>Conteo</Text>
    <Text style={styles.regHeaderText}>Cal. Min</Text>
    <Text style={styles.regHeaderText}>Cal. Max</Text>
  </View>

  {registros.slice(0, 5).map((r, idx) => (
    <View key={idx} style={styles.regRow}>
      <TextInput
        style={styles.regInput}
        value={r.n_planta}
        onChangeText={(v) =>
          updateRegistro(idx, { n_planta: v.replace(/[^0-9]/g, "") })
        }
        keyboardType="numeric"
      />

      <TextInput
        style={styles.regInput}
        value={r.fila}
        onChangeText={(v) =>
          updateRegistro(idx, { fila: v.replace(/[^0-9]/g, "") })
        }
        keyboardType="numeric"
      />

      <TextInput
        style={styles.regInputWide}
        value={r.n_frutos_caidos}
        onChangeText={(v) =>
          updateRegistro(idx, {
            n_frutos_caidos: v.replace(/[^0-9]/g, ""),
          })
        }
        keyboardType="numeric"
      />

      <TextInput
        style={styles.regInput}
        value={r.calibre_min}
        onChangeText={(v) =>
          updateRegistro(idx, { calibre_min: v.replace(/[^0-9]/g, "") })
        }
        keyboardType="numeric"
      />

      <TextInput
        style={styles.regInput}
        value={r.calibre_max}
        onChangeText={(v) =>
          updateRegistro(idx, { calibre_max: v.replace(/[^0-9]/g, "") })
        }
        keyboardType="numeric"
      />
    </View>
  ))}

  {registros.length < 20 && (
    <TouchableOpacity onPress={handleAddRegistro} style={{ marginTop: 10 }}>
      <Text style={{ color: "#234d20", fontWeight: "700" }}>
        + Agregar planta
      </Text>
    </TouchableOpacity>
  )}

  {/* ===== FOTOS (AQUÍ, VISIBLE) ===== */}
  <View style={{ marginTop: 20 }}>
    <Text style={styles.sectionTitle}>Fotos</Text>

    <View style={{ flexDirection: "row", gap: 10 }}>
      <TouchableOpacity
        style={styles.photoButton}
        onPress={handleTomarFoto1}
      >
        <Text style={styles.photoButtonText}>
          {foto1 ? "Foto 1 ✓" : "Tomar foto 1"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.photoButton}
        onPress={handleTomarFoto2}
      >
        <Text style={styles.photoButtonText}>
          {foto2 ? "Foto 2 ✓" : "Tomar foto 2"}
        </Text>
      </TouchableOpacity>
    </View>
  </View>
</View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleGuardar}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveText}>Guardar</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      {/* MODALES */}
      <Modal visible={modalSector} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <FlatList
              data={sectores}
              keyExtractor={(i) => String(i.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setSector(item.nombre);
                    setModalSector(false);
                  }}
                >
                  <Text style={styles.modalItem}>{item.nombre}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={modalLado} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <FlatList
              data={ladosVariedad}
              keyExtractor={(i) => String(i.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setLado(item.nombre);
                    setModalLado(false);
                  }}
                >
                  <Text style={styles.modalItem}>{item.nombre}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default InsertarConteoFrutosCaidosScreen;

/* ================= ESTILOS ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1B4D3E", padding: 16,  paddingBottom: 120 },
  card: { backgroundColor: "#fff", borderRadius: 10, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#234d20", marginBottom: 10 },
  label: { marginTop: 12, marginBottom: 4, fontWeight: "600", color: "#234d20" },
  input: { backgroundColor: "#eee", padding: 12, borderRadius: 8, fontSize: 16 },
  toggleContainer: { flexDirection: "row", marginBottom: 10 },
  toggleButton: {
    flex: 1,
    padding: 10,
    backgroundColor: "#ccc",
    borderRadius: 8,
    marginRight: 6,
    alignItems: "center",
  },
  toggleButtonActive: { backgroundColor: "#234d20" },
  toggleText: { color: "#fff", fontWeight: "600" },
  searchContainer: { flexDirection: "row", marginBottom: 10 },
  searchInput: {
    flex: 1,
    backgroundColor: "#eee",
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  searchButton: { backgroundColor: "#2e7d32", padding: 12, borderRadius: 8 },
  searchButtonText: { color: "#fff", fontWeight: "700" },
  resultItem: { backgroundColor: "#eef6f0", padding: 10, marginTop: 6, borderRadius: 8 },
  resultItemText: { fontWeight: "700", color: "#234d20" },
  resultItemSub: { color: "#666" },
  selectedCard: { backgroundColor: "#e3f2e5", padding: 12, borderRadius: 10, marginTop: 10 },
  selectedTitle: { fontWeight: "700", color: "#234d20", marginBottom: 4 },
  saveButton: {
    backgroundColor: "#234d20",
    padding: 16,
    borderRadius: 10,
    marginBottom: 40,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontSize: 18, fontWeight: "700" },

  regHeaderRow: { flexDirection: "row", marginBottom: 6 },
  regHeaderText: { flex: 1, fontSize: 11, fontWeight: "700", color: "#234d20" },
  regRow: { flexDirection: "row", marginBottom: 6 },
  regInput: {
    flex: 1,
    backgroundColor: "#eee",
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 6,
    fontSize: 12,
    color: "#000",
    marginRight: 4,
  },
  regInputWide: {
    flex: 1.2,
    backgroundColor: "#eee",
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 6,
    fontSize: 12,
    color: "#000",
    marginRight: 4,
  },

  photoButton: {
    flex: 1,
    backgroundColor: "#234d20",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  photoButtonText: { color: "#fff", fontWeight: "700" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: { backgroundColor: "#fff", borderRadius: 10, width: "85%", maxHeight: "70%" },
  modalItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: "#eee", fontSize: 16 },
});
