import React, { useState, useRef, useEffect } from 'react';
import { useNoteStore } from '../stores/noteStore';
import { aiApi } from '../api/ai';
import { Send, Bot, User, X, Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const AIChat: React.FC = () => {
  const { chatHistory, addToChatHistory, clearChatHistory, currentNote, notes } = useNoteStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // 发送消息
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const question = input.trim();
    setInput('');

    // 添加用户消息
    addToChatHistory({ role: 'user', content: question });
    setIsLoading(true);

    try {
      // 如果没有指定笔记ID，则搜索相关笔记
      let noteIds: string[] | undefined;
      if (currentNote) {
        noteIds = [currentNote.id];
      } else {
        // 简单关键词匹配
        const keywords = question.toLowerCase().split(/\s+/);
        const relevantNotes = notes.filter((note) => {
          const content = (note.title + ' ' + note.content).toLowerCase();
          return keywords.some((kw) => content.includes(kw));
        });
        if (relevantNotes.length > 0) {
          noteIds = relevantNotes.slice(0, 5).map((n) => n.id);
        }
      }

      const response = await aiApi.chat({ question, noteIds });

      if (response.success && response.data) {
        addToChatHistory({
          role: 'assistant',
          content: response.data.answer,
          sources: response.data.sources,
        });
      } else {
        addToChatHistory({
          role: 'assistant',
          content: '抱歉，处理您的请求时出现了错误。请稍后重试。',
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      addToChatHistory({
        role: 'assistant',
        content: '抱歉，发生了网络错误。请检查您的连接并稍后重试。',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 快速操作
  const quickActions = [
    {
      label: '总结当前笔记',
      action: () => {
        if (currentNote) {
          setInput('请总结这篇笔记的主要内容');
        }
      },
      disabled: !currentNote,
    },
    {
      label: '提取关键要点',
      action: () => {
        if (currentNote) {
          setInput('请提取这篇笔记的关键要点');
        }
      },
      disabled: !currentNote,
    },
    {
      label: '搜索知识库',
      action: () => {
        setInput('');
      },
    },
  ];

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col shrink-0">
      {/* 头部 */}
      <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">AI助手</h3>
            <p className="text-xs text-gray-500">基于Kimi</p>
          </div>
        </div>
        <button
          onClick={clearChatHistory}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="清空对话"
        >
          <X size={18} />
        </button>
      </div>

      {/* 快速操作 */}
      {chatHistory.length === 0 && (
        <div className="p-4 border-b border-gray-100">
          <p className="text-xs text-gray-500 mb-2">快速操作</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                disabled={action.disabled}
                className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles size={28} className="text-blue-600" />
            </div>
            <p className="text-gray-600 font-medium">有什么可以帮您的？</p>
            <p className="text-sm text-gray-500 mt-1">
              我可以帮您总结笔记、回答问题或搜索知识库
            </p>
          </div>
        ) : (
          chatHistory.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  message.role === 'user'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gradient-to-br from-blue-500 to-purple-600'
                }`}
              >
                {message.role === 'user' ? (
                  <User size={16} />
                ) : (
                  <Bot size={16} className="text-white" />
                )}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>

                {/* 引用来源 */}
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200/50">
                    <p className="text-xs opacity-70 mb-1">参考笔记：</p>
                    <div className="flex flex-wrap gap-1">
                      {message.sources.map((source, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 bg-white/50 rounded-full"
                        >
                          {source.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* 加载指示器 */}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-gray-500" />
              <span className="text-sm text-gray-500">思考中...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-end gap-2 bg-gray-100 rounded-xl p-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="输入问题..."
            className="flex-1 bg-transparent border-none outline-none resize-none max-h-32 text-sm text-gray-700 placeholder-gray-400"
            rows={1}
            style={{ minHeight: '24px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          按 Enter 发送，Shift + Enter 换行
        </p>
      </div>
    </div>
  );
};
