import api from './api';
import { API_ENDPOINTS } from '../config/apiConfig';

function normalizarOcorrencia(item) {
  return {
    idOcorrencia: item?.idOcorrencia ?? item?.IdOcorrencia,
    idUsuario: item?.idUsuario ?? item?.IdUsuario,
    nomeUsuario: item?.nomeUsuario ?? item?.NomeUsuario ?? '',
    idPonto: item?.idPonto ?? item?.IdPonto ?? null,
    nomePonto: item?.nomePonto ?? item?.NomePonto ?? null,
    tipo: item?.tipo ?? item?.Tipo ?? '',
    titulo: item?.titulo ?? item?.Titulo ?? '',
    descricao: item?.descricao ?? item?.Descricao ?? '',
    logradouro: item?.logradouro ?? item?.Logradouro ?? null,
    bairro: item?.bairro ?? item?.Bairro ?? null,
    cidade: item?.cidade ?? item?.Cidade ?? null,
    uf: item?.uf ?? item?.Uf ?? null,
    latitude: item?.latitude ?? item?.Latitude ?? null,
    longitude: item?.longitude ?? item?.Longitude ?? null,
    status: String(item?.status ?? item?.Status ?? 'ABERTA').toUpperCase(),
    dataCriacao: item?.dataCriacao ?? item?.DataCriacao ?? null,
    dataAtualizacao: item?.dataAtualizacao ?? item?.DataAtualizacao ?? null,
  };
}

export async function listarOcorrencias({ status, idPonto } = {}) {
  const response = await api.get(API_ENDPOINTS.ocorrencias, {
    params: {
      ...(status ? { status } : {}),
      ...(idPonto ? { idPonto } : {}),
    },
  });

  if (!Array.isArray(response.data)) {
    throw new Error('A API retornou uma lista de ocorrências em formato inesperado.');
  }

  return response.data.map(normalizarOcorrencia);
}

export async function obterOcorrenciaPorId(id) {
  if (!id || Number(id) <= 0) {
    throw new Error('ID da ocorrência inválido.');
  }

  const response = await api.get(`${API_ENDPOINTS.ocorrencias}/${id}`);
  return normalizarOcorrencia(response.data);
}

function prepararPayload(dados) {
  return {
    tipo: String(dados.tipo || '').trim().toUpperCase(),
    titulo: String(dados.titulo || '').trim(),
    descricao: String(dados.descricao || '').trim(),
    idPonto: dados.idPonto ? Number(dados.idPonto) : null,
    logradouro: String(dados.logradouro || '').trim() || null,
    bairro: String(dados.bairro || '').trim() || null,
    cidade: String(dados.cidade || '').trim() || null,
    uf: String(dados.uf || '').trim().toUpperCase() || null,
    latitude: dados.latitude === '' || dados.latitude == null ? null : Number(dados.latitude),
    longitude: dados.longitude === '' || dados.longitude == null ? null : Number(dados.longitude),
    ...(dados.status ? { status: String(dados.status).trim().toUpperCase() } : {}),
  };
}

export async function criarOcorrencia(dados) {
  const response = await api.post(API_ENDPOINTS.ocorrencias, prepararPayload(dados));
  return normalizarOcorrencia(response.data);
}

export async function atualizarOcorrencia(id, dados) {
  if (!id || Number(id) <= 0) {
    throw new Error('ID da ocorrência inválido.');
  }

  const response = await api.put(
    `${API_ENDPOINTS.ocorrencias}/${id}`,
    prepararPayload(dados),
  );
  return normalizarOcorrencia(response.data);
}

export async function excluirOcorrencia(id) {
  if (!id || Number(id) <= 0) {
    throw new Error('ID da ocorrência inválido.');
  }

  await api.delete(`${API_ENDPOINTS.ocorrencias}/${id}`);
}
