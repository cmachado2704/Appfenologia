import Geolocation from "react-native-geolocation-service";
import { PermissionsAndroid, Platform } from "react-native";

export type GPSResult = {
  lat: number | null;
  lon: number | null;
};

export const getCurrentPosition = async (): Promise<GPSResult> => {
  try {
    if (Platform.OS === "android") {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
      );
 
    }

    return await new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
        },
        (err) => {
          console.warn("GPS ERROR:", err);
          resolve({ lat: null, lon: null });
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
          forceRequestLocation: true,
          showLocationDialog: true,
        }
      );
    });
  } catch (e) {
    console.warn("GPS unexpected error:", e);
    return { lat: null, lon: null };
  }
};
