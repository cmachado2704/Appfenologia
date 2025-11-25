import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "offline_tomas_queue";

export const addToOfflineQueue = async (registro: any) => {
  const existing = await AsyncStorage.getItem(KEY);
  const queue = existing ? JSON.parse(existing) : [];
  queue.push(registro);
  await AsyncStorage.setItem(KEY, JSON.stringify(queue));
};

export const getOfflineQueue = async () => {
  const existing = await AsyncStorage.getItem(KEY);
  return existing ? JSON.parse(existing) : [];
};

export const clearOfflineQueue = async () => {
  await AsyncStorage.removeItem(KEY);
};
