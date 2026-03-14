import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type { ApiResponse, Note, CreateNoteRequest, UpdateNoteRequest } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      console.error('Network Error:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// 笔记API
export const notesApi = {
  // 获取笔记列表
  getNotes: async (params?: { search?: string; tag?: string }): Promise<ApiResponse<Note[]>> => {
    const response = await apiClient.get('/notes', { params });
    return response.data;
  },

  // 获取单篇笔记
  getNote: async (id: string): Promise<ApiResponse<Note>> => {
    const response = await apiClient.get(`/notes/${id}`);
    return response.data;
  },

  // 创建笔记
  createNote: async (data: CreateNoteRequest): Promise<ApiResponse<Note>> => {
    const response = await apiClient.post('/notes', data);
    return response.data;
  },

  // 更新笔记
  updateNote: async (id: string, data: UpdateNoteRequest): Promise<ApiResponse<Note>> => {
    const response = await apiClient.put(`/notes/${id}`, data);
    return response.data;
  },

  // 删除笔记
  deleteNote: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/notes/${id}`);
    return response.data;
  },

  // 生成摘要
  summarizeNote: async (id: string): Promise<ApiResponse<{ summary: string }>> => {
    const response = await apiClient.post(`/notes/${id}/summarize`);
    return response.data;
  },
};

export default apiClient;
