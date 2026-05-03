import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, ScrollView } from 'react-native';
import api from '../../api/api.config';
import { Briefcase, Calendar, Plus, MoreVertical, Edit, Trash2, X, Check } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import dayjs from 'dayjs';
import { useAuth } from '../../context/AuthContext';
import ActionMenu, { MenuOption } from '../../components/ActionMenu';
import FormSelect from '../../components/FormSelect';
import FormDatePicker from '../../components/FormDatePicker';
import ConfirmModal from '../../components/ConfirmModal';
import EmptyState from '../../components/EmptyState';

export default function ProyectosScreen({ navigation }: any) {
  const { user } = useAuth();
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedProyecto, setSelectedProyecto] = useState<any>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    fechaInicio: dayjs().format('YYYY-MM-DD'),
    fechaFin: dayjs().add(1, 'month').format('YYYY-MM-DD'),
    clienteId: null as number | null,
    estado: 'PLANIFICADO'
  });
  const [saving, setSaving] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [proyectoToDelete, setProyectoToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const canEdit = user?.permisos?.includes('EDITAR_PROYECTO');
  const canDelete = user?.permisos?.includes('ELIMINAR_PROYECTO');
  const canCreate = user?.permisos?.includes('CREAR_PROYECTO');

  const fetchData = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        api.get('/proyectos'),
        api.get('/clientes')
      ]);
      
      const pData = pRes.data.data;
      setProyectos(Array.isArray(pData.data || pData) ? (pData.data || pData) : []);
      
      const cData = cRes.data.data;
      setClientes(Array.isArray(cData.data || cData) ? (cData.data || cData) : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setForm({
      nombre: '',
      descripcion: '',
      fechaInicio: dayjs().format('YYYY-MM-DD'),
      fechaFin: dayjs().add(1, 'month').format('YYYY-MM-DD'),
      clienteId: clientes[0]?.id || null,
      estado: 'PLANIFICADO'
    });
    setIsEditing(false);
    setModalVisible(true);
  };

  const handleOpenEdit = (p: any) => {
    setSelectedProyecto(p);
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion || '',
      fechaInicio: dayjs(p.fechaInicio).format('YYYY-MM-DD'),
      fechaFin: p.fechaFin ? dayjs(p.fechaFin).format('YYYY-MM-DD') : '',
      clienteId: p.clienteId,
      estado: p.estado
    });
    setIsEditing(true);
    setModalVisible(true);
    setMenuVisible(false);
  };

  const handleSubmit = async () => {
    if (!form.nombre || !form.clienteId) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Nombre y Cliente son obligatorios', position: 'bottom' });
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await api.patch(`/proyectos/${selectedProyecto.id}`, form);
      } else {
        await api.post('/proyectos', form);
      }
      setModalVisible(false);
      setTimeout(() => {
        Toast.show({ type: 'success', text1: 'Éxito', text2: isEditing ? 'Proyecto actualizado correctamente' : 'Proyecto creado correctamente', position: 'bottom' });
      }, 300);
      fetchData();
    } catch (error) {
      // Error handled by interceptor
    } finally {
      setSaving(false);
    }
  };

  const handleOptions = (proyecto: any) => {
    setSelectedProyecto(proyecto);
    setMenuVisible(true);
  };

  const menuOptions: MenuOption[] = [
    ...(canEdit ? [{ 
      label: 'Editar Proyecto', 
      icon: Edit, 
      onPress: () => handleOpenEdit(selectedProyecto) 
    }] : []),
    ...(canDelete ? [{ 
      label: 'Eliminar Proyecto', 
      icon: Trash2, 
      isDestructive: true,
      onPress: () => confirmDelete(selectedProyecto) 
    }] : []),
  ];

  const confirmDelete = (proyecto: any) => {
    setProyectoToDelete(proyecto);
    setDeleteModalVisible(true);
    setMenuVisible(false);
  };

  const handleConfirmDelete = async () => {
    if (!proyectoToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/proyectos/${proyectoToDelete.id}`);
      setDeleteModalVisible(false);
      setTimeout(() => {
        Toast.show({ type: 'success', text1: 'Éxito', text2: 'Proyecto eliminado correctamente', position: 'bottom' });
      }, 300);
      fetchData();
    } catch (e) {
      // Error handled by interceptor
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('Tareas', { proyectoId: item.id, proyectoNombre: item.nombre })}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.nombre.charAt(0)}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.nombre}</Text>
        <View style={styles.row}>
          <Briefcase color="#64748b" size={14} />
          <Text style={styles.subtext}>{item.cliente?.empresa || item.cliente?.nombre || 'Sin cliente'}</Text>
        </View>
        <View style={styles.row}>
          <View style={[
            styles.statusBadge, 
            { 
              backgroundColor: 
                item.estado === 'COMPLETADO' ? '#10b98120' : 
                item.estado === 'EN_PROGRESO' ? '#3b82f620' :
                item.estado === 'CANCELADO' ? '#ef444420' : '#334155' 
            }
          ]}>
            <Text style={[
              styles.statusBadgeText, 
              { 
                color: 
                  item.estado === 'COMPLETADO' ? '#10b981' : 
                  item.estado === 'EN_PROGRESO' ? '#3b82f6' :
                  item.estado === 'CANCELADO' ? '#ef4444' : '#94a3b8' 
              }
            ]}>
              {item.estado.replace('_', ' ')}
            </Text>
          </View>
        </View>
      </View>
      {(canEdit || canDelete) && (
        <TouchableOpacity onPress={() => handleOptions(item)} style={styles.moreButton}>
          <MoreVertical color="#94a3b8" size={20} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={proyectos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            iconName="LayoutDashboard"
            title="Sin proyectos"
            description="Aún no has registrado ningún proyecto. Comienza creando uno nuevo para gestionar tus tareas."
            actionLabel="Crear Proyecto"
            onAction={canCreate ? handleOpenCreate : undefined}
          />
        }
      />

      {canCreate && (
        <TouchableOpacity style={styles.fab} onPress={handleOpenCreate}>
          <Plus color="#fff" size={30} />
        </TouchableOpacity>
      )}

      <ActionMenu 
        isVisible={menuVisible}
        onClose={() => setMenuVisible(false)}
        title={selectedProyecto?.nombre}
        options={menuOptions}
      />

      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditing ? 'Editar Proyecto' : 'Nuevo Proyecto'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color="#94a3b8" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.label}>Nombre del Proyecto</Text>
              <TextInput style={styles.input} value={form.nombre} onChangeText={(t) => setForm({ ...form, nombre: t })} placeholder="Ej. Rediseño Web" placeholderTextColor="#64748b" />

              <Text style={styles.label}>Descripción</Text>
              <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={form.descripcion} onChangeText={(t) => setForm({ ...form, descripcion: t })} placeholder="Breve descripción..." placeholderTextColor="#64748b" multiline />

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <FormDatePicker 
                    label="Fecha Inicio"
                    value={form.fechaInicio}
                    onChange={(val) => setForm({ ...form, fechaInicio: val })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <FormDatePicker 
                    label="Fecha Fin"
                    value={form.fechaFin}
                    onChange={(val) => setForm({ ...form, fechaFin: val })}
                  />
                </View>
              </View>

              <FormSelect 
                label="Cliente"
                options={clientes.map(c => ({ 
                  label: c.empresa ? `${c.nombre} - ${c.empresa}` : c.nombre, 
                  value: c.id 
                }))}
                value={form.clienteId}
                onSelect={(val) => setForm({ ...form, clienteId: val })}
              />

              <FormSelect 
                label="Estado"
                options={[
                  { label: 'PLANIFICADO', value: 'PLANIFICADO' },
                  { label: 'EN PROGRESO', value: 'EN_PROGRESO' },
                  { label: 'COMPLETADO', value: 'COMPLETADO' },
                  { label: 'CANCELADO', value: 'CANCELADO' }
                ]}
                value={form.estado}
                onSelect={(val) => setForm({ ...form, estado: val })}
              />

              <TouchableOpacity style={[styles.submitButton, saving && { opacity: 0.7 }]} onPress={handleSubmit} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>{isEditing ? 'Guardar Cambios' : 'Crear Proyecto'}</Text>
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
        title="Eliminar Proyecto"
        message={`¿Estás seguro de que deseas eliminar el proyecto "${proyectoToDelete?.nombre}"? Se perderán las tareas y toda la información asociada.`}
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
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f620',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#3b82f6',
    fontSize: 18,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  subtext: {
    color: '#94a3b8',
    fontSize: 13,
    marginLeft: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  moreButton: {
    padding: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#3b82f6',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  label: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
    fontWeight: '600',
    marginTop: 10,
  },
  input: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  selectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  selectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  selectorItemSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#3b82f610',
  },
  selectorItemText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  selectorItemTextSelected: {
    color: '#3b82f6',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
