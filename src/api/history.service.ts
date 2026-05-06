import api from './api.config';

export interface HistoryItem {
  id: number;
  accion?: string;
  campo?: string;
  entidadNombre: string;
  tipo: string;
  usuarioId: number;
  usuario: any;
  creadoEn: string;
  valorAntes?: string;
  valorDespues?: string;
  proyectoNombre?: string;
  nombreProyecto?: string;
  tareaId?: number;
  nombreTarea?: string;
  clienteNombre?: string;
  nombreCliente?: string;
}

export interface HistoryResponse {
  data: HistoryItem[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface ProjectHistoryItem {
  id: number;
  proyecto_id: number;
  proyecto_nombre: string;
  accion: string;
  descripcion: string;
  usuario_nombre: string;
  fecha_creacion: string;
  estado_anterior?: string;
  estado_nuevo?: string;
}

export interface ProjectHistoryResponse {
  data: ProjectHistoryItem[];
  total?: number;
  page?: number;
  limit?: number;
}

class HistoryService {
  async getSystemHistory(page: number = 1, limit: number = 20): Promise<HistoryResponse> {
    try {
      const response = await api.get(`/proyectos/historial/global?page=${page}&limit=${limit}`);
      console.log('System history response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching system history:', error);
      throw error;
    }
  }

  async getEntityHistory(entityType: string, entityId: number, page: number = 1): Promise<HistoryResponse> {
    try {
      if (entityType === 'proyecto') {
        const response = await api.get(`/proyectos/${entityId}/historial?page=${page}&limit=20`);
        console.log('Project entity history response:', response.data);
        return response.data;
      } else {
        const response = await api.get(`/proyectos/historial/global?${entityType}Id=${entityId}&page=${page}&limit=20`);
        console.log('Entity history response:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching entity history:', error);
      throw error;
    }
  }

  async getProjectHistory(userId: number, page: number = 1): Promise<ProjectHistoryResponse> {
    try {
      const response = await api.get(`/proyectos/historial/global?page=${page}&limit=20`);
      console.log('Project history response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching project history:', error);
      throw error;
    }
  }

  async getTaskHistory(userId: number, page: number = 1): Promise<HistoryResponse> {
    try {
      const response = await api.get(`/proyectos/historial/global?page=${page}&limit=20`);
      console.log('Task history response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching task history:', error);
      throw error;
    }
  }

  async getAssignedProjectHistory(userId: number, page: number = 1): Promise<ProjectHistoryResponse> {
    try {
      const response = await api.get(`/proyectos/historial/global?page=${page}&limit=20`);
      console.log('Assigned project history response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching assigned project history:', error);
      throw error;
    }
  }

  async searchHistory(query: string, page: number = 1): Promise<HistoryResponse> {
    try {
      const response = await api.get(`/proyectos/historial/global?page=${page}&limit=20`);
      console.log('Search history response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error searching history:', error);
      throw error;
    }
  }

  async getSystemHistoryByUrl(url: string): Promise<HistoryResponse> {
    try {
      const response = await api.get(url);
      console.log('System history by URL response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching system history by URL:', error);
      throw error;
    }
  }

  async getClientes(): Promise<any> {
    try {
      const response = await api.get('/clientes?limit=100');
      console.log('Clientes response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching clientes:', error);
      throw error;
    }
  }

  async getProyectos(url: string): Promise<any> {
    try {
      const response = await api.get(url);
      console.log('Proyectos response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching proyectos:', error);
      throw error;
    }
  }

  async getTareas(url: string): Promise<any> {
    try {
      const response = await api.get(url);
      console.log('Tareas response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching tareas:', error);
      throw error;
    }
  }
}

export default new HistoryService();
