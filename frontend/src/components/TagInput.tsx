import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Tag } from '@/types';

/**
 * タグ入力・表示コンポーネント
 * Phase 12: タグクラウド機能
 */

interface TagInputProps {
  tags: Tag[];
  onAddTag: (tagName: string) => Promise<void>;
  onRemoveTag: (tagId: string) => Promise<void>;
  disabled?: boolean;
}

export const TagInput: React.FC<TagInputProps> = ({
  tags,
  onAddTag,
  onRemoveTag,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue) return;

    // 重複チェック
    if (tags.some(tag => tag.name === trimmedValue)) {
      alert('このタグは既に追加されています');
      setInputValue('');
      return;
    }

    setIsAdding(true);
    try {
      await onAddTag(trimmedValue);
      setInputValue('');
    } catch (error) {
      console.error('タグ追加エラー:', error);
      alert('タグの追加に失敗しました');
    } finally {
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="タグを入力してEnter"
          disabled={disabled || isAdding}
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled || isAdding || !inputValue.trim()}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          追加
        </button>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-700 rounded-md text-sm"
            >
              {tag.name}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onRemoveTag(tag.id)}
                  className="ml-1 hover:text-red-600 transition-colors"
                  aria-label={`${tag.name}を削除`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
