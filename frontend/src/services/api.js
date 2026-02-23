import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Admin Auth
export const adminLogin = async (username, password) => {
  const response = await api.post('/admin/login', { username, password });
  localStorage.setItem('admin_token', response.data.access_token);
  return response.data;
};

export const adminLogout = () => {
  localStorage.removeItem('admin_token');
};

export const checkAdmin = async () => {
  try {
    const response = await api.get('/admin/check');
    return response.data;
  } catch (error) {
    return null;
  }
};

// Ricorsi
export const getRicorsi = async (attivo = null) => {
  const params = attivo !== null ? { attivo } : {};
  const response = await api.get('/ricorsi', { params });
  return response.data;
};

export const getRicorso = async (id) => {
  const response = await api.get(`/ricorsi/${id}`);
  return response.data;
};

export const createRicorso = async (ricorso) => {
  const response = await api.post('/ricorsi', ricorso);
  return response.data;
};

export const updateRicorso = async (id, ricorso) => {
  const response = await api.put(`/ricorsi/${id}`, ricorso);
  return response.data;
};

export const deleteRicorso = async (id) => {
  const response = await api.delete(`/ricorsi/${id}`);
  return response.data;
};

// Submissions
export const createSubmission = async (ricorsoId, datiUtente) => {
  const formData = new FormData();
  formData.append('ricorso_id', ricorsoId);
  formData.append('dati_utente', JSON.stringify(datiUtente));
  
  const response = await api.post('/submissions', formData);
  return response.data;
};

export const uploadFile = async (submissionId, documentId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post(`/upload/${submissionId}/${documentId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const uploadEsempioFile = async (ricorsoId, documentId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post(`/upload-esempio/${ricorsoId}/${documentId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteEsempioFile = async (ricorsoId, documentId) => {
  const response = await api.delete(`/esempio/${ricorsoId}/${documentId}`);
  return response.data;
};

export const getEsempioFileUrl = (ricorsoId, documentId) => {
  return `${API}/esempio/${ricorsoId}/${documentId}`;
};

export const getSubmissions = async (ricorsoId = null) => {
  const params = ricorsoId ? { ricorso_id: ricorsoId } : {};
  const response = await api.get('/submissions', { params });
  return response.data;
};

export const getSubmissionsStats = async (ricorsoId) => {
  const response = await api.get(`/submissions/stats/${ricorsoId}`);
  return response.data;
};

// Admin Management
export const createAdminManual = async (adminData) => {
  const response = await api.post('/admin/create-manual', adminData);
  return response.data;
};

export const createInvite = async (inviteData) => {
  const response = await api.post('/admin/invite', inviteData);
  return response.data;
};

export const validateInvite = async (token) => {
  const response = await axios.get(`${API}/admin/invite/validate/${token}`);
  return response.data;
};

export const registerWithInvite = async (token, username, password) => {
  const response = await axios.post(`${API}/admin/register-with-invite`, {
    token,
    username,
    password
  });
  return response.data;
};

export const listAdmins = async () => {
  const response = await api.get('/admin/list');
  return response.data;
};

export const deleteAdmin = async (adminId) => {
  const response = await api.delete(`/admin/delete/${adminId}`);
  return response.data;
};

export const listInvites = async () => {
  const response = await api.get('/admin/invites');
  return response.data;
};

export default api;
