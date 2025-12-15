import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  StyleSheet,
  ScrollView,
} from "react-native";
import { supabase } from "../../services/supabaseClient";

const MantenedorLotes = () => {
  const [lotes, setLotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* ==========================================================
      ESTADO DEL MODAL CREAR
  ========================================================== */
  const [modalCrearVisible, setModalCrearVisible] = useState(false);
  const [nuevo, setNuevo] = useState({
    nombre_lote: "",
    variedad: "",
    latitud: "",
    longitud: "",
    plantas_calculadas: "",
    codigo_lote: "",
    area_neta_estimada_ha: "",
  });

  /* ==========================================================
      ESTADO DEL MODAL EDITAR
  ========================================================== */
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [editando, setEditando] = useState<any>(null);

  const [editData, setEditData] = useState({
    nombre_lote: "",
    variedad: "",
    latitud: "",
    longitud: "",
    plantas_calculadas: "",
    codigo_lote: "",
    area_neta_estimada_ha: "",
  });

  /* ==========================================================
      FUNCIONES AUXILIARES
  ========================================================== */

  // Genera código correlativo tipo L-027
  const generarCodigoLote = async (): Promise<string> => {
    const { data, error } = await supabase
      .from("lotes")
      .select("codigo_lote")
      .order("codigo_lote", { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) return "L-001";

    const ultimo = data[0].codigo_lote; // Ej: L-026
    const numero = parseInt(ultimo.replace("L-", "")) || 0;
    const nuevoNum = numero + 1;

    return `L-${String(nuevoNum).padStart(3, "0")}`;
  };

  // Validación básica de coordenadas
  const validarCoordenada = (valor: string) => {
    if (!/^[-]?\d{1,2}(\.\d+)?$/.test(valor)) return false;
    return true;
  };

  /* ==========================================================
      CARGAR LISTA DE LOTES
  ========================================================== */
  const fetchLotes = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("lotes")
      .select("*")
      .order("nombre_lote", { ascending: true });

    if (error) Alert.alert("Error", "No se pudieron cargar los lotes.");
    else setLotes(data || []);

    setLoading(false);
  };

  useEffect(() => {
    fetchLotes();
  }, []);

  /* ==========================================================
      CREAR LOTE
  ========================================================== */
  const crearLote = async () => {
    if (!nuevo.nombre_lote.trim() || !nuevo.variedad.trim()) {
      Alert.alert("Validación", "Debe ingresar nombre y variedad.");
      return;
    }

    if (nuevo.latitud && !validarCoordenada(nuevo.latitud)) {
      Alert.alert("Error", "Latitud inválida. Ejemplo: -11.123456");
      return;
    }

    if (nuevo.longitud && !validarCoordenada(nuevo.longitud)) {
      Alert.alert("Error", "Longitud inválida. Ejemplo: -77.123456");
      return;
    }

    let codigo = nuevo.codigo_lote;
    if (!codigo) codigo = await generarCodigoLote();

    const payload = {
      nombre_lote: nuevo.nombre_lote.trim(),
      variedad: nuevo.variedad.trim(),
      latitud: nuevo.latitud ? parseFloat(nuevo.latitud) : null,
      longitud: nuevo.longitud ? parseFloat(nuevo.longitud) : null,
      plantas_calculadas: nuevo.plantas_calculadas
        ? parseInt(nuevo.plantas_calculadas)
        : null,
      codigo_lote: codigo,
      area_neta_estimada_ha: nuevo.area_neta_estimada_ha
        ? parseFloat(nuevo.area_neta_estimada_ha)
        : null,
    };

    const { error } = await supabase.from("lotes").insert([payload]);

    if (error) Alert.alert("Error", "No se pudo crear el lote.");
    else {
      setModalCrearVisible(false);
      fetchLotes();
    }
  };

  /* ==========================================================
      ABRIR MODAL EDITAR
  ========================================================== */
  const abrirEditar = (lote: any) => {
    setEditando(lote);
    setEditData({
      nombre_lote: lote.nombre_lote,
      variedad: lote.variedad,
      latitud: lote.latitud ? lote.latitud.toString() : "",
      longitud: lote.longitud ? lote.longitud.toString() : "",
      plantas_calculadas: lote.plantas_calculadas
        ? lote.plantas_calculadas.toString()
        : "",
      codigo_lote: lote.codigo_lote,
      area_neta_estimada_ha: lote.area_neta_estimada_ha
        ? lote.area_neta_estimada_ha.toString()
        : "",
    });

    setModalEditarVisible(true);
  };

  /* ==========================================================
      GUARDAR EDICIÓN
  ========================================================== */
  const editarLote = async () => {
    const payload = {
      nombre_lote: editData.nombre_lote.trim(),
      variedad: editData.variedad.trim(),
      latitud: editData.latitud ? parseFloat(editData.latitud) : null,
      longitud: editData.longitud ? parseFloat(editData.longitud) : null,
      plantas_calculadas: editData.plantas_calculadas
        ? parseInt(editData.plantas_calculadas)
        : null,
      codigo_lote: editData.codigo_lote, // NO editable
      area_neta_estimada_ha: editData.area_neta_estimada_ha
        ? parseFloat(editData.area_neta_estimada_ha)
        : null,
    };

    const { error } = await supabase
      .from("lotes")
      .update(payload)
      .eq("id_lote", editando.id_lote);

    if (error) Alert.alert("Error", "No se pudo actualizar el lote.");
    else {
      setModalEditarVisible(false);
      fetchLotes();
    }
  };

  /* ==========================================================
      ELIMINAR LOTE
  ========================================================== */
  const eliminarLote = async (id_lote: string) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Eliminar lote? Podría afectar tomas y registros asociados.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("lotes")
              .delete()
              .eq("id_lote", id_lote);

            if (error) Alert.alert("Error", "No se pudo eliminar.");
            else fetchLotes();
          },
        },
      ]
    );
  };

  /* ==========================================================
      RENDER
  ========================================================== */
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mantenedor de Lotes</Text>

      {/* CREAR LOTE */}
      <TouchableOpacity
        style={styles.btnAdd}
        onPress={async () => {
          const codigo = await generarCodigoLote();
          setNuevo({
            nombre_lote: "",
            variedad: "",
            latitud: "",
            longitud: "",
            plantas_calculadas: "",
            codigo_lote: codigo,
            area_neta_estimada_ha: "",
          });
          setModalCrearVisible(true);
        }}
      >
        <Text style={styles.btnAddText}>+ Crear Lote</Text>
      </TouchableOpacity>

      {/* LISTA */}
      <FlatList
        data={lotes}
        keyExtractor={(item) => item.id_lote}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemMain}>{item.nombre_lote}</Text>
              <Text style={styles.itemSub}>Código: {item.codigo_lote}</Text>
              <Text style={styles.itemSub}>Variedad: {item.variedad}</Text>
              <Text style={styles.itemSub}>
                Plantas: {item.plantas_calculadas ?? "-"}
              </Text>
              <Text style={styles.itemSub}>
                Área (ha): {item.area_neta_estimada_ha ?? "-"}
              </Text>
            </View>

            <View style={styles.rowActions}>
              <TouchableOpacity
                style={styles.btnEdit}
                onPress={() => abrirEditar(item)}
              >
                <Text style={styles.btnEditText}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnDelete}
                onPress={() => eliminarLote(item.id_lote)}
              >
                <Text style={styles.btnDeleteText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* ==========================================================
            MODAL CREAR
      ========================================================== */}
      <Modal visible={modalCrearVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <ScrollView>
              <Text style={styles.modalTitle}>Crear Lote</Text>

              <Text style={styles.label}>Nombre del lote</Text>
              <TextInput
                style={styles.input}
                value={nuevo.nombre_lote}
                onChangeText={(t) => setNuevo({ ...nuevo, nombre_lote: t })}
              />

              <Text style={styles.label}>Variedad</Text>
              <TextInput
                style={styles.input}
                value={nuevo.variedad}
                onChangeText={(t) => setNuevo({ ...nuevo, variedad: t })}
              />

              <Text style={styles.label}>Latitud</Text>
              <TextInput
                style={styles.input}
                placeholder="-11.123456"
                keyboardType="numeric"
                value={nuevo.latitud}
                onChangeText={(t) => setNuevo({ ...nuevo, latitud: t })}
              />

              <Text style={styles.label}>Longitud</Text>
              <TextInput
                style={styles.input}
                placeholder="-77.123456"
                keyboardType="numeric"
                value={nuevo.longitud}
                onChangeText={(t) => setNuevo({ ...nuevo, longitud: t })}
              />

              <Text style={styles.label}>Plantas calculadas</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={nuevo.plantas_calculadas}
                onChangeText={(t) =>
                  setNuevo({ ...nuevo, plantas_calculadas: t })
                }
              />

              <Text style={styles.label}>Código asignado</Text>
              <TextInput
                style={[styles.input, { backgroundColor: "#e0e0e0" }]}
                value={nuevo.codigo_lote}
                editable={false}
              />

              <Text style={styles.label}>Área estimada (ha)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={nuevo.area_neta_estimada_ha}
                onChangeText={(t) =>
                  setNuevo({ ...nuevo, area_neta_estimada_ha: t })
                }
              />

              <TouchableOpacity style={styles.btnModalSave} onPress={crearLote}>
                <Text style={styles.btnModalText}>Guardar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnModalCancel}
                onPress={() => setModalCrearVisible(false)}
              >
                <Text style={styles.btnModalCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ==========================================================
            MODAL EDITAR
      ========================================================== */}
      <Modal visible={modalEditarVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <ScrollView>
              <Text style={styles.modalTitle}>Editar Lote</Text>

              <Text style={styles.label}>Nombre del lote</Text>
              <TextInput
                style={styles.input}
                value={editData.nombre_lote}
                onChangeText={(t) =>
                  setEditData({ ...editData, nombre_lote: t })
                }
              />

              <Text style={styles.label}>Variedad</Text>
              <TextInput
                style={styles.input}
                value={editData.variedad}
                onChangeText={(t) => setEditData({ ...editData, variedad: t })}
              />

              <Text style={styles.label}>Latitud</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={editData.latitud}
                onChangeText={(t) => setEditData({ ...editData, latitud: t })}
              />

              <Text style={styles.label}>Longitud</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={editData.longitud}
                onChangeText={(t) => setEditData({ ...editData, longitud: t })}
              />

              <Text style={styles.label}>Plantas calculadas</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={editData.plantas_calculadas}
                onChangeText={(t) =>
                  setEditData({ ...editData, plantas_calculadas: t })
                }
              />

              <Text style={styles.label}>Código (no editable)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: "#e0e0e0" }]}
                value={editData.codigo_lote}
                editable={false}
              />

              <Text style={styles.label}>Área estimada (ha)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={editData.area_neta_estimada_ha}
                onChangeText={(t) =>
                  setEditData({ ...editData, area_neta_estimada_ha: t })
                }
              />

              <TouchableOpacity style={styles.btnModalSave} onPress={editarLote}>
                <Text style={styles.btnModalText}>Guardar Cambios</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnModalCancel}
                onPress={() => setModalEditarVisible(false)}
              >
                <Text style={styles.btnModalCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default MantenedorLotes;

/* ==========================================================
      ESTILOS
========================================================== */
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#e8f3eb" },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    color: "#234d20",
    marginBottom: 20,
  },
  btnAdd: {
    backgroundColor: "#234d20",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  btnAddText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },
  listItem: {
    backgroundColor: "white",
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemMain: {
    fontSize: 17,
    fontWeight: "700",
    color: "#234d20",
  },
  itemSub: {
    fontSize: 13,
    color: "#556b5c",
  },
  rowActions: { flexDirection: "row", gap: 10 },

  btnEdit: {
    backgroundColor: "#1f78d1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnEditText: { color: "white", fontWeight: "700" },

  btnDelete: {
    backgroundColor: "#b82d2d",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnDeleteText: { color: "white", fontWeight: "700" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "88%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#234d20",
    marginBottom: 15,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#234d20",
    marginBottom: 4,
  },

  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cfd8dc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
    color: "#234d20",
  },

  btnModalSave: {
    backgroundColor: "#234d20",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  btnModalText: {
    textAlign: "center",
    color: "white",
    fontWeight: "700",
  },
  btnModalCancel: { paddingVertical: 10 },
  btnModalCancelText: {
    textAlign: "center",
    color: "#b82d2d",
    fontWeight: "700",
  },
});
