import React, { useState, useCallback, useEffect } from 'react';
import { useNoteStore } from '../stores/noteStore';
import { Tag as TagIcon } from 'lucide-react';

export const NoteEditor: React.FC = () => {
  const { currentNote, tags, updateNote } = useNoteStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  // 防抖定时器
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // 同步当前笔记到本地状态
  useEffect(() => {
    if (currentNote) {
      setTitle(currentNote.title);
      setContent(currentNote.content);
      setSelectedTagIds(currentNote.tags.map((t) => t.id));
    }
  }, [currentNote?.id]);

  // 自动保存（防抖）
  const debouncedSave = useCallback(
    (updates: { title?: string; content?: string; tagIds?: string[] }) => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      const timeout = setTimeout(() => {
        if (currentNote) {
          updateNote(currentNote.id, updates);
        }
      }, 500);
      setSaveTimeout(timeout);
    },
    [currentNote, saveTimeout, updateNote]
  );

  // 处理标题变更
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    debouncedSave({ title: newTitle });
  };

  // 处理内容变更
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    debouncedSave({ content: newContent });
  };

  // 处理标签切换
  const handleTagToggle = (tagId: string) => {
    const newTagIds = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter((id) => id !== tagId)
      : [...selectedTagIds, tagId];
    setSelectedTagIds(newTagIds);
    debouncedSave({ tagIds: newTagIds });
  };

  // 插入Markdown语法
  const insertMarkdown = (syntax: string, placeholder: string = '') => {
    const textarea = document.getElementById('note-content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = syntax.replace('{{text}}', selectedText || placeholder);

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
    debouncedSave({ content: newContent });

    // 恢复焦点
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + replacement.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  if (!currentNote) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        请选择一个笔记
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 标题栏 */}
      <div className="p-4 border-b border-gray-200">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="笔记标题"
          className="w-full text-xl font-semibold text-gray-800 placeholder-gray-400 border-none outline-none bg-transparent"
        />

        {/* 标签选择 */}
        <div className="flex items-center gap-2 mt-3">
          <TagIcon size={16} className="text-gray-400" />
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => handleTagToggle(tag.id)}
                className={`px-2 py-0.5 text-xs rounded-full border transition-all ${
                  selectedTagIds.includes(tag.id)
                    ? 'border-transparent text-white'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
                style={{
                  backgroundColor: selectedTagIds.includes(tag.id) ? tag.color : 'transparent',
                }}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 工具栏 */}
      <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-1 bg-gray-50">
        <button
          onClick={() => insertMarkdown('**{{text}}**', '粗体文本')}
          className="px-2 py-1 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded"
          title="粗体"
        >
          B
        </button>
        <button
          onClick={() => insertMarkdown('*{{text}}*', '斜体文本')}
          className="px-2 py-1 text-sm italic text-gray-600 hover:bg-gray-200 rounded"
          title="斜体"
        >
          I
        </button>
        <button
          onClick={() => insertMarkdown('# {{text}}', '标题')}
          className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded"
          title="标题"
        >
          H1
        </button>
        <button
          onClick={() => insertMarkdown('## {{text}}', '标题')}
          className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded"
          title="二级标题"
        >
          H2
        </button>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <button
          onClick={() => insertMarkdown('- {{text}}', '列表项')}
          className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded"
          title="无序列表"
        >
          • List
        </button>
        <button
          onClick={() => insertMarkdown('1. {{text}}', '列表项')}
          className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded"
          title="有序列表"
        >
          1. List
        </button>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <button
          onClick={() => insertMarkdown('```\n{{text}}\n```', '代码')}
          className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded font-mono"
          title="代码块"
        >
          {'<>'}
        </button>
        <button
          onClick={() => insertMarkdown('> {{text}}', '引用')}
          className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded"
          title="引用"
        >
          "
        </button>
        <button
          onClick={() => insertMarkdown('[{{text}}](url)', '链接文本')}
          className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded"
          title="链接"
        >
          🔗
        </button>
      </div>

      {/* 编辑器 */}
      <textarea
        id="note-content"
        value={content}
        onChange={handleContentChange}
        placeholder="开始写作..."
        className="flex-1 w-full p-4 resize-none outline-none text-gray-700 leading-relaxed font-mono text-sm"
        spellCheck={false}
      />
    </div>
  );
};
