import React, { useState, useCallback } from 'react';
import { useNoteStore } from '../stores/noteStore';
import { Search, X } from 'lucide-react';

export const SearchBox: React.FC = () => {
  const { searchQuery, setSearchQuery, fetchNotes } = useNoteStore();
  const [isFocused, setIsFocused] = useState(false);

  // 防抖搜索
  const debouncedSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      // 延迟执行搜索
      setTimeout(() => {
        fetchNotes();
      }, 300);
    },
    [setSearchQuery, fetchNotes]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const handleClear = () => {
    setSearchQuery('');
    fetchNotes();
  };

  return (
    <div
      className={`relative flex items-center transition-all duration-200 ${
        isFocused ? 'w-80' : 'w-64'
      }`}
    >
      <Search
        size={18}
        className={`absolute left-3 transition-colors ${
          isFocused ? 'text-blue-500' : 'text-gray-400'
        }`}
      />
      <input
        type="text"
        value={searchQuery}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="搜索笔记..."
        className={`w-full pl-10 pr-9 py-2 bg-gray-100 border rounded-lg text-sm transition-all outline-none ${
          isFocused
            ? 'bg-white border-blue-500 ring-2 ring-blue-100'
            : 'border-transparent hover:bg-gray-200'
        }`}
      />
      
      {searchQuery && (
        <button
          onClick={handleClear}
          className="absolute right-3 p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};
