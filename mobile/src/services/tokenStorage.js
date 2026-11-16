let accessToken = null;

const tokenStorage = {
  async getToken() {
    return accessToken;
  },

  async setToken(token) {
    accessToken = token;
  },

  async removeToken() {
    accessToken = null;
  },
};

export default tokenStorage;