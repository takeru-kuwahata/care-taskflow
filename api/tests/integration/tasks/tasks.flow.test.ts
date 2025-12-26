/**
 * 課題管理API 統合テスト
 * 実データ主義: モックを使用せず、実際のデータベースとサービスを使用
 */

import { signupUser } from '../../../auth/auth.service.js';
import {
  createTaskWithRelations,
  getTaskList,
  getTaskDetail,
  updateTaskWithRelations,
  deleteTaskById,
} from '../../../tasks/tasks.service.js';
import {
  generateUniqueEmail,
  generateTestPassword,
} from '../../utils/test-auth-helper.js';
import { cleanupTestUser } from '../../utils/db-test-helper.js';
import {
  cleanupTestTasks,
  cleanupTaskById,
  generateTestTaskData,
  taskExists,
  getCausesCount,
  getActionsCount,
  getAssigneesCount,
} from '../../utils/test-task-helper.js';
import type {
  SignupData,
  TaskCreateRequest,
  TaskUpdateRequest,
} from '../../../types/index.js';

describe('課題管理API 統合テスト', () => {
  let testUserEmail: string;
  let testUserPassword: string;
  let testUserId: string;

  beforeAll(async () => {
    // テスト用ユーザーを作成
    testUserEmail = generateUniqueEmail('task-test-user');
    testUserPassword = generateTestPassword();

    const signupData: SignupData = {
      email: testUserEmail,
      password: testUserPassword,
    };

    const authResponse = await signupUser(signupData);
    testUserId = authResponse.user.id;
  });

  afterAll(async () => {
    // テストデータのクリーンアップ
    await cleanupTestTasks(testUserId);
    await cleanupTestUser(testUserEmail);
  });

  describe('課題作成', () => {
    let createdTaskId: string;

    afterEach(async () => {
      if (createdTaskId) {
        await cleanupTaskById(createdTaskId);
      }
    });

    it('正常に課題を作成できる', async () => {
      const taskData = generateTestTaskData();

      const task = await createTaskWithRelations(testUserId, taskData as TaskCreateRequest);

      expect(task).toBeDefined();
      expect(task.id).toBeDefined();
      expect(task.category).toBe(taskData.category);
      expect(task.problem).toBe(taskData.problem);
      expect(task.status).toBe(taskData.status);
      // deadlineはISO 8601形式（YYYY-MM-DDTHH:mm:ss.sssZ）で返却される
      expect(task.deadline).toContain(taskData.deadline);
      expect(task.causes).toHaveLength(2);
      expect(task.actions).toHaveLength(1);
      expect(task.assignees).toHaveLength(1);

      createdTaskId = task.id;

      // DBに実際に保存されているか確認
      const exists = await taskExists(createdTaskId);
      expect(exists).toBe(true);

      const causesCount = await getCausesCount(createdTaskId);
      expect(causesCount).toBe(2);

      const actionsCount = await getActionsCount(createdTaskId);
      expect(actionsCount).toBe(1);

      const assigneesCount = await getAssigneesCount(createdTaskId);
      expect(assigneesCount).toBe(1);
    });

    it('必須項目が不足している場合はエラーになる', async () => {
      const invalidData = {
        category: 'system',
        // problemが欠けている
        status: 'not_started',
      };

      await expect(
        createTaskWithRelations(testUserId, invalidData as TaskCreateRequest)
      ).rejects.toThrow();
    });
  });

  describe('課題一覧取得', () => {
    let taskId1: string;
    let taskId2: string;

    beforeAll(async () => {
      // テスト用課題を2つ作成
      const taskData1 = generateTestTaskData({
        category: 'system',
        status: 'in_progress',
      });
      const taskData2 = generateTestTaskData({
        category: 'coordination',
        status: 'not_started',
      });

      const task1 = await createTaskWithRelations(testUserId, taskData1 as TaskCreateRequest);
      taskId1 = task1.id;

      const task2 = await createTaskWithRelations(testUserId, taskData2 as TaskCreateRequest);
      taskId2 = task2.id;
    });

    afterAll(async () => {
      await cleanupTaskById(taskId1);
      await cleanupTaskById(taskId2);
    });

    it('課題一覧を取得できる', async () => {
      const result = await getTaskList({}, {});

      expect(result.tasks).toBeDefined();
      expect(Array.isArray(result.tasks)).toBe(true);
      expect(result.total).toBeGreaterThanOrEqual(2);
    });

    it('カテゴリでフィルタリングできる', async () => {
      const result = await getTaskList({ category: 'system' }, {});

      expect(result.tasks).toBeDefined();
      result.tasks.forEach((task) => {
        expect(task.category).toBe('system');
      });
    });

    it('ステータスでフィルタリングできる', async () => {
      const result = await getTaskList({ status: 'in_progress' }, {});

      expect(result.tasks).toBeDefined();
      result.tasks.forEach((task) => {
        expect(task.status).toBe('in_progress');
      });
    });
  });

  describe('課題詳細取得', () => {
    let taskId: string;

    beforeAll(async () => {
      const taskData = generateTestTaskData();

      const task = await createTaskWithRelations(testUserId, taskData as TaskCreateRequest);
      taskId = task.id;
    });

    afterAll(async () => {
      await cleanupTaskById(taskId);
    });

    it('課題詳細を取得できる', async () => {
      const task = await getTaskDetail(taskId);

      expect(task).toBeDefined();
      expect(task?.id).toBe(taskId);
      expect(task?.causes).toBeDefined();
      expect(task?.actions).toBeDefined();
      expect(task?.assignees).toBeDefined();
    });

    it('存在しない課題IDの場合はnullが返る', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const task = await getTaskDetail(nonExistentId);

      expect(task).toBeNull();
    });
  });

  describe('課題更新', () => {
    let taskId: string;

    beforeEach(async () => {
      const taskData = generateTestTaskData();

      const task = await createTaskWithRelations(testUserId, taskData as TaskCreateRequest);
      taskId = task.id;
    });

    afterEach(async () => {
      await cleanupTaskById(taskId);
    });

    it('課題を更新できる', async () => {
      const updateData: TaskUpdateRequest = {
        status: 'completed',
        causes: [
          { cause: '更新された原因1' },
        ],
      };

      const updatedTask = await updateTaskWithRelations(taskId, updateData);

      expect(updatedTask).toBeDefined();
      expect(updatedTask?.status).toBe('completed');
      expect(updatedTask?.causes).toHaveLength(1);
      expect(updatedTask?.causes[0].cause).toBe('更新された原因1');

      // DBに実際に更新されているか確認
      const causesCount = await getCausesCount(taskId);
      expect(causesCount).toBe(1);
    });

    it('存在しない課題IDの場合はnullが返る', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const updateData: TaskUpdateRequest = { status: 'completed' };

      const updatedTask = await updateTaskWithRelations(nonExistentId, updateData);

      expect(updatedTask).toBeNull();
    });
  });

  describe('課題削除', () => {
    let taskId: string;

    beforeEach(async () => {
      const taskData = generateTestTaskData();

      const task = await createTaskWithRelations(testUserId, taskData as TaskCreateRequest);
      taskId = task.id;
    });

    it('課題を削除できる', async () => {
      const deleted = await deleteTaskById(taskId);

      expect(deleted).toBe(true);

      // DBから実際に削除されているか確認
      const exists = await taskExists(taskId);
      expect(exists).toBe(false);

      // カスケード削除により関連データも削除されているか確認
      const causesCount = await getCausesCount(taskId);
      expect(causesCount).toBe(0);

      const actionsCount = await getActionsCount(taskId);
      expect(actionsCount).toBe(0);

      const assigneesCount = await getAssigneesCount(taskId);
      expect(assigneesCount).toBe(0);
    });

    it('存在しない課題IDの場合はfalseが返る', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const deleted = await deleteTaskById(nonExistentId);

      expect(deleted).toBe(false);
    });
  });

  describe('エンドツーエンドフロー - 課題のライフサイクル', () => {
    it('課題の作成→一覧取得→詳細取得→更新→削除の一連のフロー', async () => {
      // 1. 課題作成
      const taskData = generateTestTaskData({
        category: 'training',
        problem: 'E2Eテスト課題',
        status: 'not_started',
      });

      const createdTask = await createTaskWithRelations(testUserId, taskData as TaskCreateRequest);
      expect(createdTask).toBeDefined();
      const taskId = createdTask.id;

      // 2. 一覧取得で作成した課題が含まれることを確認
      const listResult = await getTaskList({}, {});
      const foundTask = listResult.tasks.find((t) => t.id === taskId);
      expect(foundTask).toBeDefined();

      // 3. 詳細取得
      const detailTask = await getTaskDetail(taskId);
      expect(detailTask).toBeDefined();
      expect(detailTask?.problem).toBe('E2Eテスト課題');

      // 4. 更新
      const updateData: TaskUpdateRequest = {
        status: 'completed',
      };
      const updatedTask = await updateTaskWithRelations(taskId, updateData);
      expect(updatedTask).toBeDefined();
      expect(updatedTask?.status).toBe('completed');

      // 5. 削除
      const deleted = await deleteTaskById(taskId);
      expect(deleted).toBe(true);

      // 削除確認
      const exists = await taskExists(taskId);
      expect(exists).toBe(false);
    });
  });
});
