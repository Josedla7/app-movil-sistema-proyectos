import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Download, RefreshCw, X, CheckCircle, AlertCircle } from 'lucide-react-native';
import { checkForUpdates, downloadAndInstallApk, UpdateInfo } from '../services/updateService';
import Constants from 'expo-constants';

export default function UpdateChecker() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const slideAnim = useRef(new Animated.Value(-100)).current;

  const currentVersion = Constants.expoConfig?.version || '1.0.0';

  useEffect(() => {
    const check = async () => {
      const info = await checkForUpdates(currentVersion);
      if (info.available) {
        setUpdateInfo(info);
        // Animación de entrada del banner
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
        }).start();
      }
    };
    const timer = setTimeout(check, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleDownload = async () => {
    if (!updateInfo?.downloadUrl) return;
    setDownloading(true);
    setProgress(0);
    setDone(false);

    await downloadAndInstallApk(updateInfo.downloadUrl, (p) => {
      setProgress(p);
      if (p >= 100) setDone(true);
    });

    setDownloading(false);
    setModalVisible(false);
  };

  if (!updateInfo) return null;

  return (
    <>
      {/* Banner de actualización */}
      <Animated.View style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.bannerContent}>
          <RefreshCw color="#3b82f6" size={16} />
          <Text style={styles.bannerText}>
            Nueva versión <Text style={styles.versionBold}>v{updateInfo.latestVersion}</Text> disponible
          </Text>
        </View>
        <TouchableOpacity style={styles.bannerBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.bannerBtnText}>Actualizar</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Modal de actualización */}
      <Modal transparent animationType="fade" visible={modalVisible} onRequestClose={() => !downloading && setModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.iconCircle}>
                <Download color="#3b82f6" size={28} />
              </View>
              {!downloading && (
                <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                  <X color="#64748b" size={20} />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.modalTitle}>Actualización disponible</Text>
            <View style={styles.versionRow}>
              <Text style={styles.versionChip}>v{updateInfo.currentVersion}</Text>
              <Text style={styles.arrow}>→</Text>
              <Text style={[styles.versionChip, styles.versionChipNew]}>v{updateInfo.latestVersion}</Text>
            </View>

            <Text style={styles.notesLabel}>Novedades:</Text>
            <Text style={styles.notes} numberOfLines={5}>{updateInfo.releaseNotes}</Text>

            {/* Barra de progreso */}
            {downloading && (
              <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.progressText}>{done ? '¡Listo!' : `Descargando... ${progress}%`}</Text>
              </View>
            )}

            {/* Botón */}
            {!downloading ? (
              <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload}>
                <Download color="#fff" size={18} />
                <Text style={styles.downloadBtnText}>Descargar e instalar</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.downloadingRow}>
                {done ? (
                  <CheckCircle color="#10b981" size={22} />
                ) : (
                  <ActivityIndicator color="#3b82f6" />
                )}
                <Text style={styles.downloadingText}>
                  {done ? 'Abriendo instalador...' : 'Por favor espera...'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#3b82f630',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bannerContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bannerText: { color: '#94a3b8', fontSize: 12 },
  versionBold: { color: '#3b82f6', fontWeight: 'bold' },
  bannerBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  bannerBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  overlay: {
    flex: 1,
    backgroundColor: '#00000080',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: '#1e293b',
    borderRadius: 28,
    padding: 28,
    width: '100%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#3b82f615',
    borderWidth: 1,
    borderColor: '#3b82f630',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: { padding: 4 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 12 },
  versionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  versionChip: {
    backgroundColor: '#334155',
    color: '#94a3b8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 'bold',
  },
  versionChipNew: { backgroundColor: '#3b82f620', color: '#3b82f6' },
  arrow: { color: '#64748b', fontSize: 16 },
  notesLabel: { color: '#64748b', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  notes: { color: '#94a3b8', fontSize: 13, lineHeight: 20, marginBottom: 24 },

  progressContainer: { marginBottom: 20 },
  progressTrack: { height: 6, backgroundColor: '#0f172a', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 3 },
  progressText: { color: '#64748b', fontSize: 12, textAlign: 'center' },

  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 16,
  },
  downloadBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  downloadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  downloadingText: { color: '#94a3b8', fontSize: 14 },
});
