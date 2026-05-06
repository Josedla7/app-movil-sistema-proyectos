import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View, TouchableOpacity } from 'react-native';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, Briefcase, Users, UserCog, FolderHeart, LogOut, Clock } from 'lucide-react-native';

import LoginScreen from '../screens/auth/LoginScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import PortalClienteScreen from '../screens/proyectos/PortalClienteScreen';
import ProyectosScreen from '../screens/proyectos/ProyectosScreen';
import ClientesScreen from '../screens/clientes/ClientesScreen';
import UsuariosScreen from '../screens/usuarios/UsuariosScreen';
import TareasScreen from '../screens/proyectos/TareasScreen';
import AdminHistoryScreen from '../screens/history/AdminHistoryScreen';
import ClientHistoryScreen from '../screens/history/ClientHistoryScreen';
import EmployeeHistoryScreen from '../screens/history/EmployeeHistoryScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AppTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0f172a',
    card: '#1e293b',
    text: '#ffffff',
    primary: '#3b82f6',
  },
};

const MainTabs = () => {
  const { user, logout } = useAuth();
  const rol = user?.rol?.nombre;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: '#1e293b' },
        headerTintColor: '#fff',
        headerRight: () => (
          <TouchableOpacity 
            onPress={logout} 
            style={{ marginRight: 16, padding: 8, backgroundColor: '#ef444420', borderRadius: 8 }}
          >
            <LogOut color="#ef4444" size={20} />
          </TouchableOpacity>
        ),
        tabBarStyle: { backgroundColor: '#1e293b', borderTopColor: '#334155', height: 60, paddingBottom: 8 },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Dashboard') return <LayoutDashboard color={color} size={size} />;
          if (route.name === 'Proyectos') return <Briefcase color={color} size={size} />;
          if (route.name === 'Clientes') return <Users color={color} size={size} />;
          if (route.name === 'Usuarios') return <UserCog color={color} size={size} />;
          if (route.name === 'Mis Proyectos') return <FolderHeart color={color} size={size} />;
          if (route.name === 'Historial') return <Clock color={color} size={size} />;
          return null;
        },
      })}
    >
      {rol !== 'CLIENTE' && (
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
      )}
      
      {rol !== 'CLIENTE' && (
        <Tab.Screen name="Proyectos" component={ProyectosScreen} />
      )}

      {rol === 'ADMIN' && (
        <Tab.Screen name="Clientes" component={ClientesScreen} />
      )}

      {rol === 'ADMIN' && (
        <Tab.Screen name="Usuarios" component={UsuariosScreen} />
      )}

      {rol === 'ADMIN' && (
        <Tab.Screen name="Historial" component={AdminHistoryScreen} />
      )}

      {rol === 'CLIENTE' && (
        <Tab.Screen name="Mis Proyectos" component={PortalClienteScreen} />
      )}

      {rol === 'CLIENTE' && (
        <Tab.Screen name="Historial" component={ClientHistoryScreen} />
      )}

      {rol !== 'ADMIN' && rol !== 'CLIENTE' && (
        <Tab.Screen name="Historial" component={EmployeeHistoryScreen} />
      )}
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={AppTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen 
              name="Tareas" 
              component={TareasScreen}
              options={{
                headerShown: true,
                headerStyle: { backgroundColor: '#0f172a' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
