import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' }
})

request.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (config.data instanceof FormData) {
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('Content-Type', false)
    } else {
      const h = config.headers || {}
      const next = { ...h }
      delete next['Content-Type']
      config.headers = next
    }
  }
  return config
})

function clearTokenAndEmitExpired() {
  localStorage.removeItem('token')
  window.dispatchEvent(new Event('auth-expired'))
}

request.interceptors.response.use(
  res => {
    const data = res.data
    if (data && data.code !== undefined && data.code !== 200) {
      const msg = data.message || '请求失败'
      if (msg === '未登录' || msg.includes('请先登录')) {
        clearTokenAndEmitExpired()
      }
      return Promise.reject(msg)
    }
    return data
  },
  err => {
    const status = err?.response?.status
    const msg = err?.response?.data?.message || err?.response?.data?.data?.message || err?.message
    if (status === 401 || msg === '未登录' || (typeof msg === 'string' && msg.includes('请先登录'))) {
      clearTokenAndEmitExpired()
    }
    return Promise.reject(msg)
  }
)

let currentSpaceId = null
export function setSpaceId(id) { currentSpaceId = id }
export function getSpaceId() { return currentSpaceId }
function spaceParam() { return currentSpaceId != null ? { spaceId: currentSpaceId } : {} }

export const api = {
  setSpaceId,
  getSpaceId,
  getSpace: (id) => request.get(`/space/${id || currentSpaceId}`),
  getDefaultSpace: () => request.get('/space/default'),
  createSpace: (coupleKey) => request.post('/space/create', coupleKey != null && coupleKey !== '' ? { coupleKey } : {}),
  joinSpace: (coupleKey) => request.post('/space/join', { coupleKey }),
  register: (data) => request.post('/auth/register', data),
  login: (data) => request.post('/auth/login', data),
  me: () => request.get('/auth/me'),
  uploadAvatar: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return request.post('/auth/avatar', fd)
  },
  getPartner: () => request.get('/space/partner'),
  updateAnniversary: (anniversaryDate) => request.put('/space/update-anniversary', { anniversaryDate }),
  getSparkState: (spaceId) => request.get('/spark/state', { params: { spaceId } }),
  sparkCheckin: (spaceId) => request.post('/spark/checkin', null, { params: { spaceId } }),
  getSparkCalendar: (spaceId, year, month) => request.get('/spark/calendar', { params: { spaceId, year, month } }),
  updateProfile: (data) => request.post('/auth/profile', data),
  getPhotoCategories: () => request.get('/photo/category/list', { params: spaceParam() }),
  createPhotoCategory: (data) => request.post('/photo/category', data),
  updatePhotoCategory: (id, data) => request.put(`/photo/category/${id}`, data),
  deletePhotoCategory: (id) => request.delete(`/photo/category/${id}`),
  getPhotosByCategory: (categoryId) => request.get('/photo/list', { params: { categoryId } }),
  getPhotosBySpace: () => request.get('/photo/listBySpace', { params: spaceParam() }),
  uploadPhoto: (formData) => request.post('/photo/upload', formData),
  deletePhoto: (id) => request.delete(`/photo/${id}`),
  getDiaryList: () => request.get('/diary/list', { params: spaceParam() }),
  createDiary: (data) => request.post('/diary', data),
  updateDiary: (id, data) => request.post(`/diary/update/${id}`, data),
  uploadDiaryImage: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return request.post('/diary/upload-image', fd)
  },
  deleteDiary: (id) => request.delete(`/diary/${id}`),
  generateAiImage: (prompt) => request.post('/ai-image/generate', { prompt, spaceId: currentSpaceId }),
  generateAiImageOnly: (prompt) => request.post('/ai-image/generate-only', { prompt }),
  saveAiImage: (data) => request.post('/ai-image/save', { ...data, spaceId: currentSpaceId }),
  getAiImageList: () => request.get('/ai-image/list', { params: spaceParam() }),
  deleteAiImage: (id) => request.delete(`/ai-image/${id}`),
  getMilestones: () => request.get('/milestone/list', { params: spaceParam() }),
  uploadMilestoneMedia: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return request.post('/milestone/upload-media', fd)
  },
  createMilestone: (data) => request.post('/milestone', { ...data, spaceId: currentSpaceId }),
  updateMilestone: (id, data) => request.put(`/milestone/${id}`, data),
  deleteMilestone: (id) => request.delete(`/milestone/${id}`),
  getWishes: () => request.get('/wish/list', { params: spaceParam() }),
  createWish: (data) => request.post('/wish', { ...data, spaceId: currentSpaceId }),
  toggleWish: (id) => request.put(`/wish/${id}/toggle`),
  deleteWish: (id) => request.delete(`/wish/${id}`)
}

// 开发时通过 proxy 访问后端，图片 URL 需指向后端
const apiBase = import.meta.env.DEV ? '' : (window.location.origin + (window.__API_BASE__ || ''))
export function getImageUrl(url) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  const path = url.startsWith('/') ? url : '/' + url
  return apiBase + path
}
