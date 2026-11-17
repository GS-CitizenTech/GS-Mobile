import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'alerta_cidadao_session_v1';

function isValidSession(session) {
  return Boolean(
    session &&
    typeof session.accessToken === 'string' &&
    session.accessToken.length > 0 &&
    session.user &&
    typeof session.user === 'object' &&
    session.user.idUsuario !== undefined &&
    session.user.idUsuario !== null
  );
}

const tokenStorage = {
  async getSession() {
    const storedValue = await SecureStore.getItemAsync(SESSION_KEY);

    if (!storedValue) {
      return null;
    }

    try {
      const session = JSON.parse(storedValue);

      if (!isValidSession(session)) {
        await SecureStore.deleteItemAsync(SESSION_KEY);
        return null;
      }

      if (session.expiresAt) {
        const expiration = new Date(session.expiresAt).getTime();

        if (!Number.isFinite(expiration) || expiration <= Date.now()) {
          await SecureStore.deleteItemAsync(SESSION_KEY);
          return null;
        }
      }

      return session;
    } catch (error) {
      // Uma sessão corrompida não deve impedir a abertura do aplicativo.
      await SecureStore.deleteItemAsync(SESSION_KEY);
      return null;
    }
  },

  async getToken() {
    const session = await this.getSession();
    return session?.accessToken ?? null;
  },

  async setSession(session) {
    if (!isValidSession(session)) {
      throw new Error('Não foi possível salvar uma sessão de autenticação inválida.');
    }

    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
  },

  async setToken(token) {
    // Compatibilidade com chamadas antigas: não salva token sem os dados da sessão.
    if (!token) {
      await this.removeSession();
      return;
    }

    const currentSession = await this.getSession();

    if (!currentSession) {
      throw new Error('Salve a sessão completa usando setSession().');
    }

    await this.setSession({ ...currentSession, accessToken: token });
  },

  async removeSession() {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  },

  async removeToken() {
    await this.removeSession();
  },
};

export default tokenStorage;
