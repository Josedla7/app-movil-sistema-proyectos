import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api.config';
import { Users, Shield, Briefcase, LayoutDashboard, Activity, Clock, CheckCircle2, User as UserIcon, AlertCircle } from 'lucide-react-native';

export default function DashboardScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchStats = async () => {
    try {
      setError(false);
      const res = await api.get('/dashboard/stats');
      const data = res.data.data || res.data;
      const finalStats = data.stats || (data.totalUsuarios !== undefined ? data : null);

      if (finalStats) {
        setStats(finalStats);
      } else {
        setError(true);
      }
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Cargando tu panel...</Text>
      </View>
    );
  }

  if (error || !stats) {
    return (
      <View style={styles.centerContainer}>
        <AlertCircle color="#ef4444" size={48} />
        <Text style={styles.errorText}>No se pudieron cargar las estadísticas</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchStats}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Usamos el rol del contexto de auth (/auth/me) que siempre es correcto
  // No dependemos de stats.type del backend que puede ser incorrecto en Render
  const rolNombre = (user?.rol?.nombre || '').toUpperCase();

  const renderAdminStats = () => (
    <View style={styles.statsGrid}>
      <StatCard label="Total Usuarios" value={stats?.totalUsuarios ?? 0} icon={Users} color="blue" description="Usuarios registrados" />
      <StatCard label="Roles del Sistema" value={stats?.totalRoles ?? 0} icon={Shield} color="emerald" description="Niveles de acceso" />
      <StatCard label="Clientes" value={stats?.totalClientes ?? 0} icon={Briefcase} color="amber" description="Empresas activas" />
      <StatCard label="Total Proyectos" value={stats?.totalProyectos ?? 0} icon={LayoutDashboard} color="indigo" description="En curso y finalizados" />
      <StatCard label="Tareas Globales" value={stats?.totalTareas ?? 0} icon={Activity} color="rose" description="Entregables totales" />
    </View>
  );

  const renderTrabajadorStats = () => (
    <View style={styles.statsGrid}>
      <StatCard label="Mis Proyectos" value={stats?.proyectosAsignados ?? 0} icon={LayoutDashboard} color="blue" description="Proyectos donde participas" />
      <StatCard label="Tareas Pendientes" value={stats?.tareasPendientes ?? 0} icon={Clock} color="amber" description="Por completar" />
      <StatCard label="Tareas Completadas" value={stats?.tareasCompletadas ?? 0} icon={CheckCircle2} color="emerald" description="Trabajo finalizado" />
    </View>
  );

  const renderClienteStats = () => (
    <View style={styles.statsGrid}>
      <StatCard label="Mis Proyectos" value={stats?.proyectosAsignados ?? 0} icon={LayoutDashboard} color="blue" description="Proyectos asignados a tu cuenta" />
      <StatCard label="Tareas en Curso" value={stats?.tareasPendientes ?? 0} icon={Clock} color="amber" description="Tareas pendientes y en progreso" />
      <StatCard label="Tareas Completadas" value={stats?.tareasCompletadas ?? 0} icon={CheckCircle2} color="emerald" description="Tareas finalizadas" />
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.pageTitle}>Panel de Control</Text>
          <Text style={styles.welcomeMsg}>
            {rolNombre === 'ADMIN'
              ? 'Vista global de la organización'
              : rolNombre === 'CLIENTE'
                ? `Bienvenido, ${user?.nombre}. Portal de seguimiento.`
                : `Hola, ${user?.nombre}. Resumen de tu trabajo.`}
          </Text>
        </View>
        <View style={styles.userBadge}>
          <View style={[styles.avatarContainer, { backgroundColor: '#1e293b' }]}>
            <UserIcon color="#fff" size={20} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.nombre}</Text>
            <Text style={styles.userRole}>{user?.rol?.nombre}</Text>
          </View>
        </View>
      </View>

      <View style={styles.roleHeader}>
        <Text style={styles.roleName}>{user?.nombre}</Text>
        <View style={styles.roleTag}>
          <Text style={styles.roleTagText}>{user?.rol?.nombre}</Text>
        </View>
      </View>

      {/* Render basado en el rol real del usuario, no en stats.type del backend */}
      {rolNombre === 'ADMIN' && renderAdminStats()}
      {rolNombre === 'CLIENTE' && renderClienteStats()}
      {rolNombre === 'TRABAJADOR' && renderTrabajadorStats()}
    </ScrollView>
  );
}

function StatCard({ label, value, icon: Icon, color, description }: any) {
  const colorMap: any = {
    blue: { text: '#60a5fa', bg: '#3b82f61a', border: '#3b82f633' },
    emerald: { text: '#34d399', bg: '#10b9811a', border: '#10b98133' },
    amber: { text: '#fbbf24', bg: '#f59e0b1a', border: '#f59e0b33' },
    indigo: { text: '#818cf8', bg: '#6366f11a', border: '#6366f133' },
    rose: { text: '#fb7185', bg: '#f43f5e1a', border: '#f43f5e33' },
  };

  const style = colorMap[color] || colorMap.blue;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardLabel}>{label}</Text>
          <Text style={styles.cardValue}>{value}</Text>
        </View>
        <View style={[styles.iconContainer, { backgroundColor: style.bg, borderColor: style.border }]}>
          <Icon color={style.text} size={22} />
        </View>
      </View>
      <Text style={styles.cardDesc}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', padding: 20 },
  loadingText: { color: '#64748b', marginTop: 12, fontWeight: '500' },
  errorText: { color: '#94a3b8', marginTop: 16, textAlign: 'center', fontSize: 16 },
  retryBtn: { marginTop: 20, backgroundColor: '#1e293b', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  retryText: { color: '#3b82f6', fontWeight: 'bold' },
  content: { padding: 20, paddingTop: 40 },
  header: { marginBottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerLeft: { flex: 1, marginRight: 12 },
  pageTitle: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  welcomeMsg: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  userBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 8, borderRadius: 16, borderWidth: 1, borderColor: '#334155' },
  avatarContainer: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  userInfo: { marginLeft: 10, marginRight: 4 },
  userName: { fontSize: 12, fontWeight: 'bold', color: '#fff' },
  userRole: { fontSize: 9, color: '#3b82f6', fontWeight: '800', letterSpacing: 1, marginTop: 2 },
  roleHeader: { marginBottom: 24, backgroundColor: '#1e293b60', padding: 16, borderRadius: 20, borderLeftWidth: 4, borderLeftColor: '#3b82f6' },
  roleName: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  roleTag: { backgroundColor: '#3b82f620', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginTop: 8 },
  roleTagText: { color: '#3b82f6', fontSize: 10, fontWeight: 'bold' },
  statsGrid: { marginBottom: 30 },
  card: { backgroundColor: '#1e293b60', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#334155', marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardInfo: { flex: 1 },
  cardLabel: { fontSize: 11, fontWeight: '800', color: '#64748b', letterSpacing: 1, marginBottom: 4 },
  cardValue: { fontSize: 40, fontWeight: '900', color: '#fff' },
  iconContainer: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  cardDesc: { fontSize: 12, color: '#475569', marginTop: 12, fontWeight: '600' },
  errorContainer: { padding: 20, backgroundColor: '#ef444410', borderRadius: 16, marginTop: 20 },
  debugText: { color: '#64748b', fontSize: 10, marginTop: 8, fontFamily: 'monospace' },
});

