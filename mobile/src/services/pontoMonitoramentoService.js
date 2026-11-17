import api from './api';
import { API_ENDPOINTS } from '../config/apiConfig';

export async function listarPontosMonitoramento() {
  const response = await api.get(API_ENDPOINTS.pontosMonitoramento);
  return Array.isArray(response.data) ? response.data : [];
}

export async function obterPontoMonitoramentoPorId(id) {
  if (!id || Number(id) <= 0) {
    throw new Error('ID do ponto de monitoramento inválido.');
  }

  const response = await api.get(`${API_ENDPOINTS.pontosMonitoramento}/${id}`);
  return response.data;
}
