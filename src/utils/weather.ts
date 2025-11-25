const API_KEY = "402aade3cbaa714b97cc75aa94e3a303"; // ← reemplaza por tu API key real

export const getWeather = async (lat: number, lon: number) => {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    const response = await fetch(url);
    const data = await response.json();

    return {
      temperatura_actual_c: data.main?.temp ?? null,
      humedad_relativa_pct: data.main?.humidity ?? null,
      presion_atmosferica_hpa: data.main?.pressure ?? null,
      sensacion_termica_c: data.main?.feels_like ?? null,
      nubosidad_pct: data.clouds?.all ?? null,
      velocidad_del_viento_mps: data.wind?.speed ?? null,
      direccion_del_viento: data.wind?.deg ?? null,
      radiacion_solar_uv: null, // OpenWeather no da UV en este endpoint
      fecha_y_hora: new Date().toISOString(),
      fuente_de_datos: "OpenWeather",
    };
  } catch (e) {
    console.error("Error leyendo clima:", e);
    return null;
  }
};
