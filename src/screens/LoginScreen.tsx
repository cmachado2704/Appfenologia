import { loginInspector } from "../services/authService";
import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// 🔥 IMPORTANTE: Definir props correctamente
type Props = {
  onLoginSuccess: () => void;
};

const LoginScreen: React.FC<Props> = ({ onLoginSuccess }) => {

  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#4B752A" }}>
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.innerBox}>
          
          {/* Usuario */}
          <Text style={styles.label}>USUARIO</Text>
          <TextInput
            style={styles.input}
            value={usuario}
            onChangeText={setUsuario}
            placeholder="Escribe tu usuario"
            placeholderTextColor="#d9e6ff"
          />

          {/* Contraseña */}
          <Text style={styles.label}>CONTRASEÑA</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Escribe tu contraseña"
            placeholderTextColor="#d9e6ff"
            secureTextEntry
          />

          {/* Botón ingresar */}
          <TouchableOpacity
            style={styles.btnIngresar}
            onPress={async () => {
              if (!usuario || !password) {
                Alert.alert("Completa usuario y contraseña");
                return;
              }

              const resp = await loginInspector(usuario, password);

              if (!resp.ok) {
                console.log("LOGIN_ERROR:", resp);
                Alert.alert("Hubo un error — revisa la consola");
                return;
              }

              // ⭐ LOGIN EXITOSO
              onLoginSuccess();

              // ACTIVAR NAVEGACIÓN
              onLoginSuccess();
            }}
          >
            <Text style={styles.btnIngresarText}>INGRESAR</Text>
          </TouchableOpacity>

          {/* Pie de página */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>App AgroCheck</Text>
            <Text style={styles.footerText}>V.1.0.0</Text>
            <Text style={styles.footerText}>Propiedad de BPI Consultores</Text>
            <Text style={styles.footerText}>Versión en desarrollo</Text>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 25,
    backgroundColor: "#4B752A"
  },
  innerBox: {
    width: "100%",
  },
  label: {
    color: "white",
    fontSize: 16,
    marginBottom: 5,
    marginTop: 15,
  },
  input: {
    backgroundColor: "#3266C4",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 6,
    color: "white",
    fontSize: 16,
  },
  btnIngresar: {
    backgroundColor: "#3266C4",
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 35,
    alignItems: "center",
  },
  btnIngresarText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  footer: {
    marginTop: 50,
    borderWidth: 1,
    borderColor: "white",
    padding: 15,
    alignItems: "center",
    borderRadius: 8,
  },
  footerText: {
    color: "white",
    fontSize: 14,
    marginVertical: 2,
  },
});

export default LoginScreen;
