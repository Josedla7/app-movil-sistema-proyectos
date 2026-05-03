import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api.config';
import { 
  LogOut, 
  Briefcase, 
  ChevronRight, 
  CheckCircle as CheckCircle2, 
  Activity, 
  Layers, 
  User as UserIcon, 
  LayoutDashboard, 
  Clock,
  ArrowLeft,
  BarChart2
} from 'lucide-react-native';
import dayjs from 'dayjs';

interface Proyecto {
  id: number;
  nombre: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  tareas?: any[];
}

interface Tarea {
  id: number;
  titulo: string;
  estado: string;
  porcentajeAvance: number;
  fechaInicio?: string;
  fechaFin?: string;
}

export default function PortalClienteScreen() {
  const { user } = useAuth();
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [selectedProyecto, setSelectedProyecto] = useState<Proyecto | null>(null);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loadingTareas, setLoadingTareas] = useState(false);

  const fetchData = async () => {
    try {
      const res = await api.get('/proyectos/mis-proyectos');
      const data = res.data.data || res.data;
      const projectsArray = Array.isArray(data) ? data : (data.data || []);
      setProyectos(projectsArray);
    } catch (error) {
      // Error fetching portal data
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const fetchTareas = async (id: number) => {
    setLoadingTareas(true);
    try {
      const res = await api.get(`/proyectos/${id}/gantt`);
      const data = res.data.data || res.data;
      setTareas(data.tareas || []);
    } catch (error) {
      // Error fetching tasks
    } finally {
      setLoadingTareas(false);
    }
  };

  useEffect(() => {
    if (selectedProyecto) {
      fetchTareas(selectedProyecto.id);
    }
  }, [selectedProyecto]);

  const getProjectStats = (proyecto: Proyecto) => {
    const total = proyecto.tareas?.length || 0;
    const completadas = proyecto.tareas?.filter((t: any) => t.estado === 'COMPLETADA').length || 0;
    const enProgreso = proyecto.tareas?.filter((t: any) => t.estado === 'EN_PROGRESO').length || 0;
    const promedio = total > 0 
      ? Math.round(proyecto.tareas!.reduce((acc: number, t: any) => acc + (t.porcentajeAvance || 0), 0) / total) 
      : 0;
    return { total, completadas, enProgreso, promedio };
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Cargando tu portal...</Text>
      </View>
    );
  }

  const renderGanttMobile = () => {
    if (loadingTareas) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Cargando diagrama...</Text>
        </View>
      );
    }

    return (
      <View style={styles.tasksContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => setSelectedProyecto(null)}>
          <View style={styles.backButtonInner}>
            <ArrowLeft color="#3b82f6" size={18} />
            <Text style={styles.backButtonText}>Volver a Proyectos</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.projectHeaderDetail}>
          <View style={styles.projectTitleContainer}>
            <BarChart2 color="#3b82f6" size={32} />
            <Text style={styles.projectTitle}>{selectedProyecto?.nombre}</Text>
          </View>
          <Text style={styles.projectDesc}>{selectedProyecto?.descripcion || 'Sin descripción'}</Text>
          
          <View style={styles.detailStatsRow}>
             <View style={styles.detailStat}>
                <Text style={styles.detailStatLabel}>Tareas</Text>
                <Text style={styles.detailStatValue}>{tareas.length}</Text>
             </View>
              <View style={styles.detailStat}>
                 <Text style={styles.detailStatLabel}>En Progreso</Text>
                 <Text style={[styles.detailStatValue, { color: '#3b82f6' }]}>{tareas.filter(t => t.estado === 'EN_PROGRESO').length}</Text>
              </View>
              <View style={styles.detailStat}>
                 <Text style={styles.detailStatLabel}>Completadas</Text>
                 <Text style={[styles.detailStatValue, { color: '#10b981' }]}>{tareas.filter(t => t.estado === 'COMPLETADA').length}</Text>
              </View>
           </View>

          <View style={styles.projectTimelineInfo}>
             <View style={styles.timelineItem}>
                <Clock color="#94a3b8" size={14} />
                <View>
                  <Text style={styles.timelineLabel}>Fecha Inicio</Text>
                  <Text style={styles.timelineValue}>{dayjs(selectedProyecto?.fechaInicio).format('DD MMM, YYYY')}</Text>
                </View>
             </View>
             <View style={styles.timelineDivider} />
             <View style={styles.timelineItem}>
                <Clock color="#ef4444" size={14} />
                <View>
                  <Text style={styles.timelineLabel}>Fecha Fin</Text>
                  <Text style={styles.timelineValue}>
                    {selectedProyecto?.fechaFin ? dayjs(selectedProyecto?.fechaFin).format('DD MMM, YYYY') : 'En curso'}
                  </Text>
                </View>
             </View>
          </View>
        </View>

        <View style={styles.ganttSectionHeader}>
          <Layers color="#3b82f6" size={18} />
          <Text style={styles.ganttSectionTitle}>Cronograma Gantt</Text>
        </View>
        
        {tareas.length === 0 ? (
          <View style={styles.emptyState}>
            <Layers color="#475569" size={48} />
            <Text style={styles.emptyText}>No hay tareas registradas</Text>
          </View>
        ) : (
          tareas.map((tarea, index) => {
            const isCompleted = tarea.estado === 'COMPLETADA';
            const isInProgress = tarea.estado === 'EN_PROGRESO';
            
            // Cálculo de posición para el Gantt
            const projectStart = dayjs(selectedProyecto?.fechaInicio);
            const projectEnd = selectedProyecto?.fechaFin ? dayjs(selectedProyecto?.fechaFin) : dayjs().add(1, 'month');
            const projectDuration = projectEnd.diff(projectStart, 'day') || 1;
            
            const taskStart = tarea.fechaInicio ? dayjs(tarea.fechaInicio) : dayjs(tarea.creadoEn || undefined);
            const taskEnd = tarea.fechaFin ? dayjs(tarea.fechaFin) : taskStart.add(1, 'day');
            
            const leftOffset = Math.max(0, Math.min(100, (taskStart.diff(projectStart, 'day') / projectDuration) * 100));
            const widthPct = Math.max(5, Math.min(100 - leftOffset, (taskEnd.diff(taskStart, 'day') / projectDuration) * 100));

            return (
              <View key={tarea.id} style={styles.ganttRow}>
                <View style={styles.ganttTaskInfo}>
                  <View style={[styles.taskIndicator, { backgroundColor: isCompleted ? '#10b981' : isInProgress ? '#3b82f6' : '#64748b' }]} />
                  <Text style={styles.ganttTaskTitle} numberOfLines={1}>{tarea.titulo}</Text>
                  <View style={[styles.statusBadgeSmall, { backgroundColor: isCompleted ? '#10b98120' : isInProgress ? '#3b82f620' : '#64748b20' }]}>
                    <Text style={[styles.statusBadgeTextSmall, { color: isCompleted ? '#10b981' : isInProgress ? '#3b82f6' : '#64748b' }]}>
                      {tarea.estado.replace('_', ' ')}
                    </Text>
                  </View>
                </View>

                {/* Visualización de la barra temporal del Gantt */}
                <View style={styles.ganttTrackFull}>
                  <View 
                    style={[
                      styles.ganttTaskBar, 
                      { 
                        left: `${leftOffset}%`, 
                        width: `${widthPct}%`,
                        backgroundColor: isCompleted ? '#10b981' : isInProgress ? '#3b82f6' : '#475569' 
                      }
                    ]} 
                  />
                </View>

                <View style={styles.taskDateRow}>
                   <Text style={styles.taskDateText}>
                     {tarea.fechaInicio ? dayjs(tarea.fechaInicio).format('DD MMM') : 'S/F'} 
                     {tarea.fechaFin ? ` - ${dayjs(tarea.fechaFin).format('DD MMM')}` : ''}
                   </Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    );
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
    >
      {!selectedProyecto ? (
        <>
          <View style={styles.dashboardHeader}>
            <View style={styles.headerTitleContainer}>
              <Briefcase color="#3b82f6" size={32} />
              <View style={styles.headerText}>
                <Text style={styles.pageTitle}>Mis Proyectos</Text>
                <Text style={styles.welcomeMsg}>
                  Bienvenido, <Text style={styles.userNameAccent}>{user?.nombre}</Text>.
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Tus Proyectos Activos</Text>
          
          {proyectos.length === 0 ? (
            <View style={styles.emptyState}>
              <Briefcase color="#1e293b" size={64} />
              <Text style={styles.emptyText}>No tienes proyectos asignados.</Text>
            </View>
          ) : (
            proyectos.map(proyecto => {
              const pStats = getProjectStats(proyecto);
              return (
                <TouchableOpacity 
                  key={proyecto.id} 
                  style={styles.projectCard}
                  onPress={() => setSelectedProyecto(proyecto)}
                >
                  <View style={styles.projectCardMain}>
                    <View style={styles.projectHeaderRow}>
                      <View style={styles.projectTitleBox}>
                        <Text style={styles.projectCardTitle} numberOfLines={1}>{proyecto.nombre}</Text>
                        <Text style={styles.projectCardDesc} numberOfLines={1}>{proyecto.descripcion || 'Sin descripción'}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: proyecto.estado === 'COMPLETADO' ? '#10b98120' : '#3b82f620' }]}>
                        <Text style={[styles.statusBadgeText, { color: proyecto.estado === 'COMPLETADO' ? '#10b981' : '#3b82f6' }]}>{proyecto.estado}</Text>
                      </View>
                    </View>

                    <View style={styles.projectDates}>
                      <Clock color="#64748b" size={12} />
                      <Text style={styles.dateText}>
                        {dayjs(proyecto.fechaInicio).format('DD MMM, YYYY')}
                        {proyecto.fechaFin ? ` - ${dayjs(proyecto.fechaFin).format('DD MMM, YYYY')}` : ' (Sin fin)'}
                      </Text>
                    </View>

                    <View style={styles.miniStatsRow}>
                      <View style={styles.miniStatItem}>
                        <Text style={styles.miniStatValue}>{pStats.total}</Text>
                        <Text style={styles.miniStatLabel}>Tareas</Text>
                      </View>
                      <View style={styles.miniStatItem}>
                        <Text style={[styles.miniStatValue, { color: '#3b82f6' }]}>{pStats.enProgreso}</Text>
                        <Text style={styles.miniStatLabel}>En Progreso</Text>
                      </View>
                      <View style={styles.miniStatItem}>
                        <Text style={[styles.miniStatValue, { color: '#10b981' }]}>{pStats.completadas}</Text>
                        <Text style={styles.miniStatLabel}>Completas</Text>
                      </View>
                    </View>

                    
                    
                    <View style={styles.cardFooterAction}>
                       <BarChart2 color="#3b82f6" size={16} />
                       <Text style={styles.actionText}>Ver Diagrama Gantt</Text>
                       <ChevronRight color="#3b82f6" size={16} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </>
      ) : (
        renderGanttMobile()
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  centerContainer: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { color: '#64748b', marginTop: 12, fontWeight: '500' },
  content: { padding: 20, paddingTop: 40 },
  dashboardHeader: { marginBottom: 24 },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  headerText: { marginLeft: 16 },
  pageTitle: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  welcomeMsg: { fontSize: 14, color: '#94a3b8', marginTop: 2 },
  userNameAccent: { color: '#3b82f6', fontWeight: 'bold' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  cardWrapper: { marginBottom: 16 },
  cardContainer: { backgroundColor: '#1e293b60', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#334155' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardInfo: { flex: 1 },
  cardLabel: { fontSize: 10, fontWeight: '900', color: '#64748b', letterSpacing: 1.5, marginBottom: 4, textTransform: 'uppercase' },
  cardValue: { fontSize: 32, fontWeight: '900', color: '#fff' },
  iconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardDesc: { fontSize: 11, color: '#475569', marginTop: 12, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  projectCard: { backgroundColor: '#1e293b80', borderRadius: 28, marginBottom: 20, borderWidth: 1, borderColor: '#334155', overflow: 'hidden' },
  projectCardMain: { padding: 20 },
  projectHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  projectTitleBox: { flex: 1, marginRight: 8 },
  projectCardTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  projectCardDesc: { fontSize: 12, color: '#64748b', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'transparent' },
  statusBadgeText: { fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' },
  projectDates: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dateText: { fontSize: 11, color: '#64748b', marginLeft: 6 },
  miniStatsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#334155', marginBottom: 8 },
  miniStatItem: { alignItems: 'center', flex: 1 },
  miniStatValue: { fontSize: 18, fontWeight: '900', color: '#fff' },
  miniStatLabel: { fontSize: 9, color: '#475569', fontWeight: 'bold', textTransform: 'uppercase', marginTop: 2 },
  cardFooterAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3b82f615', paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: '#3b82f630', marginTop: 12 },
  actionText: { color: '#3b82f6', fontSize: 13, fontWeight: 'bold', marginHorizontal: 8 },
  backButton: { marginBottom: 20 },
  backButtonInner: { flexDirection: 'row', alignItems: 'center' },
  backButtonText: { color: '#3b82f6', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  projectHeaderDetail: { marginBottom: 24 },
  projectTitleContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  projectTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginLeft: 12 },
  projectDesc: { fontSize: 14, color: '#94a3b8', lineHeight: 20, marginBottom: 16 },
  detailStatsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#1e293b60', padding: 16, borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  detailStat: { alignItems: 'center' },
  detailStatLabel: { fontSize: 9, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  detailStatValue: { fontSize: 18, fontWeight: '900', color: '#fff' },
  projectTimelineInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b40', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#33415510' },
  timelineItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  timelineDivider: { width: 1, height: 30, backgroundColor: '#334155', marginHorizontal: 12 },
  timelineLabel: { fontSize: 9, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' },
  timelineValue: { fontSize: 12, color: '#fff', fontWeight: '700', marginTop: 1 },
  ganttSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, marginTop: 10 },
  ganttSectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  ganttRow: { backgroundColor: '#1e293b60', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  ganttTaskInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  taskIndicator: { width: 10, height: 10, borderRadius: 5 },
  ganttTaskTitle: { fontSize: 14, fontWeight: 'bold', color: '#fff', flex: 1 },
  statusBadgeSmall: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusBadgeTextSmall: { fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase' },
  ganttTrackFull: { height: 6, backgroundColor: '#0f172a', borderRadius: 3, marginTop: 8, position: 'relative', overflow: 'hidden' },
  ganttTaskBar: { position: 'absolute', height: '100%', borderRadius: 3 },
  taskDateRow: { marginTop: 6, flexDirection: 'row', justifyContent: 'flex-end' },
  taskDateText: { fontSize: 9, color: '#64748b', fontWeight: 'bold' },
  tasksContainer: { marginTop: 8 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { marginTop: 16, color: '#475569', fontSize: 16, textAlign: 'center' },
});
