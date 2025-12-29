import { db } from '../db/index';
import { tags, taskTags } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

/**
 * タグリポジトリ
 * Phase 12: タグクラウド機能
 */

/**
 * 全タグを取得
 */
export async function getAllTags() {
  return await db.select().from(tags).orderBy(tags.name);
}

/**
 * タグ名で検索（部分一致）
 */
export async function searchTags(query: string) {
  return await db
    .select()
    .from(tags)
    .where(sql`${tags.name} ILIKE ${'%' + query + '%'}`)
    .orderBy(tags.name);
}

/**
 * タグ名でタグを取得または作成
 */
export async function getOrCreateTag(name: string) {
  // 既存のタグを検索
  const existingTags = await db
    .select()
    .from(tags)
    .where(eq(tags.name, name))
    .limit(1);

  if (existingTags.length > 0) {
    return existingTags[0];
  }

  // 新規作成
  const newTag = {
    id: uuidv4(),
    name,
    createdAt: new Date(),
  };

  await db.insert(tags).values(newTag);
  return newTag;
}

/**
 * 課題にタグを追加
 */
export async function addTagToTask(taskId: string, tagId: string) {
  const taskTag = {
    taskId,
    tagId,
    createdAt: new Date(),
  };

  await db.insert(taskTags).values(taskTag);
  return taskTag;
}

/**
 * 課題からタグを削除
 */
export async function removeTagFromTask(taskId: string, tagId: string) {
  await db
    .delete(taskTags)
    .where(
      sql`${taskTags.taskId} = ${taskId} AND ${taskTags.tagId} = ${tagId}`
    );
}

/**
 * 課題のタグ一覧を取得
 */
export async function getTaskTags(taskId: string) {
  return await db
    .select({
      id: tags.id,
      name: tags.name,
      createdAt: tags.createdAt,
    })
    .from(taskTags)
    .innerJoin(tags, eq(taskTags.tagId, tags.id))
    .where(eq(taskTags.taskId, taskId))
    .orderBy(tags.name);
}
