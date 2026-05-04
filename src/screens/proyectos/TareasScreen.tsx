import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, ScrollView } from 'react-native';
import api from '../../api/api.config';
import { CheckCircle2, Clock, Plus, MoreVertical, Edit, Trash2, X, Check, Calendar, User } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import dayjs from 'dayjs';
import { useAuth } from '../../context/AuthContext';
import ActionMenu, { MenuOption } from '../../components/ActionMenu';
import FormSelect from '../../components/FormSelect';
import FormDatePicker from '../../components/FormDatePicker';
import ConfirmModal from '../../components/ConfirmModal';
import EmptyState from '../../components/EmptyState';
import { generateProjectReport } from '../../services/ReportService';
import { FileText } from 'lucide-react-native';

export default function TareasScreen({ route, navigation }: any) {
  const { proyectoId, proyectoNombre } = route.params;
  const { user } = useAuth();
  
  const [tareas, setTareas] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedTarea, setSelectedTarea] = useState<any>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    estado: 'PENDIENTE',
    prioridad: 'MEDIA',
    responsableId: null as number | null,
    proyectoId: proyectoId,
    fechaInicio: null as string | null,
    fechaFin: null as string | null
  });
  const [saving, setSaving] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [tareaToDelete, setTareaToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  const canEdit = user?.permisos?.includes('EDITAR_TAREA');
  const canDelete = user?.permisos?.includes('ELIMINAR_TAREA');
  const canCreate = user?.permisos?.includes('CREAR_TAREA');

  const fetchData = async () => {
    try {
      const [tRes, uRes] = await Promise.all([
        api.get(`/tareas?proyectoId=${proyectoId}`),
        api.get('/usuarios')
      ]);
      
      const tData = tRes.data.data;
      setTareas(Array.isArray(tData.data || tData) ? (tData.data || tData) : []);
      
      const uData = uRes.data.data;
      const usersList = Array.isArray(uData.data || uData) ? (uData.data || uData) : [];
      setUsuarios(usersList.filter((u: any) => u.rol?.nombre !== 'CLIENTE'));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setForm({
      titulo: '',
      descripcion: '',
      estado: 'PENDIENTE',
      prioridad: 'MEDIA',
      responsableId: null,
      proyectoId: proyectoId,
      fechaInicio: dayjs().toISOString(),
      fechaFin: dayjs().add(7, 'day').toISOString()
    });
    setIsEditing(false);
    setModalVisible(true);
  };

  const handleOpenEdit = (t: any) => {
    setSelectedTarea(t);
    setForm({
      titulo: t.titulo,
      descripcion: t.descripcion || '',
      estado: t.estado,
      prioridad: t.prioridad,
      responsableId: t.responsableId,
      proyectoId: proyectoId,
      fechaInicio: t.fechaInicio || null,
      fechaFin: t.fechaFin || null
    });
    setIsEditing(true);
    setModalVisible(true);
    setMenuVisible(false);
  };

  const handleSubmit = async () => {
    if (!form.titulo || !form.responsableId) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Título y Responsable son obligatorios', position: 'top' });
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await api.patch(`/tareas/${selectedTarea.id}`, form);
      } else {
        await api.post('/tareas', form);
      }
      setModalVisible(false);
      setTimeout(() => {
        Toast.show({ type: 'success', text1: 'Éxito', text2: isEditing ? 'Tarea actualizada correctamente' : 'Tarea creada correctamente', position: 'top' });
      }, 300);
      fetchData();
    } catch (error) {
    } finally {
      setSaving(false);
    }
  };

  const handleOptions = (t: any) => {
    setSelectedTarea(t);
    setMenuVisible(true);
  };

  const menuOptions: MenuOption[] = [
    ...(canEdit ? [{ label: 'Editar Tarea', icon: Edit, onPress: () => handleOpenEdit(selectedTarea) }] : []),
    ...(canDelete ? [{ label: 'Eliminar Tarea', icon: Trash2, isDestructive: true, onPress: () => confirmDelete(selectedTarea) }] : []),
  ];

  const confirmDelete = (t: any) => {
    setTareaToDelete(t);
    setDeleteModalVisible(true);
    setMenuVisible(false);
  };

  const handleConfirmDelete = async () => {
    if (!tareaToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/tareas/${tareaToDelete.id}`);
      setDeleteModalVisible(false);
      setTimeout(() => {
        Toast.show({ type: 'success', text1: 'Éxito', text2: 'Tarea eliminada correctamente', position: 'top' });
      }, 300);
      fetchData();
    } catch (e) {
    } finally {
      setDeleting(false);
    }
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      await generateProjectReport(proyectoId, proyectoNombre, user?.rol?.nombre === 'CLIENTE');
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo generar el reporte', position: 'top' });
    } finally {
      setGeneratingReport(false);
    }
  };

  useEffect(() => {
    fetchData();
    navigation.setOptions({ 
      title: `Tareas: ${proyectoNombre}`,
      headerRight: () => (
        <TouchableOpacity 
          onPress={handleGenerateReport} 
          disabled={generatingReport}
          style={{ marginRight: 10, padding: 8, backgroundColor: '#3b82f620', borderRadius: 10 }}
        >
          {generatingReport ? (
            <ActivityIndicator size="small" color="#3b82f6" />
          ) : (
            <FileText color="#3b82f6" size={20} />
          )}
        </TouchableOpacity>
      )
    });
  }, [generatingReport]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETADA': return '#10b981';
      case 'EN_PROGRESO': return '#3b82f6';
      case 'REVISION': return '#f59e0b';
      default: return '#94a3b8';
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={[styles.statusLine, { backgroundColor: getStatusColor(item.estado) }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.taskTitle}>{item.titulo}</Text>
          <TouchableOpacity onPress={() => handleOptions(item)}>
            <MoreVertical color="#94a3b8" size={18} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.taskDesc} numberOfLines={2}>{item.descripcion || 'Sin descripción'}</Text>
        
        <View style={styles.taskFooter}>
          <View style={styles.footerItem}>
            <User color="#64748b" size={12} />
            <Text style={styles.footerText}>{item.responsable?.nombre || 'Sin asignar'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.estado) + '20' }]}>
            <Text style={[styles.statusBadgeText, { color: getStatusColor(item.estado) }]}>{item.estado}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tareas}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            iconName="Layers"
            title="Sin tareas"
            description="Este proyecto no tiene tareas asignadas. Comienza a organizar el trabajo."
            actionLabel="Añadir Tarea"
            onAction={canCreate ? handleOpenCreate : undefined}
          />
        }
      />

      {canCreate && (
        <TouchableOpacity style={styles.fab} onPress={handleOpenCreate}>
          <Plus color="#fff" size={30} />
        </TouchableOpacity>
      )}

      <ActionMenu isVisible={menuVisible} onClose={() => setMenuVisible(false)} title={selectedTarea?.titulo} options={menuOptions} />

      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditing ? 'Editar Tarea' : 'Nueva Tarea'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><X color="#94a3b8" size={24} /></TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.label}>Título</Text>
              <TextInput style={styles.input} value={form.titulo} onChangeText={(t) => setForm({ ...form, titulo: t })} placeholder="Ej. Implementar login" placeholderTextColor="#64748b" />

              <Text style={styles.label}>Descripción</Text>
              <TextInput style={[styles.input, { height: 60 }]} value={form.descripcion} onChangeText={(t) => setForm({ ...form, descripcion: t })} placeholder="Detalles..." placeholderTextColor="#64748b" multiline />

              <FormSelect 
                label="Estado"
                options={[
                  { label: 'PENDIENTE', value: 'PENDIENTE' },
                  { label: 'EN PROGRESO', value: 'EN_PROGRESO' },
                  { label: 'COMPLETADA', value: 'COMPLETADA' },
                  { label: 'CANCELADA', value: 'CANCELADA' }
                ]}
                value={form.estado}
                onSelect={(val) => setForm({ ...form, estado: val })}
              />

              <FormSelect 
                label="Responsable"
                options={usuarios.map(u => ({ label: u.nombre, value: u.id }))}
                value={form.responsableId}
                onSelect={(val) => setForm({ ...form, responsableId: val })}
              />

              <FormDatePicker
                label="Fecha Inicio"
                value={form.fechaInicio}
                onChange={(date) => setForm({ ...form, fechaInicio: date })}
              />

              <FormDatePicker
                label="Fecha Fin"
                value={form.fechaFin}
                onChange={(date) => setForm({ ...form, fechaFin: date })}
              />

              <TouchableOpacity style={[styles.submitButton, saving && { opacity: 0.7 }]} onPress={handleSubmit} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>{isEditing ? 'Guardar Cambios' : 'Crear Tarea'}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
        <Toast />
      </Modal>

      <ConfirmModal
        isVisible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Tarea"
        message={`¿Estás seguro de que deseas eliminar la tarea "${tareaToDelete?.titulo}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        isLoading={deleting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  list: { padding: 20, paddingBottom: 100 },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusLine: { width: 4 },
  cardContent: { flex: 1, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  taskTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  taskDesc: { fontSize: 13, color: '#94a3b8', marginBottom: 12 },
  taskFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 11, color: '#64748b' },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusBadgeText: { fontSize: 9, fontWeight: 'bold' },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBar: { flex: 1, height: 4, backgroundColor: '#334155', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  progressText: { fontSize: 10, color: '#64748b', fontWeight: 'bold', width: 30 },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#3b82f6', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  emptyText: { color: '#64748b', textAlign: 'center', marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#0f172a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%', borderTopWidth: 1, borderTopColor: '#334155' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  label: { fontSize: 14, color: '#94a3b8', marginBottom: 8, fontWeight: '600', marginTop: 10 },
  input: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 12, padding: 12, color: '#fff', fontSize: 15, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  selector: { flexDirection: 'row', gap: 5, marginBottom: 10 },
  selectBtn: { flex: 1, padding: 8, borderRadius: 8, backgroundColor: '#1e293b', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  selectBtnActive: { backgroundColor: '#3b82f620', borderColor: '#3b82f6' },
  selectBtnText: { color: '#64748b', fontSize: 11, fontWeight: 'bold' },
  selectBtnTextActive: { color: '#3b82f6' },
  selectorContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  selectorItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 6 },
  selectorItemSelected: { borderColor: '#3b82f6', backgroundColor: '#3b82f610' },
  selectorItemText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  selectorItemTextSelected: { color: '#3b82f6' },
  progressBtn: { flex: 1, padding: 8, borderRadius: 8, backgroundColor: '#1e293b', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  progressBtnActive: { backgroundColor: '#3b82f620', borderColor: '#3b82f6' },
  progressBtnText: { color: '#64748b', fontSize: 11, fontWeight: 'bold' },
  progressBtnTextActive: { color: '#3b82f6' },
  submitButton: { backgroundColor: '#3b82f6', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20, marginBottom: 40 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
