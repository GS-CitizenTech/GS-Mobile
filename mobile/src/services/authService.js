import api from './api';
import tokenStorage from './tokenStorage';
import { API_ENDPOINTS } from '../config/apiConfig';

function normalizeUser(data) {
  return {
    idUsuario: data?.idUsuario ?? data?.IdUsuario,
    nome: data?.nome ?? data?.Nome ?? '',
    email: data?.email ?? data?.Email ?? '',
    perfil: String(data?.perfil ?? data?.Perfil ?? 'CIDADAO').toUpperCase(),
    telefone: data?.telefone ?? data?.Telefone ?? null,
    ativo: data?.ativo ?? data?.Ativo ?? true,
    dataCadastro: data?.dataCadastro ?? data?.DataCadastro ?? null,
  };
}

export async function login({ email, senha }) {
  const response = await api.post(API_ENDPOINTS.login, {
    email: email.trim().toLowerCase(),
    senha,
  });

  const accessToken = response.data?.accessToken ?? response.data?.AccessToken;

  if (!accessToken) {
    throw new Error('A API não retornou um token de autenticação válido.');
  }

  await tokenStorage.setToken(accessToken);

  return {
    accessToken,
    tokenType: response.data?.tokenType ?? response.data?.TokenType ?? 'Bearer',
    expiraEm: response.data?.expiraEm ?? response.data?.ExpiraEm ?? null,
    user: normalizeUser(response.data),
  };
}

export async function registerCitizen({ nome, email, senha, telefone }) {
  const response = await api.post(API_ENDPOINTS.usuarios, {
    nome: nome.trim(),
    email: email.trim().toLowerCase(),
    senha,
    telefone: telefone?.trim() || null,
    perfil: 'CIDADAO',
  });

  return normalizeUser(response.data);
}

export async function logout() {
  await tokenStorage.removeToken();
}
