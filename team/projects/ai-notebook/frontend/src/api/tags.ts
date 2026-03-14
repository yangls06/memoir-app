import apiClient from './notes';
import type { ApiResponse, Tag, CreateTagRequest } from '../types';

// 标签API
export const tagsApi = {
  // 获取所有标签
  getTags: async (): Promise<ApiResponse<Tag[]>> => {
    const response = await apiClient.get('/tags');
    return response.data;
  },

  // 创建标签
  createTag: async (data: CreateTagRequest): Promise<ApiResponse<Tag>> => {
    const response = await apiClient.post('/tags', data);
    return response.data;
  },

  // 删除标签
  deleteTag: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/tags/${id}`);
    return response.data;
  },
};
