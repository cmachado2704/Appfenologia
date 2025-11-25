import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../../services/supabaseClient";
import { useNavigation } from "@react-navigation/native";

// Calcular semana ISO
const getISOWeek = (date: Date) => {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

// Formato bonito: DD/MM/YYYY
const formatDate = (fecha: string) => {
  if (!fecha) return "";
  const d = new Date(fecha);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const PlanificacionTomasScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [tomas, setTomas] = useState<any[]>([]);
  const [week, setWeek] = useState<number>(getISOWeek(new Date()));

  useEffect(() => {
    cargarTomas();
  }, [week]);

  const cargarTomas = async () => {
    try {
      setLoading(true);

      const { data: tomasData, error: errorTomas } = await supabase
        .from("tomas")
        .select("*");

      if (errorTomas) throw errorTomas;

      const { data: fenData, error: errorFen } = await supabase
        .from("tomas_fenologicas")
        .select("n_de_toma");

      if (errorFen) throw errorFen;

      // Ejecutado por toma
      const ejecutados: Record<string, number> = {};
      fenData?.forEach((f) => {
        ejecutados[f.n_de_toma] = (ejecutados[f.n_de_toma] || 0) + 1;
      });

      // Filtrar por semana ISO
      const filtradas = tomasData?.filter((t) => {
        const fi = new Date(t.fecha_creacion);
        const ff = new Date(t.fecha_fin);
        const w1 = getISOWeek(fi);
        const w2 = getISOWeek(ff);
        return w1 === week || w2 === week;
      });

      // Enriquecer y ordenar
      const completas = filtradas
        ?.map((t) => {
          const plan = Number(t.muestra_sugerida || 0);
          const ejec = ejecutados[t.n_de_toma] || 0;
          const cumplimiento = plan > 0 ? Math.round((ejec / plan) * 100) : 0;

          const hoy = new Date();
          const fi = new Date(t.fecha_creacion);
          const ff = new Date(t.fecha_fin);

          let estado = "creada";
          if (cumplimiento === 100) estado = "completada";
          else if (hoy >= fi && hoy <= ff) estado = "en_proceso";
          else if (hoy > ff && ejec > 0) estado = "retrasada";
          else if (hoy > ff && ejec === 0) estado = "vencida";

          return {
            ...t,
            plan,
            ejec,
            cumplimiento,
            estado,
          };
        })
        .sort(
          (a, b) =>
            new Date(a.fecha_creacion).getTime() -
            new Date(b.fecha_creacion).getTime()
        );

      setTomas(completas || []);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const cambiarSemana = (delta: number) => setWeek(week + delta);

  const colorEstado = (estado: string) => {
    switch (estado) {
      case "completada":
        return "#2e7d32";
      case "en_proceso":
        return "#fdd835";
      case "retrasada":
        return "#fb8c00";
      case "vencida":
        return "#d32f2f";
      default:
        return "#9e9e9e";
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Planificación de Tomas</Text>

      {/* SELECTOR DE SEMANA */}
      <View style={styles.weekSelector}>
        <TouchableOpacity onPress={() => cambiarSemana(-1)}>
          <Text style={styles.weekArrow}>{"<"}</Text>
        </TouchableOpacity>

        <Text style={styles.weekLabel}>Semana {week}</Text>

        <TouchableOpacity onPress={() => cambiarSemana(1)}>
          <Text style={styles.weekArrow}>{">"}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#ffffff" />
      ) : (
        <ScrollView style={{ marginTop: 10 }}>
          {tomas.length === 0 && (
            <Text style={{ color: "#fff", textAlign: "center", marginTop: 20 }}>
              No hay tomas planificadas para esta semana.
            </Text>
          )}

          {tomas.map((t) => (
            <View key={t.n_de_toma} style={styles.card}>
              <Text style={styles.cardTitle}>
                {t.n_de_toma} — {t.nombre_lote}
              </Text>

              <Text style={styles.cardText}>
                {formatDate(t.fecha_creacion)} → {formatDate(t.fecha_fin)}
              </Text>

              <Text style={styles.cardText}>
                Planificado: {t.plan}   •   Ejecutado: {t.ejec}
              </Text>

              <View style={styles.progressBackground}>
                <View
                  style={[styles.progressBar, { width: `${t.cumplimiento}%` }]}
                />
              </View>

              <Text style={styles.cardText}>
                Cumplimiento: {t.cumplimiento}%
              </Text>

              <View
                style={[styles.badge, { backgroundColor: colorEstado(t.estado) }]}
              >
                <Text style={styles.badgeText}>{t.estado.toUpperCase()}</Text>
              </View>

              <TouchableOpacity
                style={styles.detailButton}
                onPress={() =>
                  navigation.navigate("AprobarEditarTomas" as any, {
                    codigo: t.n_de_toma,
                  })
                }
              >
                <Text style={styles.detailText}>Ver detalle →</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default PlanificacionTomasScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2f5d2c",
    padding: 15,
    paddingTop: 50,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  weekSelector: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },
  weekArrow: {
    color: "#fff",
    fontSize: 28,
    marginHorizontal: 25,
  },
  weekLabel: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#e8f3eb",
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
    elevation: 2,
  },
  cardTitle: {
    color: "#234d20",
    fontSize: 18,
    fontWeight: "800",
  },
  cardText: {
    color: "#234d20",
    marginTop: 6,
    fontSize: 14,
  },
  progressBackground: {
    height: 10,
    backgroundColor: "#cfd8dc",
    borderRadius: 6,
    marginTop: 10,
    overflow: "hidden",
  },
  progressBar: {
    height: 10,
    backgroundColor: "#4caf50",
  },
  badge: {
    alignSelf: "flex-start",
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "700",
  },
  detailButton: {
    marginTop: 14,
  },
  detailText: {
    color: "#1b5e20",
    fontWeight: "700",
    fontSize: 15,
  },
});
