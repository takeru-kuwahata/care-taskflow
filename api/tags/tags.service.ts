import * as tagsRepository from './tags.repository';

/**
 * タグサービス
 * Phase 12: タグクラウド機能
 */

/**
 * 全タグを取得
 */
export async function getAllTags() {
  return await tagsRepository.getAllTags();
}

/**
 * タグ名で検索
 */
export async function searchTags(query: string) {
  if (!query || query.trim() === '') {
    return await getAllTags();
  }
  return await tagsRepository.searchTags(query.trim());
}

/**
 * 課題にタグを追加
 * @param taskId 課題ID
 * @param tagName タグ名（新規作成または既存タグを使用）
 */
export async function addTagToTask(taskId: string, tagName: string) {
  // タグ名をトリム・正規化
  const normalizedTagName = tagName.trim();

  if (!normalizedTagName) {
    throw new Error('Tag name cannot be empty');
  }

  // タグを取得または作成
  const tag = await tagsRepository.getOrCreateTag(normalizedTagName);

  // 課題にタグを追加（重複の場合はエラーになるが、DB制約で防止）
  try {
    await tagsRepository.addTagToTask(taskId, tag.id);
  } catch (error: any) {
    // 重複エラーの場合は無視
    if (error.code === '23505') {
      // PostgreSQL unique violation
      return tag;
    }
    throw error;
  }

  return tag;
}

/**
 * 課題からタグを削除
 */
export async function removeTagFromTask(taskId: string, tagId: string) {
  await tagsRepository.removeTagFromTask(taskId, tagId);
}

/**
 * 課題のタグ一覧を取得
 */
export async function getTaskTags(taskId: string) {
  return await tagsRepository.getTaskTags(taskId);
}
