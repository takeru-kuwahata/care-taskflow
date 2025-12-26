import {
  isTaskCategory,
  isTaskStatus,
} from '../types/index.js';

/**
 * 課題バリデーションユーティリティ
 */

/**
 * バリデーション結果型
 */
export interface ValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * 日付文字列がISO 8601形式（YYYY-MM-DD）かチェック
 */
function isValidDateString(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) {
    return false;
  }

  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * 原因配列のバリデーション
 */
function validateCauses(causes: unknown): ValidationResult {
  if (!Array.isArray(causes)) {
    return { valid: false, message: 'causesは配列である必要があります' };
  }

  for (const [index, cause] of causes.entries()) {
    if (typeof cause !== 'object' || cause === null) {
      return { valid: false, message: `causes[${index}]はオブジェクトである必要があります` };
    }

    const c = cause as Record<string, unknown>;
    if (typeof c.cause !== 'string' || c.cause.trim() === '') {
      return { valid: false, message: `causes[${index}].causeは空でない文字列である必要があります` };
    }
  }

  return { valid: true };
}

/**
 * 対応案配列のバリデーション
 */
function validateActions(actions: unknown): ValidationResult {
  if (!Array.isArray(actions)) {
    return { valid: false, message: 'actionsは配列である必要があります' };
  }

  for (const [index, action] of actions.entries()) {
    if (typeof action !== 'object' || action === null) {
      return { valid: false, message: `actions[${index}]はオブジェクトである必要があります` };
    }

    const a = action as Record<string, unknown>;
    if (typeof a.action !== 'string' || a.action.trim() === '') {
      return { valid: false, message: `actions[${index}].actionは空でない文字列である必要があります` };
    }
  }

  return { valid: true };
}

/**
 * 対応者配列のバリデーション
 */
function validateAssignees(assignees: unknown): ValidationResult {
  if (!Array.isArray(assignees)) {
    return { valid: false, message: 'assigneesは配列である必要があります' };
  }

  for (const [index, assignee] of assignees.entries()) {
    if (typeof assignee !== 'object' || assignee === null) {
      return { valid: false, message: `assignees[${index}]はオブジェクトである必要があります` };
    }

    const a = assignee as Record<string, unknown>;
    if (typeof a.name !== 'string' || a.name.trim() === '') {
      return { valid: false, message: `assignees[${index}].nameは空でない文字列である必要があります` };
    }

    if (a.organization !== undefined && typeof a.organization !== 'string') {
      return { valid: false, message: `assignees[${index}].organizationは文字列である必要があります` };
    }
  }

  return { valid: true };
}

/**
 * 課題作成リクエストのバリデーション
 */
export function validateTaskCreateRequest(data: unknown): ValidationResult {
  if (typeof data !== 'object' || data === null) {
    return { valid: false, message: 'リクエストボディがオブジェクトではありません' };
  }

  const req = data as Record<string, unknown>;

  // 必須項目チェック: category
  if (!isTaskCategory(req.category)) {
    return { valid: false, message: 'categoryは有効なカテゴリである必要があります' };
  }

  // 必須項目チェック: problem
  if (typeof req.problem !== 'string' || req.problem.trim() === '') {
    return { valid: false, message: 'problemは空でない文字列である必要があります' };
  }

  if (req.problem.length > 500) {
    return { valid: false, message: 'problemは最大500文字です' };
  }

  // 必須項目チェック: status
  if (!isTaskStatus(req.status)) {
    return { valid: false, message: 'statusは有効なステータスである必要があります' };
  }

  // 任意項目チェック: deadline
  if (req.deadline !== undefined) {
    if (typeof req.deadline !== 'string' || !isValidDateString(req.deadline)) {
      return { valid: false, message: 'deadlineはISO 8601形式（YYYY-MM-DD）である必要があります' };
    }
  }

  // 任意項目チェック: relatedBusiness
  if (req.relatedBusiness !== undefined && typeof req.relatedBusiness !== 'string') {
    return { valid: false, message: 'relatedBusinessは文字列である必要があります' };
  }

  // 任意項目チェック: businessContent
  if (req.businessContent !== undefined && typeof req.businessContent !== 'string') {
    return { valid: false, message: 'businessContentは文字列である必要があります' };
  }

  // 任意項目チェック: organization
  if (req.organization !== undefined && typeof req.organization !== 'string') {
    return { valid: false, message: 'organizationは文字列である必要があります' };
  }

  // 任意項目チェック: causes
  if (req.causes !== undefined) {
    const causesResult = validateCauses(req.causes);
    if (!causesResult.valid) {
      return causesResult;
    }
  }

  // 任意項目チェック: actions
  if (req.actions !== undefined) {
    const actionsResult = validateActions(req.actions);
    if (!actionsResult.valid) {
      return actionsResult;
    }
  }

  // 任意項目チェック: assignees
  if (req.assignees !== undefined) {
    const assigneesResult = validateAssignees(req.assignees);
    if (!assigneesResult.valid) {
      return assigneesResult;
    }
  }

  return { valid: true };
}

/**
 * 課題更新リクエストのバリデーション
 */
export function validateTaskUpdateRequest(data: unknown): ValidationResult {
  if (typeof data !== 'object' || data === null) {
    return { valid: false, message: 'リクエストボディがオブジェクトではありません' };
  }

  const req = data as Record<string, unknown>;

  // すべて任意項目だが、指定された場合は検証する

  // category
  if (req.category !== undefined && !isTaskCategory(req.category)) {
    return { valid: false, message: 'categoryは有効なカテゴリである必要があります' };
  }

  // problem
  if (req.problem !== undefined) {
    if (typeof req.problem !== 'string' || req.problem.trim() === '') {
      return { valid: false, message: 'problemは空でない文字列である必要があります' };
    }
    if (req.problem.length > 500) {
      return { valid: false, message: 'problemは最大500文字です' };
    }
  }

  // status
  if (req.status !== undefined && !isTaskStatus(req.status)) {
    return { valid: false, message: 'statusは有効なステータスである必要があります' };
  }

  // deadline
  if (req.deadline !== undefined) {
    if (typeof req.deadline !== 'string' || !isValidDateString(req.deadline)) {
      return { valid: false, message: 'deadlineはISO 8601形式（YYYY-MM-DD）である必要があります' };
    }
  }

  // relatedBusiness
  if (req.relatedBusiness !== undefined && typeof req.relatedBusiness !== 'string') {
    return { valid: false, message: 'relatedBusinessは文字列である必要があります' };
  }

  // businessContent
  if (req.businessContent !== undefined && typeof req.businessContent !== 'string') {
    return { valid: false, message: 'businessContentは文字列である必要があります' };
  }

  // organization
  if (req.organization !== undefined && typeof req.organization !== 'string') {
    return { valid: false, message: 'organizationは文字列である必要があります' };
  }

  // causes
  if (req.causes !== undefined) {
    const causesResult = validateCauses(req.causes);
    if (!causesResult.valid) {
      return causesResult;
    }
  }

  // actions
  if (req.actions !== undefined) {
    const actionsResult = validateActions(req.actions);
    if (!actionsResult.valid) {
      return actionsResult;
    }
  }

  // assignees
  if (req.assignees !== undefined) {
    const assigneesResult = validateAssignees(req.assignees);
    if (!assigneesResult.valid) {
      return assigneesResult;
    }
  }

  return { valid: true };
}

/**
 * クエリパラメータのバリデーション（フィルター・ソート）
 */
export function validateTaskQueryParams(query: Record<string, unknown>): ValidationResult {
  // category
  if (query.category !== undefined && !isTaskCategory(query.category)) {
    return { valid: false, message: 'categoryクエリパラメータが無効です' };
  }

  // status
  if (query.status !== undefined && !isTaskStatus(query.status)) {
    return { valid: false, message: 'statusクエリパラメータが無効です' };
  }

  // assignee
  if (query.assignee !== undefined && typeof query.assignee !== 'string') {
    return { valid: false, message: 'assigneeクエリパラメータは文字列である必要があります' };
  }

  // sortBy
  if (query.sortBy !== undefined) {
    const validSortFields = ['taskNumber', 'deadline', 'status', 'category'];
    if (!validSortFields.includes(query.sortBy as string)) {
      return { valid: false, message: 'sortByクエリパラメータが無効です' };
    }
  }

  // sortOrder
  if (query.sortOrder !== undefined) {
    if (query.sortOrder !== 'asc' && query.sortOrder !== 'desc') {
      return { valid: false, message: 'sortOrderは"asc"または"desc"である必要があります' };
    }
  }

  return { valid: true };
}
