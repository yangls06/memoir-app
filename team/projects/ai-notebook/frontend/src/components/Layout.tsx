import React, { useEffect, useCallback } from 'react';
import { useNoteStore } from '../stores/noteStore';
import { Sidebar } from './Sidebar';
import { NoteEditor } from './NoteEditor';
import { NotePreview } from './NotePreview';
import { AIChat } from './AIChat';
import { SearchBox } from './SearchBox';
import { LayoutGrid, Eye, Edit3, Columns, Bot, Plus } from 'lucide-react';

export const Layout: React.FC = () => {
  const {
    currentNote,
    viewMode,
    showAIPanel,
    isSaving,
    setViewMode,
    setShowAIPanel,
    createNote,
    fetchNotes,
    fetchTags,
  } = useNoteStore();

  // 初始化加载数据
  useEffect(() => {
    fetchNotes();
    fetchTags();
  }, [fetchNotes, fetchTags]);

  // 创建新笔记
  const handleCreateNote = useCallback(async () => {
    const newNote = await createNote('新建笔记');
    if (newNote) {
      // 自动聚焦标题编辑
    }
  }, [createNote]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 侧边栏 */}
      <Sidebar />

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部工具栏 */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-4">
            <SearchBox />
          </div>

          <div className="flex items-center gap-2">
            {/* 视图切换 */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('edit')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'edit' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
                title="编辑模式"
              >
                <Edit3 size={18} />
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'split' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
                title="分屏模式"
              >
                <Columns size={18} />
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'preview' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
                title="预览模式"
              >
                <Eye size={18} />
              </button>
            </div>

            {/* AI面板切换 */}
            <button
              onClick={() => setShowAIPanel(!showAIPanel)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                showAIPanel
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Bot size={18} />
              <span className="text-sm font-medium">AI助手</span>
            </button>

            {/* 新建笔记按钮 */}
            <button
              onClick={handleCreateNote}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              <span className="text-sm font-medium">新建笔记</span>
            </button>
          </div>
        </header>

        {/* 编辑区 */}
        <div className="flex-1 flex overflow-hidden">
          {currentNote ? (
            <>
              {/* 编辑器 */}
              {(viewMode === 'edit' || viewMode === 'split') && (
                <div
                  className={`${
                    viewMode === 'split' ? 'w-1/2 border-r border-gray-200' : 'flex-1'
                  } bg-white`}
                >
                  <NoteEditor />
                </div>
              )}

              {/* 预览区 */}
              {(viewMode === 'preview' || viewMode === 'split') && (
                <div className={`${viewMode === 'split' ? 'w-1/2' : 'flex-1'} bg-white overflow-auto`}>
                  <NotePreview />
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <LayoutGrid size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg">选择一个笔记开始编辑</p>
                <p className="text-sm mt-2">或点击右上角新建笔记</p>
              </div>
            </div>
          )}
        </div>

        {/* 保存状态指示器 */}
        {isSaving && (
          <div className="absolute bottom-4 right-4 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-full shadow-lg">
            保存中...
          </div>
        )}
      </div>

      {/* AI面板 */}
      {showAIPanel && <AIChat />}
    </div>
  );
};
