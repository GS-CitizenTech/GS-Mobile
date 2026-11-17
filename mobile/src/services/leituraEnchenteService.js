import api from './api';
import { API_ENDPOINTS } from '../config/apiConfig';

/**
 * Lista as leituras da API, opcionalmente filtradas por ponto de monitoramento.
 * A API já retorna os registros da medição mais recente para a mais antiga.
 */
export async function listarLeiturasEnchente(idPonto) {
  if (idPonto !== undefined && idPonto !== null) {
    const numericPointId = Number(idPonto);
    if (!Number.isSafeInteger(numericPointId) || numericPointId <= 0) {
      throw new Error('ID do ponto de monitoramento inválido.');
    }
  }

  const response = await api.get(API_ENDPOINTS.leiturasEnchente, {
    params: idPonto !== undefined && idPonto !== null ? { idPonto } : undefined,
  });

  return Array.isArray(response.data) ? response.data : [];
}

/** Consulta uma leitura específica pelo identificador. */
export async function obterLeituraEnchentePorId(id) {
  const numericId = Number(id);
  if (!Number.isSafeInteger(numericId) || numericId <= 0) {
    throw new Error('ID da leitura de enchente inválido.');
  }

  const response = await api.get(`${API_ENDPOINTS.leiturasEnchente}/${id}`);
  return response.data;
}
