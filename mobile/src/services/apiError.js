function getValidationMessage(data) {
  if (!data) return null;

  if (typeof data.message === 'string' && data.message.trim()) return data.message;
  if (typeof data.mensagem === 'string' && data.mensagem.trim()) return data.mensagem;
  if (typeof data.detail === 'string' && data.detail.trim()) return data.detail;
  if (typeof data.title === 'string' && data.title.trim()) return data.title;

  const errors = data.errors ?? data.erros ?? data.Errors ?? data.Erros;
  if (errors && typeof errors === 'object') {
    const firstError = Object.values(errors).flat().find(
      (value) => typeof value === 'string' && value.trim(),
    );
    if (firstError) return firstError;
  }

  return null;
}

export function getApiErrorMessage(error) {
  if (!error) {
    return 'Ocorreu um erro inesperado.';
  }

  if (typeof error.message === 'string' && !error.response && !error.request && error.message.trim()) {
    return error.message;
  }

  if (error.code === 'ECONNABORTED') {
    return 'A requisição demorou demais para responder.';
  }

  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    const serverMessage = getValidationMessage(data);

    if (status === 400) {
      return serverMessage || 'Os dados enviados são inválidos. Confira os campos e tente novamente.';
    }

    if (status === 401) {
      return 'E-mail ou senha incorretos, ou sua sessão expirou.';
    }

    if (status === 403) {
      return 'Você não tem permissão para realizar esta operação.';
    }

    if (status === 404) {
      return serverMessage || 'O recurso solicitado não foi encontrado.';
    }

    if (status === 409) {
      return serverMessage || 'Este cadastro já existe ou entrou em conflito com outro registro.';
    }

    if (status === 429) {
      return 'Muitas requisições. Aguarde um momento e tente novamente.';
    }

    if (status >= 500) {
      return 'O servidor apresentou um erro. Tente novamente mais tarde.';
    }

    return serverMessage || `Erro na requisição (${status}).`;
  }

  if (error.request) {
    return 'Não foi possível conectar à API. Verifique sua conexão e confirme se o servidor está em execução.';
  }

  return error.message || 'Ocorreu um erro inesperado.';
}
