import apiClient from './notes';
import type { ApiResponse, ChatRequest, ChatResponse } from '../types';

// AI API
export const aiApi = {
  // 知识问答
  chat: async (data: ChatRequest): Promise<ApiResponse<ChatResponse>> => {
    const response = await apiClient.post('/ai/chat', data);
    return response.data;
  },
};
