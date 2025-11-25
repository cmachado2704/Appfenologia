import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { supabase } from "../../services/supabaseClient";

type Toma = {
  id_toma: string;
  n_de_toma: string;
  nombre_lote: string;
  fecha_creacion: string | null;
  fecha_fin: string | null;
  estado: string | null;
};

const AprobarEditarTomas: React.FC = () => {
  const [tomas, setTomas] = useState<Toma[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTomas = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("tomas")
      .select("id_toma, n_de_toma, nombre_lote, fecha_creacion, fecha_fin, estado")
      .order("fecha_creacion", { ascending: false });

    if (error) {
      Alert.alert("Error", "No se pudieron obtener las tomas.");
    } else {
      setTomas(data as Toma[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTomas();
  }, []);

  const aprobarToma = async (id_toma: string) => {
    const { error } = await supabase
      .from("tomas")
      .update({
        estado: "aprobada",
        fecha_aprobacion: new Date().toISOString(),
      })
      .eq("id_toma", id_toma);

    if (error) {
      Alert.alert("Error", "No se pudo aprobar la toma.");
    } else {
      Alert.alert("Éxito", "Toma aprobada.");
      fetchTomas();
    }
  };

  const eliminarToma = async (id_toma: string) => {
    Alert.alert(
      "Confirmación",
      "¿Desea eliminar esta toma?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("tomas")
              .delete()
              .eq("id_toma", id_toma);

            if (error) Alert.alert("Error", "No se pudo eliminar.");
            else {
              Alert.alert("Eliminado", "Toma eliminada.");
              fetchTomas();
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Aprobación / Edición de Tomas</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#ffffff" />
      ) : (
        tomas.map((toma) => (
          <View key={toma.id_toma} style={styles.card}>
            <Text style={styles.cardTitle}>
              {toma.n_de_toma} – {toma.nombre_lote}
            </Text>

            <Text style={styles.cardDetail}>
              Inicio: {toma.fecha_creacion || "–"}
            </Text>

            <Text style={styles.cardDetail}>
              Fin: {toma.fecha_fin || "–"}
            </Text>

            <Text style={styles.cardDetail}>
              Estado: {toma.estado || "sin estado"}
            </Text>

            <View style={styles.row}>
              <TouchableOpacity
                style={styles.btnApprove}
                onPress={() => aprobarToma(toma.id_toma)}
              >
                <Text style={styles.btnText}>Aprobar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnEdit}
                onPress={() => Alert.alert("Pendiente", "Función editar viene luego")}
              >
                <Text style={styles.btnText}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnDelete}
                onPress={() => eliminarToma(toma.id_toma)}
              >
                <Text style={styles.btnText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#2f5d2c",
    padding: 16,
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#4a7c59",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  cardTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  cardDetail: {
    color: "#e8f3eb",
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    marginTop: 12,
    justifyContent: "space-between",
  },
  btnApprove: {
    backgroundColor: "#1b8a2f",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  btnEdit: {
    backgroundColor: "#1f78d1",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  btnDelete: {
    backgroundColor: "#b82d2d",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  btnText: {
    color: "#ffffff",
    fontWeight: "700",
  },
});

export default AprobarEditarTomas;
