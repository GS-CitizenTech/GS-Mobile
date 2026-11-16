import axios from 'axios';

import {
  API_BASE_URL,
  API_TIMEOUT,
} from '../config/apiConfig';

import tokenStorage from './tokenStorage';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

// Adiciona o JWT automaticamente quando existir um token.
api.interceptors.request.use(
  async (config) => {
    const token = await tokenStorage.getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Centraliza o tratamento de erros das respostas.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(
        'Erro HTTP:',
        error.response.status,
        error.response.data,
      );
    } else if (error.request) {
      console.error(
        'A API não respondeu à requisição:',
        error.message,
      );
    } else {
      console.error(
        'Erro ao configurar requisição:',
        error.message,
      );
    }

    return Promise.reject(error);
  },
);

export default api;