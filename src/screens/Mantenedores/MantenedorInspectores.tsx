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

const MantenedorInspectores = () => {
  const [inspectores, setInspectores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* ==========================================================
      MODAL CREAR INSPECTOR
  ========================================================== */
  const [modalCrearVisible, setModalCrearVisible] = useState(false);
  const [nuevo, setNuevo] = useState({
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    dni: "",
    tipo_de_usuario: "INSPECTOR",
    clave: "",
    usuario: "",
  });

  /* ==========================================================
      MODAL EDITAR INSPECTOR
  ========================================================== */
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [editData, setEditData] = useState({
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    dni: "",
    tipo_de_usuario: "",
    usuario: "",
    activo: true,
  });

  /* ==========================================================
      CARGAR INSPECTORES
  ========================================================== */
  const fetchInspectores = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("inspectores")
      .select("*")
      .order("apellido_paterno", { ascending: true });

    if (error) Alert.alert("Error", "No se pudieron cargar inspectores");
    else setInspectores(data || []);

    setLoading(false);
  };

  useEffect(() => {
    fetchInspectores();
  }, []);

  /* ==========================================================
      CREAR INSPECTOR
  ========================================================== */
  const crearInspector = async () => {
    if (
      !nuevo.nombre.trim() ||
      !nuevo.apellido_paterno.trim() ||
      !nuevo.dni.trim() ||
      !nuevo.clave.trim()
    ) {
      Alert.alert("Validación", "Complete todos los campos obligatorios.");
      return;
    }

    const payload = {
      nombre: nuevo.nombre.trim(),
      apellido_paterno: nuevo.apellido_paterno.trim(),
      apellido_materno: nuevo.apellido_materno.trim(),
      dni: nuevo.dni.trim(),
      tipo_de_usuario: nuevo.tipo_de_usuario,
      clave: nuevo.clave.trim(),
      usuario: nuevo.usuario.trim() || null,
      activo: true,
    };

    const { error } = await supabase.from("inspectores").insert([payload]);

    if (error) Alert.alert("Error", "No se pudo crear inspector");
    else {
      setModalCrearVisible(false);
      setNuevo({
        nombre: "",
        apellido_paterno: "",
        apellido_materno: "",
        dni: "",
        tipo_de_usuario: "INSPECTOR",
        clave: "",
        usuario: "",
      });
      fetchInspectores();
    }
  };

  /* ==========================================================
      ABRIR MODAL EDITAR
  ========================================================== */
  const abrirEditar = (inspector: any) => {
    setEditando(inspector);
    setEditData({
      nombre: inspector.nombre,
      apellido_paterno: inspector.apellido_paterno,
      apellido_materno: inspector.apellido_materno,
      dni: inspector.dni,
      tipo_de_usuario: inspector.tipo_de_usuario,
      usuario: inspector.usuario,
      activo: inspector.activo,
    });
    setModalEditarVisible(true);
  };

  /* ==========================================================
      EDITAR INSPECTOR
  ========================================================== */
  const editarInspector = async () => {
    const { error } = await supabase
      .from("inspectores")
      .update({
        nombre: editData.nombre.trim(),
        apellido_paterno: editData.apellido_paterno.trim(),
        apellido_materno: editData.apellido_materno.trim(),
        dni: editData.dni.trim(),
        tipo_de_usuario: editData.tipo_de_usuario,
        usuario: editData.usuario.trim() || null,
        activo: editData.activo,
      })
      .eq("id_inspector", editando.id_inspector);

    if (error) Alert.alert("Error", "No se pudo actualizar inspector");
    else {
      setModalEditarVisible(false);
      fetchInspectores();
    }
  };

  /* ==========================================================
      ELIMINAR INSPECTOR
  ========================================================== */
  const eliminarInspector = async (id_inspector: string) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Eliminar inspector? Esto no eliminará tomas históricas, pero no podrá usar la app.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("inspectores")
              .delete()
              .eq("id_inspector", id_inspector);

            if (error) Alert.alert("Error", "No se pudo eliminar");
            else fetchInspectores();
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
      <Text style={styles.title}>Mantenedor de Inspectores</Text>

      {/* Crear */}
      <TouchableOpacity
        style={styles.btnAdd}
        onPress={() => setModalCrearVisible(true)}
      >
        <Text style={styles.btnAddText}>+ Crear Inspector</Text>
      </TouchableOpacity>

      {/* LISTA */}
      <FlatList
        data={inspectores}
        keyExtractor={(item) => item.id_inspector}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <View>
              <Text style={styles.itemName}>
                {item.nombre} {item.apellido_paterno}
              </Text>
              <Text style={styles.itemSub}>DNI: {item.dni}</Text>
              <Text style={styles.itemSub}>Usuario: {item.usuario}</Text>
              <Text style={styles.itemSub}>
                Rol: {item.tipo_de_usuario} |{" "}
                {item.activo ? "Activo" : "Inactivo"}
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
                onPress={() => eliminarInspector(item.id_inspector)}
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
            <ScrollView>
              <Text style={styles.modalTitle}>Crear Inspector</Text>

              {/* Nombre */}
              <TextInput
                style={styles.input}
                placeholder="Nombre"
                value={nuevo.nombre}
                onChangeText={(t) => setNuevo({ ...nuevo, nombre: t })}
              />

              <TextInput
                style={styles.input}
                placeholder="Apellido paterno"
                value={nuevo.apellido_paterno}
                onChangeText={(t) => setNuevo({ ...nuevo, apellido_paterno: t })}
              />

              <TextInput
                style={styles.input}
                placeholder="Apellido materno"
                value={nuevo.apellido_materno}
                onChangeText={(t) => setNuevo({ ...nuevo, apellido_materno: t })}
              />

              <TextInput
                style={styles.input}
                placeholder="DNI"
                value={nuevo.dni}
                keyboardType="numeric"
                onChangeText={(t) => setNuevo({ ...nuevo, dni: t })}
              />

              <TextInput
                style={styles.input}
                placeholder="Usuario / Email"
                value={nuevo.usuario}
                onChangeText={(t) => setNuevo({ ...nuevo, usuario: t })}
              />

              {/* Tipo de usuario */}
              <Text style={styles.label}>Rol</Text>
              <View style={styles.rowRoles}>
                <TouchableOpacity
                  style={[
                    styles.roleBtn,
                    nuevo.tipo_de_usuario === "INSPECTOR" && styles.roleSelected,
                  ]}
                  onPress={() =>
                    setNuevo({ ...nuevo, tipo_de_usuario: "INSPECTOR" })
                  }
                >
                  <Text style={styles.roleText}>Inspector</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleBtn,
                    nuevo.tipo_de_usuario === "SUPERVISOR" && styles.roleSelected,
                  ]}
                  onPress={() =>
                    setNuevo({ ...nuevo, tipo_de_usuario: "SUPERVISOR" })
                  }
                >
                  <Text style={styles.roleText}>Supervisor</Text>
                </TouchableOpacity>
              </View>

              {/* Clave */}
              <TextInput
                style={styles.input}
                placeholder="Clave (solo al crear)"
                secureTextEntry
                value={nuevo.clave}
                onChangeText={(t) => setNuevo({ ...nuevo, clave: t })}
              />

              {/* Botones */}
              <TouchableOpacity
                style={styles.btnModalSave}
                onPress={crearInspector}
              >
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

      {/* ======================================================
             MODAL EDITAR
      ====================================================== */}
      <Modal visible={modalEditarVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <ScrollView>
              <Text style={styles.modalTitle}>Editar Inspector</Text>

              <TextInput
                style={styles.input}
                value={editData.nombre}
                onChangeText={(t) => setEditData({ ...editData, nombre: t })}
              />

              <TextInput
                style={styles.input}
                value={editData.apellido_paterno}
                onChangeText={(t) =>
                  setEditData({ ...editData, apellido_paterno: t })
                }
              />

              <TextInput
                style={styles.input}
                value={editData.apellido_materno}
                onChangeText={(t) =>
                  setEditData({ ...editData, apellido_materno: t })
                }
              />

              <TextInput
                style={styles.input}
                value={editData.dni}
                keyboardType="numeric"
                onChangeText={(t) => setEditData({ ...editData, dni: t })}
              />

              <TextInput
                style={styles.input}
                value={editData.usuario}
                onChangeText={(t) => setEditData({ ...editData, usuario: t })}
              />

              <Text style={styles.label}>Rol</Text>
              <View style={styles.rowRoles}>
                <TouchableOpacity
                  style={[
                    styles.roleBtn,
                    editData.tipo_de_usuario === "INSPECTOR" &&
                      styles.roleSelected,
                  ]}
                  onPress={() =>
                    setEditData({ ...editData, tipo_de_usuario: "INSPECTOR" })
                  }
                >
                  <Text style={styles.roleText}>Inspector</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleBtn,
                    editData.tipo_de_usuario === "SUPERVISOR" &&
                      styles.roleSelected,
                  ]}
                  onPress={() =>
                    setEditData({ ...editData, tipo_de_usuario: "SUPERVISOR" })
                  }
                >
                  <Text style={styles.roleText}>Supervisor</Text>
                </TouchableOpacity>
              </View>

              {/* CLAVE NO EDITABLE */}
              <Text style={styles.label}>Clave</Text>
              <Text style={styles.disabledField}>No editable</Text>

              {/* ACTIVO */}
              <TouchableOpacity
                style={[
                  styles.activeToggle,
                  editData.activo ? styles.active : styles.inactive,
                ]}
                onPress={() =>
                  setEditData({ ...editData, activo: !editData.activo })
                }
              >
                <Text style={styles.toggleText}>
                  {editData.activo ? "Activo" : "Inactivo"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnModalSave}
                onPress={editarInspector}
              >
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

export default MantenedorInspectores;

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
    color: "white",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
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
  itemName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#234d20",
  },
  itemSub: {
    color: "#5a6e63",
    fontSize: 13,
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
    marginTop: 10,
    marginBottom: 8,
  },
  btnModalText: {
    textAlign: "center",
    color: "white",
    fontWeight: "700",
  },
  btnModalCancel: {
    paddingVertical: 10,
  },
  btnModalCancelText: {
    textAlign: "center",
    color: "#b82d2d",
    fontWeight: "700",
  },
  label: {
    fontWeight: "700",
    marginBottom: 4,
    color: "#234d20",
  },
  rowRoles: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  roleBtn: {
    flex: 1,
    backgroundColor: "#cfd8dc",
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  roleSelected: {
    backgroundColor: "#1f78d1",
  },
  roleText: {
    textAlign: "center",
    fontWeight: "700",
    color: "white",
  },
  disabledField: {
    backgroundColor: "#eeeeee",
    color: "#777",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  activeToggle: {
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  active: { backgroundColor: "#2e7d32" },
  inactive: { backgroundColor: "#b82d2d" },
  toggleText: { textAlign: "center", color: "white", fontWeight: "700" },
});
