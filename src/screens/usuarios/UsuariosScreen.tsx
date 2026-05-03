import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import api from '../../api/api.config';
import { Plus, MoreVertical, Edit, Trash2, X, Check } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/AuthContext';
import ActionMenu, { MenuOption } from '../../components/ActionMenu';
import FormSelect from '../../components/FormSelect';
import ConfirmModal from '../../components/ConfirmModal';

export default function UsuariosScreen() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<any>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    correo: '',
    contrasena: '',
    rolId: null as number | null
  });
  const [saving, setSaving] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const canEdit = user?.permisos?.includes('EDITAR_USUARIO');
  const canDelete = user?.permisos?.includes('ELIMINAR_USUARIO');
  const canCreate = user?.permisos?.includes('CREAR_USUARIO');

  const fetchData = async () => {
    try {
      const [uRes, rRes] = await Promise.all([
        api.get('/usuarios'),
        api.get('/roles')
      ]);
      
      const uData = uRes.data.data;
      setUsuarios(Array.isArray(uData.data || uData) ? (uData.data || uData) : []);
      
      const rData = rRes.data.data;
      setRoles(Array.isArray(rData.data || rData) ? (rData.data || rData) : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setForm({ nombre: '', correo: '', contrasena: '', rolId: roles[0]?.id || null });
    setIsEditing(false);
    setModalVisible(true);
  };

  const handleOpenEdit = (u: any) => {
    setSelectedUsuario(u);
    setForm({
      nombre: u.nombre,
      correo: u.correo,
      contrasena: '',
      rolId: u.rolId
    });
    setIsEditing(true);
    setModalVisible(true);
    setMenuVisible(false);
  };

  const handleSubmit = async () => {
    if (!form.nombre || !form.correo || (!isEditing && !form.contrasena) || !form.rolId) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Todos los campos son obligatorios', position: 'bottom' });
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        const { contrasena, ...updateData } = form;
        await api.patch(`/usuarios/${selectedUsuario.id}`, updateData);
      } else {
        await api.post('/auth/registro', form);
      }
      setModalVisible(false);
      setTimeout(() => {
        Toast.show({ type: 'success', text1: 'Éxito', text2: isEditing ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente', position: 'bottom' });
      }, 300);
      fetchData();
    } catch (error) {
      // Error handled by interceptor
    } finally {
      setSaving(false);
    }
  };

  const handleOptions = (u: any) => {
    setSelectedUsuario(u);
    setMenuVisible(true);
  };

  const menuOptions: MenuOption[] = [
    ...(canEdit ? [{ 
      label: 'Editar Usuario', 
      icon: Edit, 
      onPress: () => handleOpenEdit(selectedUsuario) 
    }] : []),
    ...(canDelete ? [{ 
      label: 'Eliminar Usuario', 
      icon: Trash2, 
      isDestructive: true,
      onPress: () => confirmDelete(selectedUsuario) 
    }] : []),
  ];

  const confirmDelete = (u: any) => {
    setUserToDelete(u);
    setDeleteModalVisible(true);
    setMenuVisible(false);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/usuarios/${userToDelete.id}`);
      setDeleteModalVisible(false);
      setTimeout(() => {
        Toast.show({ type: 'success', text1: 'Éxito', text2: 'Usuario eliminado correctamente', position: 'bottom' });
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
    <View style={styles.card}>
      <View style={styles.cardMain}>
        <View style={styles.info}>
          <View style={styles.header}>
            <Text style={styles.name}>{item.nombre}</Text>
            <View style={[styles.badge, { backgroundColor: item.rol?.nombre === 'ADMIN' ? '#ef444420' : '#10b98120' }]}>
              <Text style={[styles.badgeText, { color: item.rol?.nombre === 'ADMIN' ? '#ef4444' : '#10b981' }]}>
                {item.rol?.nombre}
              </Text>
            </View>
          </View>
          <Text style={styles.email}>{item.correo}</Text>
        </View>
        {(canEdit || canDelete) && (
          <TouchableOpacity onPress={() => handleOptions(item)} style={styles.moreButton}>
            <MoreVertical color="#94a3b8" size={20} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={usuarios}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
      />
      {canCreate && (
        <TouchableOpacity style={styles.fab} onPress={handleOpenCreate}>
          <Plus color="#fff" size={30} />
        </TouchableOpacity>
      )}

      <ActionMenu 
        isVisible={menuVisible}
        onClose={() => setMenuVisible(false)}
        title={selectedUsuario?.nombre}
        options={menuOptions}
      />

      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color="#94a3b8" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.label}>Nombre</Text>
              <TextInput style={styles.input} value={form.nombre} onChangeText={(t) => setForm({ ...form, nombre: t })} placeholder="Nombre del usuario" placeholderTextColor="#64748b" />

              <Text style={styles.label}>Correo</Text>
              <TextInput style={styles.input} value={form.correo} onChangeText={(t) => setForm({ ...form, correo: t })} placeholder="usuario@correo.com" placeholderTextColor="#64748b" keyboardType="email-address" autoCapitalize="none" />

              {!isEditing && (
                <>
                  <Text style={styles.label}>Contraseña</Text>
                  <TextInput style={styles.input} value={form.contrasena} onChangeText={(t) => setForm({ ...form, contrasena: t })} placeholder="Contraseña segura" placeholderTextColor="#64748b" secureTextEntry />
                </>
              )}

              <FormSelect 
                label="Rol"
                options={roles.map(r => ({ label: r.nombre, value: r.id }))}
                value={form.rolId}
                onSelect={(val) => setForm({ ...form, rolId: val })}
              />

              <TouchableOpacity style={[styles.submitButton, saving && { opacity: 0.7 }]} onPress={handleSubmit} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>{isEditing ? 'Actualizar Usuario' : 'Crear Usuario'}</Text>
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
        title="Eliminar Usuario"
        message={`¿Estás seguro de que deseas eliminar al usuario "${userToDelete?.nombre}"? Esta acción no se puede deshacer.`}
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
    padding: 16, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#334155' 
  },
  cardMain: { flexDirection: 'row', alignItems: 'center' },
  info: { flex: 1 },
  moreButton: { padding: 4, marginRight: -8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  email: { color: '#94a3b8', fontSize: 14 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
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
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  roleOptionSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#3b82f610',
  },
  roleOptionText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  roleOptionTextSelected: {
    color: '#3b82f6',
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
