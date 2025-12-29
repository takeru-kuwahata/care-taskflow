import React, { useState, useEffect } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import type { Comment } from '@/types';
import { getTaskComments, createComment } from '@/lib/apiClient';
import { logger } from '@/lib/logger';

/**
 * コメントセクションコンポーネント
 * Phase 12: コメント機能
 */

interface CommentSectionProps {
  taskId: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ taskId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // コメント一覧を取得
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setIsLoading(true);
        const { comments: fetchedComments } = await getTaskComments(taskId);
        setComments(fetchedComments);
        logger.debug('Comments fetched', { count: fetchedComments.length });
      } catch (error) {
        logger.error('Failed to fetch comments', { error });
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [taskId]);

  // コメント投稿
  const handlePost = async () => {
    const trimmedContent = newComment.trim();
    if (!trimmedContent) return;

    setIsPosting(true);
    try {
      const { comment } = await createComment(taskId, trimmedContent);
      setComments([comment, ...comments]); // 新しいコメントを先頭に追加
      setNewComment('');
      logger.debug('Comment posted', { commentId: comment.id });
    } catch (error) {
      logger.error('Failed to post comment', { error });
      alert('コメントの投稿に失敗しました');
    } finally {
      setIsPosting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter または Cmd+Enter で投稿
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handlePost();
    }
  };

  // 日時フォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } else if (days > 0) {
      return `${days}日前`;
    } else if (hours > 0) {
      return `${hours}時間前`;
    } else if (minutes > 0) {
      return `${minutes}分前`;
    } else {
      return 'たった今';
    }
  };

  return (
    <div className="space-y-4">
      {/* コメント投稿フォーム */}
      <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
        <div className="flex items-start gap-2">
          <MessageCircle className="h-5 w-5 text-gray-400 mt-1" />
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="コメントを入力... (Ctrl+Enterで投稿)"
              disabled={isPosting}
              className="w-full min-h-[80px] resize-none border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handlePost}
                disabled={isPosting || !newComment.trim()}
                className="flex items-center gap-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-1.5 px-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <Send className="h-4 w-4" />
                投稿
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* コメント一覧 */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-4 text-gray-500 text-sm">
            読み込み中...
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">
            まだコメントがありません
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-900">
                    {comment.userName || '匿名'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
