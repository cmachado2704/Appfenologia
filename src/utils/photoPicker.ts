import {launchCamera} from "react-native-image-picker";

export const tomarFoto = async (): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    launchCamera(
      {
        mediaType: "photo",
        cameraType: "back",
        quality: 0.8,
        saveToPhotos: false,
      },
      (response) => {
        if (response.didCancel) {
          resolve(null);
        } else if (response.errorCode) {
          reject(response.errorMessage);
        } else {
          const uri = response.assets?.[0]?.uri ?? null;
          resolve(uri);
        }
      }
    );
  });
};
