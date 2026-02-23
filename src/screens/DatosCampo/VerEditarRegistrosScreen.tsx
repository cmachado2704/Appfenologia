// VerEditarRegistrosScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
  Pressable,
  FlatList,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { supabase } from "../../services/supabaseClient";

/* ===================== UTIL ===================== */
const fmtDate = (iso?: string) => {
  if (!iso) return "—";
  // Fuerza fecha local SIN conversión UTC
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y.slice(2)}`;
};

const isBlank = (v: any) => String(v ?? "").trim() === "";

/* ===================== TYPES ===================== */
type TomaRow = {
  n_de_toma: string;
  fecha_creacion: string;
  tipo_toma: "fenologica" | "calibracion" | "conteo";
  nombre_lote: string;
  variedad?: string | null;
  cantidad_registros: number;
};

/* ===================== SCREEN ===================== */
export default function VerEditarRegistrosScreen({ navigation }: any) {
  /* ---------- FORM 1 ---------- */
  const [search, setSearch] = useState("");
  const [lotes, setLotes] = useState<string[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  /* ---------- FORM 2 ---------- */
  const [loteSel, setLoteSel] = useState<string | null>(null);
  const [tomas, setTomas] = useState<TomaRow[]>([]);
  const [loadingTomas, setLoadingTomas] = useState(false);

  /* ---------- FORM 3 ---------- */
  const [editorOpen, setEditorOpen] = useState(false);
  const [tomaSel, setTomaSel] = useState<TomaRow | null>(null);
  const [registros, setRegistros] = useState<any[]>([]);
  const [loadingReg, setLoadingReg] = useState(false);

  // edición segura por fila
  const [editingRowId, setEditingRowId] = useState<string | null>(null);

  // filtros
  const [fFecha, setFFecha] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // opciones de zona/sector (solo una según tipo)
  const [zonaOpts, setZonaOpts] = useState<string[]>([]);
  const [sectorOpts, setSectorOpts] = useState<string[]>([]);
  const [zonaSel, setZonaSel] = useState<string | null>(null);
  const [sectorSel, setSectorSel] = useState<string | null>(null);

  const [pickerOpen, setPickerOpen] = useState(false);

  // soporte (clasificación + estados)
  const [clasifOpts, setClasifOpts] = useState<any[]>([]);
  const [estadoOpts, setEstadoOpts] = useState<any[]>([]);
  const [clasifModal, setClasifModal] = useState(false);
  const [clasifRowId, setClasifRowId] = useState<string | null>(null);
  const [estadoModal, setEstadoModal] = useState(false);
  const [estadoRowId, setEstadoRowId] = useState<string | null>(null);

  const originals = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase
        .from("clasificacion_tamano")
        .select("*")
        .limit(300);
      setClasifOpts(c || []);

      const { data: e } = await supabase
        .from("tipos_estado")
        .select("codigo_estado, nombre_estado, cultivo")
        .limit(500);
      setEstadoOpts(e || []);
    })();
  }, []);

  /* ===================== BUSCAR LOTES ===================== */
  const buscarLotes = async () => {
    if (!search.trim()) return;
    setLoadingSearch(true);
    try {
      const { data, error } = await supabase
        .from("tomas")
        .select("nombre_lote")
        .ilike("nombre_lote", `%${search.trim()}%`)
        .order("nombre_lote", { ascending: true })
        .limit(30);
      if (error) throw error;

      setLotes(
        Array.from(new Set((data || []).map((d: any) => d.nombre_lote))).filter(
          Boolean
        )
      );
    } catch {
      setLotes([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  /* ===================== CONTAR REGISTROS ===================== */
  const getCountForToma = async (n_de_toma: string, tipo: string) => {
    const table =
      tipo === "fenologica"
        ? "tomas_fenologicas"
        : tipo === "calibracion"
        ? "calibracion_frutos"
        : "conteo_frutos_caidos";

    const { count } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq("n_de_toma", n_de_toma);

    return count ?? 0;
  };

  /* ===================== FORM 2 ===================== */
  const cargarTomas = async (lote: string) => {
    setLoteSel(lote);
    setLoadingTomas(true);
    try {
      const { data, error } = await supabase
        .from("tomas")
        .select("n_de_toma, fecha_creacion, tipo_toma, nombre_lote, variedad, estado")
        .eq("nombre_lote", lote)
        .eq("estado", "creada")
        .order("fecha_creacion", { ascending: false });

      if (error) throw error;

      const base: TomaRow[] = (data || []).map((t: any) => ({
        n_de_toma: t.n_de_toma,
        fecha_creacion: t.fecha_creacion,
        tipo_toma: t.tipo_toma,
        nombre_lote: t.nombre_lote,
        variedad: t.variedad ?? null,
        cantidad_registros: 0,
      }));

      const withCounts = await Promise.all(
        base.map(async (t) => ({
          ...t,
          cantidad_registros: await getCountForToma(t.n_de_toma, t.tipo_toma),
        }))
      );

      setTomas(withCounts.filter((t) => t.cantidad_registros > 0));
    } catch {
      setTomas([]);
    } finally {
      setLoadingTomas(false);
    }
  };

  /* ===================== FORM 3: abrir editor ===================== */
  const abrirEditor = async (toma: TomaRow) => {
    setEditorOpen(true);
    setTomaSel(toma);
    setLoadingReg(true);
    setRegistros([]);
    originals.current.clear();

    // reset filtros/edición
    setEditingRowId(null);
    setFFecha(null);
    setShowDatePicker(false);
    setZonaSel(null);
    setSectorSel(null);
    setZonaOpts([]);
    setSectorOpts([]);
    setPickerOpen(false);

    try {
      // 1) cargar registros
      let q: any;
      if (toma.tipo_toma === "fenologica") {
        q = supabase
          .from("tomas_fenologicas")
          .select("*")
          .eq("n_de_toma", toma.n_de_toma)
          .order("fecha_y_hora");
      } else if (toma.tipo_toma === "calibracion") {
        q = supabase
          .from("calibracion_frutos")
          .select("*")
          .eq("n_de_toma", toma.n_de_toma)
          .order("fecha_evaluacion");
      } else {
        q = supabase
          .from("conteo_frutos_caidos")
          .select("*")
          .eq("n_de_toma", toma.n_de_toma)
          .order("fecha_evaluacion");
      }

      const { data, error } = await q;
      if (error) throw error;

      setRegistros(data || []);

      // snapshot originals
      (data || []).forEach((r: any) => {
        const key = String(
          toma.tipo_toma === "fenologica" ? r.id_toma_fenologica : r.id
        );
        originals.current.set(key, r);
      });

      // 2) cargar SOLO el catálogo necesario
      if (toma.tipo_toma === "fenologica") {
        const { data: z } = await supabase
          .from("zonas")
          .select("nombre_zona")
          .order("nombre_zona");
        setZonaOpts((z || []).map((x: any) => x.nombre_zona).filter(Boolean));
      } else {
        const { data: s } = await supabase
          .from("sector")
          .select("nombre")
          .order("nombre");
        setSectorOpts((s || []).map((x: any) => x.nombre).filter(Boolean));
      }
    } finally {
      setLoadingReg(false);
    }
  };

  const updById = (rowId: string, patch: any) => {
  setRegistros(prev =>
    prev.map(r => {
      const id = getRowKey(r);
      return id === rowId ? { ...r, ...patch } : r;
    })
  );
};

  const getRowKey = (row: any) => {
    if (!tomaSel) return "";
    return String(tomaSel.tipo_toma === "fenologica" ? row.id_toma_fenologica : row.id);
  };

  const validateRow = (row: any) => {
    if (!tomaSel) return { ok: false, msg: "Toma no válida" };

    const idField = tomaSel.tipo_toma === "fenologica" ? "id_toma_fenologica" : "id";
    const orig = originals.current.get(String(row[idField]));

    let payload: any;

    if (tomaSel.tipo_toma === "calibracion") {
      payload = {
        n_planta: row.n_planta,
        fila: row.fila,
        clasificacion: row.clasificacion,
        calibre: row.calibre,
      };
    } else if (tomaSel.tipo_toma === "conteo") {
      payload = {
        n_planta: row.n_planta,
        n_frutos_caidos: row.n_frutos_caidos,
        calibre_minimo: row.calibre_minimo,
        calibre_maximo: row.calibre_maximo,
      };
    } else {
      payload = {
        planta: row.planta,
        n_rama: row.n_rama,
        fila: row.fila,
        cantidad: row.cantidad,
        es_estado: row.es_estado,
      };
    }

    if (Object.values(payload).some(isBlank)) {
      return { ok: false, msg: "No dejar casillas en blanco" };
    }

    // comparar contra original (solo por columnas editables)
    const origSlim =
      tomaSel.tipo_toma === "calibracion"
        ? {
            n_planta: orig?.n_planta,
            fila: orig?.fila,
            clasificacion: orig?.clasificacion,
            calibre: orig?.calibre,
          }
        : tomaSel.tipo_toma === "conteo"
        ? {
            n_planta: orig?.n_planta,
            n_frutos_caidos: orig?.n_frutos_caidos,
            calibre_minimo: orig?.calibre_minimo,
            calibre_maximo: orig?.calibre_maximo,
          }
        : {
            planta: orig?.planta,
            n_rama: orig?.n_rama,
            fila: orig?.fila,
            cantidad: orig?.cantidad,
            es_estado: orig?.es_estado,
          };

    if (JSON.stringify(payload) === JSON.stringify(origSlim)) {
      return { ok: false, msg: "Debe modificar al menos un campo" };
    }

    return { ok: true, payload };
  };

  const guardarFila = async (row: any) => {
    if (!tomaSel) return;

    const v = validateRow(row);
    if (!v.ok) return Alert.alert("Validación", v.msg);

    const idField = tomaSel.tipo_toma === "fenologica" ? "id_toma_fenologica" : "id";
    const table =
      tomaSel.tipo_toma === "fenologica"
        ? "tomas_fenologicas"
        : tomaSel.tipo_toma === "calibracion"
        ? "calibracion_frutos"
        : "conteo_frutos_caidos";

    const { error } = await supabase.from(table).update(v.payload).eq(idField, row[idField]);
    if (error) return Alert.alert("Error", "No se pudo guardar");

    // actualizar original slim
    const key = String(row[idField]);
    originals.current.set(key, { ...(originals.current.get(key) || {}), ...v.payload });

    Alert.alert("OK", "Guardado");
    setEditingRowId(null);
  };

  /* ===================== FILTRADO ===================== */
  const registrosFiltrados = useMemo(() => {
    return registros.filter((r) => {
      // fecha ISO YYYY-MM-DD (de timestamp o date)
      const rawFecha = tomaSel?.tipo_toma === "fenologica" ? r.fecha_y_hora : r.fecha_evaluacion;
      const fechaISO = rawFecha ? String(rawFecha).slice(0, 10) : null;
      const okFecha = !fFecha || fechaISO === fFecha;

      if (tomaSel?.tipo_toma === "fenologica") {
        const okZona = !zonaSel || r.zona === zonaSel;
        return okFecha && okZona;
      } else {
        const okSector = !sectorSel || r.sector === sectorSel;
        return okFecha && okSector;
      }
    });
  }, [registros, fFecha, zonaSel, sectorSel, tomaSel?.tipo_toma]);

  /* ===================== UI ===================== */
  return (
    <View style={styles.container}>
      {/* TOP */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Ver / editar</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* FORM 1 */}
      <View style={styles.card}>
        <Text style={styles.h}>1) Buscador</Text>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar lote"
            placeholderTextColor="#7A8B83"
          />
          <TouchableOpacity style={styles.btn} onPress={buscarLotes}>
            <Text style={styles.btnTxt}>Buscar</Text>
          </TouchableOpacity>
        </View>
        {loadingSearch && <ActivityIndicator />}
        {lotes.map((l) => (
          <TouchableOpacity
            key={l}
            style={styles.suggest}
            onPress={() => {
              setSearch(l);
              setLotes([]);
              cargarTomas(l);
            }}
          >
            <Text style={{ color: "#0E1C15", fontWeight: "800" }}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* FORM 2 */}
      {loteSel && (
        <View style={styles.card}>
          <Text style={styles.h}>2) Tomas – {loteSel}</Text>

          <View style={styles.tableHeader}>
            <Text style={styles.colToma}>N°{"\n"}toma</Text>
            <Text style={styles.colFecha}>Fecha{"\n"}creación</Text>
            <Text style={styles.colTipo}>Tipo</Text>
            <Text style={styles.colRegs}>Regs</Text>
            <Text style={styles.colEditar}>Editar</Text>
          </View>

          {loadingTomas && <ActivityIndicator />}

          {tomas.map((t) => (
            <View key={t.n_de_toma} style={styles.tableRow}>
              <Text style={styles.colToma}>{t.n_de_toma}</Text>
              <Text style={styles.colFecha}>{fmtDate(t.fecha_creacion)}</Text>
              <Text style={styles.colTipo}>{t.tipo_toma}</Text>
              <Text style={styles.colRegs}>{t.cantidad_registros}</Text>
              <View style={styles.colEditar}>
                <TouchableOpacity style={styles.btnMini} onPress={() => abrirEditor(t)}>
                  <Text style={styles.btnMiniTxt}>Editar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* FORM 3 FULLSCREEN */}
      <Modal visible={editorOpen} animationType="slide">
        <View style={styles.container}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => setEditorOpen(false)}>
              <Text style={styles.back}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Editar registros</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Encabezado + filtros (con labels) */}
          {tomaSel && (
            <View style={styles.card}>
              <Text style={styles.meta}>
                {tomaSel.n_de_toma} · {tomaSel.nombre_lote}
              </Text>
              <Text style={styles.metaSmall}>
                {fmtDate(tomaSel.fecha_creacion)} · {tomaSel.variedad ?? "—"} · {tomaSel.tipo_toma}
              </Text>

{/* FILTROS COMPACTOS */}
<View style={styles.filterRow}>
  {/* Filtro fecha */}
  <TouchableOpacity
    style={styles.filterCompact}
    onPress={() => setShowDatePicker(true)}
  >
    <Text style={styles.filterCompactTxt}>
      {fFecha ? `📅 ${fFecha}` : "📅 Fecha"}
    </Text>
  </TouchableOpacity>

  {/* Filtro zona / sector */}
  <TouchableOpacity
    style={styles.filterCompact}
    onPress={() => setPickerOpen(true)}
  >
    <Text style={styles.filterCompactTxt}>
      {tomaSel.tipo_toma === "fenologica"
        ? zonaSel ?? "🧭 Zona"
        : sectorSel ?? "🧭 Sector"}
    </Text>
  </TouchableOpacity>

  {/* Limpiar todo */}
  <TouchableOpacity
    style={styles.filterClear}
    onPress={() => {
      setFFecha(null);
      setZonaSel(null);
      setSectorSel(null);
    }}
  >
    <Text style={styles.filterClearTxt}>  Limpiar{'\n'}Filtros</Text>
  </TouchableOpacity>


</View>
</View>
          )}

          {showDatePicker && (
  <DateTimePicker
    value={fFecha ? new Date(fFecha + "T00:00:00") : new Date()}
    mode="date"
    display="calendar"
    onChange={(_, date) => {
      setShowDatePicker(false);
      if (date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        setFFecha(`${y}-${m}-${d}`);
      }
    }}
  />
)}

          {/* Modal selector zona/sector */}
          <Modal visible={pickerOpen} transparent animationType="fade">
            <Pressable style={styles.modalOverlay} onPress={() => setPickerOpen(false)}>
              <Pressable style={styles.modalCard}>
                <Text style={{ fontWeight: "900", marginBottom: 8, textAlignVertical: "center" }}>
                  {tomaSel?.tipo_toma === "fenologica" ? "Seleccionar zona" : "Seleccionar sector"}
                </Text>

                <FlatList
                  data={tomaSel?.tipo_toma === "fenologica" ? zonaOpts : sectorOpts}
                  keyExtractor={(x, idx) => `${x}-${idx}`}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.modalItem}
                      onPress={() => {
                        if (tomaSel?.tipo_toma === "fenologica") setZonaSel(item);
                        else setSectorSel(item);
                        setPickerOpen(false);
                      }}
                    >
                      <Text>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              </Pressable>
            </Pressable>
          </Modal>

          {loadingReg && <ActivityIndicator />}

          {/* TABLA */}
 <ScrollView horizontal>
  <ScrollView
    style={{ maxHeight: "90%" }}
    contentContainerStyle={{ paddingBottom: 20 }}
            >
            <View>
              {/* header */}
              <View style={styles.gridHeader}>
                <Text style={styles.cellH}>Fecha</Text>

                {tomaSel?.tipo_toma === "calibracion" && (
                  <>
                    <Text style={styles.cellH}>Planta</Text>
                    <Text style={styles.cellH}>Fila</Text>
                    <Text style={styles.cellH}>Clasif.</Text>
                    <Text style={styles.cellH}>Calibre</Text>
                    <Text style={styles.cellH}>Guardar</Text>
                  </>
                )}

                {tomaSel?.tipo_toma === "conteo" && (
                  <>
                    <Text style={styles.cellH}>Planta</Text>
                    <Text style={styles.cellH}>Caídos</Text>
                    <Text style={styles.cellH}>Cal. Min</Text>
                    <Text style={styles.cellH}>Cal. Max</Text>
                    <Text style={styles.cellH}>Guardar</Text>
                  </>
                )}

                {tomaSel?.tipo_toma === "fenologica" && (
                  <>
                    <Text style={styles.cellH}>Planta</Text>
                    <Text style={styles.cellH}>Rama</Text>
                    <Text style={styles.cellH}>Fila</Text>
                    <Text style={styles.cellH}>Cant.</Text>
                    <Text style={styles.cellH}>Estado</Text>
                    <Text style={styles.cellH}>Guardar</Text>
                  </>
                )}
              </View>

              {/* rows */}
              {registrosFiltrados.map((r, idx) => {
                const rowId = getRowKey(r);
                const editable = editingRowId === rowId;

                const fechaTxt =
                  tomaSel?.tipo_toma === "fenologica"
                    ? fmtDate(r.fecha_y_hora)
                    : fmtDate(r.fecha_evaluacion);

                return (
                  <TouchableOpacity
                    key={rowId || String(idx)}
                    style={[styles.gridRow, editable && styles.gridRowActive]}
                    activeOpacity={0.95}
                    onPress={() => setEditingRowId(rowId)}
                  >
                    <Text style={styles.cellT}>{fechaTxt}</Text>

                    {/* CALIBRACION */}
                    {tomaSel?.tipo_toma === "calibracion" && (
                      <>
                        <TextInput
                          editable={editable}
                          style={[styles.cellI, !editable && styles.cellDisabled]}
                          value={String(r.n_planta ?? "")}
                          onChangeText={(v) => updById(rowId, { n_planta: v })}
                        />
                        <TextInput
                          editable={editable}
                          style={[styles.cellI, !editable && styles.cellDisabled]}
                          value={String(r.fila ?? "")}
                          onChangeText={(v) => updById(rowId, { fila: v })}
                        />
                        <TouchableOpacity
                          disabled={!editable}
                          style={[styles.cellBtn, !editable && styles.cellDisabled]}
                          onPress={() => {
                            setClasifRowId(String(r.id));
                            setClasifModal(true);
                          }}
                        >
                          <Text style={styles.cellBtnTxt}>
                            {r.clasificacion || "Elegir"}
                          </Text>
                        </TouchableOpacity>
                        <TextInput
                          editable={editable}
                          style={[styles.cellI, !editable && styles.cellDisabled]}
                          value={String(r.calibre ?? "")}
                          onChangeText={(v) => updById(rowId, { calibre: v })}
                        />
                        <TouchableOpacity
                          style={[styles.saveBtn, !editable && styles.cellDisabled]}
                          disabled={!editable}
                          onPress={() => guardarFila(r)}
                        >
                          <Text style={styles.saveBtnTxt}>Guardar</Text>
                        </TouchableOpacity>
                      </>
                    )}

                    {/* CONTEO */}
                    {tomaSel?.tipo_toma === "conteo" && (
                      <>
                        <TextInput
                          editable={editable}
                          style={[styles.cellI, !editable && styles.cellDisabled]}
                          value={String(r.n_planta ?? "")}
                          onChangeText={(v) => updById(rowId, { n_planta: v })}
                        />
                        <TextInput
                          editable={editable}
                          style={[styles.cellI, !editable && styles.cellDisabled]}
                          value={String(r.n_frutos_caidos ?? "")}
                          onChangeText={(v) => updById(rowId, { n_frutos_caidos: v })}
                        />
                        <TextInput
                          editable={editable}
                          style={[styles.cellI, !editable && styles.cellDisabled]}
                          value={String(r.calibre_minimo ?? "")}
                          onChangeText={(v) => updById(rowId, { calibre_minimo: v })}
                        />
                        <TextInput
                          editable={editable}
                          style={[styles.cellI, !editable && styles.cellDisabled]}
                          value={String(r.calibre_maximo ?? "")}
                          onChangeText={(v) => updById(rowId, { calibre_maximo: v })}
                        />
                        <TouchableOpacity
                          style={[styles.saveBtn, !editable && styles.cellDisabled]}
                          disabled={!editable}
                          onPress={() => guardarFila(r)}
                        >
                          <Text style={styles.saveBtnTxt}>Guardar</Text>
                        </TouchableOpacity>
                      </>
                    )}

                    {/* FENOLOGICA */}
                    {tomaSel?.tipo_toma === "fenologica" && (
                      <>
                        <TextInput
                          editable={editable}
                          style={[styles.cellI, !editable && styles.cellDisabled]}
                          value={String(r.planta ?? "")}
                          onChangeText={(v) => updById(rowId, { planta: v })}
                        />
                        <TextInput
                          editable={editable}
                          style={[styles.cellI, !editable && styles.cellDisabled]}
                          value={String(r.n_rama ?? "")}
                          onChangeText={(v) => updById(rowId, { n_rama: v })}
                        />
                        <TextInput
                          editable={editable}
                          style={[styles.cellI, !editable && styles.cellDisabled]}
                          value={String(r.fila ?? "")}
                          onChangeText={(v) => updById(rowId, { fila: v })}
                        />
                        <TextInput
                          editable={editable}
                          style={[styles.cellI, !editable && styles.cellDisabled]}
                          value={String(r.cantidad ?? "")}
                          onChangeText={(v) => updById(rowId, { cantidad: v })}
                        />
                        <TouchableOpacity
                          disabled={!editable}
                          style={[styles.cellBtn, !editable && styles.cellDisabled]}
                          onPress={() => {
                            setEstadoRowId(String(r.id_toma_fenologica));
                            setEstadoModal(true);
                          }}
                        >
                          <Text style={styles.cellBtnTxt}>
                            {r.es_estado || "Elegir"}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.saveBtn, !editable && styles.cellDisabled]}
                          disabled={!editable}
                          onPress={() => guardarFila(r)}
                        >
                          <Text style={styles.saveBtnTxt}>Guardar</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
      </ScrollView>

          {/* MODAL CLASIF */}
          <Modal visible={clasifModal} transparent animationType="fade">
            <Pressable style={styles.modalOverlay} onPress={() => setClasifModal(false)}>
              <Pressable style={styles.modalCard}>
                <Text style={{ fontWeight: "900", marginBottom: 8 }}>Seleccionar clasificación</Text>
                <FlatList
                  data={clasifOpts}
                  keyExtractor={(i, idx) => String(i.id ?? idx)}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.modalItem}
                      onPress={() => {
                        const i = registros.findIndex((x) => String(x.id) === clasifRowId);
                        if (i >= 0) {
  const rowId = getRowKey(registros[i]);
  updById(rowId, { clasificacion: item.clasificacion });
}
                        setClasifModal(false);
                      }}
                    >
                      <Text>{item.clasificacion}</Text>
                    </TouchableOpacity>
                  )}
                />
              </Pressable>
            </Pressable>
          </Modal>

          {/* MODAL ESTADO */}
          <Modal visible={estadoModal} transparent animationType="fade">
            <Pressable style={styles.modalOverlay} onPress={() => setEstadoModal(false)}>
              <Pressable style={styles.modalCard}>
                <Text style={{ fontWeight: "900", marginBottom: 8 }}>Seleccionar estado</Text>
                <FlatList
                  data={estadoOpts}
                  keyExtractor={(i) => i.codigo_estado}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.modalItem}
                      onPress={() => {
                        const i = registros.findIndex(
                          (x) => String(x.id_toma_fenologica) === estadoRowId
                        );
                        if (i >= 0) {
  const rowId = getRowKey(registros[i]);
  updById(rowId, { es_estado: item.codigo_estado });
}
                        setEstadoModal(false);
                      }}
                    >
                      <Text>{item.codigo_estado}</Text>
                    </TouchableOpacity>
                  )}
                />
              </Pressable>
            </Pressable>
          </Modal>
        </View>
      </Modal>
    </View>
  );
}

/* ===================== STYLES ===================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#123B2A", padding: 10 },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#164533",
    padding: 10,
    borderRadius: 10,
  },
  back: { color: "#fff", fontSize: 18, fontWeight: "900", width: 24 },
  title: { flex: 1, textAlign: "center", color: "#fff", fontWeight: "900" },

  card: { backgroundColor: "#EAF2EC", padding: 10, borderRadius: 12, marginTop: 10 },
  h: { fontWeight: "900", marginBottom: 6, color: "#0E1C15" },

  row: { flexDirection: "row", gap: 6 },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#CAD8CF",
    color: "#0E1C15",
  },

  btn: { backgroundColor: "#234d20", padding: 10, borderRadius: 8 },
  btnTxt: { color: "#fff", fontWeight: "900" },

  suggest: { backgroundColor: "#fff", padding: 10, borderRadius: 8, marginTop: 6 },

  /* FORM 2 table */
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#234d20",
    paddingVertical: 6,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#CAD8CF",
    paddingVertical: 4,
  },
  colToma: { width: 60, textAlign: "center", fontWeight: "900", color: "#0E1C15" },
  colFecha: { width: 80, textAlign: "center", fontWeight: "900", color: "#0E1C15" },
  colTipo: { width: 90, textAlign: "center", fontWeight: "900", color: "#0E1C15" },
  colRegs: { width: 50, textAlign: "center", fontWeight: "900", color: "#0E1C15" },
  colEditar: { width: 70, textAlign: "center", fontWeight: "900" },

  btnMini: { backgroundColor: "#234d20", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  btnMiniTxt: { color: "#fff", fontSize: 14, fontWeight: "900" },

  meta: { fontWeight: "900", color: "#0E1C15" },
  metaSmall: { fontSize: 12, color: "#0E1C15" },

  /* Filters */
  filterLabel: { fontSize: 12, fontWeight: "900", color: "#0E1C15", marginBottom: 4 },
  filterBtn: {
    backgroundColor: "#234d20",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flex: 1,
  },
  filterBtnTxt: { color: "#fff", fontWeight: "900", textAlign: "center" },

 /* ===================== GRID TABLE ===================== */

gridHeader: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#EEF3F0",
  paddingVertical: 6,
  borderRadius: 8,
  marginTop: 10,
},

cellH: {
  width: 75,
  fontSize: 11,
  fontWeight: "900",
  color: "#0E1C15",
  textAlign: "center",
    marginLeft: 4.5, // 👈 CLAVE
},

gridRow: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#fff",
  borderRadius: 8,
  paddingVertical: 4,
  marginTop: 4,
  borderWidth: 1,
  borderColor: "#CAD8CF",
},

gridRowActive: {
  borderColor: "#234d20",
  borderWidth: 2,
},

cellT: {
  width: 70,
  height: 34,
  fontSize: 11,
  fontWeight: "900",
  color: "#0E1C15",
  textAlign: "center",
  textAlignVertical: "center",
},

cellI: {
  width: 65,
  height: 34,
  fontSize: 10,
  fontWeight: "800",
  color: "#0E1C15",
  backgroundColor: "#fff",
  borderWidth: 1,
  borderColor: "#CAD8CF",
  borderRadius: 6,
  paddingHorizontal: 6,
  textAlign: "center",
  textAlignVertical: "center",
  marginLeft: 15,
},

cellBtn: {
  width: 75,
  height: 34,
  marginLeft: 6,
  borderRadius: 6,
  borderWidth: 1,
  borderColor: "#CAD8CF",
  backgroundColor: "#F7FBF9",
  alignItems: "center",
  justifyContent: "center",
},

cellBtnTxt: {
  color: "#0E1C15",
  fontWeight: "900",
  fontSize: 10,
  textAlign: "center",
},

saveBtn: {
  width: 70,
  height: 34,
  marginLeft: 6,
  borderRadius: 6,
  backgroundColor: "#234d20",
  alignItems: "center",
  justifyContent: "center",
},

saveBtnTxt: {
  color: "#fff",
  fontWeight: "900",
  fontSize: 11,
},

cellDisabled: {
  opacity: 0.5,
},


  /* Modals */
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 12 },
  modalCard: { backgroundColor: "#fff", borderRadius: 12, padding: 12, maxHeight: "80%" },
  modalItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  filterRow: {
  flexDirection: "row",
  alignItems: "center",
  marginTop: 10,
  gap: 8,
},

filterCompact: {
  flex: 1,
  backgroundColor: "#234d20",
  borderRadius: 10,
  paddingVertical: 10,
  alignItems: "center",
  justifyContent: "center",
},

filterCompactTxt: {
  color: "#fff",
  fontWeight: "900",
  fontSize: 13,
},

filterClear: {
  width: 66,
  height: 44,
  borderRadius: 10,
  backgroundColor: "#A83A3A",
  alignItems: "center",
  justifyContent: "center",
},

filterClearTxt: {
  color: "#fff",
  fontSize: 12,
  fontWeight: "900",
  textAlign: "center",  
  justifyContent: "center",
},

});
