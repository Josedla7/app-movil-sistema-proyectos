import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';

const API_URL = 'https://gestion-proyectos-5oai.onrender.com/api';
// const API_URL = 'http://192.168.0.4:3000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    let errorMessage = 'Ocurrió un error inesperado';
    if (error.response) {
      if (error.response.status === 401) {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        errorMessage = 'Tu sesión ha expirado';
      } else {
        errorMessage = error.response.data?.message || error.response.data?.error || `Error ${error.response.status}`;
      }
    } else if (error.request) {
      errorMessage = 'No se pudo conectar con el servidor';
    }

    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: errorMessage,
      position: 'bottom'
    });

    return Promise.reject(error);
  }
);

export default api;
