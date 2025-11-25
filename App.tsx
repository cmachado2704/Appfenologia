import React, { useState } from "react";
import LoginScreen from "./src/screens/LoginScreen";
import AppNavigator from "./src/navigation/AppNavigator";
import "./src/utils/polyfills";
import { syncOfflineQueue } from "./src/utils/syncOffline";
// 🔥 Tipo para las props de AppNavigator
type AppNavigatorProps = {
  onLogout: () => void;
};

export default function App() {
  const [isLogged, setIsLogged] = useState(false);

  const handleLogout = () => {
    setIsLogged(false);
  };
// ⬇️  ESTE USEEFFECT VA AQUÍ EXACTAMENTE  ⬇️
  React.useEffect(() => {
    // Intento inmediato
    syncOfflineQueue();

    // Intento recurrente cada 10 segundos
    const interval = setInterval(() => {
      syncOfflineQueue();
    }, 10000);

    return () => clearInterval(interval);
  }, []);
  // ⬆️  ESTE USEEFFECT VA AQUÍ EXACTAMENTE  ⬆️

  return (
    isLogged ? (
      <AppNavigator onLogout={handleLogout} />
    ) : (
      <LoginScreen onLoginSuccess={() => setIsLogged(true)} />
    )
  );
}
