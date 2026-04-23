import axios from 'axios'
 
const API = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 30000,
})
 
// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
 
// Handle 401 globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/signin'
    }
    return Promise.reject(err)
  }
)
 
// ── Auth ──────────────────────────────────────────────
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  me: () => API.get('/auth/me'),
  logout: () => API.post('/auth/logout'),
}
 
// ── Jobs ──────────────────────────────────────────────
export const jobsAPI = {
  list: (params) => API.get('/jobs', { params }),
  get: (id) => API.get(`/jobs/${id}`),
  create: (data) => API.post('/jobs', data),
  update: (id, data) => API.put(`/jobs/${id}`, data),
  delete: (id) => API.delete(`/jobs/${id}`),
}
 
// ── Resumes ───────────────────────────────────────────
export const resumesAPI = {
  upload: (formData, jobId, onProgress) =>
    API.post(`/resumes/upload/${jobId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded * 100) / e.total)),
    }),
  list: (jobId) => API.get(`/resumes/${jobId}`),
  get: (id) => API.get(`/resumes/detail/${id}`),
  delete: (id) => API.delete(`/resumes/${id}`),
}
 
// ── Rankings ──────────────────────────────────────────
export const rankingsAPI = {
  rank: (jobId) => API.post(`/rank/${jobId}`),
  results: (jobId) => API.get(`/rank/${jobId}/results`),
  candidate: (candidateId) => API.get(`/rank/candidate/${candidateId}`),
}
 
// ── Analytics (Admin) ─────────────────────────────────
export const analyticsAPI = {
  overview: () => API.get('/admin/overview'),
  users: () => API.get('/admin/users'),
  updateUserRole: (userId, role) => API.put(`/admin/users/${userId}/role`, { role }),
  deleteUser: (userId) => API.delete(`/admin/users/${userId}`),
}
 
export default API
 