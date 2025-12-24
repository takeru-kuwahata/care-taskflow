# プロジェクト設定

## 基本設定
```yaml
プロジェクト名: 医療的ケア児支援課題管理システム（ケアTaskFlow）
開始日: 2025-12-24
技術スタック:
  frontend: React 18 + TypeScript 5 + shadcn/ui + Tailwind CSS + Vite 5
  backend: Neon PostgreSQL + Drizzle ORM + Vercel Serverless Functions
  database: Neon PostgreSQL
  hosting: Vercel
  auth: Clerk
```

## 開発環境
```yaml
ポート設定:
  # 複数プロジェクト並行開発のため、一般的でないポートを使用
  frontend: 3247
  backend: 8432
  database: 5433

環境変数:
  設定ファイル: .env.local（ルートディレクトリ）
  必須項目:
    - DATABASE_URL（Neon PostgreSQL接続URL）
    - VITE_API_BASE_URL（APIベースURL）
    - CLERK_PUBLISHABLE_KEY（Clerk公開鍵、認証使用時）
    - CLERK_SECRET_KEY（Clerkシークレット、認証使用時）
```

## テスト認証情報
```yaml
開発用アカウント:
  email: test@care-taskflow.local
  password: TestPass2025!

外部サービス:
  Neon: PostgreSQLデータベース（無料枠0.5GB、24/7稼働）
  Vercel: ホスティング＋Serverless Functions（無料枠）
  Clerk: 認証サービス（無料枠5,000MAU）
```

## コーディング規約

### 命名規則
```yaml
ファイル名:
  - コンポーネント: PascalCase.tsx (例: TaskList.tsx, TaskDetail.tsx)
  - ユーティリティ: camelCase.ts (例: formatDate.ts, apiClient.ts)
  - 定数: UPPER_SNAKE_CASE.ts (例: API_ENDPOINTS.ts, CATEGORIES.ts)

変数・関数:
  - 変数: camelCase (例: taskList, selectedCategory)
  - 関数: camelCase (例: fetchTasks, handleSubmit)
  - 定数: UPPER_SNAKE_CASE (例: MAX_TASK_LENGTH, API_BASE_URL)
  - 型/インターフェース: PascalCase (例: Task, TaskFormData)
```

### コード品質
```yaml
必須ルール:
  - TypeScript: strictモード有効
  - 未使用の変数/import禁止
  - console.log本番環境禁止（console.warn, console.errorは許可）
  - エラーハンドリング必須
  - 関数行数: 100行以下（96.7%カバー）
  - ファイル行数: 700行以下（96.9%カバー）
  - 複雑度: 10以下
  - 行長: 120文字

フォーマット:
  - インデント: スペース2つ
  - セミコロン: あり
  - クォート: シングル
  - 末尾カンマ: あり（ES5準拠）
```

## プロジェクト固有ルール

### APIエンドポイント
```yaml
命名規則:
  - RESTful形式を厳守
  - 複数形を使用 (/tasks, /users)
  - ケバブケース使用

エンドポイント一覧:
  - GET /api/tasks: 課題一覧取得
  - GET /api/tasks/:id: 課題詳細取得
  - POST /api/tasks: 課題作成
  - PUT /api/tasks/:id: 課題更新
  - DELETE /api/tasks/:id: 課題削除
  - GET /api/health: ヘルスチェック
```

### 型定義
```yaml
配置:
  frontend: src/types/index.ts
  backend: api/types/index.ts

同期ルール:
  - 共通の型定義（Task, Cause, Action等）は両ファイルに同一内容を保つ
  - 片方を更新したら即座にもう片方も更新

主要型:
  - Task: 課題
  - Cause: 原因
  - Action: 対応案
  - Assignee: 対応者
  - User: ユーザー
```

### デザインシステム
```yaml
色使い（最大3色＋α）:
  ベース色:
    - 白: #FFFFFF
    - ライトグレー: #F3F4F6
    - ミディアムグレー: #9CA3AF

  アクセント色:
    - ブルー: #3B82F6（進行中、リンク、ボタン）
    - レッド: #EF4444（期限切れ、削除ボタン）
    - グリーン: #10B981（完了）※最小限使用

フォント:
  - 和文: Noto Sans JP
  - 英文: Inter

原則:
  - シンプル、視認性重視
  - Backlog的ゴチャゴチャ感なし
```

## ディレクトリ構成
```
/
├── docs/
│   ├── requirements.md          # 要件定義書
│   ├── requirements_draft.md    # 要件定義書下書き
│   ├── ui_design_notes.md       # UI/UXデザイン詳細仕様
│   └── SCOPE_PROGRESS.md        # 進捗管理表
├── src/
│   ├── components/              # UIコンポーネント
│   │   ├── TaskList.tsx
│   │   ├── TaskDetail.tsx
│   │   └── ...
│   ├── pages/                   # ページコンポーネント
│   │   ├── TaskListPage.tsx
│   │   ├── TaskDetailPage.tsx
│   │   ├── LoginPage.tsx
│   │   └── SignupPage.tsx
│   ├── types/                   # 型定義
│   │   └── index.ts
│   ├── utils/                   # ユーティリティ関数
│   ├── hooks/                   # カスタムフック
│   ├── store/                   # Zustand状態管理
│   └── api/                     # API呼び出し
├── api/                         # Vercel Serverless Functions
│   ├── tasks/
│   │   ├── index.ts             # GET /api/tasks
│   │   └── [id].ts              # GET/PUT/DELETE /api/tasks/:id
│   ├── types/                   # 型定義（バックエンド）
│   │   └── index.ts
│   └── health.ts                # GET /api/health
├── .eslintrc.json               # ESLint設定
├── .prettierrc.json             # Prettier設定
├── CLAUDE.md                    # このファイル
└── README.md                    # プロジェクト概要
```

## 🆕 最新技術情報（知識カットオフ対応）

### shadcn/ui
- コピー&ペースト型UIライブラリ
- Radix UI + Tailwind CSS ベース
- React 18+必須
- 公式: https://ui.shadcn.com/

### Neon PostgreSQL
- サーバーレスPostgreSQL
- 無料枠: 0.5GB、24/7稼働
- Vercel公式統合
- 公式: https://neon.tech

### Drizzle ORM
- TypeScript-first ORM
- 型安全なクエリビルダー
- PostgreSQL完全対応
- 公式: https://orm.drizzle.team/

### Clerk
- モダンな認証サービス
- React SDKが充実
- 無料枠: 5,000MAU
- メール確認不要設定が可能（MVP簡略化）
- 公式: https://clerk.com

**選定理由**:
- MVP開発速度優先（簡単実装）
- Auth.jsより学習コスト低い
- 無料枠で十分な規模

---

## 開発フロー

### Phase 1: 要件定義（完了）
- ✅ 成果目標の明確化
- ✅ 実現可能性調査
- ✅ 技術スタック決定
- ✅ ページ構成決定
- ✅ 要件定義書作成

### Phase 2: Git/GitHub管理（推奨、スキップ可）
- リポジトリ作成
- 初期コミット
- ブランチ戦略設定

### Phase 3: フロントエンド基盤
- Vite + React + TypeScript環境構築
- shadcn/ui + Tailwind CSS セットアップ
- ルーティング設定（React Router v6）
- 状態管理設定（Zustand）
- 開発サーバー起動確認

### Phase 4: ページ実装
- P-001: 課題一覧ページ
- P-002: 課題詳細ページ
- AUTH-001: ログインページ
- AUTH-002: サインアップページ

---

**設定ファイル終了**
