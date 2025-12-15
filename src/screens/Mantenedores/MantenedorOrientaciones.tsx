import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
} from "react-native";
import { supabase } from "../../services/supabaseClient";

const MantenedorOrientaciones = () => {
  const [orientaciones, setOrientaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Crear
  const [modalCrearVisible, setModalCrearVisible] = useState(false);
  const [nuevaOrientacion, setNuevaOrientacion] = useState("");

  // Editar
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [orientacionEditando, setOrientacionEditando] = useState<any>(null);
  const [orientacionEditNombre, setOrientacionEditNombre] = useState("");

  /* ----------------------------------------------------------
      CARGAR ORIENTACIONES
  ---------------------------------------------------------- */
  const fetchOrientaciones = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("orientaciones")
      .select("*")
      .order("nombre_orientacion", { ascending: true });

    if (error) {
      Alert.alert("Error", "No se pudieron cargar orientaciones");
    } else {
      setOrientaciones(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchOrientaciones();
  }, []);

  /* ----------------------------------------------------------
      CREAR ORIENTACIÓN
  ---------------------------------------------------------- */
  const crearOrientacion = async () => {
    if (!nuevaOrientacion.trim()) {
      Alert.alert("Validación", "Ingrese un nombre de orientación.");
      return;
    }

    const { error } = await supabase
      .from("orientaciones")
      .insert([{ nombre_orientacion: nuevaOrientacion.trim() }]);

    if (error) {
      Alert.alert("Error", "No se pudo crear orientación");
    } else {
      setNuevaOrientacion("");
      setModalCrearVisible(false);
      fetchOrientaciones();
    }
  };

  /* ----------------------------------------------------------
      ABRIR EDITAR
  ---------------------------------------------------------- */
  const abrirEditar = (item: any) => {
    setOrientacionEditando(item);
    setOrientacionEditNombre(item.nombre_orientacion);
    setModalEditarVisible(true);
  };

  /* ----------------------------------------------------------
      EDITAR ORIENTACIÓN
  ---------------------------------------------------------- */
  const editarOrientacion = async () => {
    if (!orientacionEditNombre.trim()) {
      Alert.alert("Validación", "Ingrese un nombre válido.");
      return;
    }

    const { error } = await supabase
      .from("orientaciones")
      .update({ nombre_orientacion: orientacionEditNombre.trim() })
      .eq("id_orientacion", orientacionEditando.id_orientacion);

    if (error) {
      Alert.alert("Error", "No se pudo actualizar orientación");
    } else {
      setModalEditarVisible(false);
      fetchOrientaciones();
    }
  };

  /* ----------------------------------------------------------
      ELIMINAR ORIENTACIÓN
  ---------------------------------------------------------- */
  const eliminarOrientacion = async (id_orientacion: number) => {
    Alert.alert(
      "Confirmar",
      "¿Eliminar orientación? Esto podría afectar lotes asociados.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("orientaciones")
              .delete()
              .eq("id_orientacion", id_orientacion);

            if (error) Alert.alert("Error", "No se pudo eliminar");
            else fetchOrientaciones();
          },
        },
      ]
    );
  };

  /* ----------------------------------------------------------
      RENDER
  ---------------------------------------------------------- */
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mantenedor de Orientaciones</Text>

      {/* Botón Crear */}
      <TouchableOpacity
        style={styles.btnAdd}
        onPress={() => setModalCrearVisible(true)}
      >
        <Text style={styles.btnAddText}>+ Crear Orientación</Text>
      </TouchableOpacity>

      {/* LISTA */}
      <FlatList
        data={orientaciones}
        keyExtractor={(item) => item.id_orientacion.toString()}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text style={styles.itemText}>{item.nombre_orientacion}</Text>

            <View style={styles.rowActions}>
              <TouchableOpacity
                style={styles.btnEdit}
                onPress={() => abrirEditar(item)}
              >
                <Text style={styles.btnEditText}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnDelete}
                onPress={() => eliminarOrientacion(item.id_orientacion)}
              >
                <Text style={styles.btnDeleteText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* ----------------------------------------------------
            MODAL CREAR
      ------------------------------------------------------ */}
      <Modal visible={modalCrearVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Crear Orientación</Text>

            <TextInput
              style={styles.input}
              placeholder="Nombre orientación"
              value={nuevaOrientacion}
              onChangeText={setNuevaOrientacion}
            />

            <TouchableOpacity
              style={styles.btnModalSave}
              onPress={crearOrientacion}
            >
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

      {/* ----------------------------------------------------
            MODAL EDITAR
      ------------------------------------------------------ */}
      <Modal visible={modalEditarVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Editar Orientación</Text>

            <TextInput
              style={styles.input}
              value={orientacionEditNombre}
              onChangeText={setOrientacionEditNombre}
            />

            <TouchableOpacity
              style={styles.btnModalSave}
              onPress={editarOrientacion}
            >
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

export default MantenedorOrientaciones;

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
    color: "white",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
  },
  listItem: {
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemText: {
    fontSize: 16,
    color: "#234d20",
    flex: 1,
  },
  rowActions: { flexDirection: "row", gap: 12 },
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
    width: "85%",
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
    color: "white",
    textAlign: "center",
    fontWeight: "700",
  },
  btnModalCancel: { paddingVertical: 10 },
  btnModalCancelText: {
    color: "#b82d2d",
    textAlign: "center",
    fontWeight: "700",
  },
});
