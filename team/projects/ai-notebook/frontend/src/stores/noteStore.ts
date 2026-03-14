import { create } from 'zustand';
import type { Note, Tag, ViewMode } from '../types';
import { notesApi } from '../api/notes';
import { tagsApi } from '../api/tags';

interface NoteState {
  // 笔记列表
  notes: Note[];
  // 当前选中的笔记
  currentNote: Note | null;
  // 所有标签
  tags: Tag[];
  // 加载状态
  isLoading: boolean;
  // 保存状态
  isSaving: boolean;
  // 视图模式
  viewMode: ViewMode;
  // 搜索关键词
  searchQuery: string;
  // 选中的标签筛选
  selectedTagId: string | null;
  // AI对话历史
  chatHistory: { role: 'user' | 'assistant'; content: string; sources?: { noteId: string; title: string }[] }[];
  // 是否显示AI面板
  showAIPanel: boolean;

  // Actions
  setNotes: (notes: Note[]) => void;
  setCurrentNote: (note: Note | null) => void;
  setTags: (tags: Tag[]) => void;
  setViewMode: (mode: ViewMode) => void;
  setSearchQuery: (query: string) => void;
  setSelectedTagId: (tagId: string | null) => void;
  setShowAIPanel: (show: boolean) => void;

  // 异步操作
  fetchNotes: () => Promise<void>;
  fetchTags: () => Promise<void>;
  fetchNote: (id: string) => Promise<void>;
  createNote: (title: string) => Promise<Note | null>;
  updateNote: (id: string, updates: { title?: string; content?: string; tagIds?: string[] }) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  createTag: (name: string, color?: string) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  addToChatHistory: (message: { role: 'user' | 'assistant'; content: string; sources?: { noteId: string; title: string }[] }) => void;
  clearChatHistory: () => void;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  // 初始状态
  notes: [],
  currentNote: null,
  tags: [],
  isLoading: false,
  isSaving: false,
  viewMode: 'split',
  searchQuery: '',
  selectedTagId: null,
  chatHistory: [],
  showAIPanel: false,

  // 同步Actions
  setNotes: (notes) => set({ notes }),
  setCurrentNote: (note) => set({ currentNote: note }),
  setTags: (tags) => set({ tags }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedTagId: (tagId) => set({ selectedTagId: tagId }),
  setShowAIPanel: (show) => set({ showAIPanel: show }),

  // 异步操作
  fetchNotes: async () => {
    set({ isLoading: true });
    try {
      const { searchQuery, selectedTagId } = get();
      const response = await notesApi.getNotes({
        search: searchQuery || undefined,
        tag: selectedTagId || undefined,
      });
      if (response.success && response.data) {
        set({ notes: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTags: async () => {
    try {
      const response = await tagsApi.getTags();
      if (response.success && response.data) {
        set({ tags: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  },

  fetchNote: async (id) => {
    set({ isLoading: true });
    try {
      const response = await notesApi.getNote(id);
      if (response.success && response.data) {
        set({ currentNote: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch note:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  createNote: async (title) => {
    try {
      const response = await notesApi.createNote({ title, content: '' });
      if (response.success && response.data) {
        const newNote = response.data;
        set((state) => ({ notes: [newNote, ...state.notes] }));
        return newNote;
      }
    } catch (error) {
      console.error('Failed to create note:', error);
    }
    return null;
  },

  updateNote: async (id, updates) => {
    set({ isSaving: true });
    try {
      const response = await notesApi.updateNote(id, updates);
      if (response.success && response.data) {
        const updatedNote = response.data;
        set((state) => ({
          currentNote: state.currentNote?.id === id ? updatedNote : state.currentNote,
          notes: state.notes.map((n) => (n.id === id ? updatedNote : n)),
        }));
      }
    } catch (error) {
      console.error('Failed to update note:', error);
    } finally {
      set({ isSaving: false });
    }
  },

  deleteNote: async (id) => {
    try {
      await notesApi.deleteNote(id);
      set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
        currentNote: state.currentNote?.id === id ? null : state.currentNote,
      }));
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  },

  createTag: async (name, color) => {
    try {
      const response = await tagsApi.createTag({ name, color });
      if (response.success && response.data) {
        set((state) => ({ tags: [...state.tags, response.data!] }));
      }
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  },

  deleteTag: async (id) => {
    try {
      await tagsApi.deleteTag(id);
      set((state) => ({ tags: state.tags.filter((t) => t.id !== id) }));
    } catch (error) {
      console.error('Failed to delete tag:', error);
    }
  },

  addToChatHistory: (message) => {
    set((state) => ({
      chatHistory: [...state.chatHistory, message],
    }));
  },

  clearChatHistory: () => {
    set({ chatHistory: [] });
  },
}));
