import axios from 'axios';

const API = 'http://localhost:3000/api';

const api = {
  async login(email, password) {
    try {
      console.log('Intentando login:', email);
      const res = await axios.post(`${API}/auth/login`, { email, password });
      console.log('Respuesta login:', res.data);
      if (res.data.success) {
        localStorage.setItem('token', res.data.data.accessToken);
        localStorage.setItem('user', JSON.stringify(res.data.data.user));
        return { ok: true, user: res.data.data.user };
      }
      return { ok: false, error: res.data.error };
    } catch (err) {
      console.error('Error login:', err);
      return { ok: false, error: err.response?.data?.error || 'Error de conexión' };
    }
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getToken() {
    return localStorage.getItem('token');
  },

  isAuth() {
    return !!localStorage.getItem('token');
  },

  async get(url) {
    const token = this.getToken();
    console.log(`GET ${url} - Token:`, token ? 'Presente' : 'No hay token');
    
    if (!token) {
      console.error('No hay token guardado');
      throw new Error('No autenticado');
    }
    
    try {
      const res = await axios.get(`${API}${url}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`GET ${url} respuesta:`, res.data);
      return res.data;
    } catch (err) {
      console.error(`GET ${url} error:`, err.response?.status, err.response?.data);
      throw err;
    }
  },

  async post(url, data) {
    const token = this.getToken();
    console.log(`POST ${url} - Data:`, data);
    
    if (!token) {
      console.error('No hay token guardado');
      throw new Error('No autenticado');
    }
    
    try {
      const res = await axios.post(`${API}${url}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`POST ${url} respuesta:`, res.data);
      return res.data;
    } catch (err) {
      console.error(`POST ${url} error:`, err.response?.status, err.response?.data);
      throw err;
    }
  }
};

export default api;