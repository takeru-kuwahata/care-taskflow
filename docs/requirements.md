# 医療的ケア児支援課題管理システム - 要件定義書

**最終更新**: 2025-12-27
**バージョン**: 1.2（Phase 12追加）
**ステータス**: 確定・本番稼働中

---

## 要件定義の作成原則
- **「あったらいいな」は絶対に作らない**
- **拡張可能性のための余分な要素は一切追加しない**
- **将来の「もしかして」のための準備は禁止**
- **今、ここで必要な最小限の要素のみ**

---

## 1. プロジェクト概要

### 1.1 成果目標
**医療的ケア児支援の課題を構造化・可視化し、自治体職員のExcel管理作業を50%以上削減、課題解決を加速させる課題管理システム**

### 1.2 成功指標

#### 定量的指標
1. **Excel作業時間削減**: 50%以上
2. **MVP完成**: 1月中旬（遅くとも3月末）
3. **課題登録時間**: 5分以内/件
4. **月間アクティブユーザー率**: 80%以上（神奈川県職員）
5. **導入自治体数**: 1年以内に3自治体以上

#### 定性的指標
1. **神奈川県でのデモ成功**: 好評価を得る
2. **直感的なUI**: 非エンジニアが説明なしで使える
3. **課題解決の加速**: 構造化された課題管理が実現
4. **シンプルなデザイン**: Backlogのようなゴチャゴチャ感なし、視認性重視
5. **実務運用適合**: チームメンバーが互いの課題を編集できる柔軟性

---

## 2. システム全体像

### 2.1 主要機能一覧
- **課題管理**: 課題の登録・編集・削除、属性管理
- **一覧表示**: テーブル形式での課題一覧、フィルタリング、ソート
- **認証機能**: メール + パスワード認証（MVP簡略版）

### 2.2 ユーザーロールと権限

#### MVP段階（単一ロール）
- **ログインユーザー**: 全員が同じ権限（管理者ロールなし）
  - 全課題の閲覧
  - 課題の作成
  - **全課題の編集・削除（誰が作成した課題でも編集可能）**

#### 将来拡張（Phase 2以降）
- 管理者ロールの追加
- 編集履歴の記録
- より詳細な権限設定

### 2.3 認証・認可要件

#### 認証方式
- メール + パスワード
- メール確認: 不要（MVP簡略化）

#### セキュリティレベル
- 基本的な認証機能（Clerk / Auth.js使用）
- HTTPS強制（本番環境）
- セッション管理

#### 権限マトリックス

| 機能/ページ        | ゲスト | ログインユーザー | 備考               |
|--------------------|--------|------------------|--------------------|
| ログインページ     | ○      | ×                | 未ログインのみ     |
| サインアップページ | ○      | ×                | 未ログインのみ     |
| 課題一覧ページ     | ×      | ○                | 要ログイン         |
| 課題詳細ページ     | ×      | ○                | 要ログイン         |
| 課題作成           | ×      | ○                | 要ログイン         |
| 課題編集           | ×      | ○（全員）        | **全員が編集可能** |
| 課題削除           | ×      | ○（全員）        | **全員が削除可能** |

**設計理由:**
- 神奈川県での実務運用を考慮（誰かが登録した課題を別の人が編集できる必要がある）
- MVP段階では全員が信頼できるメンバー前提
- 削除時の確認ダイアログでミス防止

---

## 3. ページ詳細仕様

### 3.0 P-000: ダッシュボードページ（Dashboard）【Phase 11追加】

#### 目的
課題の全体進捗を視覚的にわかりやすく表示し、一目でプロジェクト状況を把握する

#### 主要機能
- サマリーカード（総課題数、完了率、進行中、期限切れ）
- カテゴリ別課題数グラフ
- ステータス別進捗グラフ
- 最近の活動（オプション）

※実装完了：詳細はコード参照（frontend/src/pages/user/Dashboard.tsx、api/dashboard/index.ts）

---

### 3.1 P-001: 課題一覧ページ（Task List）

#### 目的
全課題を一覧表示し、ステータスと優先度を把握する

#### 主要機能
- 課題一覧テーブル表示（項番、カテゴリ、問題点、ステータス、対応者、期限）
- フィルタリング機能（カテゴリ、ステータス、対応者）
- ソート機能
- ページネーション機能（20件/ページ、表示件数変更可）
- 新規課題登録ボタン
- 課題クリックで詳細表示

※実装完了：詳細はコード参照（frontend/src/pages/user/TaskList.tsx）

---

### 3.2 P-002: 課題詳細ページ（Task Detail）

#### 目的
課題の登録・編集・削除を行い、詳細情報を管理する

#### 主要機能
- 課題情報の表示・編集（カテゴリ、問題点、原因、対応案、ステータス、対応者、期限、関連事業等）
- 保存ボタン（登録/更新）
- 削除ボタン（確認ダイアログ付き）
- 戻るボタン

※実装完了：詳細はコード参照（frontend/src/pages/user/TaskDetail.tsx）

---

## 4. データ設計概要

### 4.1 主要エンティティ

※実装完了：詳細はコード参照
- DBスキーマ: api/db/schema.ts
- フロントエンド型定義: frontend/src/types/index.ts

**エンティティ**:
- User（ユーザー）
- Task（課題）
- Cause（原因）
- Action（対応案）
- Assignee（対応者）

**エンティティ関係**:
```
User ──1:N── Task ─┬─1:N─ Cause
                   ├─1:N─ Action
                   └─1:N─ Assignee
```

**主要バリデーション**:
- category: 必須、7つのカテゴリから選択
- problem: 必須、最大500文字
- status: 必須（未着手/進行中/完了）
- email: 必須、有効なメール形式、一意
- password: 必須、8文字以上

---

## 5. 制約事項

### 技術的制約
- **Neonデータベース制限**: 無料枠0.5GB（50件程度の課題管理には十分）
- **Vercel制限**: 無料枠（ホビープロジェクトに適切）
- **モバイル対応**: 後回し（PC優先）

---

## 5.1 セキュリティ要件

### 基本方針
本プロジェクトは **CVSS 3.1（Common Vulnerability Scoring System）** に準拠したセキュリティ要件を満たすこと。

CVSS 3.1の評価観点:
- **機密性（Confidentiality）**: 不正アクセス防止、データ暗号化
- **完全性（Integrity）**: データ改ざん防止、入力検証
- **可用性（Availability）**: DoS対策、冗長化

詳細な診断と改善は、Phase 11（本番運用診断）で @本番運用診断オーケストレーター が実施します。

---

### プロジェクト固有の必須要件

**認証機能（必須）**:
- ✅ ブルートフォース攻撃対策（アカウントロックアウト）
- ✅ パスワードポリシー（8文字以上）
- ✅ セッション管理（タイムアウト、CSRF対策）

**その他の一般要件**:
- ✅ HTTPSの強制（本番環境）
- ✅ セキュリティヘッダー設定（本番環境）
- ✅ 入力値のサニタイゼーション
- ✅ エラーメッセージでの情報漏洩防止

---

### 運用要件：可用性とヘルスチェック

**ヘルスチェックエンドポイント（全プロジェクト必須）**:
- エンドポイント: `/api/health`
- 目的: Vercel Serverless Functionsでの稼働確認
- 要件: データベース接続確認、5秒以内の応答

**グレースフルシャットダウン（全プロジェクト必須）**:
- SIGTERMシグナルハンドラーの実装
- 進行中のリクエスト完了まで待機
- タイムアウト: 8秒

---

## 6. API設計

※実装完了：詳細はコード参照（api/配下）

### エンドポイント一覧（全17エンドポイント）

#### 認証API（3エンドポイント）
- POST /api/auth/signup - 新規ユーザー登録
- POST /api/auth/login - ログイン
- POST /api/auth/logout - ログアウト

#### 課題管理API（5エンドポイント）
- GET /api/tasks - 課題一覧取得（ページネーション対応）
- GET /api/tasks/:id - 課題詳細取得
- POST /api/tasks - 課題作成
- PUT /api/tasks/:id - 課題更新（Phase 12: importance, urgency 対応）
- DELETE /api/tasks/:id - 課題削除

#### ダッシュボードAPI（2エンドポイント）
- GET /api/dashboard/stats - ダッシュボード統計情報取得
- GET /api/dashboard/matrix - 重要度×緊急度マトリクス取得（Phase 12追加）

#### タグAPI（3エンドポイント、Phase 12追加）
- GET /api/tags - タグ一覧取得
- POST /api/tasks/:id/tags - タグ追加
- DELETE /api/tasks/:id/tags/:tagId - タグ削除

#### コメントAPI（2エンドポイント、Phase 12追加）
- GET /api/tasks/:id/comments - コメント一覧取得
- POST /api/tasks/:id/comments - コメント投稿

#### ヘルスチェックAPI（1エンドポイント）
- GET /api/health - ヘルスチェック

#### その他（1エンドポイント）
- GET /api/current-user - 現在のユーザー情報取得

---

## 7. 技術スタック

### フロントエンド
```yaml
フレームワーク: React 18
言語: TypeScript 5
UIライブラリ: shadcn/ui + Tailwind CSS
  選定理由:
    - 最もシンプル＆クリーン
    - 完全カスタマイズ可能
    - 最高パフォーマンス
    - Backlog的ゴチャゴチャ感を完全回避
状態管理: Zustand
ルーティング: React Router v6
データフェッチ: TanStack Query (React Query)
ビルドツール: Vite 5
フォント: Noto Sans JP / Inter
認証: Clerk
  選定理由:
    - MVP開発速度優先（簡単実装）
    - メール確認不要設定が可能
    - 無料枠5,000MAU
    - React SDK充実
```

### バックエンド
```yaml
データベース: Neon PostgreSQL
  選定理由:
    - 永続無料枠（0.5GB、24/7稼働）
    - Vercel公式統合
    - サーバーレスアーキテクチャ
ORM: Drizzle ORM
  選定理由:
    - TypeScript-first
    - 型安全なクエリビルダー
    - PostgreSQL完全対応
API: REST API（Vercel Serverless Functions）
  構成:
    - GET /api/tasks: 一覧取得
    - GET /api/tasks/:id: 詳細取得
    - POST /api/tasks: 新規作成
    - PUT /api/tasks/:id: 更新
    - DELETE /api/tasks/:id: 削除
    - GET /api/health: ヘルスチェック
  実装方法:
    - api/tasks/index.ts（一覧取得）
    - api/tasks/[id].ts（詳細・更新・削除）
    - api/tasks/create.ts（新規作成）
    - Drizzle ORMで型安全にNeon PostgreSQLへアクセス
```

### インフラ
```yaml
ホスティング: Vercel
  - フロントエンド: 無料枠（無制限デプロイ）
  - API: Serverless Functions（無料枠）
データベース: Neon PostgreSQL（無料枠）
認証: Clerk（無料枠5,000MAU）
```

### デザインシステム
```yaml
色使い（最大3色）:
  - ベース: 白・グレー系（#FFFFFF, #F3F4F6, #9CA3AF）
  - アクセント: ブルー系（#3B82F6）
  - 警告: レッド系（#EF4444）
  - 完了: グリーン系（#10B981）※最小限使用
フォント:
  - 和文: Noto Sans JP
  - 英文: Inter
原則: シンプル、視認性重視、Backlog的ゴチャゴチャ感なし
```

---

## 8. 必要な外部サービス・アカウント

### 必須サービス
| サービス名 | 用途 | 取得先 | 備考 |
|-----------|------|--------|------|
| Neon | PostgreSQLデータベース | https://neon.tech | 無料枠: 0.5GB、24/7稼働 |
| Vercel | フロントエンドホスティング＋API | https://vercel.com | 無料枠: 無制限デプロイ |
| GitHub | バージョン管理 | https://github.com | 無料 |
| Clerk | 認証機能 | https://clerk.com | 無料枠: 5,000MAU |

### オプションサービス（Phase 2以降）
| サービス名 | 用途 | 取得先 | 備考 |
|-----------|------|--------|------|
| TBD | ガントチャートライブラリ | - | Phase 2で選定 |

---

## 9. 今後の拡張予定

**原則**: 拡張予定があっても、必要最小限の実装のみを行う

- 「あったらいいな」は実装しない
- 拡張可能性のための余分な要素は追加しない
- 将来の「もしかして」のための準備は禁止
- 今、ここで必要な最小限の要素のみを実装

拡張が必要になった時点で、Phase 11: 機能拡張オーケストレーターを使用して追加実装を行います。

### 拡張候補（実装はしない）

**Phase 2: 機能拡張**
- ガントチャート表示
- 課題の統合・分解機能（ドラッグ&ドロップ）
- Excelインポート/エクスポート
- 管理者ロール
- 編集履歴の記録

**Phase 3: 本格運用**
- コメント機能
- 通知機能（メール、プッシュ通知）
- モバイル対応（レスポンシブ強化）

---

## 10. Phase 12: 対話促進機能群（実装完了・本番稼働中）

### 10.1 概要

**目的**: 年始の打ち合わせ（星野先生・森下さん・桑畑さん）で163件の課題を議論し、対応策を提案するための3つの機能。

**背景**:
- 課題の整理はできているが「対応策の提案」が求められている
- Excel渡されて「提案を書け」と言われても出てこない
- 星野先生との対話で初めてアイデアが湧く
- **このシステムは「対話を生み出すためのツール」**

**実装完了日**: 2025-12-27
**本番稼働**: https://care-taskflow.vercel.app

### 10.2 3つの機能

1. **タグクラウド機能**: 課題間の緩やかな関連付け
2. **コメント機能**: 時系列の対話・提案記録
3. **重要度×緊急度マトリクス**: 優先順位の可視化

---

### 10.3 機能1: タグクラウド

#### データモデル

**新規テーブル**:
```sql
-- タグテーブル
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 課題-タグ中間テーブル（多対多）
CREATE TABLE task_tags (
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (task_id, tag_id)
);
```

#### UI設計

**課題詳細ページ（P-002）**:
- タグ入力フィールド（既存タグをサジェスト）
- タグ表示（Badge形式）

**課題一覧ページ（P-001）**:
- テーブルに「タグ」カラム追加
- タグクリックで絞り込み
- フィルターに「タグ」追加

#### API設計

- `GET /api/tags` - タグ一覧取得
- `POST /api/tasks/:id/tags` - タグ追加
- `DELETE /api/tasks/:id/tags/:tagId` - タグ削除

---

### 10.4 機能2: コメント機能

#### データモデル

**新規テーブル**:
```sql
CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**重要な設計原則**:
- **元データ（Cause/Action/Assignee）は保護**: Excelから移植したデータは改変しない
- **コメントは別の対話スペース**: 新しい提案・議論を記録

#### UI設計

**課題詳細ページ（P-002）**:
```
┌────────────────────┐
│ 基本情報            │
├────────────────────┤
│ 【元データ】        │
│ 原因（複数）        │ ← Excelから移植（保護）
│ 対応案（複数）      │ ← Excelから移植（保護）
│ 対応者（複数）      │ ← Excelから移植（保護）
├────────────────────┤
│ 【新規：コメント】  │ ← これを追加
│   桑畑（12/26）     │
│   「提案: XXX」     │
│     └ 星野（12/26） │
│       「いいね」    │
│   [コメント追加]    │
└────────────────────┘
```

**課題一覧ページ（P-001）**:
- コメント件数バッジ表示（例: 💬 3）

#### API設計

- `GET /api/tasks/:id/comments` - コメント一覧取得
- `POST /api/tasks/:id/comments` - コメント投稿
- `PUT /api/comments/:id` - コメント編集（Phase 2）
- `DELETE /api/comments/:id` - コメント削除（Phase 2）

**Phase 1の制約**:
- スレッド機能（返信）は Phase 2 以降
- Phase 1 では1階層のみのシンプルなコメント

---

### 10.5 機能3: 重要度×緊急度マトリクス

#### データモデル

**tasks テーブルへのカラム追加**:
```sql
ALTER TABLE tasks ADD COLUMN importance text;  -- 'high' | 'medium' | 'low' | null
ALTER TABLE tasks ADD COLUMN urgency text;     -- 'high' | 'medium' | 'low' | null
```

**型定義追加**:
```typescript
// 重要度レベル
export type ImportanceLevel = 'high' | 'medium' | 'low';
export const IMPORTANCE_LEVELS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;
export const IMPORTANCE_LABELS: Record<ImportanceLevel, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

// 緊急度レベル
export type UrgencyLevel = 'high' | 'medium' | 'low';
export const URGENCY_LEVELS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;
export const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

// Task型への追加
export interface Task {
  // ... 既存フィールド
  importance?: ImportanceLevel;
  urgency?: UrgencyLevel;
}

// マトリクス表示用の型
export interface MatrixCell {
  importance: ImportanceLevel;
  urgency: UrgencyLevel;
  count: number;
}

export interface PriorityMatrixResponse {
  matrix: MatrixCell[];  // 9セル（3x3）
  unsetCount: number;    // 未設定の課題数
  totalTasks: number;    // 総課題数
}
```

### 10.3 API設計

**新規エンドポイント**:
- `GET /api/dashboard/matrix` - マトリクス統計取得

**既存エンドポイント拡張**:
- `PUT /api/tasks/:id` - importance, urgency フィールド追加
- `GET /api/tasks` - importance, urgency フィルター追加

### 10.4 UI設計

#### 課題詳細ページ（P-002）

**追加要素**（進捗管理セクション内）:
```tsx
{/* 重要度×緊急度 */}
<div className="grid grid-cols-2 gap-4 mb-6">
  <div>
    <label className="block text-sm font-semibold text-gray-800 mb-2">
      重要度
      <span className="text-gray-500 ml-1 font-normal text-xs">（任意）</span>
    </label>
    <select value={importance} onChange={(e) => setImportance(e.target.value)}>
      <option value="">未設定</option>
      <option value="high">高</option>
      <option value="medium">中</option>
      <option value="low">低</option>
    </select>
  </div>
  <div>
    <label className="block text-sm font-semibold text-gray-800 mb-2">
      緊急度
      <span className="text-gray-500 ml-1 font-normal text-xs">（任意）</span>
    </label>
    <select value={urgency} onChange={(e) => setUrgency(e.target.value)}>
      <option value="">未設定</option>
      <option value="high">高</option>
      <option value="medium">中</option>
      <option value="low">低</option>
    </select>
  </div>
</div>

{/* 現在の領域表示 */}
{importance && urgency && (
  <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm text-gray-700">
    <strong>現在の位置:</strong> {getQuadrantLabel(importance, urgency)}
  </div>
)}
```

**領域ラベル関数**:
```typescript
function getQuadrantLabel(importance: ImportanceLevel, urgency: UrgencyLevel): string {
  if (importance === 'high' && urgency === 'high') return '第1領域（危機・最優先）';
  if (importance === 'high' && urgency === 'low') return '第2領域（質・計画的対応）';
  if (importance === 'low' && urgency === 'high') return '第3領域（錯覚・慎重に判断）';
  if (importance === 'low' && urgency === 'low') return '第4領域（無駄・優先度低）';
  return '中間領域';
}
```

#### 課題一覧ページ（P-001）

**テーブルカラム追加**:
```
| 項番 | 項目 | 問題点 | 重要度 | 緊急度 | 進捗ステータス | 対応者 | 期限 |
```

**フィルター追加**:
- 重要度フィルター（全て/高/中/低/未設定）
- 緊急度フィルター（全て/高/中/低/未設定）
- 「第1領域のみ表示」ボタン（importance=high & urgency=high）

#### ダッシュボード（P-000）

**新規セクション: 重要度×緊急度マトリクス**:
```tsx
<Card className="bg-white rounded-xl shadow-sm p-6">
  <h2 className="text-lg font-semibold text-gray-900 mb-4">
    📊 重要度×緊急度マトリクス
  </h2>

  <div className="grid grid-cols-4 gap-2">
    {/* ヘッダー行 */}
    <div></div>
    <div className="text-center font-bold text-sm">緊急度: 高</div>
    <div className="text-center font-bold text-sm">緊急度: 中</div>
    <div className="text-center font-bold text-sm">緊急度: 低</div>

    {/* 重要度: 高 */}
    <div className="font-bold text-sm">重要度: 高</div>
    <MatrixCell importance="high" urgency="high" count={23} />
    <MatrixCell importance="high" urgency="medium" count={15} />
    <MatrixCell importance="high" urgency="low" count={8} />

    {/* 重要度: 中 */}
    <div className="font-bold text-sm">重要度: 中</div>
    <MatrixCell importance="medium" urgency="high" count={12} />
    <MatrixCell importance="medium" urgency="medium" count={34} />
    <MatrixCell importance="medium" urgency="low" count={19} />

    {/* 重要度: 低 */}
    <div className="font-bold text-sm">重要度: 低</div>
    <MatrixCell importance="low" urgency="high" count={5} />
    <MatrixCell importance="low" urgency="medium" count={18} />
    <MatrixCell importance="low" urgency="low" count={29} />
  </div>

  {/* 未設定課題数 */}
  <div className="mt-4 text-sm text-gray-600">
    未設定: {unsetCount}件
  </div>
</Card>
```

**MatrixCellコンポーネント**:
```tsx
function MatrixCell({ importance, urgency, count }: MatrixCellProps) {
  const navigate = useNavigate();
  const bgColor = getMatrixCellColor(importance, urgency);

  return (
    <button
      onClick={() => navigate(`/tasks?importance=${importance}&urgency=${urgency}`)}
      className={`p-4 rounded ${bgColor} hover:opacity-80 transition cursor-pointer`}
    >
      <div className="text-2xl font-bold">{count}</div>
      <div className="text-xs">件</div>
    </button>
  );
}

function getMatrixCellColor(importance: ImportanceLevel, urgency: UrgencyLevel): string {
  if (importance === 'high' && urgency === 'high') return 'bg-red-100 border-2 border-red-500';
  if (importance === 'high' && urgency === 'low') return 'bg-green-100 border-2 border-green-500';
  if (importance === 'low' && urgency === 'high') return 'bg-yellow-100 border-2 border-yellow-500';
  if (importance === 'low' && urgency === 'low') return 'bg-gray-100 border-2 border-gray-300';
  return 'bg-blue-50 border border-blue-200';
}
```

### 10.5 実装の原則

**最小性の原則**:
- マトリクスはダッシュボードに統合（新規ページ作成しない）
- importance, urgency は既存 tasks テーブルに追加（新規テーブル作成しない）
- 既存UIに最小限の追加のみ

**刹那性の原則**:
- ドラッグ&ドロップ式マトリクス編集は不要（Phase 2以降で検討）
- 163件の一括設定機能は不要（打ち合わせ中に個別設定すればよい）

**実証性の原則**:
- API実装後、統合テストで動作確認
- フロントエンド実装後、E2Eテストで動作確認

### 10.6 ユースケース

**シナリオ1: 全体像把握**
1. ダッシュボードでマトリクス図を確認
2. 「第1領域（重要×緊急）が23件」と把握
3. 第1領域のセルをクリック → 該当課題一覧へ遷移

**シナリオ2: 個別課題の優先度設定**
1. 課題詳細ページで「重要度: 高」「緊急度: 低」を選択
2. システム表示「現在の位置: 第2領域（質・計画的対応）」
3. 保存

**シナリオ3: 優先課題の絞り込み**
1. 課題一覧ページで「第1領域のみ表示」ボタンをクリック
2. 23件に絞り込まれる
3. タグ機能も併用して最終的に5件に絞り込み

### 10.6 Phase 1 スコープ（年始打ち合わせまで）

**実装する機能**:
1. タグクラウド機能（基本版）
2. コメント機能（1階層のみ）
3. 重要度×緊急度マトリクス

**実装しない機能（Phase 2以降）**:
- スレッド型コメント（返信機能）
- タグの階層化
- コメント編集・削除UI
- リアルタイム更新

---

### 10.7 実装完了

**実装期間**: 2025-12-26（1日で完了）

**実装内容**:

1. **データベース・型定義** ✅
   - タグ: tags, task_tags テーブル作成
   - コメント: comments テーブル作成
   - マトリクス: tasks に importance, urgency カラム追加
   - Drizzleスキーマ更新完了
   - 型定義追加（frontend/src/types/index.ts, api/types/index.ts）
   - マイグレーション実行完了

2. **バックエンドAPI** ✅（全8エンドポイント）
   - タグAPI: GET /api/tags, POST /api/tasks/:id/tags, DELETE /api/tasks/:id/tags/:tagId
   - コメントAPI: GET /api/tasks/:id/comments, POST /api/tasks/:id/comments
   - マトリクスAPI: PUT /api/tasks/:id（拡張）, GET /api/tasks（フィルター拡張）, GET /api/dashboard/matrix
   - 統合テスト完了

3. **フロントエンド** ✅
   - コンポーネント実装: TagInput.tsx, CommentSection.tsx
   - P-002（課題詳細）拡張: タグ入力、コメント投稿・表示、重要度・緊急度選択
   - P-001（課題一覧）拡張: タグバッジ、コメント件数、重要度・緊急度カラム、ソート機能
   - バッジ表示: タグ（最大3個）、コメント数、重要度×緊急度

4. **本番デプロイ** ✅
   - フロントエンド: https://care-taskflow.vercel.app
   - バックエンド: https://care-taskflow-api-877111301724.asia-northeast1.run.app
   - 動作確認完了（2025-12-27）

---

## 付録: 解決する課題（背景情報）

### 現状の問題点
1. **Excel管理の限界**
   - セル結合による構造破壊
   - 手作業での統合・分解
   - バージョン管理の困難さ
   - 複数人同時編集の不可

2. **進捗の不可視化**
   - 課題の優先順位が不明確
   - 対応状況が把握しづらい
   - 期限管理ができない

3. **情報共有の非効率**
   - 会議資料の作成に時間がかかる
   - 最新情報の把握が困難
   - 担当者間の連携不足

---

**要件定義書 終了**
