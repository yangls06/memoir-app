import React, { useState } from 'react';
import { useNoteStore } from '../stores/noteStore';
import { FileText, Tag, Plus, Trash2, X } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    notes,
    tags,
    currentNote,
    selectedTagId,
    isLoading,
    setCurrentNote,
    setSelectedTagId,
    deleteNote,
    createTag,
    deleteTag,
    fetchNotes,
  } = useNoteStore();

  const [showTagInput, setShowTagInput] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  // 创建标签
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagName.trim()) {
      await createTag(newTagName.trim());
      setNewTagName('');
      setShowTagInput(false);
    }
  };

  // 删除笔记
  const handleDeleteNote = async (id: string) => {
    if (confirm('确定要删除这篇笔记吗？')) {
      setDeletingNoteId(id);
      await deleteNote(id);
      setDeletingNoteId(null);
    }
  };

  // 筛选笔记
  const filteredNotes = selectedTagId
    ? notes.filter((note) => note.tags.some((tag) => tag.id === selectedTagId))
    : notes;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
      {/* 标签区域 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <Tag size={16} />
            标签
          </h3>
          <button
            onClick={() => setShowTagInput(!showTagInput)}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* 全部笔记 */}
        <button
          onClick={() => {
            setSelectedTagId(null);
            fetchNotes();
          }}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
            selectedTagId === null
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span>全部笔记</span>
          <span className="text-xs text-gray-400">{notes.length}</span>
        </button>

        {/* 标签列表 */}
        <div className="mt-2 space-y-1">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className={`group flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                selectedTagId === tag.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div
                className="flex items-center gap-2 flex-1"
                onClick={() => {
                  setSelectedTagId(tag.id === selectedTagId ? null : tag.id);
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="truncate">{tag.name}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`确定要删除标签 "${tag.name}" 吗？`)) {
                    deleteTag(tag.id);
                  }
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* 新建标签输入框 */}
        {showTagInput && (
          <form onSubmit={handleCreateTag} className="mt-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="输入标签名称"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              onBlur={() => {
                if (!newTagName.trim()) setShowTagInput(false);
              }}
            />
          </form>
        )}
      </div>

      {/* 笔记列表 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
            <FileText size={16} />
            笔记列表
          </h3>

          {isLoading ? (
            <div className="text-center py-8 text-gray-400">
              <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
              加载中...
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              {selectedTagId ? '该标签下暂无笔记' : '暂无笔记'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => setCurrentNote(note)}
                  className={`group relative p-3 rounded-lg cursor-pointer transition-all ${
                    currentNote?.id === note.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                  }`}
                >
                  <h4 className="font-medium text-sm text-gray-800 truncate pr-6">
                    {note.title || '无标题'}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {note.content.slice(0, 100) || '暂无内容'}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      {note.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag.id}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: tag.color }}
                          title={tag.name}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(note.updatedAt)}</span>
                  </div>

                  {/* 删除按钮 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(note.id);
                    }}
                    disabled={deletingNoteId === note.id}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
