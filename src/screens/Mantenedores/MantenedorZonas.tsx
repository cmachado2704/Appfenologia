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

const MantenedorZonas = () => {
  const [zonas, setZonas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para modal crear
  const [modalCrearVisible, setModalCrearVisible] = useState(false);
  const [nuevaZona, setNuevaZona] = useState("");

  // Estados para modal editar
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [zonaEditando, setZonaEditando] = useState<any>(null);
  const [zonaEditNombre, setZonaEditNombre] = useState("");

  /* ----------------------------------------------------------
      CARGAR ZONAS
  ---------------------------------------------------------- */
  const fetchZonas = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("zonas")
      .select("*")
      .order("nombre_zona", { ascending: true });

    if (error) {
      Alert.alert("Error", "No se pudieron cargar zonas");
    } else {
      setZonas(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchZonas();
  }, []);

  /* ----------------------------------------------------------
      CREAR ZONA
  ---------------------------------------------------------- */
  const crearZona = async () => {
    if (!nuevaZona.trim()) {
      Alert.alert("Validación", "Ingrese un nombre de zona.");
      return;
    }

    const { error } = await supabase
      .from("zonas")
      .insert([{ nombre_zona: nuevaZona.trim() }]);

    if (error) {
      Alert.alert("Error", "No se pudo crear zona");
    } else {
      setNuevaZona("");
      setModalCrearVisible(false);
      fetchZonas();
    }
  };

  /* ----------------------------------------------------------
      PREPARAR EDICIÓN DE ZONA
  ---------------------------------------------------------- */
  const abrirEditar = (zona: any) => {
    setZonaEditando(zona);
    setZonaEditNombre(zona.nombre_zona);
    setModalEditarVisible(true);
  };

  /* ----------------------------------------------------------
      EDITAR ZONA
  ---------------------------------------------------------- */
  const editarZona = async () => {
    if (!zonaEditNombre.trim()) {
      Alert.alert("Error", "Ingrese un nombre de zona válido.");
      return;
    }

    const { error } = await supabase
      .from("zonas")
      .update({ nombre_zona: zonaEditNombre.trim() })
      .eq("id_zona", zonaEditando.id_zona);

    if (error) {
      Alert.alert("Error", "No se pudo actualizar zona");
    } else {
      setModalEditarVisible(false);
      fetchZonas();
    }
  };

  /* ----------------------------------------------------------
      ELIMINAR ZONA
  ---------------------------------------------------------- */
  const eliminarZona = async (id_zona: number) => {
    Alert.alert(
      "Confirmar",
      "¿Eliminar zona? Esto podría afectar registros asociados.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("zonas")
              .delete()
              .eq("id_zona", id_zona);

            if (error) Alert.alert("Error", "No se pudo eliminar");
            else fetchZonas();
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
      <Text style={styles.title}>Mantenedor de Zonas</Text>

      {/* Botón abrir modal Crear */}
      <TouchableOpacity
        style={styles.btnAdd}
        onPress={() => setModalCrearVisible(true)}
      >
        <Text style={styles.btnAddText}>+ Crear Zona</Text>
      </TouchableOpacity>

      {/* LISTA DE ZONAS */}
      <FlatList
        data={zonas}
        keyExtractor={(item) => item.id_zona.toString()}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text style={styles.itemText}>{item.nombre_zona}</Text>

            <View style={styles.rowActions}>
              {/* EDITAR */}
              <TouchableOpacity
                style={styles.btnEdit}
                onPress={() => abrirEditar(item)}
              >
                <Text style={styles.btnEditText}>Editar</Text>
              </TouchableOpacity>

              {/* ELIMINAR */}
              <TouchableOpacity
                style={styles.btnDelete}
                onPress={() => eliminarZona(item.id_zona)}
              >
                <Text style={styles.btnDeleteText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/** ----------------------------------------------------
           MODAL CREAR ZONA
      ------------------------------------------------------ */}
      <Modal visible={modalCrearVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Crear zona</Text>

            <TextInput
              style={styles.input}
              placeholder="Nombre zona"
              value={nuevaZona}
              onChangeText={setNuevaZona}
            />

            <TouchableOpacity style={styles.btnModalSave} onPress={crearZona}>
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

      {/** ----------------------------------------------------
           MODAL EDITAR ZONA
      ------------------------------------------------------ */}
      <Modal visible={modalEditarVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Editar zona</Text>

            <TextInput
              style={styles.input}
              value={zonaEditNombre}
              onChangeText={setZonaEditNombre}
            />

            <TouchableOpacity style={styles.btnModalSave} onPress={editarZona}>
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

export default MantenedorZonas;

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
  btnEditText: { color: "white", fontWeight: "700" },
  btnDelete: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#b82d2d",
  },
  btnDeleteText: {
    color: "white",
    fontWeight: "700",
  },

  /* MODAL */
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
    color: "#234d20",
    marginBottom: 12,
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
  btnModalCancel: {
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnModalCancelText: {
    color: "#b82d2d",
    textAlign: "center",
    fontWeight: "700",
  },
});
