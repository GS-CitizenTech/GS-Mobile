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

export async function criarAlerta(dados) {
  const response = await api.post(API_ENDPOINTS.alertas, prepararAlerta(dados, true));
  return response.data;
}

export async function atualizarAlerta(id, dados) {
  const response = await api.put(`${API_ENDPOINTS.alertas}/${id}`, prepararAlerta(dados, false));
  return response.data;
}

export async function excluirAlerta(id) {
  await api.delete(`${API_ENDPOINTS.alertas}/${id}`);
}

function prepararAlerta(dados, incluirLeitura) {
  const probabilidade = dados.probabilidade === '' || dados.probabilidade == null
    ? null : Number(dados.probabilidade);
  return {
    ...(incluirLeitura ? { idLeitura: Number(dados.idLeitura) } : {}),
    classificacao: String(dados.classificacao || 'MODERADO').trim().toUpperCase(),
    probabilidade,
    mensagemExplicativa: String(dados.mensagemExplicativa || '').trim() || null,
    tipoMensagem: String(dados.tipoMensagem || '').trim() || null,
    modeloMl: String(dados.modeloMl || '').trim() || null,
    ...(!incluirLeitura ? { status: String(dados.status || 'ATIVO').trim().toUpperCase() } : {}),
  };
}
