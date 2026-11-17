import api from './api';
import { API_ENDPOINTS } from '../config/apiConfig';

export async function listarAlertas(status) {
  const response = await api.get(API_ENDPOINTS.alertas, {
    params: status ? { status } : undefined,
  });

  return Array.isArray(response.data) ? response.data : [];
}

export async function obterAlertaPorId(id) {
  if (!id || Number(id) <= 0) {
    throw new Error('ID do alerta inválido.');
  }

  const response = await api.get(`${API_ENDPOINTS.alertas}/${id}`);
  return response.data;
}
