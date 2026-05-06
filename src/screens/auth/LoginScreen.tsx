import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import * as SecureStore from 'expo-secure-store';
import api from '../../api/api.config';
import { Lock, Mail } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

export default function LoginScreen() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [loadingLocal, setLoadingLocal] = useState(false);
  const { checkAuth } = useAuth();

  const handleLogin = async () => {
    if (!correo || !contrasena) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Por favor ingresa correo y contraseña',
        position: 'top'
      });
      return;
    }

    setLoadingLocal(true);
    console.log('Intentando login en:', api.defaults.baseURL + '/auth/login');
    console.log('Datos enviados:', { correo, contrasena: '********' });

    try {
      const resp = await api.post('/auth/login', { correo, contrasena });
      console.log('Cuerpo de respuesta:', JSON.stringify(resp.data));

      const loginData = resp.data.data || resp.data;

      if (!loginData.accessToken) {
        throw new Error('No se recibió el token de acceso');
      }

      console.log('Login exitoso:', resp.status);
      await SecureStore.setItemAsync('accessToken', String(loginData.accessToken));
      await SecureStore.setItemAsync('refreshToken', String(loginData.refreshToken || ''));
      await checkAuth();
    } catch (error: any) {
      console.error('Error en Login:', error.message);
      if (error.response) {
        console.error('Respuesta del servidor (Error):', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('No se recibió respuesta del servidor. Verifica tu conexión a internet.');
      }
    } finally {
      setLoadingLocal(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>TechSolutions S.A.</Text>
          <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Mail color="#94a3b8" size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              placeholderTextColor="#64748b"
              value={correo}
              onChangeText={setCorreo}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock color="#94a3b8" size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor="#64748b"
              value={contrasena}
              onChangeText={setContrasena}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loadingLocal}
          >
            {loadingLocal ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3b82f6',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
