// src/screens/DatosCampo/InsertarRegistroTomaScreen.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../../services/supabaseClient";
import { tomarFoto } from "../../utils/photoPicker";
import { subirFotoSupabase } from "../../utils/uploadPhoto";
import NetInfo from "@react-native-community/netinfo";
import { addToOfflineQueue } from "../../utils/offlineQueue";
import { getCurrentPosition } from "../../utils/location";
import { CatalogCache } from "../../utils/catalogCache";
import AsyncStorage from "@react-native-async-storage/async-storage";

const normalizeKey = (value?: string) =>
  value
    ?.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim() || "";
/* ============================================================
   TIPOS
============================================================ */
type Toma = {
  id_toma: number;
  n_de_toma: string;
  codigo_lote: string;
  nombre_lote: string;
  muestra_sugerida: string | null;
  fundo: string | null;
  variedad: string | null;
  tipo_toma?: string | null;
  estado?: string | null;
};

type Zona = {
  id_zona: number;
  nombre_zona: string;
};

type Orientacion = {
  id_orientacion: number;
  nombre_orientacion: string;
};

type TipoEstado = {
  codigo_estado: string;
  nombre_estado: string;
  cultivo: string;
};

type RamaForm = {
  n_rama: string;
  tipo_estado?: string;
  es_estado?: string;
  cantidad?: string;
};

/* ============================================================
   CONFIG
============================================================ */
const MAX_RAMAS = 16;

const InsertarRegistroTomaScreen: React.FC = () => {
  /* ============================================================
     ESTADOS PRINCIPALES
  ============================================================ */
  const [searchField, setSearchField] = useState<"n_de_toma" | "nombre_lote">(
    "n_de_toma"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [tomasResults, setTomasResults] = useState<Toma[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedToma, setSelectedToma] = useState<Toma | null>(null);

  const [zonas, setZonas] = useState<Zona[]>([]);
  const [orientaciones, setOrientaciones] = useState<Orientacion[]>([]);
  const [tiposEstado, setTiposEstado] = useState<TipoEstado[]>([]);
  const [isLoadingCatalogos, setIsLoadingCatalogos] = useState(false);

  const [foto1, setFoto1] = useState<string | null>(null);
  const [foto2, setFoto2] = useState<string | null>(null);

  const [zonaSeleccionada, setZonaSeleccionada] = useState<string | null>(null);
  const [fila, setFila] = useState("");
  const [orientacionSeleccionada, setOrientacionSeleccionada] =
    useState<string | null>(null);

  const [observaciones, setObservaciones] = useState("");
  const [observacionesVisible, setObservacionesVisible] = useState(false);

  const [zonaModalVisible, setZonaModalVisible] = useState(false);
  const [orientacionModalVisible, setOrientacionModalVisible] =
    useState(false);

  const [estadoModalRama, setEstadoModalRama] = useState<number | null>(null);

  const [planta, setPlanta] = useState("");

  const [ramas, setRamas] = useState<RamaForm[]>(
    Array.from({ length: MAX_RAMAS }, () => ({ n_rama: "" }))
  );

  const [isSaving, setIsSaving] = useState(false);

  const inspector = "INSPECTOR_DEMO";

  /* ============================================================
     CARGA DE CATÁLOGOS (ONLINE + CACHE)
  ============================================================ */
  const mapTiposEstado = (data: any[]) =>
  data.map((t: any) => ({
    codigo_estado: t.tipo_estado,
    nombre_estado: t.es_estado,
    cultivo: t.cultivo,
  }));

  const loadCatalogos = useCallback(async () => {
    try {
      setIsLoadingCatalogos(true);

      const net = await NetInfo.fetch();
      const isOnline = net.isConnected && net.isInternetReachable;

      if (!isOnline) {
        const zonasCache = await CatalogCache.loadZonas();
        const oriCache = await CatalogCache.loadOrientaciones();
        const tiposCache = await CatalogCache.loadTiposEstado();

        if (
          zonasCache?.length ||
          oriCache?.length ||
          tiposCache?.length
        ) {
          setZonas(zonasCache || []);
          setOrientaciones(oriCache || []);
          setTiposEstado(mapTiposEstado(tiposCache || []));
          setIsLoadingCatalogos(false);
          return;
        }
      }

      const { data: zonasData } = await supabase
        .from("zonas")
        .select("id_zona, nombre_zona")
        .order("nombre_zona");

      const { data: oriData } = await supabase
        .from("orientaciones")
        .select("id_orientacion, nombre_orientacion")
        .order("nombre_orientacion");

      const { data: tipoData } = await supabase
        .from("tipos_estado")
        .select("tipo_estado, es_estado, cultivo")
        .order("es_estado");

      const estadosFormateados =
        tipoData?.map((t: any) => ({
          codigo_estado: t.tipo_estado,
          nombre_estado: t.es_estado, 
          cultivo: t.cultivo,
        })) || [];

      setZonas(zonasData || []);
      setOrientaciones(oriData || []);
      setTiposEstado(estadosFormateados);

      await AsyncStorage.setItem("cache_zonas", JSON.stringify(zonasData || []));
      await AsyncStorage.setItem(
        "cache_orientaciones",
        JSON.stringify(oriData || [])
      );
      await AsyncStorage.setItem(
        "cache_tipos_estado",
        JSON.stringify(estadosFormateados)
      );
    } catch (e) {
      Alert.alert("Error", "No se lograron cargar los catálogos.");
    } finally {
      setIsLoadingCatalogos(false);
    }
  }, []);

  useEffect(() => {
  const loadOfflineTipos = async () => {
    try {
      const raw = await AsyncStorage.getItem("cache_tipos_estado");
      if (raw) {
        const parsed = JSON.parse(raw);
        // ⭐ SIEMPRE setear, incluso si está vacío
        setTiposEstado(Array.isArray(parsed) ? parsed : []);
      }
    } catch (e) {
      console.log("Error cargando tipos_estado offline:", e);
    }
  };
  loadOfflineTipos();
}, []);

  useEffect(() => {
    loadCatalogos();
  }, [loadCatalogos]);

  /* ============================================================
     BÚSQUEDA DE TOMAS ( online + orden por n_de_toma )
  ============================================================ */
  const handleBuscarTomas = async () => {
    if (!searchTerm.trim()) {
      Alert.alert("Atención", "Ingresa un criterio de búsqueda.");
      return;
    }

    try {
      setIsSearching(true);
      setSelectedToma(null);

      const net = await NetInfo.fetch();
      const isOnline = net.isConnected && net.isInternetReachable;

      /* ------------------------------ ONLINE ------------------------------ */
      if (isOnline) {
        const { data, error } = await supabase
          .from("tomas")
          .select(
            "id_toma, n_de_toma, codigo_lote, nombre_lote, muestra_sugerida, fundo, variedad, tipo_toma, estado"
          )
          .eq("tipo_toma", "fenologica")
          .ilike(searchField, `%${searchTerm.trim()}%`)
          .order("n_de_toma", { ascending: true })   // ← ORDEN CORREGIDO
          .limit(50);

        if (error) throw error;

        const filtradas = data?.filter((t: any) => t.estado === "creada") || [];

        // Guarda en cache
        await AsyncStorage.setItem("cache_tomas", JSON.stringify(filtradas));

        setTomasResults(filtradas);
      }

      /* ------------------------------ OFFLINE ------------------------------ */
      else {
        const cache = await CatalogCache.loadTomas();
        const texto = searchTerm.trim().toLowerCase();

        let filtradas =
          cache
            ?.filter((t: any) => t.tipo_toma === "fenologica")
            ?.filter((t: any) => t.estado === "creada")
            ?.filter((t: any) => {
              if (searchField === "n_de_toma") {
                return (t.n_de_toma || "").toLowerCase().includes(texto);
              } else {
                return (t.nombre_lote || "").toLowerCase().includes(texto);
              }
            }) || [];

        // ← ORDENAR OFFLINE
        filtradas = filtradas.sort((a: any, b:any) => {
          const na = Number(a.n_de_toma) || 0;
          const nb = Number(b.n_de_toma) || 0;
          return na - nb;
        });

        setTomasResults(filtradas);
      }
    } catch (e) {
      Alert.alert("Error", "No se pudo realizar la búsqueda de tomas.");
    } finally {
      setIsSearching(false);
    }
  };

  /* ============================================================
     SELECCIONAR TOMA
  ============================================================ */
  const handleSelectToma = (toma: Toma) => {
    setSelectedToma(toma);
    setZonaSeleccionada(null);
    setFila("");
    setOrientacionSeleccionada(null);
    setObservaciones("");
    setPlanta("");

    setRamas(Array.from({ length: MAX_RAMAS }, () => ({ n_rama: "" })));
  };

  /* ============================================================
     MANEJO DE RAMAS
  ============================================================ */
  const handleChangeNumeroRama = (index: number, value: string) => {
    const numeric = value.replace(/[^0-9]/g, "");
    setRamas((prev) => {
      const clone = [...prev];
      clone[index].n_rama = numeric;
      return clone;
    });
  };

  const handleChangeTipoEstado = (index: number, codigo_estado: string) => {
    const tipo = tiposEstado.find((t) => t.codigo_estado === codigo_estado);
    setRamas((prev) => {
      const clone = [...prev];
      clone[index].tipo_estado = codigo_estado;
      clone[index].es_estado = tipo?.nombre_estado;
      return clone;
    });
  };

  const handleChangeCantidad = (index: number, value: string) => {
    const numericValue = value.replace(/[^0-9]/g, "");
    setRamas((prev) => {
      const clone = [...prev];
      clone[index].cantidad = numericValue;
      return clone;
    });
  };

  /* ============================================================
     VALIDACIÓN
  ============================================================ */
  const validateForm = () => {
    if (!selectedToma) return false;
    if (!zonaSeleccionada) return false;
    if (!fila.trim()) return false;
    if (!orientacionSeleccionada) return false;
    if (!planta.trim()) return false;

    const ramasValidas = ramas.filter(
      (r) =>
        r.n_rama &&
        r.tipo_estado &&
        r.cantidad &&
        Number(r.cantidad) > 0
    );

    return ramasValidas.length > 0;
  };

  /* ============================================================
     GUARDAR (ONLINE / OFFLINE)
  ============================================================ */
  const handleGuardar = async () => {
    if (!validateForm() || !selectedToma) return;

    try {
      setIsSaving(true);
      const net = await NetInfo.fetch();
      const isOnline = net.isConnected && net.isInternetReachable;
      const plantaNum = Number(planta);

      /* ----------------- OFFLINE ----------------- */
      if (!isOnline) {
        await addToOfflineQueue({
          tipo: "toma_fenologica",
          datos: {
            selectedToma,
            zonaSeleccionada,
            fila,
            orientacionSeleccionada,
            plantaNum,
            ramas,
            fotos: { foto1, foto2 },
          },
          timestamp: Date.now(),
        });

        Alert.alert(
          "Sin conexión",
          "El registro se guardó offline y se sincronizará automáticamente."
        );
        setIsSaving(false);
        return;
      }

      /* ----------------- ONLINE ----------------- */
      let lat: number | null = null;
      let lon: number | null = null;

      try {
        const gps = await getCurrentPosition();
        lat = gps.lat;
        lon = gps.lon;
      } catch {}

      let fotoUrl1: string | null = null;
      let fotoUrl2: string | null = null;

      if (foto1)
        fotoUrl1 = await subirFotoSupabase(
          selectedToma.id_toma,
          plantaNum,
          foto1
        );

      if (foto2)
        fotoUrl2 = await subirFotoSupabase(
          selectedToma.id_toma,
          plantaNum,
          foto2
        );

      const filasInsert = ramas
        .filter(
          (r) =>
            r.n_rama &&
            r.tipo_estado &&
            r.cantidad &&
            Number(r.cantidad) > 0
        )
        .map((r) => ({
          id_toma: selectedToma.id_toma,
          n_de_toma: selectedToma.n_de_toma,
          variedad: selectedToma.variedad,
          codigo_lote: selectedToma.codigo_lote,
          nombre_lote: selectedToma.nombre_lote,
          muestra_sugerida: selectedToma.muestra_sugerida,

          planta: plantaNum,
          fila: fila.trim(),

          n_rama: Number(r.n_rama),
          tipo_estado: r.tipo_estado,
          es_estado: r.es_estado,
          cantidad: Number(r.cantidad),

          latitud: lat,
          longitud: lon,

          temperatura_actual_c: null,
          humedad_relativa_pct: null,
          presion_atmosferica_hpa: null,
          sensacion_termica_c: null,
          nubosidad_pct: null,
          velocidad_del_viento_mps: null,
          direccion_del_viento: null,
          radiacion_solar_uv: null,
          fecha_y_hora: new Date().toISOString(),
          fuente_de_datos: "Sin datos",

          fotos: {
            foto1: fotoUrl1,
            foto2: fotoUrl2,
          },

          inspector,
          zona: zonaSeleccionada,
          orientacion: orientacionSeleccionada,
        }));

      const { error } = await supabase
        .from("tomas_fenologicas")
        .insert(filasInsert);

      if (error) throw error;

      Alert.alert("Éxito", "Registros guardados correctamente.");

      setPlanta("");
      setRamas(Array.from({ length: MAX_RAMAS }, () => ({ n_rama: "" })));
      setObservaciones("");
    } catch (e) {
      Alert.alert("Error", "No se pudieron guardar los registros.");
    } finally {
      setIsSaving(false);
    }
  };

  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Datos de campo - Insertar toma fenológica</Text>

      {/* BÚSQUEDA */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Seleccionar toma</Text>

        <View style={styles.searchToggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              searchField === "n_de_toma" && styles.toggleButtonActive,
            ]}
            onPress={() => setSearchField("n_de_toma")}
          >
            <Text
              style={[
                styles.toggleButtonText,
                searchField === "n_de_toma" && styles.toggleButtonTextActive,
              ]}
            >
              Por N° de toma
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              searchField === "nombre_lote" && styles.toggleButtonActive,
            ]}
            onPress={() => setSearchField("nombre_lote")}
          >
            <Text
              style={[
                styles.toggleButtonText,
                searchField === "nombre_lote" && styles.toggleButtonTextActive,
              ]}
            >
              Por nombre de lote
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            placeholder={
              searchField === "n_de_toma"
                ? "Ingresa N° de toma"
                : "Ingresa nombre de lote"
            }
            placeholderTextColor="#999"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />

          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleBuscarTomas}
            disabled={isSearching || isLoadingCatalogos}
          >
            {isSearching ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.searchButtonText}>Buscar</Text>
            )}
          </TouchableOpacity>
        </View>

        {tomasResults.length > 0 && !selectedToma && (
          <FlatList
            data={tomasResults}
            keyExtractor={(item) => item.id_toma.toString()}
            style={styles.tomasList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.tomaItem}
                onPress={() => handleSelectToma(item)}
              >
                <Text style={styles.tomaTitle}>
                  Toma {item.n_de_toma} - {item.nombre_lote}
                </Text>

                <Text style={styles.tomaSubtitle}>
                  Lote: {item.codigo_lote} | Variedad: {item.variedad || "-"}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}

        {selectedToma && (
          <View style={styles.selectedTomaContainer}>
            <Text style={styles.selectedTomaTitle}>
              Toma seleccionada: {selectedToma.n_de_toma}
            </Text>
            <Text style={styles.selectedTomaText}>
              Lote: {selectedToma.codigo_lote} - {selectedToma.nombre_lote}
            </Text>
            <Text style={styles.selectedTomaText}>
              Variedad: {selectedToma.variedad || "-"}
            </Text>
            <Text style={styles.selectedTomaText}>
              Muestra sugerida: {selectedToma.muestra_sugerida || "-"}
            </Text>
          </View>
        )}
      </View>

      {/* FORMULARIO */}
      {selectedToma && (
        <ScrollView style={styles.scrollArea}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Datos principales</Text>

            <Text style={styles.label}>Nombre de lote</Text>
            <View style={styles.readonlyBox}>
              <Text style={styles.readonlyText}>
                {selectedToma.nombre_lote}
              </Text>
            </View>

            <Text style={styles.label}>Zona</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setZonaModalVisible(true)}
            >
              <Text style={styles.dropdownText}>
                {zonaSeleccionada || "Selecciona una zona"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>Fila</Text>
            <TextInput
              style={styles.input}
              placeholder="Número de fila"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={fila}
              onChangeText={(v) => setFila(v.replace(/[^0-9]/g, ""))}
            />

            <Text style={styles.label}>Orientación</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setOrientacionModalVisible(true)}
            >
              <Text style={styles.dropdownText}>
                {orientacionSeleccionada || "Selecciona una orientación"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>Observaciones</Text>
            <TouchableOpacity
              style={styles.observacionesButton}
              onPress={() => setObservacionesVisible(true)}
            >
              <Text style={styles.observacionesButtonText}>
                {observaciones
                  ? "Ver / editar observaciones"
                  : "Agregar observaciones"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* PLANTA Y FOTOS */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Registro por planta</Text>

            <Text style={styles.label}>N° de planta</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 1"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={planta}
              onChangeText={(v) => setPlanta(v.replace(/[^0-9]/g, ""))}
            />

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
              Fotos de la planta (máx 2)
            </Text>

            <View style={{ flexDirection: "row", marginTop: 8 }}>
              <TouchableOpacity
                style={[styles.saveButton, { flex: 1, marginRight: 6 }]}
                onPress={async () => {
                  const uri = await tomarFoto();
                  if (uri) setFoto1(uri);
                }}
              >
                <Text style={styles.saveButtonText}>
                  {foto1 ? "📸 Foto 1 lista" : "Tomar foto 1"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, { flex: 1, marginLeft: 6 }]}
                onPress={async () => {
                  const uri = await tomarFoto();
                  if (uri) setFoto2(uri);
                }}
              >
                <Text style={styles.saveButtonText}>
                  {foto2 ? "📸 Foto 2 lista" : "Tomar foto 2"}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
              Ramas (máximo 16)
            </Text>

            {ramas.map((rama, index) => (
              <View key={index} style={styles.ramaRow}>
                {/* NUMERO DE RAMA */}
                <TextInput
                  style={[styles.inputSmall, { width: 60, marginRight: 6 }]}
                  placeholder="Rama"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={rama.n_rama}
                  onChangeText={(v) => handleChangeNumeroRama(index, v)}
                />

                {/* TIPO DE ESTADO */}
                <TouchableOpacity
                  style={styles.dropdownSmall}
                  onPress={() => setEstadoModalRama(index)}
                >
                  <Text style={styles.dropdownTextSmall}>
                    {rama.tipo_estado
                      ? `${rama.tipo_estado} - ${rama.es_estado}`
                      : "Tipo estado"}
                  </Text>
                </TouchableOpacity>

                {/* CANTIDAD */}
                <TextInput
                  style={styles.inputSmall}
                  placeholder="Cant."
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={rama.cantidad || ""}
                  onChangeText={(v) => handleChangeCantidad(index, v)}
                />
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleGuardar}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Guardar registro</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* MODAL OBSERVACIONES */}
      <Modal visible={observacionesVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "70%" }]}>
            <Text style={styles.modalTitle}>Observaciones</Text>

            <TextInput
              style={styles.observacionesInput}
              multiline
              placeholder="Escribe las observaciones..."
              placeholderTextColor="#999"
              value={observaciones}
              onChangeText={setObservaciones}
            />

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setObservacionesVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


      {/* MODAL TIPOS DE ESTADO */}
      
      {estadoModalRama !== null && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Seleccionar estado</Text>

              <FlatList
  data={tiposEstado.filter(
    (t) =>
      normalizeKey(t.cultivo) ===
      normalizeKey(selectedToma?.variedad ?? "")
  )}
  keyExtractor={(item) => item.codigo_estado}
  renderItem={({ item }) => (
    <TouchableOpacity
      style={styles.modalOption}
      onPress={() => {
        handleChangeTipoEstado(estadoModalRama, item.codigo_estado);
        setEstadoModalRama(null);
      }}
    >
      <Text style={styles.modalOptionText}>
        {item.codigo_estado} - {item.nombre_estado}
      </Text>
    </TouchableOpacity>
  )}
/>

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setEstadoModalRama(null)}
              >
                <Text style={styles.modalCloseButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* MODAL ZONAS */}
      {zonaModalVisible && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Selecciona una zona</Text>

              <FlatList
                data={zonas.map((z) => ({
                  label: z.nombre_zona,
                  value: z.nombre_zona,
                }))}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => {
                      setZonaSeleccionada(item.value);
                      setZonaModalVisible(false);
                    }}
                  >
                    <Text style={styles.modalOptionText}>{item.label}</Text>
                  </TouchableOpacity>
                )}
              />

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setZonaModalVisible(false)}
              >
                <Text style={styles.modalCloseButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* MODAL ORIENTACIONES */}
      {orientacionModalVisible && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Selecciona una orientación</Text>

              <FlatList
                data={orientaciones.map((o) => ({
                  label: o.nombre_orientacion,
                  value: o.nombre_orientacion,
                }))}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => {
                      setOrientacionSeleccionada(item.value);
                      setOrientacionModalVisible(false);
                    }}
                  >
                    <Text style={styles.modalOptionText}>{item.label}</Text>
                  </TouchableOpacity>
                )}
              />

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setOrientacionModalVisible(false)}
              >
                <Text style={styles.modalCloseButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

/* ============================================================
   ESTILOS
============================================================ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f5f4",
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#234d20",
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#234d20",
    marginBottom: 8,
  },
  searchToggleContainer: {
    flexDirection: "row",
    marginBottom: 8,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#cfd8dc",
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 6,
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  toggleButtonActive: {
    backgroundColor: "#234d20",
  },
  toggleButtonText: {
    fontSize: 12,
    color: "#234d20",
  },
  toggleButtonTextActive: {
    color: "#ffffff",
    fontWeight: "600",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cfd8dc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    backgroundColor: "#fff",
  },
  searchButton: {
    marginLeft: 8,
    backgroundColor: "#4caf50",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  tomasList: {
    maxHeight: 180,
    marginTop: 6,
  },
  tomaItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tomaTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#234d20",
  },
  tomaSubtitle: {
    fontSize: 12,
    color: "#555",
  },
  selectedTomaContainer: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#e8f5e9",
  },
  selectedTomaTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#234d20",
    marginBottom: 4,
  },
  selectedTomaText: {
    fontSize: 12,
    color: "#234d20",
  },
  scrollArea: {
    flex: 1,
    marginTop: 4,
  },
  label: {
    fontSize: 12,
    color: "#234d20",
    marginTop: 8,
    marginBottom: 4,
  },
  readonlyBox: {
    borderRadius: 8,
    backgroundColor: "#eceff1",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  readonlyText: {
    fontSize: 13,
    color: "#37474f",
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#cfd8dc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  dropdownText: {
    fontSize: 13,
    color: "#37474f",
  },
  observacionesButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4caf50",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  observacionesButtonText: {
    fontSize: 13,
    color: "#4caf50",
    fontWeight: "600",
  },
  ramaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  dropdownSmall: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cfd8dc",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginRight: 6,
    backgroundColor: "#fff",
  },
  dropdownTextSmall: {
    fontSize: 12,
    color: "#37474f",
  },
  inputSmall: {
    width: 60,
    borderWidth: 1,
    borderColor: "#cfd8dc",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    backgroundColor: "#fff",
  },
  saveButton: {
    backgroundColor: "#234d20",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    width: "100%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#234d20",
    marginBottom: 8,
  },
  modalOption: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eceff1",
  },
  modalOptionText: {
    fontSize: 13,
    color: "#37474f",
  },
  modalCloseButton: {
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: "#234d20",
    paddingVertical: 8,
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  observacionesInput: {
    borderWidth: 1,
    borderColor: "#cfd8dc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    minHeight: 120,
    textAlignVertical: "top",
  },
});

export default InsertarRegistroTomaScreen;
