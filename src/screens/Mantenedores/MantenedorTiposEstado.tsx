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
} from "react-native";
import { supabase } from "../../services/supabaseClient";

const MantenedorTiposEstado = () => {
  const [estados, setEstados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // CREAR
  const [modalCrearVisible, setModalCrearVisible] = useState(false);
  const [nuevo, setNuevo] = useState({
    tipo_estado: "",
    es_estado: "",
    cultivo: "",
  });

  // EDITAR
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [editData, setEditData] = useState({
    tipo_estado: "",
    es_estado: "",
    cultivo: "",
  });

  /* ==========================================================
      CARGAR ESTADOS FENOLÓGICOS
  ========================================================== */
  const fetchEstados = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("tipos_estado")
      .select("*")
      .order("cultivo", { ascending: true })
      .order("tipo_estado", { ascending: true });

    if (error) Alert.alert("Error", "No se pudieron cargar los estados.");
    else setEstados(data || []);

    setLoading(false);
  };

  useEffect(() => {
    fetchEstados();
  }, []);

  /* ==========================================================
      CREAR ESTADO
  ========================================================== */
  const crearEstado = async () => {
    if (!nuevo.tipo_estado.trim() || !nuevo.es_estado.trim() || !nuevo.cultivo.trim()) {
      Alert.alert("Validación", "Complete todos los campos obligatorios.");
      return;
    }

    const { error } = await supabase.from("tipos_estado").insert([
      {
        tipo_estado: nuevo.tipo_estado.trim(),
        es_estado: nuevo.es_estado.trim(),
        cultivo: nuevo.cultivo.trim(),
      },
    ]);

    if (error) Alert.alert("Error", "No se pudo crear el estado.");
    else {
      setModalCrearVisible(false);
      setNuevo({ tipo_estado: "", es_estado: "", cultivo: "" });
      fetchEstados();
    }
  };

  /* ==========================================================
      ABRIR EDITAR
  ========================================================== */
  const abrirEditar = (item: any) => {
    setEditando(item);
    setEditData({
      tipo_estado: item.tipo_estado,
      es_estado: item.es_estado,
      cultivo: item.cultivo,
    });
    setModalEditarVisible(true);
  };

  /* ==========================================================
      EDITAR ESTADO
  ========================================================== */
  const editarEstado = async () => {
    if (!editData.tipo_estado.trim() || !editData.es_estado.trim() || !editData.cultivo.trim()) {
      Alert.alert("Validación", "Complete todos los campos.");
      return;
    }

    const { error } = await supabase
      .from("tipos_estado")
      .update({
        tipo_estado: editData.tipo_estado.trim(),
        es_estado: editData.es_estado.trim(),
        cultivo: editData.cultivo.trim(),
      })
      .eq("id_estado", editando.id_estado);

    if (error) Alert.alert("Error", "No se pudo actualizar estado.");
    else {
      setModalEditarVisible(false);
      fetchEstados();
    }
  };

  /* ==========================================================
      ELIMINAR ESTADO
  ========================================================== */
  const eliminarEstado = async (id_estado: number) => {
    Alert.alert(
      "Confirmación",
      "¿Eliminar este estado? Si está en uso en tomas fenológicas, podría generar inconsistencias.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("tipos_estado")
              .delete()
              .eq("id_estado", id_estado);

            if (error) Alert.alert("Error", "No se pudo eliminar.");
            else fetchEstados();
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
      <Text style={styles.title}>Mantenedor de Tipos de Estado</Text>

      {/* CREAR */}
      <TouchableOpacity
        style={styles.btnAdd}
        onPress={() => setModalCrearVisible(true)}
      >
        <Text style={styles.btnAddText}>+ Crear Estado</Text>
      </TouchableOpacity>

      {/* LISTA */}
      <FlatList
        data={estados}
        keyExtractor={(item) => item.id_estado.toString()}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemMain}>
                {item.tipo_estado} — {item.es_estado}
              </Text>
              <Text style={styles.itemSub}>Cultivo: {item.cultivo}</Text>
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
                onPress={() => eliminarEstado(item.id_estado)}
              >
                <Text style={styles.btnDeleteText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* ======================================================
            MODAL CREAR
      ====================================================== */}
      <Modal visible={modalCrearVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Crear Estado Fenológico</Text>

            <TextInput
              style={styles.input}
              placeholder="Código (tipo_estado)"
              value={nuevo.tipo_estado}
              onChangeText={(t) => setNuevo({ ...nuevo, tipo_estado: t })}
            />

            <TextInput
              style={styles.input}
              placeholder="Descripción (es_estado)"
              value={nuevo.es_estado}
              onChangeText={(t) => setNuevo({ ...nuevo, es_estado: t })}
            />

            <TextInput
              style={styles.input}
              placeholder="Cultivo (PALTOS / CITRICOS)"
              value={nuevo.cultivo}
              onChangeText={(t) => setNuevo({ ...nuevo, cultivo: t })}
            />

            <TouchableOpacity style={styles.btnModalSave} onPress={crearEstado}>
              <Text style={styles.btnModalText}>Guardar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnModalCancel}
              onPress={() => setModalCrearVisible(false)}
            >
              <Text style={styles.btnModalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ======================================================
            MODAL EDITAR
      ====================================================== */}
      <Modal visible={modalEditarVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Editar Estado</Text>

            <TextInput
              style={styles.input}
              value={editData.tipo_estado}
              onChangeText={(t) => setEditData({ ...editData, tipo_estado: t })}
            />

            <TextInput
              style={styles.input}
              value={editData.es_estado}
              onChangeText={(t) => setEditData({ ...editData, es_estado: t })}
            />

            <TextInput
              style={styles.input}
              value={editData.cultivo}
              onChangeText={(t) => setEditData({ ...editData, cultivo: t })}
            />

            <TouchableOpacity style={styles.btnModalSave} onPress={editarEstado}>
              <Text style={styles.btnModalText}>Guardar cambios</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnModalCancel}
              onPress={() => setModalEditarVisible(false)}
            >
              <Text style={styles.btnModalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default MantenedorTiposEstado;

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
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemMain: {
    fontSize: 16,
    fontWeight: "700",
    color: "#234d20",
  },
  itemSub: {
    fontSize: 13,
    color: "#556b5c",
  },
  rowActions: {
    flexDirection: "row",
    gap: 12,
  },
  btnEdit: {
    backgroundColor: "#1f78d1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnEditText: {
    color: "white",
    fontWeight: "700",
  },
  btnDelete: {
    backgroundColor: "#b82d2d",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnDeleteText: {
    color: "white",
    fontWeight: "700",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "88%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#234d20",
    marginBottom: 15,
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
