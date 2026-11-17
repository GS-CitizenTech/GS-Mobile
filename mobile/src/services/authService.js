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

  const user = normalizeUser(response.data);
  const expiraEm = response.data?.expiraEm ?? response.data?.ExpiraEm ?? null;

  const session = {
    accessToken,
    tokenType: response.data?.tokenType ?? response.data?.TokenType ?? 'Bearer',
    expiresAt: expiraEm,
    user,
  };

  await tokenStorage.setSession(session);

  return session;
}

export async function restoreSession() {
  const session = await tokenStorage.getSession();

  if (!session) {
    return null;
  }

  // Revalida os dados do usuário normalizados antes de restaurar a navegação.
  return {
    ...session,
    user: normalizeUser(session.user),
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
  await tokenStorage.removeSession();
}
