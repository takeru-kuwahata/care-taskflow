# 課題一覧API仕様書

生成日: 2025-12-25
収集元: frontend/src/services/mock/TaskListService.ts
@MOCK_TO_APIマーク数: 1

## エンドポイント一覧

### 1. 課題一覧取得

- **エンドポイント**: `GET /api/tasks`
- **APIパス定数**: なし（クエリパラメータで制御）
- **説明**: 課題一覧を取得。フィルタリングとソートに対応。

#### クエリパラメータ

| パラメータ名 | 型 | 必須 | 説明 | 例 |
|------------|---|------|------|-----|
| category | string | 任意 | カテゴリでフィルタ | `system`, `coordination`, `training`, `support`, `other` |
| status | string | 任意 | ステータスでフィルタ | `not_started`, `in_progress`, `completed` |
| assignee | string | 任意 | 対応者名でフィルタ | `田中太郎` |
| sortBy | string | 任意 | ソート対象列 | `taskNumber`, `deadline`, `status`, `category` |
| sortOrder | string | 任意 | ソート順 | `asc`, `desc` |

#### Request例

```http
GET /api/tasks?status=not_started&sortBy=deadline&sortOrder=asc
```

#### Response

**型**: `TaskListResponse`

```typescript
interface TaskListResponse {
  tasks: Task[];
  total: number;
}

interface Task {
  id: string;
  taskNumber: number;
  category: TaskCategory; // 'system' | 'coordination' | 'training' | 'support' | 'other'
  problem: string;
  status: TaskStatus; // 'not_started' | 'in_progress' | 'completed'
  deadline?: string; // ISO 8601形式の日付 (YYYY-MM-DD)
  relatedBusiness?: string;
  businessContent?: string;
  organization?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  causes: Cause[];
  actions: Action[];
  assignees: Assignee[];
}

interface Cause {
  id: string;
  taskId: string;
  cause: string;
  createdAt: string;
}

interface Action {
  id: string;
  taskId: string;
  action: string;
  createdAt: string;
}

interface Assignee {
  id: string;
  taskId: string;
  name: string;
  organization?: string;
  createdAt: string;
}
```

#### Response例

```json
{
  "tasks": [
    {
      "id": "2",
      "taskNumber": 2,
      "category": "coordination",
      "problem": "教育委員会と福祉部門の連携が不十分で、支援の漏れが発生している",
      "status": "not_started",
      "deadline": "2025-02-15",
      "createdAt": "2025-01-02T00:00:00Z",
      "updatedAt": "2025-01-02T00:00:00Z",
      "createdBy": "user2",
      "causes": [],
      "actions": [],
      "assignees": [
        {
          "id": "a2",
          "taskId": "2",
          "name": "鈴木花子",
          "createdAt": "2025-01-02T00:00:00Z"
        }
      ]
    },
    {
      "id": "5",
      "taskNumber": 5,
      "category": "other",
      "problem": "予算不足により、必要な医療機器の配備が遅れている",
      "status": "not_started",
      "deadline": "2024-12-15",
      "createdAt": "2024-11-01T00:00:00Z",
      "updatedAt": "2024-11-01T00:00:00Z",
      "createdBy": "user2",
      "causes": [],
      "actions": [],
      "assignees": [
        {
          "id": "a5",
          "taskId": "5",
          "name": "鈴木花子",
          "createdAt": "2024-11-01T00:00:00Z"
        }
      ]
    }
  ],
  "total": 2
}
```

## モックサービス参照

```typescript
// 実装時はこのモックサービスの挙動を参考にする
frontend/src/services/mock/TaskListService.ts
```

## 型定義参照

```typescript
// フロントエンドの型定義
frontend/src/types/index.ts
```

## 備考

- フィルタリング処理はバックエンド側で実装
- ソート処理もバックエンド側で実装
- 複数フィルター条件の組み合わせ可能（AND条件）
- deadlineが未設定の場合、ソート時は最後に配置
