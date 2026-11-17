import api from './api';
import { API_ENDPOINTS } from '../config/apiConfig';

function normalizeUser(data) {
  return {
    idUsuario: data?.idUsuario ?? data?.IdUsuario,
    nome: data?.nome ?? data?.Nome ?? '',
    email: data?.email ?? data?.Email ?? '',
    telefone: data?.telefone ?? data?.Telefone ?? null,
    perfil: String(data?.perfil ?? data?.Perfil ?? 'CIDADAO').toUpperCase(),
    ativo: data?.ativo ?? data?.Ativo ?? false,
    dataCadastro: data?.dataCadastro ?? data?.DataCadastro ?? null,
  };
}

export async function listUsers({ incluirInativos = true } = {}) {
  const response = await api.get(API_ENDPOINTS.usuarios, {
    params: { incluirInativos },
  });

  if (!Array.isArray(response.data)) {
    throw new Error('A API retornou uma lista de usuários em formato inesperado.');
  }

  return response.data.map(normalizeUser);
}

export async function deactivateUser(idUsuario) {
  await api.delete(`${API_ENDPOINTS.usuarios}/${idUsuario}`);
}

export async function registerManager({ nome, email, senha, telefone }) {
  try {
    const response = await api.post(API_ENDPOINTS.criarGestor, {
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      senha,
      telefone: telefone?.trim() || null,
    });

    return normalizeUser(response.data);
  } catch (error) {
    if (error.response?.status === 404) {
      const unavailable = new Error(
        'A API deste projeto ainda não disponibiliza POST /api/usuarios/gestores. ' +
        'A tela e a integração mobile estão preparadas, mas é necessário concluir o endpoint administrativo na API antes de cadastrar gestores.',
      );
      unavailable.cause = error;
      throw unavailable;
    }

    throw error;
  }
}
