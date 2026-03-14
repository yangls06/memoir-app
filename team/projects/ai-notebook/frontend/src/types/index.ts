// 类型定义

export interface Note {
  id: string;
  title: string;
  content: string;
  summary?: string;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface CreateNoteRequest {
  title: string;
  content?: string;
  tagIds?: string[];
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  tagIds?: string[];
}

export interface CreateTagRequest {
  name: string;
  color?: string;
}

export interface ChatRequest {
  question: string;
  noteIds?: string[];
}

export interface ChatResponse {
  answer: string;
  sources: { noteId: string; title: string }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export type ViewMode = 'edit' | 'preview' | 'split';
