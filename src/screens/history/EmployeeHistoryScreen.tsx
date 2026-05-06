import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
  FlatList,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Search, Filter, X, User, Briefcase, Clock, CheckSquare } from 'lucide-react-native';
import FormSelectNoClose from '../../components/FormSelectNoClose';
import historyService from '../../api/history.service';
import { HistoryItem, ProjectHistoryItem } from '../../api/history.service';
import { useAuth } from '../../context/AuthContext';
import Toast from 'react-native-toast-message';
import dayjs from 'dayjs';

interface FilterOptions {
  proyectoId: string;
  tareaId: string;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  filterButton: {
    backgroundColor: '#334155',
    padding: 12,
    borderRadius: 8,
  },
  activeFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearFiltersButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyItem: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  entityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  actionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clearButton: {
    backgroundColor: '#334155',
    padding: 12,
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  listContainer: {
    padding: 16,
  },
  loadMoreContainer: {
    paddingVertical: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  text: {
    color: '#ffffff',
  },
  textWhite: {
    color: '#ffffff',
  },
  textSlate300: {
    color: '#cbd5e1',
  },
  textSlate400: {
    color: '#94a3b8',
  },
  textSlate500: {
    color: '#64748b',
  },
  textBlue400: {
    color: '#60a5fa',
  },
  textSm: {
    fontSize: 14,
  },
  textXs: {
    fontSize: 12,
  },
  textBase: {
    fontSize: 16,
  },
  fontSemibold: {
    fontWeight: '600',
  },
  fontMedium: {
    fontWeight: '500',
  },
  capitalize: {
    textTransform: 'capitalize',
  },
  textCenter: {
    textAlign: 'center',
  },
  input: {
    flex: 1,
    color: '#ffffff',
    marginLeft: 8,
    paddingVertical: 8,
  },
});

const EmployeeHistoryScreen: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<(HistoryItem | ProjectHistoryItem)[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    proyectoId: '',
    tareaId: '',
  });

  const [proyectos, setProyectos] = useState<any[]>([]);
  const [tareas, setTareas] = useState<any[]>([]);

  const loadHistory = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setPage(1);
        setHasMore(true);
      }

      let response;
      if (searchQuery) {
        response = await historyService.searchHistory(searchQuery, isRefresh ? 1 : page);
      } else if (filters.tareaId) {
        response = await historyService.getSystemHistoryByUrl(`/proyectos/historial/global?tareaId=${filters.tareaId}`);
      } else if (filters.proyectoId) {
        response = await historyService.getSystemHistoryByUrl(`/proyectos/historial/global?proyectoId=${filters.proyectoId}`);
      } else {
        const response = await historyService.getSystemHistoryByUrl('/proyectos/historial/global');
        const mappedHistory = (response.data || []).map((item: any) => ({
          id: item.id,
          proyecto_id: item.proyecto_id || item.id,
          proyecto_nombre: item.proyecto_nombre || item.nombre || item.entidadNombre,
          accion: item.accion || item.campo || 'actualizado',
          descripcion: item.descripcion || `${item.campo ? item.campo + ': ' : ''}${item.valorAntes ? item.valorAntes + ' → ' : ''}${item.valorDespues || item.entidadNombre}`,
          usuario_nombre: item.usuario_nombre || item.usuario?.nombre || 'Usuario',
          fecha_creacion: item.fecha_creacion || item.creadoEn,
          tipo: item.tipo,
          entidadNombre: item.entidadNombre,
          campo: item.campo,
          valorAntes: item.valorAntes,
          valorDespues: item.valorDespues,
          usuario: item.usuario,
        }));

        setHistory(mappedHistory);
        setHasMore(mappedHistory.length === 20);
        setPage(2);
        return;
      }

      const mappedHistory = (response.data || []).map((item: any) => ({
        id: item.id,
        proyecto_id: item.proyecto_id || item.id,
        proyecto_nombre: item.proyecto_nombre || item.nombre || item.entidadNombre,
        accion: item.accion || item.campo || 'actualizado',
        descripcion: item.descripcion || `${item.campo ? item.campo + ': ' : ''}${item.valorAntes ? item.valorAntes + ' → ' : ''}${item.valorDespues || item.entidadNombre}`,
        usuario_nombre: item.usuario_nombre || item.usuario?.nombre || 'Usuario',
        fecha_creacion: item.fecha_creacion || item.creadoEn,
        tipo: item.tipo,
        entidadNombre: item.entidadNombre,
        campo: item.campo,
        valorAntes: item.valorAntes,
        valorDespues: item.valorDespues,
        usuario: item.usuario,
      }));

      setHistory(mappedHistory);
      setHasMore(mappedHistory.length === 20);
      setPage(2);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo cargar el historial',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProyectos();
  }, []);

  useEffect(() => {
    loadTareas();
  }, [filters.proyectoId]);

  useEffect(() => {
    loadHistory();
  }, [filters]);

  const loadProyectos = async () => {
    try {
      const response = await historyService.getProyectos('/proyectos?limit=100');
      const proyectosData = response.data?.data || response.data || [];
      setProyectos(Array.isArray(proyectosData) ? proyectosData : []);
    } catch (error) {
      console.error('Error loading proyectos:', error);
      try {
        const fallbackResponse = await historyService.getProyectos('/proyectos/mis-proyectos');
        const fallbackData = fallbackResponse.data?.data || fallbackResponse.data || [];
        setProyectos(Array.isArray(fallbackData) ? fallbackData : []);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        setProyectos([]);
      }
    }
  };

  const loadTareas = async () => {
    try {
      if (filters.proyectoId) {
        const response = await historyService.getTareas(`/tareas?proyectoId=${filters.proyectoId}&limit=100`);
        const tareasData = response.data?.data || response.data || [];
        setTareas(Array.isArray(tareasData) ? tareasData : []);
      } else {
        setTareas([]);
      }
    } catch (error) {
      console.error('Error loading tareas:', error);
      setTareas([]);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory(true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadHistory();
    }
  };

  const getActionColor = (action: string) => {
    if (!action) return '#6b7280';
    switch (action.toLowerCase()) {
      case 'crear':
      case 'created':
        return '#10b981';
      case 'actualizar':
      case 'updated':
        return '#3b82f6';
      case 'eliminar':
      case 'deleted':
        return '#ef4444';
      case 'asignar':
      case 'assigned':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getEntityIcon = (entityType: string) => {
    if (!entityType) return <Clock size={16} color="#6b7280" />;
    switch (entityType.toLowerCase()) {
      case 'proyecto':
        return <Briefcase size={16} color="#3b82f6" />;
      case 'tarea':
        return <Clock size={16} color="#10b981" />;
      case 'usuario':
        return <User size={16} color="#f59e0b" />;
      default:
        return <Clock size={16} color="#6b7280" />;
    }
  };

  const isProjectHistory = (item: HistoryItem | ProjectHistoryItem): item is ProjectHistoryItem => {
    return 'proyecto_id' in item;
  };

  const renderHistoryItem = ({ item }: { item: HistoryItem | ProjectHistoryItem }) => {
    const isProject = isProjectHistory(item);
    
    return (
      <View style={styles.historyItem}>
        {/* Entidad principal */}
        <View style={styles.entityRow}>
          {getEntityIcon(isProject ? 'proyecto' : (item as HistoryItem).tipo)}
          <Text style={[styles.textWhite, styles.fontSemibold]}>
            {isProject ? item.proyecto_nombre : (item as HistoryItem).entidadNombre}
          </Text>
          {!isProject && (
            <Text style={[styles.textXs, styles.textSlate400]}>#{item.id}</Text>
          )}
        </View>
        
        <Text style={[styles.text, styles.textBase, { marginBottom: 8 }]}>
          {isProject ? item.descripcion : `${(item as HistoryItem).campo ? (item as HistoryItem).campo + ': ' : ''}${(item as HistoryItem).valorAntes ? (item as HistoryItem).valorAntes + ' → ' : ''}${(item as HistoryItem).valorDespues || (item as HistoryItem).entidadNombre}`}
        </Text>
        
        {(item as any).proyectoNombre && (
          <View style={styles.infoRow}>
            <Briefcase size={14} color="#3b82f6" />
            <Text style={[styles.textSm, styles.textBlue400]}>
              {(item as any).proyectoNombre}
            </Text>
          </View>
        )}
        
        {(item as any).clienteNombre && (
          <View style={styles.infoRow}>
            <User size={14} color="#10b981" />
            <Text style={[styles.textSm, { color: '#10b981' }]}>
              Cliente: {(item as any).clienteNombre}
            </Text>
          </View>
        )}
        
        {(item as any).nombreTarea && (
          <View style={styles.infoRow}>
            <Clock size={14} color="#f59e0b" />
            <Text style={[styles.textSm, { color: '#f59e0b' }]}>
              Tarea: {(item as any).nombreTarea}
            </Text>
          </View>
        )}
        
        <View style={styles.filterRow}>
          <View 
            style={[styles.actionBadge, { backgroundColor: `${getActionColor(isProject ? item.accion : ((item as HistoryItem).accion || (item as HistoryItem).campo || 'actualizado'))}20` }]}
          >
            <Text 
              style={[styles.textXs, styles.fontMedium, styles.capitalize, { color: getActionColor(isProject ? item.accion : ((item as HistoryItem).accion || (item as HistoryItem).campo || 'actualizado')) }]}
            >
              {isProject ? item.accion : ((item as HistoryItem).accion || (item as HistoryItem).campo || 'actualizado')}
            </Text>
          </View>
        </View>
        
        <View style={styles.footerRow}>
          <View style={styles.userInfo}>
            <User size={14} color="#94a3b8" />
            <Text style={[styles.textSm, styles.textSlate400]}>
              {isProject ? item.usuario_nombre : ((item as HistoryItem).usuario?.nombre || 'Usuario')}
            </Text>
          </View>
          <Text style={[styles.textXs, styles.textSlate500]}>
            {dayjs(isProject ? item.fecha_creacion : ((item as HistoryItem).creadoEn || item.fecha_creacion)).format('DD MMM YYYY, HH:mm')}
          </Text>
        </View>
      </View>
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={[styles.textWhite, styles.textBase, styles.fontSemibold]}>Filtros</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <X size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <FormSelectNoClose
            label="Seleccionar Proyecto"
            options={[
              { label: 'Todos mis proyectos', value: '' },
              ...(proyectos || []).map((p: any) => ({ 
                label: p.nombre, 
                value: p.id.toString() 
              }))
            ]}
            value={filters.proyectoId}
            onSelect={(value) => {
              setFilters({ ...filters, proyectoId: value, tareaId: '' });
            }}
            placeholder="Todos mis proyectos"
          />

          <FormSelectNoClose
            label="Filtrar por Tarea"
            options={[
              { label: filters.proyectoId ? 'Todas las tareas del proyecto' : 'Seleccione un proyecto primero', value: '' },
              ...(tareas || []).map((t: any) => ({ 
                label: t.titulo, 
                value: t.id.toString() 
              }))
            ]}
            value={filters.tareaId}
            onSelect={(value) => {
              setFilters({ ...filters, tareaId: value });
            }}
            placeholder={filters.proyectoId ? 'Todas las tareas del proyecto' : 'Seleccione un proyecto primero'}
          />

          <TouchableOpacity
            onPress={() => {
              setFilters({ proyectoId: '', tareaId: '' });
              setShowFilters(false);
            }}
            style={styles.clearButton}
          >
            <Text style={[styles.textWhite, styles.textCenter, styles.fontMedium]}>Limpiar filtros</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Search size={20} color="#94a3b8" />
            <TextInput
              placeholder="Buscar en historial..."
              placeholderTextColor="#94a3b8"
              style={styles.input}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            onPress={() => setShowFilters(true)}
            style={styles.filterButton}
          >
            <Filter size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {(filters.proyectoId || filters.tareaId || searchQuery) && (
          <View style={styles.activeFiltersRow}>
            <Text style={[styles.textSlate400, styles.textSm]}>Filtros activos:</Text>
            <TouchableOpacity
              onPress={() => {
                setFilters({ proyectoId: '', tareaId: '' });
                setSearchQuery('');
              }}
              style={styles.clearFiltersButton}
            >
              <Text style={[styles.textBlue400, styles.textXs]}>Limpiar</Text>
              <X size={12} color="#60a5fa" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        data={history}
        renderItem={renderHistoryItem}
        keyExtractor={(item, index) => `${item.id || index}-${index}`}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
            colors={["#3b82f6"]}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={
          hasMore ? (
            <View style={styles.loadMoreContainer}>
              <ActivityIndicator size="small" color="#3b82f6" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Clock size={48} color="#475569" />
            <Text style={[styles.textSlate400, styles.textCenter, { marginTop: 16 }]}>
              {searchQuery ? 'No se encontraron resultados' : 'No hay historial disponible'}
            </Text>
          </View>
        }
      />

      {renderFilterModal()}
    </View>
  );
};

export default EmployeeHistoryScreen;
