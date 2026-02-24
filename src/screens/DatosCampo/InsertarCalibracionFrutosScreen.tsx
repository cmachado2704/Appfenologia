import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
  FlatList,
} from "react-native";

import NetInfo from "@react-native-community/netinfo";
import DateTimePicker from "@react-native-community/datetimepicker";
import { supabase } from "../../services/supabaseClient";
import { CatalogCache } from "../../utils/catalogCache";
import { getCurrentPosition } from "../../utils/location";
import { addToOfflineQueue } from "../../utils/offlineQueue";
import { fetchClimaYUbicacion } from "../../services/climaService";

/* ===== FOTOS (MISMO STACK YA VALIDADO) ===== */
import { tomarFoto } from "../../utils/photoPicker";
import { subirFotoSupabase } from "../../utils/uploadPhoto";

type RegistroCalibracion = {
  n_planta: string;
  fila: string;
  clasificacion: any | null;
  calibre: string;
};

/* ============================================================
   PANTALLA PRINCIPAL
============================================================ */
const InsertarCalibracionFrutosScreen = ({ navigation }: any) => {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((s) => {
      setIsOnline(s.isConnected && s.isInternetReachable ? true : false);
    });
    return () => unsub();
  }, []);

  /* ================= FOTOS ================= */
  const [foto1, setFoto1] = useState<string | null>(null);
  const [foto2, setFoto2] = useState<string | null>(null);
  const [subiendoFotos, setSubiendoFotos] = useState(false);

  const handleTomarFoto1 = async () => {
    try {
      const uri = await tomarFoto();
      if (uri) setFoto1(uri);
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "No se pudo tomar la foto 1");
    }
  };

  const handleTomarFoto2 = async () => {
    try {
      const uri = await tomarFoto();
      if (uri) setFoto2(uri);
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "No se pudo tomar la foto 2");
    }
  };

  /* ------------------- BUSCADOR DE TOMAS ------------------- */
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
          .in("tipo_toma", ["calibracion", "generica"])
          .order("n_de_toma", { ascending: true });

        if (searchMode === "numero") {
          query = query.ilike("n_de_toma", `%${searchField}%`);
        } else {
          query = query.ilike("nombre_lote", `%${searchField}%`);
        }

        const { data, error } = await query;
        if (error) throw error;

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

        // ✅ MISMO FILTRO QUE ONLINE
        const filteredByTipoYEstado = filtered.filter(
          (t: any) =>
            (t.tipo_toma === "calibracion" || t.tipo_toma === "generica") &&
            t.estado === "creada"
        );

        filteredByTipoYEstado.sort((a: any, b: any) =>
          a.n_de_toma.localeCompare(b.n_de_toma)
        );

        setTomasResults(filteredByTipoYEstado);
      }
    } catch (err) {
      console.log(err);
    }

    setSearching(false);
  };

  const handleSelectToma = (t: any) => {
    setSelectedToma(t);
    setTomasResults([]); // Oculta listado
  };

  /* ------------------- FORMULARIO ------------------- */
  const [campania, setCampania] = useState("");
  const [fechaEval, setFechaEval] = useState<string | null>(null);
  const [showPickerEval, setShowPickerEval] = useState(false);

  const [fechaCosecha, setFechaCosecha] = useState<string | null>(null);
  const [showPickerCosecha, setShowPickerCosecha] = useState(false);

  const [sector, setSector] = useState("");
  const [sectores, setSectores] = useState<any[]>([]);
  const [modalSector, setModalSector] = useState(false);

  /* ================= REGISTRO DE CALIBRACIÓN (MULTI - GRID) ================= */
  const [clasificaciones, setClasificaciones] = useState<any[]>([]);
  const [modalClasif, setModalClasif] = useState(false);
  const [registroActivo, setRegistroActivo] = useState<number | null>(null);

  const [registros, setRegistros] = useState<RegistroCalibracion[]>([
    { n_planta: "", fila: "", clasificacion: null, calibre: "" },
  ]);

  const handleAddRegistro = () => {
    if (registros.length >= 20) return;
    setRegistros([
      ...registros,
      { n_planta: "", fila: "", clasificacion: null, calibre: "" },
    ]);
  };

  const updateRegistro = (idx: number, patch: Partial<RegistroCalibracion>) => {
    const copy = [...registros];
    copy[idx] = { ...copy[idx], ...patch };
    setRegistros(copy);
  };

  const [observacion, setObservacion] = useState("");

  const [lote, setLote] = useState("");
  const [variedad, setVariedad] = useState("");

  const [loading, setLoading] = useState(false);
  const [isLoadingClima, setIsLoadingClima] = useState(false);
  const [clima, setClima] = useState<any>(null);

  const getISOWeek = (date: Date) => {
    const tmp = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    const dayNum = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  };

  /* ============================================================
     CARGAR CLASIFICACIONES + SECTORES (ONLINE/OFFLINE)
  ============================================================ */
  useEffect(() => {
    const loadClasif = async () => {
      try {
        let data: any[] = [];

        if (isOnline) {
          const { data: supaData, error } = await supabase
            .from("clasificacion_tamaño")
            .select("*")
            .order("tamano", { ascending: true });

          if (error) throw error;

          data = supaData || [];
        } else {
          data = await CatalogCache.loadClasificacionTamano();
        }

        setClasificaciones(data);
      } catch (e) {
        console.log("Error cargando clasificaciones:", e);
      }
    };

    const loadSector = async () => {
      try {
        if (isOnline) {
          const { data, error } = await supabase
            .from("sector")
            .select("*")
            .order("nombre", { ascending: true });

          if (error) throw error;
          setSectores(data || []);
        } else {
          const data = await CatalogCache.loadSector();
          setSectores(data || []);
        }
      } catch (e) {
        console.log("Error cargando sectores:", e);
        try {
          const data = await CatalogCache.loadSector();
          setSectores(data || []);
        } catch {}
      }
    };

    loadClasif();
    loadSector();
  }, [isOnline]);

  /* ============================================================
     ACTUALIZAR LOTE Y VARIEDAD AL SELECCIONAR TOMA (YA EXISTENTE)
  ============================================================ */
  useEffect(() => {
    if (selectedToma) {
      setLote(selectedToma.codigo_lote || "");
      setVariedad(selectedToma.variedad || "");
    }
  }, [selectedToma]);

  const handleCargarClima = async () => {
    try {
      setIsLoadingClima(true);
      const climaPayload = await fetchClimaYUbicacion();
      setClima(climaPayload);
      Alert.alert(
        "Clima",
        climaPayload.warning ? "Clima cargado (ubicación parcial)." : "Clima cargado"
      );
    } catch (e: any) {
      Alert.alert("Clima", e?.message || "No se pudo cargar datos de clima.");
    } finally {
      setIsLoadingClima(false);
    }
  };

  /* ============================================================
     GUARDAR
  ============================================================ */
  const handleGuardar = async () => {
    if (!selectedToma) return Alert.alert("Falta seleccionar toma");
    if (!fechaEval) return Alert.alert("Falta fecha de evaluación");
    if (!fechaCosecha) return Alert.alert("Falta fecha de cosecha");
    if (!sector) return Alert.alert("Falta sector"); // NUEVO
    const validos = registros.filter(
      (r) => r.n_planta.trim() && r.fila.trim() && r.clasificacion && r.calibre.trim()
    );
    if (validos.length === 0) {
      return Alert.alert("Falta registro", "Agregue al menos 1 registro válido");
    }

    setLoading(true);

    try {
      let lat = clima?.latitud ?? null;
      let lon = clima?.longitud ?? null;

      if (lat == null || lon == null) {
        try {
          const gps = await getCurrentPosition();
          lat = gps.lat;
          lon = gps.lon;
        } catch {}
      }

      // Subir fotos (solo online). Offline: se guardan URIs y luego syncOfflineQueue las sube.
      let fotoUrl1: string | null = foto1;
      let fotoUrl2: string | null = foto2;

      if (isOnline && (foto1 || foto2)) {
        try {
          setSubiendoFotos(true);
          const idTomaNum = Number(selectedToma?.n_de_toma);
          const plantaNum = Number(validos?.[0]?.n_planta || 0);

          if (foto1) fotoUrl1 = await subirFotoSupabase(idTomaNum, plantaNum, foto1);
          if (foto2) fotoUrl2 = await subirFotoSupabase(idTomaNum, plantaNum, foto2);
        } catch (e) {
          console.log("Error subiendo fotos:", e);
          fotoUrl1 = foto1;
          fotoUrl2 = foto2;
        } finally {
          setSubiendoFotos(false);
        }
      }

      const basePayload: any = {
        campaña: campania,
        num_semana: fechaEval ? getISOWeek(new Date(fechaEval)) : null,
        fecha_evaluacion: fechaEval,
        fecha_cosecha: fechaCosecha,

        sector,
        observacion,

        lote,
        variedad,

        n_de_toma: selectedToma.n_de_toma,
        nombre_lote: selectedToma?.nombre_lote ?? null, // NUEVO

        fotos: {
          foto1: fotoUrl1,
          foto2: fotoUrl2,
        }, // NUEVO

        inspector: "APP",
        latitud: lat,
        longitud: lon,
        pais: clima?.pais ?? null,
        departamento: clima?.departamento ?? null,
        provincia: clima?.provincia ?? null,
        distrito: clima?.distrito ?? null,
        temperatura_actual_c: clima?.temperatura_actual_c ?? null,
        humedad_relativa_pct: clima?.humedad_relativa_pct ?? null,
        presion_atmosferica_hpa: clima?.presion_atmosferica_hpa ?? null,
        nubosidad_pct: clima?.nubosidad_pct ?? null,
        velocidad_del_viento_mps: clima?.velocidad_del_viento_mps ?? null,
        direccion_del_viento: clima?.direccion_del_viento ?? null,
        radiacion_solar_uv: clima?.radiacion_solar_uv ?? null,
      };

      const inserts = validos.map((r) => ({
        ...basePayload,
        fila: r.fila,
        n_planta: r.n_planta, // texto
        clasificacion: r.clasificacion?.codigo,
        tamaño: r.clasificacion?.tamano,
        calibre: Number(r.calibre),
      }));

      if (isOnline) {
        const { error } = await supabase.from("calibracion_frutos").insert(inserts);
        if (error) throw error;

        Alert.alert("Éxito", "Registros guardados correctamente");
        navigation.goBack();
      } else {
        for (const item of inserts) {
          await addToOfflineQueue({
            tipo: "calibracion_frutos",
            datos: item,
          });
        }

        Alert.alert(
          "Guardado offline",
          "Los registros se sincronizarán automáticamente cuando vuelva la conexión."
        );

        navigation.goBack();
      }
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "No se pudo guardar");
    }

    setLoading(false);
  };

  /* ============================================================
     UI
  ============================================================ */
  return (
    <ScrollView style={styles.container}>
      {/* ------------------ BUSCAR TOMA ------------------ */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Seleccionar toma</Text>

        {/* Toggle buttons */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              searchMode === "numero" && styles.toggleButtonActive,
            ]}
            onPress={() => setSearchMode("numero")}
          >
            <Text style={styles.toggleText}>Por N°de toma</Text>
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

        {/* Search input */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar…"
            value={searchField}
            onChangeText={setSearchField}
          />

          <TouchableOpacity style={styles.searchButton} onPress={handleBuscarTomas}>
            {searching ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.searchButtonText}>Buscar</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Resultados */}
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

        {/* Toma seleccionada */}
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
      {/* ------------------ FORMULARIO ------------------ */}
      {selectedToma && (
        <>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Datos de calibración</Text>

            {/* Campaña */}
            <Text style={styles.label}>Campaña</Text>
            <TextInput
              style={styles.input}
              placeholder="2024-2025"
              value={campania}
              onChangeText={setCampania}
            />

            {/* Fecha Evaluación */}
            <Text style={styles.label}>Fecha evaluación *</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowPickerEval(true)}
            >
              <Text style={{ color: fechaEval ? "#000" : "#777" }}>
                {fechaEval || "Seleccionar fecha"}
              </Text>
            </TouchableOpacity>

            {showPickerEval && (
              <DateTimePicker
                mode="date"
                value={new Date()}
                onChange={(e: any, d: any) => {
                  setShowPickerEval(false);
                  if (d) {
                    const iso = d.toISOString().split("T")[0];
                    setFechaEval(iso);
                  }
                }}
              />
            )}

            {/* Fecha Cosecha */}
            <Text style={styles.label}>Fecha cosecha *</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowPickerCosecha(true)}
            >
              <Text style={{ color: fechaCosecha ? "#000" : "#777" }}>
                {fechaCosecha || "Seleccionar fecha"}
              </Text>
            </TouchableOpacity>

            {showPickerCosecha && (
              <DateTimePicker
                mode="date"
                value={new Date()}
                onChange={(e: any, d: any) => {
                  setShowPickerCosecha(false);
                  if (d) {
                    const iso = d.toISOString().split("T")[0];
                    setFechaCosecha(iso);
                  }
                }}
              />
            )}

            {/* Sector (AHORA SELECTOR) */}
            <Text style={styles.label}>Sector</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setModalSector(true)}
            >
              <Text style={{ color: sector ? "#000" : "#777" }}>
                {sector || "Seleccionar sector"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>Clima y ubicación</Text>
            <TouchableOpacity
              style={[styles.searchButton, (!isOnline || isLoadingClima) && styles.buttonDisabled]}
              onPress={handleCargarClima}
              disabled={!isOnline || isLoadingClima}
            >
              {isLoadingClima ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.searchButtonText}>Cargando clima...</Text>
                </View>
              ) : (
                <Text style={styles.searchButtonText}>Cargar datos de clima</Text>
              )}
            </TouchableOpacity>
            {!!clima && (
              <Text style={styles.climaHint}>
                Clima listo: {clima.temperatura_actual_c ?? "-"}°C, viento {clima.direccion_del_viento ?? "-"}
              </Text>
            )}

            {/* Registro de Calibración (GRID - igual a Conteo) */}
            <Text style={styles.sectionTitle}>Registro de Calibración</Text>

            <View style={styles.regHeaderRow}>
              <Text style={styles.regHeaderText}>Planta</Text>
              <Text style={styles.regHeaderText}>Fila</Text>
              <Text style={styles.regHeaderText}>Clasif.</Text>
              <Text style={styles.regHeaderText}>Calibre</Text>
            </View>

            {registros.slice(0, 20).map((r, idx) => (
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

                <TouchableOpacity
                  style={styles.regInput}
                  onPress={() => {
                    setRegistroActivo(idx);
                    setModalClasif(true);
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: r.clasificacion ? "#000" : "#777",
                      textAlign: "center",
                    }}
                  >
                    {r.clasificacion ? r.clasificacion.codigo : "—"}
                  </Text>
                </TouchableOpacity>

                <TextInput
                  style={styles.regInput}
                  value={r.calibre}
                  onChangeText={(v) =>
                    updateRegistro(idx, { calibre: v.replace(/[^0-9]/g, "") })
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

            {/* Observación */}
            <Text style={styles.label}>Observación</Text>
            <TextInput
              style={[styles.input, { height: 90 }]}
              multiline
              value={observacion}
              onChangeText={setObservacion}
            />
          </View>

          {/* FOTOS */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Fotos</Text>

            <View style={styles.photoRow}>
              <TouchableOpacity style={styles.photoButton} onPress={handleTomarFoto1}>
                <Text style={styles.photoButtonText}>
                  {foto1 ? "Foto 1 ✓" : "Tomar foto 1"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.photoButton} onPress={handleTomarFoto2}>
                <Text style={styles.photoButtonText}>
                  {foto2 ? "Foto 2 ✓" : "Tomar foto 2"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Guardar */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleGuardar}
            disabled={loading || subiendoFotos}
          >
            {loading || subiendoFotos ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveText}>Guardar</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      {/* ------------------ MODAL SECTOR ------------------ */}
      <Modal visible={modalSector} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Seleccionar sector</Text>

            <FlatList
              data={sectores}
              keyExtractor={(item: any) => String(item.id)}
              renderItem={({ item }: any) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSector(item.nombre);
                    setModalSector(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.nombre}</Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity style={styles.modalClose} onPress={() => setModalSector(false)}>
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ------------------ MODAL CLASIFICACIÓN (YA EXISTENTE) ------------------ */}
      <Modal visible={modalClasif} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Seleccionar clasificación</Text>

            <ScrollView style={{ maxHeight: 380 }}>
              {clasificaciones.map((c: any, idx: number) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.modalItem}
                  onPress={() => {
                    if (registroActivo !== null) {
                      updateRegistro(registroActivo, { clasificacion: c });
                    }
                    setModalClasif(false);
                    setRegistroActivo(null);
                  }}
                >
                  <Text style={styles.modalItemText}>
                    {c.codigo} - {c.tamano}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.modalClose} onPress={() => setModalClasif(false)}>
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default InsertarCalibracionFrutosScreen;
	/* ================================================================
   ESTILOS — (sin cambios estructurales; solo se añaden estilos fotos + grid)
================================================================ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1B4D3E",
    padding: 16,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#234d20",
    marginBottom: 10,
  },

  label: {
    marginTop: 12,
    marginBottom: 4,
    fontWeight: "600",
    color: "#234d20",
  },

  input: {
    backgroundColor: "#eee",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },

  /* ===== TOGGLE BUSCADOR ===== */
  toggleContainer: {
    flexDirection: "row",
    marginBottom: 10,
  },

  toggleButton: {
    flex: 1,
    padding: 10,
    backgroundColor: "#ccc",
    borderRadius: 8,
    marginRight: 6,
    alignItems: "center",
  },

  toggleButtonActive: {
    backgroundColor: "#234d20",
  },

  toggleText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
     alignItems: "center",
  },

  /* ===== BUSCADOR ===== */
  searchContainer: {
    flexDirection: "row",
    marginBottom: 10,
  },

  searchInput: {
    flex: 1,
    backgroundColor: "#eee",
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
  },

  searchButton: {
    backgroundColor: "#2e7d32",
    padding: 12,
    borderRadius: 8,
  },

  searchButtonText: {
    color: "#fff",
    fontWeight: "700",
  },

  resultItem: {
    backgroundColor: "#eef6f0",
    padding: 10,
    marginTop: 6,
    borderRadius: 8,
  },

  resultItemText: { fontWeight: "700", color: "#234d20" },
  resultItemSub: { color: "#666" },

  selectedCard: {
    backgroundColor: "#e3f2e5",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },

  selectedTitle: {
    fontWeight: "700",
    color: "#234d20",
    marginBottom: 4,
  },

  /* ===== BOTÓN GUARDAR ===== */
  saveButton: {
    backgroundColor: "#234d20",
    padding: 16,
    borderRadius: 10,
    marginBottom: 40,
    alignItems: "center",
  },

  saveText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  /* ===== ESTILOS FOTOS ===== */
  photoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },

  photoButton: {
    flex: 1,
    backgroundColor: "#234d20",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  photoButtonText: {
    color: "#fff",
    fontWeight: "700",
  },

  /* ===== MODAL ===== */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },

  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "#234d20",
  },

  modalItem: {
    paddingVertical: 10,
  },

  modalItemText: {
    fontSize: 16,
  },

  modalClose: {
    backgroundColor: "#234d20",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },

  modalCloseText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },

  /* ===== REGISTRO GRID (IGUAL A CONTEO) ===== */
  regHeaderRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  regHeaderText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
    color: "#234d20",
    textAlign: "center",
  },
  regRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  regInput: {
    flex: 1,
    backgroundColor: "#eee",
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 6,
    fontSize: 12,
    color: "#000",
    marginRight: 4,
    textAlign: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  climaHint: {
    marginTop: 8,
    color: "#234d20",
    fontSize: 12,
  },
});
