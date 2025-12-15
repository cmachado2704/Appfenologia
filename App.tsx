// App.tsx (VERSIÓN FINAL CORREGIDA)

import React, { useEffect, useState } from "react";
import LoginScreen from "./src/screens/LoginScreen";
import AppNavigator from "./src/navigation/AppNavigator";

import "./src/utils/polyfills";
import { syncOfflineQueue } from "./src/utils/syncOffline";
import { updateCatalogCache } from "./src/utils/catalogCache";

import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

export default function App() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [isLogged, setIsLogged] = useState(false);

  // ---------------------------------------------------------
  // 🔹 Cargar sesión guardada (permite login offline)
  // ---------------------------------------------------------
  useEffect(() => {
    const loadSession = async () => {
      const saved = await AsyncStorage.getItem("session");
      setIsLogged(!!saved);
      setIsAppReady(true);
    };

    loadSession();
  }, []);

  // ---------------------------------------------------------
  // 🔹 Sincronización offline automática (solo si hay internet)
  // ---------------------------------------------------------
  useEffect(() => {
    const interval = setInterval(async () => {
      const net = await NetInfo.fetch();

      if (net.isConnected && net.isInternetReachable) {
        console.log("🌐 Internet ON → Procesando cola offline…");
        syncOfflineQueue();
      }
    }, 10000); // cada 10 segundos

    return () => clearInterval(interval);
  }, []);

  // ---------------------------------------------------------
  // 🔹 Actualizar catálogos al detectar internet
  // ---------------------------------------------------------
  useEffect(() => {
    const updateIfOnline = async () => {
      const net = await NetInfo.fetch();

      if (net.isConnected && net.isInternetReachable) {
        console.log("📥 Internet detectado → actualizando catálogos…");
        await updateCatalogCache();
      }
    };

    // Ejecuta al inicio
    updateIfOnline();

    // Ejecuta al cambiar el estado de la red
    const unsubscribe = NetInfo.addEventListener(updateIfOnline);

    return () => unsubscribe();
  }, []);

  // ---------------------------------------------------------
  // 🔹 Logout seguro
  // ---------------------------------------------------------
  const handleLogout = async () => {
    await AsyncStorage.removeItem("session");
    setIsLogged(false);
  };

  // ---------------------------------------------------------
  // 🔹 Esperar a que se cargue el estado inicial
  // ---------------------------------------------------------
  if (!isAppReady) return null;

  // ---------------------------------------------------------
  // 🔹 Render principal
  // ---------------------------------------------------------
  return isLogged ? (
    <AppNavigator onLogout={handleLogout} />
  ) : (
    <LoginScreen onLoginSuccess={() => setIsLogged(true)} />
  );
}
