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
import { getWeather } from "../../utils/weather";
type Toma = {
  id_toma: number;
  n_de_toma: string;
  codigo_lote: string;
  nombre_lote: string;
  muestra_sugerida: string | null;
  fundo: string | null;
  variedad: string | null;
};

// ZONAS (REAL)
type Zona = {
  id_zona: number;
  nombre_zona: string;
};

// ORIENTACIONES (REAL)
type Orientacion = {
  id_orientacion: number;
  nombre_orientacion: string;
};

// TIPO ESTADO (REAL)
type TipoEstado = {
  codigo_estado: string;
  nombre_estado: string;
};

type RamaForm = {
  n_rama: number;
  tipo_estado?: string;
  es_estado?: string;
  cantidad?: string;
};

const MAX_RAMAS = 5;

const InsertarRegistroTomaScreen: React.FC = () => {
  // Búsqueda de tomas
  const [searchField, setSearchField] = useState<"n_de_toma" | "nombre_lote">(
    "n_de_toma"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [tomasResults, setTomasResults] = useState<Toma[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedToma, setSelectedToma] = useState<Toma | null>(null);

  // Catálogos reales
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [orientaciones, setOrientaciones] = useState<Orientacion[]>([]);
  const [tiposEstado, setTiposEstado] = useState<TipoEstado[]>([]);
  const [isLoadingCatalogos, setIsLoadingCatalogos] = useState(false);
// FOTOS (máx 2 por planta)
const [foto1, setFoto1] = useState<string | null>(null);
const [foto2, setFoto2] = useState<string | null>(null);
  // Formulario
  const [zonaSeleccionada, setZonaSeleccionada] = useState<string | null>(null);
  const [fila, setFila] = useState("");
  const [orientacionSeleccionada, setOrientacionSeleccionada] =
    useState<string | null>(null);

  const [observaciones, setObservaciones] = useState("");
  const [observacionesVisible, setObservacionesVisible] = useState(false);

  const [zonaModalVisible, setZonaModalVisible] = useState(false);
  const [orientacionModalVisible, setOrientacionModalVisible] =
    useState(false);

  // *** NUEVO MODAL DE ESTADOS (para cargar los >30 estados) ***
  const [estadoModalVisible, setEstadoModalVisible] = useState(false);
  const [ramaSeleccionada, setRamaSeleccionada] = useState<number | null>(null);

  const [planta, setPlanta] = useState("");
const [estadoModalRama, setEstadoModalRama] = useState<number | null>(null);
  const [ramas, setRamas] = useState<RamaForm[]>(
    Array.from({ length: MAX_RAMAS }, (_, idx) => ({
      n_rama: idx + 1,
    }))
  );

  const [isSaving, setIsSaving] = useState(false);

  // TODO: usuario real luego
  const inspector = "INSPECTOR_DEMO";

  // Geo pendiente
  const [latitud] = useState<number | null>(null);
  const [longitud] = useState<number | null>(null);

  // ============================================================================
  // 🔥 CARGA DE CATÁLOGOS (100% CORREGIDO Y SIN ALTERAR NADA MÁS)
  // ============================================================================

  const loadCatalogos = useCallback(async () => {
    try {
      setIsLoadingCatalogos(true);

      // ZONAS
      const { data: zonasData, error: zonasError } = await supabase
        .from("zonas")
        .select("id_zona, nombre_zona")
        .order("nombre_zona", { ascending: true });

      if (zonasError) throw zonasError;

      // ORIENTACIONES
      const { data: oriData, error: oriError } = await supabase
        .from("orientaciones")
        .select("id_orientacion, nombre_orientacion")
        .order("nombre_orientacion", { ascending: true });

      if (oriError) throw oriError;

      // TIPOS ESTADO — columnas reales: tipo_estado / es_estado
      const { data: tipoData, error: tipoError } = await supabase
        .from("tipos_estado")
        .select("tipo_estado, es_estado")
        .order("es_estado", { ascending: true });

      if (tipoError) throw tipoError;

      const estadosFormateados =
        tipoData?.map((t: any) => ({
          codigo_estado: t.tipo_estado,
          nombre_estado: t.es_estado,
        })) || [];

      setZonas(zonasData || []);
      setOrientaciones(oriData || []);
      setTiposEstado(estadosFormateados);
    } catch (error: any) {
      console.error("Error cargando catálogos", error);
      Alert.alert("Error", "No se pudieron cargar los catálogos.");
    } finally {
      setIsLoadingCatalogos(false);
    }
  }, []);

  useEffect(() => {
    loadCatalogos();
  }, [loadCatalogos]);
  // ============================================================================
  // 🔍 BÚSQUEDA DE TOMAS
  // ============================================================================

  const handleBuscarTomas = async () => {
    if (!searchTerm.trim()) {
      Alert.alert("Atención", "Ingresa un criterio de búsqueda.");
      return;
    }

    try {
      setIsSearching(true);
      setSelectedToma(null);

      const { data, error } = await supabase
        .from("tomas")
        .select(
          "id_toma, n_de_toma, codigo_lote, nombre_lote, muestra_sugerida, fundo, variedad"
        )
        .ilike(searchField, `%${searchTerm.trim()}%`)
        .order("fecha_creacion", { ascending: false })
        .limit(30);

      if (error) throw error;

      setTomasResults(data || []);

      if (!data || data.length === 0) {
        Alert.alert("Sin resultados", "No se encontraron tomas.");
      }
    } catch (error: any) {
      console.error("Error buscando tomas", error);
      Alert.alert("Error", "No se pudo realizar la búsqueda de tomas.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectToma = (toma: Toma) => {
    setSelectedToma(toma);

    setZonaSeleccionada(null);
    setFila("");
    setOrientacionSeleccionada(null);
    setObservaciones("");
    setPlanta("");

    setRamas(
      Array.from({ length: MAX_RAMAS }, (_, idx) => ({
        n_rama: idx + 1,
      }))
    );
  };

  // ============================================================================
  // 🔽 REUTILIZABLE: Dropdown Modal (zonas / orientaciones)
  // ============================================================================

  const renderDropdownModal = (
    visible: boolean,
    onClose: () => void,
    title: string,
    options: { label: string; value: string }[],
    onSelect: (value: string) => void
  ) => (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>

          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  onSelect(item.value);
                  onClose();
                }}
              >
                <Text style={styles.modalOptionText}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <Text style={styles.modalCloseButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // ============================================================================
  // RAMAS: CAMBIOS LOCALES
  // ============================================================================

  const handleChangeTipoEstado = (n_rama: number, codigo_estado: string) => {
    const tipo = tiposEstado.find((t) => t.codigo_estado === codigo_estado);

    setRamas((prev) =>
      prev.map((r) =>
        r.n_rama === n_rama
          ? {
              ...r,
              tipo_estado: codigo_estado,
              es_estado: tipo?.nombre_estado,
            }
          : r
      )
    );
  };

  const handleChangeCantidad = (n_rama: number, value: string) => {
    const numericValue = value.replace(/[^0-9]/g, "");

    setRamas((prev) =>
      prev.map((r) =>
        r.n_rama === n_rama ? { ...r, cantidad: numericValue } : r
      )
    );
  };

  // ============================================================================
  // VALIDACIÓN
  // ============================================================================

  const validateForm = (): boolean => {
    if (!selectedToma) {
      Alert.alert("Atención", "Selecciona primero una toma.");
      return false;
    }
    if (!zonaSeleccionada) {
      Alert.alert("Atención", "Selecciona una zona.");
      return false;
    }
    if (!fila.trim()) {
      Alert.alert("Atención", "Ingresa la fila.");
      return false;
    }
    if (!orientacionSeleccionada) {
      Alert.alert("Atención", "Selecciona una orientación.");
      return false;
    }
    if (!planta.trim()) {
      Alert.alert("Atención", "Ingresa el número de planta.");
      return false;
    }

    const ramasValidas = ramas.filter(
      (r) => r.tipo_estado && r.cantidad && Number(r.cantidad) > 0
    );

    if (ramasValidas.length === 0) {
      Alert.alert("Atención", "Registra al menos una rama.");
      return false;
    }

    return true;
  };

  // ============================================================================
  // GUARDADO (SIN FOTOS NI CLIMA)
  // ============================================================================

  const handleGuardar = async () => {
    if (!validateForm() || !selectedToma) return;

    try {
      setIsSaving(true);
 // Verificar conexión
  const net = await NetInfo.fetch();
  const isOnline = net.isConnected && net.isInternetReachable;
      const plantaNum = Number(planta);
// OBTENER CLIMA SI HAY INTERNET
let clima = null;

if (isOnline && latitud && longitud) {
  clima = await getWeather(latitud, longitud);
}
// Si NO hay internet → guardar en modo offline
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
      foto1,
      foto2,
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
// SUBIR FOTOS ANTES DE INSERTAR EN SUPABASE
  let fotoUrl1: string | null = null;
  let fotoUrl2: string | null = null;
// 🔥 LOG TEMPORAL para saber si estás autenticado
console.log("Sesion actual:", await supabase.auth.getSession());
  if (foto1) {
    fotoUrl1 = await subirFotoSupabase(selectedToma.id_toma, plantaNum, foto1);
  }

  if (foto2) {
    fotoUrl2 = await subirFotoSupabase(selectedToma.id_toma, plantaNum, foto2);
  }
 const filasInsert = ramas
  .filter((r) => r.tipo_estado && r.cantidad && Number(r.cantidad) > 0)
  .map((r) => ({
    
    id_toma: selectedToma.id_toma,
    n_de_toma: selectedToma.n_de_toma,        // ✔️ NUEVO
    variedad: selectedToma.variedad,          // ✔️ NUEVO
    codigo_lote: selectedToma.codigo_lote,
    nombre_lote: selectedToma.nombre_lote,
    muestra_sugerida: selectedToma.muestra_sugerida,

    planta: plantaNum,
    fila: fila.trim(),
    n_rama: r.n_rama,
    tipo_estado: r.tipo_estado,
    es_estado: r.es_estado,
    cantidad: Number(r.cantidad),

    latitud,
    longitud,

 temperatura_actual_c: clima?.temperatura_actual_c ?? null,
humedad_relativa_pct: clima?.humedad_relativa_pct ?? null,
presion_atmosferica_hpa: clima?.presion_atmosferica_hpa ?? null,
sensacion_termica_c: clima?.sensacion_termica_c ?? null,
nubosidad_pct: clima?.nubosidad_pct ?? null,
velocidad_del_viento_mps: clima?.velocidad_del_viento_mps ?? null,
direccion_del_viento: clima?.direccion_del_viento ?? null,
radiacion_solar_uv: clima?.radiacion_solar_uv ?? null,
fecha_y_hora: clima?.fecha_y_hora ?? new Date().toISOString(),
fuente_de_datos: clima?.fuente_de_datos ?? "Sin Internet",
 foto1: fotoUrl1,
foto2: fotoUrl2,
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
      setRamas(
        Array.from({ length: MAX_RAMAS }, (_, idx) => ({
          n_rama: idx + 1,
        }))
      );
      setObservaciones("");
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", "No se pudieron guardar los registros.");
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================================
  // UI PRINCIPAL
  // ============================================================================

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Datos de campo - Insertar registro</Text>

      {/* Búsqueda */}
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
            disabled={isSearching}
          >
            {isSearching ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.searchButtonText}>Buscar</Text>
            )}
          </TouchableOpacity>
        </View>
        {/* Resultados */}
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

        {/* Toma seleccionada */}
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

      {/* FORMULARIO PRINCIPAL */}
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
              disabled={isLoadingCatalogos}
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
              disabled={isLoadingCatalogos}
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

          {/* PLANTA / RAMAS */}
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
              Ramas (máximo 4)
            </Text>

            {ramas.map((rama) => (
              <View key={rama.n_rama} style={styles.ramaRow}>
                <Text style={styles.ramaLabel}>Rama {rama.n_rama}</Text>

                {/* 🔥 DROPDOWN CORREGIDO USANDO LOS 30+ ESTADOS */}
<TouchableOpacity
  style={styles.dropdownSmall}
  onPress={() => {
    setEstadoModalRama(rama.n_rama);
  }}
>
                  <Text style={styles.dropdownTextSmall}>
                    {rama.es_estado || "Tipo estado"}
                  </Text>
                </TouchableOpacity>

                <TextInput
                  style={styles.inputSmall}
                  placeholder="Cant."
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={rama.cantidad || ""}
                  onChangeText={(v) => handleChangeCantidad(rama.n_rama, v)}
                />
              </View>
            ))}
          </View>

          {/* GUARDAR */}
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
{estadoModalRama !== null && (
  <Modal visible transparent animationType="fade">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Seleccionar estado</Text>

        <FlatList
          data={tiposEstado}
          keyExtractor={(item) => item.codigo_estado}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                handleChangeTipoEstado(estadoModalRama, item.codigo_estado);
                setEstadoModalRama(null);
              }}
            >
              <Text style={styles.modalOptionText}>{item.nombre_estado}</Text>
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
      {/* MODAL ZONA */}
      {renderDropdownModal(
        zonaModalVisible,
        () => setZonaModalVisible(false),
        "Selecciona una zona",
        zonas.map((z) => ({
          label: z.nombre_zona,
          value: z.nombre_zona,
        })),
        setZonaSeleccionada
      )}

      {/* MODAL ORIENTACIÓN */}
      {renderDropdownModal(
        orientacionModalVisible,
        () => setOrientacionModalVisible(false),
        "Selecciona una orientación",
        orientaciones.map((o) => ({
          label: o.nombre_orientacion,
          value: o.nombre_orientacion,
        })),
        setOrientacionSeleccionada
      )}
    </View>
  );
};

// ============================================================================
// ESTILOS
// ============================================================================

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
    marginTop: 2,
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
  ramaLabel: {
    fontSize: 12,
    color: "#234d20",
    width: 60,
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
