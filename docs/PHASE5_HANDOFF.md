# Phase 5: 環境構築への引き継ぎ文書

**作成日**: 2025-12-25
**引き継ぎ元**: Phase 9（E2Eテスト）
**引き継ぎ先**: Phase 5（環境構築オーケストレーター）

---

## 📋 引き継ぎ概要

Phase 9（E2Eテスト）を実施した結果、**環境変数の設定不足とバックエンドAPI未接続**が原因で、E2Eテストの成功率が30.8%（12/39）に留まりました。

E2Eテストを100%成功させるため、Phase 5（環境構築）に戻り、以下の環境整備を完了させる必要があります。

---

## 🎯 Phase 5で完了すべき作業

### 1. 環境変数の設定（最優先）

#### 必須の環境変数

**ファイル**: `/.env.local`（プロジェクトルートディレクトリ）

```bash
# データベース接続
DATABASE_URL="postgresql://[username]:[password]@[host]/[database]?sslmode=require"

# JWT認証
JWT_SECRET="your-secret-key-here-minimum-32-characters"

# API設定
VITE_API_BASE_URL="http://localhost:8432"

# フロントエンド開発サーバー
VITE_PORT=3247
```

#### 環境変数の詳細

1. **DATABASE_URL**
   - Neon PostgreSQL接続URL
   - Neonダッシュボードから取得
   - 形式: `postgresql://[username]:[password]@[host]/[database]?sslmode=require`
   - 例: `postgresql://user:pass@ep-cool-name-123456.us-east-2.aws.neon.tech/caretaskflow?sslmode=require`

2. **JWT_SECRET**
   - JWT署名用のシークレットキー
   - 最低32文字以上のランダムな文字列
   - 生成方法: `openssl rand -base64 32`

3. **VITE_API_BASE_URL**
   - APIベースURL
   - ローカル開発: `http://localhost:8432`
   - 本番環境: Vercel URL（デプロイ後に設定）

### 2. Neon PostgreSQLセットアップ

#### ステップ1: Neonプロジェクト作成

1. https://neon.tech にアクセス
2. 新規プロジェクト作成
   - プロジェクト名: `caretaskflow`（または任意）
   - リージョン: `US East (Ohio)` または `Asia Pacific (Tokyo)`
   - PostgreSQLバージョン: 16（推奨）

3. 接続URLをコピー
   - ダッシュボードから `DATABASE_URL` を取得
   - `.env.local` に貼り付け

#### ステップ2: データベーススキーマ作成

**既存のスキーマファイル**: `/api/db/schema.ts`

```typescript
// すでに実装済み - 確認のみ
export const users = pgTable('users', { ... });
export const tasks = pgTable('tasks', { ... });
export const causes = pgTable('causes', { ... });
export const actions = pgTable('actions', { ... });
export const assignees = pgTable('assignees', { ... });
```

#### ステップ3: マイグレーション実行

```bash
# apiディレクトリに移動
cd api

# 依存関係インストール（未実施の場合）
npm install

# データベーススキーマをNeonにプッシュ
npm run db:push

# 成功メッセージ確認
# ✓ Applying changes...
# ✓ Done!
```

### 3. テストユーザーの作成（オプション）

E2Eテストで使用するテストユーザーを事前に作成する場合：

```sql
-- Neon SQLエディタで実行
INSERT INTO users (email, password_hash, created_at, updated_at)
VALUES (
  'test@care-taskflow.local',
  '$2a$10$...',  -- bcryptハッシュ化されたパスワード
  NOW(),
  NOW()
);
```

**注**: または、E2Eテスト実行時にサインアップAPIで自動作成されます。

---

## 🔍 現在の状態

### ✅ 完了している項目

1. **フロントエンド実装**
   - React 18 + TypeScript 5
   - Vite 5開発環境
   - shadcn/ui + Tailwind CSS
   - 全4ページ実装完了

2. **バックエンド実装**
   - Vercel Serverless Functions
   - Drizzle ORM
   - 全8エンドポイント実装完了
   - スキーマ定義完了（`/api/db/schema.ts`）

3. **API統合**
   - モック完全削除
   - 実APIサービス作成完了
   - 型定義同期完了

4. **E2Eテスト**
   - Playwright環境構築完了
   - 全39テスト実装完了
   - テスト成功率: 30.8%（環境変数設定後に100%目標）

### ❌ 未完了の項目

1. **環境変数の設定**
   - `.env.local` が未作成または不完全

2. **Neon PostgreSQLセットアップ**
   - プロジェクト未作成
   - 接続URL未取得
   - マイグレーション未実行

3. **バックエンドAPI動作確認**
   - ローカル環境での起動確認未実施
   - 統合テスト未実施

---

## 📊 E2Eテスト失敗詳細

### 失敗したテスト（27件）

#### 認証関連（2件）
- ログイン機能が動作しない
- サインアップ機能が動作しない

**原因**:
- `DATABASE_URL` が未設定のため、ユーザーテーブルにアクセスできない
- `JWT_SECRET` が未設定のため、トークン生成ができない

#### 課題一覧ページ（12件）
- ページタイトルと基本要素が表示されない
- フィルター機能が動作しない
- ソート機能が動作しない
- 課題行クリックで詳細ページに遷移できない

**原因**: 認証が失敗し、課題一覧ページにアクセスできない

#### 課題詳細ページ（13件）
- 新規作成ページが表示されない
- 課題作成ができない
- 課題編集ができない
- 課題削除ができない

**原因**: 認証が失敗し、課題詳細ページにアクセスできない

---

## 🎯 Phase 5完了後の期待結果

### 環境変数設定完了
```bash
# .env.local が正しく設定されている
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
VITE_API_BASE_URL="http://localhost:8432"
VITE_PORT=3247
```

### データベースセットアップ完了
```bash
# マイグレーション成功
cd api && npm run db:push
# ✓ Applying changes...
# ✓ Done!

# テーブル確認（Neon SQLエディタ）
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
# users
# tasks
# causes
# actions
# assignees
```

### バックエンドAPI動作確認
```bash
# ローカル開発サーバー起動
npm run dev  # フロントエンド（ポート3247）

# 別ターミナルでAPIテスト
curl http://localhost:8432/api/health
# {"status":"ok"}
```

### E2Eテスト成功率
```bash
# E2Eテスト再実行
cd frontend && npm run test:e2e

# 期待結果
# 39 passed (100%)
```

---

## 📁 重要ファイル一覧

### 環境変数
- `/.env.local` - **要作成・要更新**

### データベーススキーマ
- `/api/db/schema.ts` - ✅ 実装済み
- `/api/db/index.ts` - ✅ 実装済み

### APIエンドポイント（実装済み）
- `/api/auth/signup.ts` - POST /api/auth/signup
- `/api/auth/login.ts` - POST /api/auth/login
- `/api/auth/logout.ts` - POST /api/auth/logout
- `/api/tasks/index.ts` - POST/GET /api/tasks
- `/api/tasks/[id].ts` - GET/PUT/DELETE /api/tasks/:id

### E2Eテスト
- `/frontend/e2e/login.spec.ts` - ✅ 実装済み
- `/frontend/e2e/signup.spec.ts` - ✅ 実装済み
- `/frontend/e2e/task-list.spec.ts` - ✅ 実装済み
- `/frontend/e2e/task-detail.spec.ts` - ✅ 実装済み

### API仕様書
- `/docs/api-specs/auth-api.md`
- `/docs/api-specs/task-list-api.md`
- `/docs/api-specs/task-detail-api.md`

---

## 🛠️ Phase 5実行手順

### ステップ1: Neon PostgreSQLセットアップ

```bash
# 1. https://neon.tech にアクセス
# 2. 新規プロジェクト作成
# 3. 接続URLをコピー（DATABASE_URL）
```

### ステップ2: 環境変数ファイル作成

```bash
# プロジェクトルートディレクトリで実行
cd /Users/kuwahatatakeru/医療DW\ Dropbox/21_AI/医療的ケア児支援課題管理システム

# .env.localファイル作成
touch .env.local

# エディタで開いて環境変数を追加
code .env.local  # または vim .env.local
```

**追加する内容**:
```bash
DATABASE_URL="postgresql://[Neonから取得]"
JWT_SECRET="$(openssl rand -base64 32)"
VITE_API_BASE_URL="http://localhost:8432"
VITE_PORT=3247
```

### ステップ3: データベースマイグレーション

```bash
# apiディレクトリに移動
cd api

# 依存関係確認
npm install

# スキーマをNeonにプッシュ
npm run db:push

# 成功確認
# ✓ Applying changes...
# ✓ Done!
```

### ステップ4: 動作確認

```bash
# フロントエンド開発サーバー起動
cd ../frontend
npm run dev

# ブラウザで http://localhost:3247 を開く
# ログインページが表示されることを確認

# サインアップテスト
# - メールアドレス: test@care-taskflow.local
# - パスワード: TestPass2025!
# - サインアップボタンクリック
# - 成功すると課題一覧ページへ遷移
```

### ステップ5: E2Eテスト再実行

```bash
# E2Eテスト実行
cd frontend
npm run test:e2e

# 期待結果: 39 passed (100%)
```

---

## ⚠️ トラブルシューティング

### 問題1: DATABASE_URLが無効

**症状**:
```
Error: Invalid DATABASE_URL
```

**解決策**:
- Neonダッシュボードで接続URLを再確認
- `?sslmode=require` が含まれていることを確認
- URLエンコーディングが必要な特殊文字がある場合は変換

### 問題2: マイグレーション失敗

**症状**:
```
Error: Cannot connect to database
```

**解決策**:
```bash
# 1. DATABASE_URLが正しく設定されているか確認
echo $DATABASE_URL

# 2. Neonプロジェクトが起動しているか確認（Neonダッシュボード）

# 3. 接続テスト
cd api
npx drizzle-kit studio  # データベースブラウザで接続確認
```

### 問題3: JWT_SECRETが短すぎる

**症状**:
```
Error: JWT_SECRET must be at least 32 characters
```

**解決策**:
```bash
# 32文字以上のランダムな文字列を生成
openssl rand -base64 32

# .env.localに貼り付け
JWT_SECRET="生成された文字列"
```

### 問題4: E2Eテストがまだ失敗する

**症状**: 環境変数設定後もテストが失敗

**解決策**:
```bash
# 1. 開発サーバー再起動
# Ctrl+C で停止
npm run dev

# 2. ブラウザキャッシュクリア

# 3. E2Eテスト再実行
npm run test:e2e

# 4. デバッグモードで実行
npm run test:e2e:headed  # ブラウザを表示してテスト実行
```

---

## 📞 Phase 5完了後の報告事項

Phase 5完了後、以下の情報をPhase 9（E2Eテスト）に報告してください：

### ✅ 完了確認チェックリスト

- [ ] `.env.local` ファイル作成完了
- [ ] `DATABASE_URL` 設定完了
- [ ] `JWT_SECRET` 設定完了
- [ ] `VITE_API_BASE_URL` 設定完了
- [ ] Neon PostgreSQLプロジェクト作成完了
- [ ] データベースマイグレーション成功（`npm run db:push`）
- [ ] テーブル作成確認（users, tasks, causes, actions, assignees）
- [ ] ローカル開発サーバー起動成功（http://localhost:3247）
- [ ] サインアップ機能動作確認
- [ ] ログイン機能動作確認

### 📊 報告内容

```markdown
## Phase 5完了報告

**完了日**: YYYY-MM-DD

### 環境変数設定
- DATABASE_URL: ✅ 設定完了
- JWT_SECRET: ✅ 設定完了
- VITE_API_BASE_URL: ✅ 設定完了

### Neon PostgreSQL
- プロジェクト名: [プロジェクト名]
- リージョン: [リージョン]
- マイグレーション: ✅ 成功
- テーブル数: 5（users, tasks, causes, actions, assignees）

### 動作確認
- 開発サーバー起動: ✅ 成功
- サインアップ: ✅ 動作確認
- ログイン: ✅ 動作確認
- 課題一覧表示: ✅ 動作確認

### E2Eテスト準備完了
Phase 9（E2Eテスト）再実行の準備が整いました。
```

---

## 🎯 Phase 5の成功基準

以下の条件を**すべて**満たした場合、Phase 5完了とします：

1. ✅ `.env.local` に全必須環境変数が設定されている
2. ✅ Neon PostgreSQLプロジェクトが作成されている
3. ✅ データベースマイグレーションが成功している
4. ✅ 5つのテーブル（users, tasks, causes, actions, assignees）が作成されている
5. ✅ ローカル開発サーバーが起動できる
6. ✅ サインアップ機能が動作する
7. ✅ ログイン機能が動作する
8. ✅ 課題一覧ページが表示される

**全条件クリア後 → Phase 9（E2Eテスト）再実行 → 成功率100%達成**

---

## 📚 参考資料

### Neon PostgreSQL
- 公式サイト: https://neon.tech
- ドキュメント: https://neon.tech/docs

### Drizzle ORM
- 公式サイト: https://orm.drizzle.team
- マイグレーション: https://orm.drizzle.team/kit-docs/overview

### 環境変数
- Vite環境変数: https://vitejs.dev/guide/env-and-mode.html

---

**Phase 5担当者へ**: 上記の手順に従って環境構築を完了させてください。不明点があれば、この引き継ぎ文書を参照してください。

**Phase 9より**: 環境構築完了後、E2Eテストの成功率100%達成を目指します！
