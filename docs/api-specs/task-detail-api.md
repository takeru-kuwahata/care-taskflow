# 課題詳細API仕様書

生成日: 2025-12-25
収集元: frontend/src/services/mock/TaskDetailService.ts
@MOCK_TO_APIマーク数: 4

## エンドポイント一覧

### 1. 課題詳細取得

- **エンドポイント**: `GET /api/tasks/:id`
- **説明**: 指定されたIDの課題詳細を取得

#### パスパラメータ

| パラメータ名 | 型 | 必須 | 説明 |
|------------|---|------|------|
| id | string | 必須 | 課題ID |

#### Request例

```http
GET /api/tasks/1
```

#### Response

**型**: `TaskDetailResponse`

```typescript
interface TaskDetailResponse {
  task: Task;
}
```

#### Response例（成功）

```json
{
  "task": {
    "id": "1",
    "taskNumber": 1,
    "category": "system",
    "problem": "医療的ケア児の情報が各部署で分散しており、一元管理ができていない",
    "status": "in_progress",
    "deadline": "2025-01-31",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z",
    "createdBy": "user1",
    "causes": [],
    "actions": [],
    "assignees": [
      {
        "id": "a1",
        "taskId": "1",
        "name": "田中太郎",
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ]
  }
}
```

#### エラーレスポンス

**404 Not Found**:
```json
{
  "error": "Task not found"
}
```

---

### 2. 課題作成

- **エンドポイント**: `POST /api/tasks`
- **説明**: 新規課題を作成

#### Request

**型**: `TaskCreateRequest`

```typescript
interface TaskCreateRequest {
  category: TaskCategory;        // 必須
  problem: string;                // 必須
  status: TaskStatus;             // 必須
  deadline?: string;              // 任意（ISO 8601形式: YYYY-MM-DD）
  relatedBusiness?: string;       // 任意
  businessContent?: string;       // 任意
  organization?: string;          // 任意
  causes?: CauseCreateRequest[];  // 任意（配列）
  actions?: ActionCreateRequest[]; // 任意（配列）
  assignees?: AssigneeCreateRequest[]; // 任意（配列）
}

interface CauseCreateRequest {
  cause: string;
}

interface ActionCreateRequest {
  action: string;
}

interface AssigneeCreateRequest {
  name: string;
  organization?: string;
}
```

#### Request例

```json
{
  "category": "coordination",
  "problem": "新しい課題の説明",
  "status": "not_started",
  "deadline": "2025-03-31",
  "causes": [
    { "cause": "原因1" },
    { "cause": "原因2" }
  ],
  "actions": [
    { "action": "対応案1" }
  ],
  "assignees": [
    { "name": "山田太郎", "organization": "福祉部" }
  ]
}
```

#### Response

**型**: `TaskDetailResponse`

成功時は作成された課題の詳細を返す（GET /api/tasks/:idと同じ形式）

---

### 3. 課題更新

- **エンドポイント**: `PUT /api/tasks/:id`
- **説明**: 既存課題を更新

#### パスパラメータ

| パラメータ名 | 型 | 必須 | 説明 |
|------------|---|------|------|
| id | string | 必須 | 課題ID |

#### Request

**型**: `TaskUpdateRequest`

```typescript
interface TaskUpdateRequest {
  category?: TaskCategory;
  problem?: string;
  status?: TaskStatus;
  deadline?: string;
  relatedBusiness?: string;
  businessContent?: string;
  organization?: string;
  causes?: CauseCreateRequest[];
  actions?: ActionCreateRequest[];
  assignees?: AssigneeCreateRequest[];
}
```

**注**: すべてのフィールドが任意。指定されたフィールドのみ更新される。

#### Request例

```json
{
  "status": "in_progress",
  "deadline": "2025-04-15",
  "causes": [
    { "cause": "更新された原因1" },
    { "cause": "新しい原因2" }
  ]
}
```

#### Response

**型**: `TaskDetailResponse`

成功時は更新された課題の詳細を返す（GET /api/tasks/:idと同じ形式）

#### エラーレスポンス

**404 Not Found**:
```json
{
  "error": "Task not found"
}
```

---

### 4. 課題削除

- **エンドポイント**: `DELETE /api/tasks/:id`
- **説明**: 課題を削除

#### パスパラメータ

| パラメータ名 | 型 | 必須 | 説明 |
|------------|---|------|------|
| id | string | 必須 | 課題ID |

#### Request例

```http
DELETE /api/tasks/1
```

#### Response

**成功時**: ステータスコード204（No Content）、レスポンスボディなし

#### エラーレスポンス

**404 Not Found**:
```json
{
  "error": "Task not found"
}
```

---

## 型定義参照

すべての型定義は以下のファイルに記載されています：
```typescript
// フロントエンドの型定義
frontend/src/types/index.ts
```

### 主要な型

- `Task`: 課題エンティティ
- `Cause`: 原因エンティティ
- `Action`: 対応案エンティティ
- `Assignee`: 対応者エンティティ
- `TaskCategory`: カテゴリ型（'system' | 'coordination' | 'training' | 'support' | 'other'）
- `TaskStatus`: ステータス型（'not_started' | 'in_progress' | 'completed'）

## モックサービス参照

```typescript
// 実装時はこのモックサービスの挙動を参考にする
frontend/src/services/mock/TaskDetailService.ts
```

## バリデーションルール

### 作成時（POST）
- **必須項目**: category, problem, status
- **任意項目**: deadline, relatedBusiness, businessContent, organization, causes, actions, assignees

### 更新時（PUT）
- **すべて任意**: 指定されたフィールドのみ更新

### 共通
- `problem`: 最大500文字
- `category`: 定義済みのカテゴリ値のみ許可
- `status`: 定義済みのステータス値のみ許可
- `deadline`: ISO 8601形式（YYYY-MM-DD）

## 備考

- 課題削除時、関連する原因・対応案・対応者も自動的に削除される（カスケード削除）
- taskNumberは自動採番（作成時に指定不可）
- createdAt, updatedAt, createdByはサーバー側で自動設定
