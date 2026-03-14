import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useNoteStore } from '../stores/noteStore';

export const NotePreview: React.FC = () => {
  const { currentNote } = useNoteStore();

  if (!currentNote) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        请选择一个笔记
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto p-8">
        {/* 标题 */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{currentNote.title || '无标题'}</h1>

        {/* 标签 */}
        {currentNote.tags.length > 0 && (
          <div className="flex items-center gap-2 mb-6">
            {currentNote.tags.map((tag) => (
              <span
                key={tag.id}
                className="px-2.5 py-1 text-xs font-medium rounded-full text-white"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* 摘要 */}
        {currentNote.summary && (
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">AI摘要：</span> {currentNote.summary}
            </p>
          </div>
        )}

        {/* Markdown内容 */}
        <div className="markdown-preview prose prose-slate max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {currentNote.content || '*暂无内容*'}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};
