import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, ScrollView } from 'react-native';
import api from '../../api/api.config';
import { User, Phone, Mail, Plus, MoreVertical, Edit, Trash2, X } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/AuthContext';
import ActionMenu, { MenuOption } from '../../components/ActionMenu';
import ConfirmModal from '../../components/ConfirmModal';
import EmptyState from '../../components/EmptyState';

export default function ClientesScreen() {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<any>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    empresa: ''
  });
  const [saving, setSaving] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const canEdit = user?.permisos?.includes('EDITAR_CLIENTE');
  const canDelete = user?.permisos?.includes('ELIMINAR_CLIENTE');
  const canCreate = user?.permisos?.includes('CREAR_CLIENTE');

  const fetchClientes = async () => {
    try {
      const res = await api.get('/clientes');
      const responseData = res.data.data;
      const clientesArray = responseData.data || responseData;
      setClientes(Array.isArray(clientesArray) ? clientesArray : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setForm({ nombre: '', correo: '', telefono: '', empresa: '' });
    setIsEditing(false);
    setModalVisible(true);
  };

  const handleOpenEdit = (cliente: any) => {
    setForm({
      nombre: cliente.nombre,
      correo: cliente.correo,
      telefono: cliente.telefono || '',
      empresa: cliente.empresa || ''
    });
    setIsEditing(true);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!form.nombre || !form.correo) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Nombre y correo son obligatorios', position: 'top' });
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await api.patch(`/clientes/${selectedCliente.id}`, form);
      } else {
        await api.post('/clientes', form);
      }
      setModalVisible(false);
      setTimeout(() => {
        Toast.show({ type: 'success', text1: 'Éxito', text2: isEditing ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente', position: 'top' });
      }, 300);
      fetchClientes();
    } catch (error) {
      // Error handled by interceptor
    } finally {
      setSaving(false);
    }
  };

  const handleOptions = (cliente: any) => {
    setSelectedCliente(cliente);
    setMenuVisible(true);
  };

  const menuOptions: MenuOption[] = [
    ...(canEdit ? [{
      label: 'Editar Cliente',
      icon: Edit,
      onPress: () => handleOpenEdit(selectedCliente)
    }] : []),
    ...(canDelete ? [{
      label: 'Eliminar Cliente',
      icon: Trash2,
      isDestructive: true,
      onPress: () => confirmDelete(selectedCliente)
    }] : []),
  ];

  const confirmDelete = (cliente: any) => {
    setClienteToDelete(cliente);
    setDeleteModalVisible(true);
    setMenuVisible(false);
  };

  const handleConfirmDelete = async () => {
    if (!clienteToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/clientes/${clienteToDelete.id}`);
      setDeleteModalVisible(false);
      setTimeout(() => {
        Toast.show({ type: 'success', text1: 'Éxito', text2: 'Cliente eliminado correctamente', position: 'top' });
      }, 300);
      fetchClientes();
    } catch (e) {
      // Error handled by interceptor
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.nombre.charAt(0)}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.nombre}</Text>
        <View style={styles.row}>
          <Mail color="#64748b" size={14} />
          <Text style={styles.subtext}>{item.correo}</Text>
        </View>
        {item.empresa && (
          <View style={styles.row}>
            <Text style={styles.empresaBadge}>{item.empresa}</Text>
          </View>
        )}
      </View>
      {(canEdit || canDelete) && (
        <TouchableOpacity onPress={() => handleOptions(item)} style={styles.moreButton}>
          <MoreVertical color="#94a3b8" size={20} />
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={clientes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            iconName="Users"
            title="Sin clientes"
            description="Tu base de datos de clientes está vacía. Registra a tu primer cliente para comenzar."
            actionLabel="Registrar Cliente"
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
        title={selectedCliente?.nombre}
        options={menuOptions}
      />

      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color="#94a3b8" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.label}>Nombre Completo</Text>
              <TextInput
                style={styles.input}
                value={form.nombre}
                onChangeText={(text) => setForm({ ...form, nombre: text })}
                placeholder="Ej. Juan Pérez"
                placeholderTextColor="#64748b"
              />

              <Text style={styles.label}>Correo Electrónico</Text>
              <TextInput
                style={styles.input}
                value={form.correo}
                onChangeText={(text) => setForm({ ...form, correo: text })}
                placeholder="ejemplo@correo.com"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
              />

              <Text style={styles.label}>Empresa</Text>
              <TextInput
                style={styles.input}
                value={form.empresa}
                onChangeText={(text) => setForm({ ...form, empresa: text })}
                placeholder="Nombre de la empresa"
                placeholderTextColor="#64748b"
              />

              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                style={styles.input}
                value={form.telefono}
                onChangeText={(text) => setForm({ ...form, telefono: text })}
                placeholder="+34 600 000 000"
                placeholderTextColor="#64748b"
                keyboardType="phone-pad"
              />

              <TouchableOpacity style={[styles.submitButton, saving && { opacity: 0.7 }]} onPress={handleSubmit} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isEditing ? 'Guardar Cambios' : 'Crear Cliente'}
                  </Text>
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
        title="Eliminar Cliente"
        message={`¿Estás seguro de que deseas eliminar al cliente "${clienteToDelete?.nombre}"? Esta acción eliminará también sus proyectos asociados y no se puede deshacer.`}
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
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3b82f620',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  avatarText: { color: '#3b82f6', fontSize: 20, fontWeight: 'bold' },
  info: { flex: 1 },
  moreButton: { padding: 8, marginRight: -8 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  subtext: { color: '#94a3b8', fontSize: 13, marginLeft: 6 },
  empresaBadge: {
    backgroundColor: '#f59e0b20',
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
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
  },
  input: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
