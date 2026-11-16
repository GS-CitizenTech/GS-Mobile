export function getApiErrorMessage(error) {
  if (!error) {
    return 'Ocorreu um erro inesperado.';
  }

  if (error.code === 'ECONNABORTED') {
    return 'A requisição demorou demais para responder.';
  }

  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    if (status === 400) {
      return data?.message || 'Os dados enviados são inválidos.';
    }

    if (status === 401) {
      return 'Sua sessão é inválida ou expirou. Faça login novamente.';
    }

    if (status === 403) {
      return 'Você não tem permissão para realizar esta operação.';
    }

    if (status === 404) {
      return 'O recurso solicitado não foi encontrado.';
    }

    if (status === 409) {
      return data?.message || 'Foi identificado um conflito na operação.';
    }

    if (status === 429) {
      return 'Muitas requisições. Aguarde um momento e tente novamente.';
    }

    if (status >= 500) {
      return 'O servidor apresentou um erro. Tente novamente mais tarde.';
    }

    return data?.message || `Erro na requisição (${status}).`;
  }

  if (error.request) {
    return 'Não foi possível conectar à API. Verifique sua conexão.';
  }

  return error.message || 'Ocorreu um erro inesperado.';
}