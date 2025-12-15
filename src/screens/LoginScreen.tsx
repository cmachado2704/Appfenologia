import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

import { supabase } from "../services/supabaseClient";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { updateCatalogCache } from "../utils/catalogCache";

type Props = { onLoginSuccess: () => void };

const LoginScreen = ({ onLoginSuccess }: Props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // AUTOLOGIN
  useEffect(() => {
    const checkSession = async () => {
      const saved = await AsyncStorage.getItem("session");
      if (saved) onLoginSuccess();
    };
    checkSession();
  }, []);

  const handleLogin = async () => {
    if (!email || !password)
      return Alert.alert("Error", "Ingresa correo y contraseña.");

    setLoading(true);

    const net = await NetInfo.fetch();
    const isOnline = net.isConnected && net.isInternetReachable;

    // LOGIN OFFLINE
    if (!isOnline) {
      const saved = await AsyncStorage.getItem("session");
      setLoading(false);
      if (saved) return onLoginSuccess();

      return Alert.alert(
        "Sin conexión",
        "Necesitas internet para iniciar sesión por primera vez."
      );
    }

    // LOGIN ONLINE
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setLoading(false);
      return Alert.alert("Error", error.message);
    }

    await AsyncStorage.setItem("session", JSON.stringify(data.session));

    try {
      await updateCatalogCache();
    } catch {}

    setLoading(false);
    onLoginSuccess();
  };

  return (
    <ImageBackground
      source={require("../assets/bg.jpg")} // <-- SOLO UNA IMAGEN DE FONDO
      style={styles.bg}
      resizeMode="cover"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.inner}
        >
          {/* FORMULARIO */}
          <View style={styles.formContainer}>
            <TextInput
              placeholder="Correo"
              placeholderTextColor="#ccc"
              style={styles.input}
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <TextInput
              placeholder="Contraseña"
              placeholderTextColor="#ccc"
              secureTextEntry
              style={styles.input}
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              style={styles.btn}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.btnText}>Ingresar</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* FOOTER / DISCLAIMER */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Propiedad de BPI Consultores</Text>
            <Text style={styles.footerText}>Versión 0.0.0.4</Text>
            <Text style={styles.footerText}>App en desarrollo</Text>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </ImageBackground>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 25,
  },
  formContainer: {
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 12,
    padding: 20,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.25)",
    color: "#fff",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  btn: {
    backgroundColor: "#1e7f38",
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  footer: {
    marginTop: 40,
    alignItems: "center",
  },
  footerText: {
    color: "#ffffff",
    fontSize: 14,
    opacity: 0.9,
  },
});
