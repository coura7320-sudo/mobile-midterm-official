import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'whatsapp_clone_jwt_token';
const USER_KEY = 'whatsapp_clone_user_data';
const THEME_KEY = 'whatsapp_clone_theme_mode';

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  }
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const secureStorage = {
  saveToken: (token: string) => setItem(TOKEN_KEY, token),
  getToken: () => getItem(TOKEN_KEY),
  removeToken: () => deleteItem(TOKEN_KEY),

  saveUser: (userJson: string) => setItem(USER_KEY, userJson),
  getUser: () => getItem(USER_KEY),
  removeUser: () => deleteItem(USER_KEY),

  saveThemeMode: (mode: string) => setItem(THEME_KEY, mode),
  getThemeMode: () => getItem(THEME_KEY),
};
