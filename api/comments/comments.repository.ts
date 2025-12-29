import { db } from '../db/index';
import { comments, users } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

/**
 * コメントリポジトリ
 * Phase 12: コメント機能
 */

/**
 * 課題のコメント一覧を取得（作成者情報付き）
 */
export async function getTaskComments(taskId: string) {
  return await db
    .select({
      id: comments.id,
      taskId: comments.taskId,
      userId: comments.userId,
      userName: users.email, // メールアドレスをユーザー名として使用
      content: comments.content,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.taskId, taskId))
    .orderBy(desc(comments.createdAt)); // 新しい順
}

/**
 * コメントを作成
 */
export async function createComment(taskId: string, userId: string, content: string) {
  const newComment = {
    id: uuidv4(),
    taskId,
    userId,
    content,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(comments).values(newComment);

  // 作成したコメントをユーザー情報付きで返す
  const result = await db
    .select({
      id: comments.id,
      taskId: comments.taskId,
      userId: comments.userId,
      userName: users.email,
      content: comments.content,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.id, newComment.id))
    .limit(1);

  return result[0];
}

/**
 * コメントを更新
 */
export async function updateComment(commentId: string, _userId: string, content: string) {
  await db
    .update(comments)
    .set({
      content,
      updatedAt: new Date(),
    })
    .where(eq(comments.id, commentId));

  // 更新後のコメントをユーザー情報付きで返す
  const result = await db
    .select({
      id: comments.id,
      taskId: comments.taskId,
      userId: comments.userId,
      userName: users.email,
      content: comments.content,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.id, commentId))
    .limit(1);

  return result[0];
}

/**
 * コメントを削除
 */
export async function deleteComment(commentId: string) {
  await db.delete(comments).where(eq(comments.id, commentId));
}

/**
 * コメントの所有者確認
 */
export async function isCommentOwner(commentId: string, userId: string): Promise<boolean> {
  const result = await db
    .select()
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);

  return result.length > 0 && result[0].userId === userId;
}

/**
 * 課題のコメント数を取得
 */
export async function getCommentCount(taskId: string): Promise<number> {
  const result = await db
    .select()
    .from(comments)
    .where(eq(comments.taskId, taskId));

  return result.length;
}
