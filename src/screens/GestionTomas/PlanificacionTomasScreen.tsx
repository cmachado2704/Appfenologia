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

/* ============================================================
   TIPOS
============================================================ */
type ConteoTipos = Record<string, number>;

interface Toma {
  n_de_toma: string;
  nombre_lote: string;
  fecha_creacion: string;
  fecha_fin: string;
  muestra_sugerida: number;
  tipo_toma: string | null;
}

/* ============================================================
   UTILIDADES
============================================================ */
const getISOWeek = (date: Date) => {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

const formatDate = (fecha: string | null) => {
  if (!fecha) return "";
  const d = new Date(fecha);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}/${d.getFullYear()}`;
};

const calcularEstado = (fi: Date, ff: Date, ejecutado: number, plan: number) => {
  const hoy = new Date();
  if (plan > 0 && ejecutado >= plan) return "completada";
  if (hoy >= fi && hoy <= ff) return "en_proceso";
  if (hoy > ff && ejecutado > 0) return "retrasada";
  if (hoy > ff && ejecutado === 0) return "vencida";
  return "creada";
};

const estadoColor = (estado: string) => {
  switch (estado) {
    case "completada": return "#2e7d32";
    case "en_proceso": return "#fdd835";
    case "retrasada": return "#fb8c00";
    case "vencida": return "#d32f2f";
    default: return "#9e9e9e";
  }
};

/* ============================================================
   COMPONENTE PRINCIPAL
============================================================ */
const PlanificacionTomasScreen = () => {
  const [loading, setLoading] = useState(false);

  /* DETALLADA */
  const [week, setWeek] = useState(getISOWeek(new Date()));

  /* CONSOLIDADA */
  const [vista, setVista] = useState<"detallada" | "consolidada">("detallada");
  const [modoConsolidado, setModoConsolidado] = useState<"mensual" | "anual">("mensual");

  const [mes, setMes] = useState(new Date().getMonth() + 1); // 1–12
  const [ano, setAno] = useState(new Date().getFullYear());

  const [tomas, setTomas] = useState<any[]>([]);

  /* ============================================================
     CARGA DE TOMAS
  ============================================================ */
  useEffect(() => {
    cargarTomas();
  }, []);

  const cargarTomas = async () => {
    try {
      setLoading(true);

      const { data: tomasData } = await supabase.from("tomas").select("*");

      const { data: fenData } = await supabase.from("tomas_fenologicas").select("n_de_toma");
      const { data: calData } = await supabase.from("calibracion_frutos").select("n_de_toma");
      const { data: conData } = await supabase.from("conteo_frutos_caidos").select("n_de_toma");

      const ejecutFen: ConteoTipos = {};
      const ejecutCal: ConteoTipos = {};
      const ejecutCon: ConteoTipos = {};

      fenData?.forEach((f) => (ejecutFen[f.n_de_toma] = (ejecutFen[f.n_de_toma] || 0) + 1));
      calData?.forEach((f) => (ejecutCal[f.n_de_toma] = (ejecutCal[f.n_de_toma] || 0) + 1));
      conData?.forEach((f) => (ejecutCon[f.n_de_toma] = (ejecutCon[f.n_de_toma] || 0) + 1));

      const enriquecidas = tomasData?.map((t: any) => {
        const fi = new Date(t.fecha_creacion);
        const ff = new Date(t.fecha_fin);
        const plan = Number(t.muestra_sugerida || 0);

        let ejecutado = 0;
        const tipo = t.tipo_toma || "sin_tipo";

        if (tipo === "fenologica") ejecutado = ejecutFen[t.n_de_toma] || 0;
        else if (tipo === "conteo") ejecutado = ejecutCon[t.n_de_toma] || 0;
        else if (tipo === "calibracion") ejecutado = ejecutCal[t.n_de_toma] || 0;
        else if (tipo === "generica")
          ejecutado =
            (ejecutFen[t.n_de_toma] || 0) +
            (ejecutCal[t.n_de_toma] || 0) +
            (ejecutCon[t.n_de_toma] || 0);

        const cumplimiento = plan > 0 ? Math.round((ejecutado / plan) * 100) : 0;
        const estado = calcularEstado(fi, ff, ejecutado, plan);

        return { ...t, plan, ejecutado, cumplimiento, estado };
      });

      setTomas(enriquecidas || []);
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     RESUMEN MENSUAL
============================================================ */
  const resumenMensual = (() => {
    const delMes = tomas.filter((t) => {
      const f = new Date(t.fecha_creacion);
      return f.getFullYear() === ano && f.getMonth() + 1 === mes;
    });

    const total = delMes.length;
    const plan = delMes.reduce((acc, t) => acc + t.plan, 0);
    const ejecutado = delMes.reduce((acc, t) => acc + t.ejecutado, 0);

    const tipos: ConteoTipos = {};
    delMes.forEach((t) => {
      const key = t.tipo_toma || "sin_tipo";
      tipos[key] = (tipos[key] || 0) + 1;
    });

    return { total, plan, ejecutado, tipos };
  })();

  /* ============================================================
     RESUMEN ANUAL
============================================================ */
  const resumenAnual = (() => {
    const delAno = tomas.filter((t) => {
      const f = new Date(t.fecha_creacion);
      return f.getFullYear() === ano;
    });

    const total = delAno.length;
    const plan = delAno.reduce((acc, t) => acc + t.plan, 0);
    const ejecutado = delAno.reduce((acc, t) => acc + t.ejecutado, 0);

    const tipos: ConteoTipos = {};
    delAno.forEach((t) => {
      const key = t.tipo_toma || "sin_tipo";
      tipos[key] = (tipos[key] || 0) + 1;
    });

    return { total, plan, ejecutado, tipos };
  })();

  /* ============================================================
     SEMANAS DEL MES (opción B: solo si fecha_creación es del mes)
============================================================ */
  const semanasDelMes = (() => {
    const mapa: Record<number, number> = {};

    tomas.forEach((t) => {
      const f = new Date(t.fecha_creacion);
      if (f.getFullYear() === ano && f.getMonth() + 1 === mes) {
        const w = getISOWeek(f);
        mapa[w] = (mapa[w] || 0) + 1;
      }
    });

    return Object.keys(mapa).map((wk) => ({
      semana: Number(wk),
      cantidad: mapa[Number(wk)],
    }));
  })();

  /* ============================================================
     MESES DEL AÑO (conteo simple)
============================================================ */
  const mesesDelAno = (() => {
    const mapa: Record<number, number> = {};

    tomas.forEach((t) => {
      const f = new Date(t.fecha_creacion);
      if (f.getFullYear() === ano) {
        const m = f.getMonth() + 1;
        mapa[m] = (mapa[m] || 0) + 1;
      }
    });

    return Object.keys(mapa).map((m) => ({
      mes: Number(m),
      cantidad: mapa[Number(m)],
    }));
  })();

  /* ============================================================
     TARJETA DETALLADA (igual que antes)
============================================================ */
  const TarjetaDetalle = ({ t }: any) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t.n_de_toma} — {t.nombre_lote}</Text>

      <Text style={styles.cardSubtitle}>
        Tipo: {(t.tipo_toma || "SIN_TIPO").toUpperCase()}
      </Text>

      <Text style={styles.cardText}>
        {formatDate(t.fecha_creacion)} → {formatDate(t.fecha_fin)}
      </Text>

      <Text style={styles.cardText}>Plan: {t.plan}</Text>
      <Text style={styles.cardText}>Ejecutado: {t.ejecutado}</Text>

      <View style={styles.progressBackground}>
        <View style={[styles.progressBar, { width: `${t.cumplimiento}%` }]} />
      </View>

      <Text style={styles.cardText}>Cumplimiento: {t.cumplimiento}%</Text>

      <View style={[styles.badge, { backgroundColor: estadoColor(t.estado) }]}>
        <Text style={styles.badgeText}>{t.estado.toUpperCase()}</Text>
      </View>
    </View>
  );

  /* ============================================================
     RENDER PRINCIPAL
============================================================ */
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Plan y cumplimiento de tomas</Text>

      {/* TOGGLE DETALLADA / CONSOLIDADA */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleBtn, vista === "detallada" && styles.toggleActive]}
          onPress={() => setVista("detallada")}
        >
          <Text style={styles.toggleText}>Detallada</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleBtn, vista === "consolidada" && styles.toggleActive]}
          onPress={() => setVista("consolidada")}
        >
          <Text style={styles.toggleText}>Consolidada</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#fff" />
      ) : vista === "detallada" ? (
        /* ============================================================
           VISTA DETALLADA — POR SEMANAS (no cambia)
        ============================================================ */
        <>
          <View style={styles.weekSelector}>
            <TouchableOpacity onPress={() => setWeek(week - 1)}>
              <Text style={styles.weekArrow}>{"<"}</Text>
            </TouchableOpacity>

            <Text style={styles.weekLabel}>Semana {week}</Text>

            <TouchableOpacity onPress={() => setWeek(week + 1)}>
              <Text style={styles.weekArrow}>{">"}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ marginTop: 10 }}>
            {tomas
              .filter((t) => getISOWeek(new Date(t.fecha_creacion)) === week)
              .map((t) => (
                <TarjetaDetalle key={t.n_de_toma} t={t} />
              ))}
          </ScrollView>
        </>
      ) : (
        /* ============================================================
           VISTA CONSOLIDADA — MENSUAL / ANUAL
        ============================================================ */
        <ScrollView style={{ marginTop: 10 }}>
          {/* SUB-TOGGLE */}
          <View style={styles.subToggleContainer}>
            <TouchableOpacity
              style={[styles.subToggleBtn, modoConsolidado === "mensual" && styles.subToggleActive]}
              onPress={() => setModoConsolidado("mensual")}
            >
              <Text style={styles.subToggleText}>Mensual</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.subToggleBtn, modoConsolidado === "anual" && styles.subToggleActive]}
              onPress={() => setModoConsolidado("anual")}
            >
              <Text style={styles.subToggleText}>Anual</Text>
            </TouchableOpacity>
          </View>

          {/* ============================================================
             CONSOLIDADO MENSUAL
          ============================================================ */}
          {modoConsolidado === "mensual" && (
            <>
              {/* Selector mes */}
              <View style={styles.monthSelector}>
                <TouchableOpacity
                  onPress={() => {
                    if (mes === 1) {
                      setMes(12);
                      setAno(ano - 1);
                    } else setMes(mes - 1);
                  }}
                >
                  <Text style={styles.weekArrow}>{"<"}</Text>
                </TouchableOpacity>

                <Text style={styles.weekLabel}>
                  {new Date(ano, mes - 1).toLocaleString("es-ES", {
                    month: "long",
                    year: "numeric",
                  })}
                </Text>

                <TouchableOpacity
                  onPress={() => {
                    if (mes === 12) {
                      setMes(1);
                      setAno(ano + 1);
                    } else setMes(mes + 1);
                  }}
                >
                  <Text style={styles.weekArrow}>{">"}</Text>
                </TouchableOpacity>
              </View>

              {/* RESUMEN MENSUAL */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Resumen mensual</Text>
                <Text style={styles.cardText}>Tomas creadas: {resumenMensual.total}</Text>
                <Text style={styles.cardText}>Plan total: {resumenMensual.plan}</Text>
                <Text style={styles.cardText}>Ejecutado total: {resumenMensual.ejecutado}</Text>

                <View style={styles.progressBackground}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${
                          resumenMensual.plan > 0
                            ? Math.round((resumenMensual.ejecutado / resumenMensual.plan) * 100)
                            : 0
                        }%`,
                      },
                    ]}
                  />
                </View>

                <Text style={styles.cardText}>Tipos de toma</Text>
                {Object.entries(resumenMensual.tipos).map(([tipo, cant]) => (
                  <Text key={tipo} style={styles.cardText}>
                    {tipo}: {cant}
                  </Text>
                ))}
              </View>

              {/* SEMANAS DEL MES */}
              <Text style={styles.sectionTitle}>Semanas del mes</Text>

              {semanasDelMes.map((w) => (
                <View key={w.semana} style={{ marginBottom: 12 }}>
                  <Text style={styles.weekText}>Semana {w.semana}</Text>

                  <View style={styles.progressBackground}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${(w.cantidad / resumenMensual.total) * 100}%` },
                      ]}
                    />
                  </View>

                  <Text style={styles.cardText}>{w.cantidad} tomas</Text>
                </View>
              ))}
            </>
          )}

          {/* ============================================================
             CONSOLIDADO ANUAL
          ============================================================ */}
          {modoConsolidado === "anual" && (
            <>
              {/* Selector año */}
              <View style={styles.monthSelector}>
                <TouchableOpacity onPress={() => setAno(ano - 1)}>
                  <Text style={styles.weekArrow}>{"<"}</Text>
                </TouchableOpacity>

                <Text style={styles.weekLabel}>{ano}</Text>

                <TouchableOpacity onPress={() => setAno(ano + 1)}>
                  <Text style={styles.weekArrow}>{">"}</Text>
                </TouchableOpacity>
              </View>

              {/* RESUMEN ANUAL */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Resumen anual</Text>
                <Text style={styles.cardText}>Tomas creadas: {resumenAnual.total}</Text>
                <Text style={styles.cardText}>Plan total: {resumenAnual.plan}</Text>
                <Text style={styles.cardText}>Ejecutado total: {resumenAnual.ejecutado}</Text>

                <View style={styles.progressBackground}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${
                          resumenAnual.plan > 0
                            ? Math.round((resumenAnual.ejecutado / resumenAnual.plan) * 100)
                            : 0
                        }%`,
                      },
                    ]}
                  />
                </View>

                <Text style={styles.cardText}>Tipos de toma</Text>
                {Object.entries(resumenAnual.tipos).map(([tipo, cant]) => (
                  <Text key={tipo} style={styles.cardText}>
                    {tipo}: {cant}
                  </Text>
                ))}
              </View>

              {/* MESES DEL AÑO */}
              <Text style={styles.sectionTitle}>Meses del año</Text>

              {mesesDelAno.map((m) => (
                <View key={m.mes} style={{ marginBottom: 12 }}>
                  <Text style={styles.weekText}>
                    {new Date(ano, m.mes - 1).toLocaleString("es-ES", { month: "long" })}
                  </Text>

                  <View style={styles.progressBackground}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${(m.cantidad / resumenAnual.total) * 100}%` },
                      ]}
                    />
                  </View>

                  <Text style={styles.cardText}>{m.cantidad} tomas</Text>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default PlanificacionTomasScreen;

/* ============================================================
   ESTILOS
============================================================ */
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
    marginBottom: 10,
  },

  toggleContainer: {
    flexDirection: "row",
  },
  toggleBtn: {
    flex: 1,
    backgroundColor: "#466b52",
    paddingVertical: 10,
    margin: 5,
    borderRadius: 8,
    alignItems: "center",
  },
  toggleActive: {
    backgroundColor: "#63a46c",
  },
  toggleText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  subToggleContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },
  subToggleBtn: {
    flex: 1,
    backgroundColor: "#466b52",
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: "center",
  },
  subToggleActive: {
    backgroundColor: "#63a46c",
  },
  subToggleText: {
    color: "#fff",
    fontWeight: "700",
  },

  weekSelector: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
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

  monthSelector: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
    alignItems: "center",
  },

  /* TARJETAS */
  card: {
    backgroundColor: "#e8f3eb",
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  cardTitle: {
    color: "#234d20",
    fontSize: 16,
    fontWeight: "800",
  },
  cardSubtitle: {
    color: "#234d20",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  cardText: {
    color: "#34204dff",
    marginTop: 4,
    fontSize: 13,
  },

  progressBackground: {
    height: 8,
    backgroundColor: "#cfd8dc",
    borderRadius: 6,
    marginTop: 8,
    overflow: "hidden",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#4caf50",
  },

  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginVertical: 10,
    textAlign: "center",
  },

  weekText: {
    color: "#fff",
    fontWeight: "700",
    marginBottom: 4,
  },

  badge: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
});
