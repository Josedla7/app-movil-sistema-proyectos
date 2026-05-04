import api from '../api/api.config';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import dayjs from 'dayjs';
import Toast from 'react-native-toast-message';

export const generateProjectReport = async (proyectoId: number, proyectoNombre: string, isCliente: boolean = false) => {
  try {
    const res = await api.get(`/reportes/proyecto/${proyectoId}`);
    
    let rawData = res.data;
    if (rawData.data) rawData = rawData.data;
    const data = rawData;

    const tasksList = data.tareas || [];
    const stats = data.stats || {};
    const teamPerformance = data.rendimientoEquipo || [];
    const deadlines = data.proximosVencimientos || [];

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica', Arial, sans-serif; padding: 40px; color: #334155; line-height: 1.5; background-color: #ffffff; }
            .header { border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; margin: 0; color: #0f172a; }
            .subtitle { font-size: 10px; color: #64748b; margin-top: 5px; text-transform: uppercase; letter-spacing: 1px; }
            
            .stats-container { display: flex; justify-content: space-between; margin-bottom: 30px; gap: 10px; }
            .stat-card { flex: 1; padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
            .stat-label { font-size: 8px; color: #64748b; margin-bottom: 4px; text-transform: uppercase; font-weight: bold; }
            .stat-value { font-size: 18px; font-weight: bold; color: #0f172a; }
            
            .section { margin-bottom: 30px; }
            .section-title { font-size: 14px; font-weight: bold; color: #3b82f6; margin-bottom: 20px; text-transform: uppercase; }
            
            .detail-grid { display: flex; flex-wrap: wrap; gap: 15px; }
            .grid-item { width: 45%; margin-bottom: 10px; }
            .label { font-size: 8px; color: #64748b; text-transform: uppercase; margin-bottom: 2px; font-weight: bold; }
            .value { font-size: 10px; font-weight: bold; color: #0f172a; }
            
            /* Estilos exactos de la tabla según la imagen */
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { text-align: left; background-color: #f1f5f9; padding: 12px 15px; font-size: 10px; color: #475569; font-weight: bold; border: none; }
            td { padding: 12px 15px; border-bottom: 1px solid #f1f5f9; font-size: 10px; color: #334155; vertical-align: middle; }
            
            .performance-grid { display: flex; flex-wrap: wrap; gap: 10px; }
            .performance-card { flex: 1; min-width: 30%; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; }
            .perf-name { font-size: 10px; font-weight: bold; color: #0f172a; margin-bottom: 4px; }
            .perf-stat { font-size: 9px; color: #64748b; }
            
            .deadline-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px dotted #e2e8f0; }
            .deadline-title { font-size: 10px; color: #1e293b; }
            .deadline-date { font-size: 10px; color: #ef4444; font-weight: bold; }

            .empty-msg { text-align: center; color: #94a3b8; padding: 20px; font-size: 10px; border: 1px solid #f1f5f9; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">Reporte de Proyecto</h1>
            <p class="subtitle">${proyectoNombre} - ${dayjs().format('DD/MM/YYYY')}</p>
          </div>

          <div class="stats-container">
            <div class="stat-card">
              <div class="stat-label">Tareas Completadas</div>
              <div class="stat-value">${stats.completadas || 0}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">En Ejecución</div>
              <div class="stat-value">${stats.enProgreso || 0}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Total Tareas</div>
              <div class="stat-value">${stats.total || 0}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Detalles del Proyecto</div>
            <div class="detail-grid">
              <div class="grid-item">
                <div class="label">Estado</div>
                <div class="value">${data.proyecto?.estado || 'N/A'}</div>
              </div>
              <div class="grid-item">
                <div class="label">Fecha Inicio</div>
                <div class="value">${data.proyecto?.fechaInicio ? dayjs(data.proyecto.fechaInicio).format('DD/MM/YYYY') : 'N/A'}</div>
              </div>
              <div class="grid-item">
                <div class="label">Fin Estimado</div>
                <div class="value">${data.proyecto?.fechaFin ? dayjs(data.proyecto.fechaFin).format('DD/MM/YYYY') : 'No definida'}</div>
              </div>
              <div class="grid-item">
                <div class="label">Cliente</div>
                <div class="value">${data.proyecto?.cliente || 'N/A'}</div>
              </div>
            </div>
          </div>

          ${!isCliente && teamPerformance.length > 0 ? `
            <div class="section">
              <div class="section-title">Rendimiento del Equipo</div>
              <div class="performance-grid">
                ${teamPerformance.map((p: any) => `
                  <div class="performance-card">
                    <div class="perf-name">${p.nombre}</div>
                    <div class="perf-stat">Tareas: <b>${p.total}</b></div>
                    <div class="perf-stat">Completas: <b>${p.completadas}</b></div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div class="section">
            <div class="section-title">LISTADO DE TAREAS</div>
            ${tasksList.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th style="width: 55%">Tarea</th>
                    <th style="width: 20%">Estado</th>
                    <th style="width: 25%">Responsable</th>
                  </tr>
                </thead>
                <tbody>
                  ${tasksList.map((t: any) => `
                    <tr>
                      <td>${t.titulo}</td>
                      <td>${t.estado}</td>
                      <td>${t.responsable || 'S/A'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : `
              <div class="empty-msg">No se encontraron tareas registradas.</div>
            `}
          </div>

          <div style="margin-top: 50px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            <p style="font-size: 8px; color: #94a3b8; text-transform: uppercase;">Reporte Oficial de Administración</p>
          </div>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    const fileName = `Reporte_${proyectoNombre.replace(/\s+/g, '_')}_${dayjs().format('YYYYMMDD')}.pdf`;

    if (Platform.OS === 'android') {
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      
      if (permissions.granted) {
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        const createdFileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          fileName,
          'application/pdf'
        );
        
        await FileSystem.writeAsStringAsync(createdFileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
        Toast.show({ type: 'success', text1: 'Éxito', text2: 'Reporte guardado correctamente' });
      } else {
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      }
    } else {
      const newUri = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.moveAsync({ from: uri, to: newUri });
      await Sharing.shareAsync(newUri, { UTI: '.pdf', mimeType: 'application/pdf' });
      Toast.show({ type: 'success', text1: 'Éxito', text2: 'Reporte generado' });
    }
    
  } catch (error) {
    console.error('Error generando reporte:', error);
    Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo generar el reporte' });
    throw error;
  }
};
