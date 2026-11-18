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

export async function listarTodosPontosMonitoramento() {
  const response = await api.get(`${API_ENDPOINTS.pontosMonitoramento}/todos`);
  return Array.isArray(response.data) ? response.data : [];
}

export async function criarPontoMonitoramento(dados) {
  const response = await api.post(API_ENDPOINTS.pontosMonitoramento, prepararPonto(dados));
  return response.data;
}

export async function atualizarPontoMonitoramento(id, dados) {
  const response = await api.put(`${API_ENDPOINTS.pontosMonitoramento}/${id}`, prepararPonto(dados));
  return response.data;
}

export async function desativarPontoMonitoramento(id) {
  await api.delete(`${API_ENDPOINTS.pontosMonitoramento}/${id}`);
}

function prepararPonto(dados) {
  const converterDecimal = (valor) => valor === '' || valor == null ? null : Number(valor);
  return {
    codigo: String(dados.codigo || '').trim(),
    nome: String(dados.nome || '').trim(),
    descricao: String(dados.descricao || '').trim() || null,
    logradouro: String(dados.logradouro || '').trim() || null,
    bairro: String(dados.bairro || '').trim() || null,
    cidade: String(dados.cidade || '').trim() || null,
    uf: String(dados.uf || '').trim().toUpperCase() || null,
    latitude: converterDecimal(dados.latitude),
    longitude: converterDecimal(dados.longitude),
    ...(dados.ativo !== undefined ? { ativo: Boolean(dados.ativo) } : {}),
  };
}
