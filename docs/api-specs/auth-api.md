# 認証API仕様書

生成日: 2025-12-25
収集元: frontend/src/services/mock/AuthService.ts
@MOCK_TO_APIマーク数: 3

## エンドポイント一覧

### 1. ログイン

- **エンドポイント**: `POST /api/auth/login`
- **説明**: メールアドレスとパスワードでユーザー認証を行う

#### Request

**型**: `LoginCredentials`

```typescript
interface LoginCredentials {
  email: string;
  password: string;
}
```

#### Request例

```json
{
  "email": "test@care-taskflow.local",
  "password": "TestPass2025!"
}
```

#### Response

**型**: `AuthResponse`

```typescript
interface AuthResponse {
  user: User;
  token: string;
}
```

#### Response例（成功）

```json
{
  "user": {
    "id": "user1",
    "email": "test@care-taskflow.local",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  },
  "token": "mock-token-user1-1735132800000"
}
```

#### エラーレスポンス

**401 Unauthorized**:
```json
{
  "error": "メールアドレスまたはパスワードが正しくありません"
}
```

---

### 2. サインアップ

- **エンドポイント**: `POST /api/auth/signup`
- **説明**: 新規ユーザーを登録

#### Request

**型**: `SignupData`

```typescript
interface SignupData {
  email: string;
  password: string;
}
```

#### Request例

```json
{
  "email": "newuser@care-taskflow.local",
  "password": "SecurePass2025!"
}
```

#### Response

**型**: `AuthResponse`

成功時はログインと同じ形式のレスポンスを返す

#### Response例（成功）

```json
{
  "user": {
    "id": "user2",
    "email": "newuser@care-taskflow.local",
    "createdAt": "2025-12-25T00:00:00Z",
    "updatedAt": "2025-12-25T00:00:00Z"
  },
  "token": "mock-token-user2-1735132800000"
}
```

#### エラーレスポンス

**409 Conflict**:
```json
{
  "error": "このメールアドレスは既に登録されています"
}
```

---

### 3. ログアウト

- **エンドポイント**: `POST /api/auth/logout`
- **説明**: ユーザーをログアウト

#### Request

リクエストボディなし（認証トークンはヘッダーで送信）

#### Request例

```http
POST /api/auth/logout
Authorization: Bearer mock-token-user1-1735132800000
```

#### Response

**成功時**: ステータスコード204（No Content）、レスポンスボディなし

---

## 型定義参照

すべての型定義は以下のファイルに記載されています：
```typescript
// フロントエンドの型定義
frontend/src/types/index.ts
```

### 主要な型

- `LoginCredentials`: ログイン認証情報（email, password）
- `SignupData`: サインアップデータ（email, password）
- `AuthResponse`: 認証レスポンス（user, token）
- `User`: ユーザーエンティティ（id, email, createdAt, updatedAt）

## モックサービス参照

```typescript
// 実装時はこのモックサービスの挙動を参考にする
frontend/src/services/mock/AuthService.ts
```

## セキュリティ要件

### パスワード要件
- 最小8文字以上
- 大文字・小文字・数字・記号を含むことを推奨

### トークン管理
- JWTトークンを使用
- 有効期限: 24時間（実装時に決定）
- Refreshトークンは本番実装時に検討

### HTTPS
- 本番環境では必須
- 認証情報は必ずHTTPS経由で送信

## バリデーションルール

### ログイン
- `email`: 必須、メールアドレス形式
- `password`: 必須

### サインアップ
- `email`: 必須、メールアドレス形式、重複チェック
- `password`: 必須、最小8文字

## 備考

- MVP段階ではメール確認は不要（要件定義に明記）
- パスワードリセット機能は将来実装予定
- ソーシャルログインは将来実装予定
- 全ユーザーが信頼できるメンバー前提（神奈川県での実務運用）
