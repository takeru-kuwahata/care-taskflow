import * as commentsRepository from './comments.repository';

/**
 * コメントサービス
 * Phase 12: コメント機能
 */

/**
 * 課題のコメント一覧を取得
 */
export async function getTaskComments(taskId: string) {
  return await commentsRepository.getTaskComments(taskId);
}

/**
 * コメントを作成
 */
export async function createComment(taskId: string, userId: string, content: string) {
  // バリデーション
  const trimmedContent = content.trim();
  if (!trimmedContent) {
    throw new Error('コメント内容を入力してください');
  }

  if (trimmedContent.length > 10000) {
    throw new Error('コメントは10,000文字以内で入力してください');
  }

  return await commentsRepository.createComment(taskId, userId, trimmedContent);
}

/**
 * コメントを更新
 */
export async function updateComment(commentId: string, userId: string, content: string) {
  // 所有者確認
  const isOwner = await commentsRepository.isCommentOwner(commentId, userId);
  if (!isOwner) {
    throw new Error('他のユーザーのコメントは編集できません');
  }

  // バリデーション
  const trimmedContent = content.trim();
  if (!trimmedContent) {
    throw new Error('コメント内容を入力してください');
  }

  if (trimmedContent.length > 10000) {
    throw new Error('コメントは10,000文字以内で入力してください');
  }

  return await commentsRepository.updateComment(commentId, userId, trimmedContent);
}

/**
 * コメントを削除
 */
export async function deleteComment(commentId: string, userId: string) {
  // 所有者確認
  const isOwner = await commentsRepository.isCommentOwner(commentId, userId);
  if (!isOwner) {
    throw new Error('他のユーザーのコメントは削除できません');
  }

  await commentsRepository.deleteComment(commentId);
}

/**
 * 課題のコメント数を取得
 */
export async function getCommentCount(taskId: string): Promise<number> {
  return await commentsRepository.getCommentCount(taskId);
}
