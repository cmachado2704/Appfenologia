import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { CatalogCache } from "../../utils/catalogCache";
import { getOfflineQueue } from "../../utils/offlineQueue";

const DatosCampoMenuScreen = ({ navigation }: any) => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [catalogosListos, setCatalogosListos] = useState(false);
  const [checkingCatalogs, setCheckingCatalogs] = useState(true);

  // 🔥 Cola offline
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  // ------------------------------------------------------------
  // 1. Detectar conexión
  // ------------------------------------------------------------
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected && state.isInternetReachable;
      setIsOnline(online ?? false);
    });
    return () => unsubscribe();
  }, []);

  // ------------------------------------------------------------
  // 2. Verificar catálogos
useEffect(() => {
  const checkCatalogs = async () => {
    setCheckingCatalogs(true);

    const zonas = await CatalogCache.loadZonas();
    const ori = await CatalogCache.loadOrientaciones();
    const tipos = await CatalogCache.loadTiposEstado();
    const tomas = await CatalogCache.loadTomas();
    const clasif = await CatalogCache.loadClasificacionTamano(); // ⭐ FALTABA

    const ready =
      zonas.length > 0 &&
      ori.length > 0 &&
      tipos.length > 0 &&
      clasif.length > 0; // ⭐ AHORA SE VALIDA TAMBIÉN

    setCatalogosListos(ready);
    setCheckingCatalogs(false);
  };

  checkCatalogs();
}, []);

  // ------------------------------------------------------------
  // 3. Contar registros offline
  // ------------------------------------------------------------
  useEffect(() => {
    const interval = setInterval(async () => {
      const q = await getOfflineQueue();
      setPendingCount(q.length);

      if (q.length > 0 && isOnline) {
        setSyncing(true);
      } else {
        setSyncing(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isOnline]);

  // ------------------------------------------------------------
  // Manejar botones
  // ------------------------------------------------------------
  const handleInsertarRegistro = () => {
    if (!isOnline && !catalogosListos) {
      return Alert.alert(
        "Sin catálogos",
        "No tienes catálogos descargados para trabajar sin conexión. Conéctate a internet una vez para habilitar el modo offline."
      );
    }
    navigation.navigate("InsertarRegistroTomaScreen");
  };

  const handleInsertarCalibracion = () => {
    if (!isOnline && !catalogosListos) {
      return Alert.alert(
        "Sin catálogos",
        "No tienes catálogos descargados para trabajar sin conexión."
      );
    }
    navigation.navigate("InsertarCalibracionFrutosScreen");
  };

  // ------------------------------------------------------------
  // Render principal
  // ------------------------------------------------------------
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Datos de Campo</Text>

      {/* BOTÓN: Insertar Registro Fenológico */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleInsertarRegistro}
        disabled={checkingCatalogs}
      >
        {checkingCatalogs ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Registro fenologico</Text>
        )}
      </TouchableOpacity>

      {/* BOTÓN NUEVO: Insertar Calibración */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleInsertarCalibracion}
      >
        <Text style={styles.buttonText}>Calibración de Frutos</Text>
      </TouchableOpacity>

    <TouchableOpacity
  style={styles.button}
  onPress={() => navigation.navigate("InsertarConteoFrutosCaidosScreen")}
>
  <Text style={styles.buttonText}>Conteo de Frutos Caídos</Text>
</TouchableOpacity>

      {/* Estado de conexión y catálogos */}
      <View style={styles.statusBox}>
        <Text style={styles.statusText}>
          Conexión: {isOnline ? "🟢 Online" : "🔴 Offline"}
        </Text>

        <Text style={styles.statusText}>
          Catálogos: {catalogosListos ? "🟢 Listos" : "🔴 No descargados"}
        </Text>
      </View>

      {/* Banner Offline */}
      <View style={styles.banner}>
        {pendingCount > 0 ? (
          <Text style={styles.bannerText}>
            {isOnline
              ? `🟡 Sincronizando… ${pendingCount} registros pendientes`
              : `🟠 Offline – ${pendingCount} registros guardados en el dispositivo`}
          </Text>
        ) : (
          <Text style={styles.bannerText}>
            {isOnline
              ? "🟢 Sin registros pendientes"
              : "🟠 Offline – sin registros nuevos"}
          </Text>
        )}
      </View>
    </View>
  );
};

export default DatosCampoMenuScreen;

// ------------------------------------------------------------
// ESTILOS
// ------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1B4D3E",
    padding: 16,
  },
  header: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "700",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#336B50",
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  statusBox: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#2F5C47",
    borderRadius: 8,
  },
  statusText: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 4,
  },
  banner: {
    marginTop: 20,
    padding: 14,
    backgroundColor: "#244f3c",
    borderRadius: 8,
  },
  bannerText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
});
