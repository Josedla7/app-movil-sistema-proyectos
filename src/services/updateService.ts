import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform, Alert } from 'react-native';

const GITHUB_OWNER = 'Josedla7';
const GITHUB_REPO = 'app-movil-sistema-proyectos';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;

export interface UpdateInfo {
  available: boolean;
  latestVersion: string;
  currentVersion: string;
  downloadUrl: string;
  releaseNotes: string;
}

const isNewerVersion = (latest: string, current: string): boolean => {
  const latestParts = latest.replace(/^v/, '').split('.').map(Number);
  const currentParts = current.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const l = latestParts[i] ?? 0;
    const c = currentParts[i] ?? 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
};

export const checkForUpdates = async (currentVersion: string): Promise<UpdateInfo> => {
  try {
    const response = await fetch(GITHUB_API_URL, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });
    if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
    const data = await response.json();
    const latestVersion = data.tag_name?.replace(/^v/, '') || '0.0.0';
    const apkAsset = data.assets?.find((a: any) => a.name?.toLowerCase().endsWith('.apk'));
    return {
      available: isNewerVersion(latestVersion, currentVersion),
      latestVersion,
      currentVersion,
      downloadUrl: apkAsset?.browser_download_url || '',
      releaseNotes: data.body || 'Nueva versión disponible.',
    };
  } catch {
    return { available: false, latestVersion: currentVersion, currentVersion, downloadUrl: '', releaseNotes: '' };
  }
};

export const downloadAndInstallApk = async (
  downloadUrl: string,
  onProgress?: (progress: number) => void
): Promise<void> => {
  if (Platform.OS !== 'android') {
    Alert.alert('Solo Android', 'Las actualizaciones automáticas solo están disponibles en Android.');
    return;
  }
  if (!downloadUrl) {
    Alert.alert('Error', 'No se encontró el archivo APK en el release.');
    return;
  }
  const fileUri = FileSystem.documentDirectory + 'update.apk';
  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (fileInfo.exists) await FileSystem.deleteAsync(fileUri);
    const downloadResumable = FileSystem.createDownloadResumable(
      downloadUrl,
      fileUri,
      {},
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        onProgress?.(Math.round(progress * 100));
      }
    );
    const result = await downloadResumable.downloadAsync();
    if (!result?.uri) throw new Error('Descarga fallida');
    const contentUri = await FileSystem.getContentUriAsync(result.uri);
    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: contentUri,
      flags: 1,
      type: 'application/vnd.android.package-archive',
    });
  } catch (error: any) {
    Alert.alert('Error de descarga', error.message || 'No se pudo descargar la actualización.');
  }
};
