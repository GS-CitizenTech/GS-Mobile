import api from './api';
import { API_ENDPOINTS } from '../config/apiConfig';
import { getApiErrorMessage } from './apiError';

export async function checkApiConnection() {
  try {
    const response = await api.get(API_ENDPOINTS.swagger);

    return {
      success: true,
      status: response.status,
      message: 'Conexão com a API estabelecida com sucesso.',
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || null,
      message: getApiErrorMessage(error),
    };
  }
}