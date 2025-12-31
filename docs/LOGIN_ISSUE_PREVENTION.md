# ログイン問題 再発防止ドキュメント

**最終更新**: 2025-12-31
**ステータス**: 修正完了・監視中

---

## 問題の概要

**症状**: ユーザーがログインできない問題が繰り返し発生（3日間継続）

**影響範囲**: 全ユーザー（本番環境 https://www.mdc-flow.net）

---

## 根本原因

### 1. 環境変数の問題（主原因）

**問題**:
- Vercel Production環境に `VITE_API_BASE_URL` が設定されていなかった
- フロントエンドが正しいバックエンドAPIにアクセスできず、ログインリクエストが失敗

**修正日**: 2025-12-31
**コミット**: e33800b

**修正内容**:
```bash
# Vercel環境変数を全環境に設定
vercel env add VITE_API_BASE_URL production
vercel env add VITE_API_BASE_URL preview
vercel env add VITE_API_BASE_URL development

# 設定値
VITE_API_BASE_URL=https://care-taskflow-api-814925728777.asia-northeast1.run.app
```

### 2. トークン削除の問題（副原因）

**問題**:
- `src/pages/public/Login.tsx` の useEffect で、ログインページにアクセスするたびに既存トークンを削除
- ログイン成功 → トークン保存 → 何らかの理由でログインページに戻る → トークン削除 → ログイン失敗

**修正日**: 2025-12-31
**コミット**: 0e3e8cc

**修正内容**:
```typescript
// 修正前: 常にトークンを削除
useEffect(() => {
  const existingToken = localStorage.getItem('auth_token');
  if (existingToken) {
    console.log('[Login] Clearing existing token on login page access');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }
}, []);

// 修正後: 401エラー時のみ削除
useEffect(() => {
  const savedError = sessionStorage.getItem('auth_error');
  if (savedError) {
    setAuthError(savedError);
    sessionStorage.removeItem('auth_error');

    // 401エラーでリダイレクトされた場合のみトークンをクリア
    console.log('[Login] Clearing token due to auth error');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }
}, []);
```

### 3. AuthContext統合の問題（副原因）

**問題**:
- `useLogin` フックが `localStorage` にトークンを保存するだけで、`AuthContext` の user 状態を更新していなかった
- `ProtectedRoute` で `!user` と判定され、ログインページにリダイレクト

**修正日**: 2025-12-31
**コミット**: ac57a1c

**修正内容**:
```typescript
// 修正前: AuthContextを更新していない
const login = async (credentials: LoginCredentials) => {
  const result = await authService.login(credentials);
  localStorage.setItem('auth_token', result.token);
  localStorage.setItem('user', JSON.stringify(result.user));
  navigate('/tasks');
};

// 修正後: AuthContextのloginを使用
const login = async (credentials: LoginCredentials) => {
  await authLogin(credentials); // AuthContextのloginを呼ぶ
  navigate('/tasks');
};
```

---

## 再発防止策

### 1. 環境変数の確認手順

**デプロイ前に必ず確認**:
```bash
# 1. Vercel環境変数を確認
cd frontend
vercel env ls

# 2. 以下が全て設定されていることを確認
# - VITE_API_BASE_URL (Production, Preview, Development)

# 3. 値を確認
vercel env pull .env.verify
cat .env.verify | grep VITE_API_BASE_URL

# 期待値: VITE_API_BASE_URL="https://care-taskflow-api-814925728777.asia-northeast1.run.app"
```

### 2. デプロイ後の動作確認手順

**必ず実行**:
```bash
# 1. E2Eテストでログイン確認
cd frontend
npx playwright test e2e/test-kuwahata-login.spec.ts

# 2. 成功条件
# - API呼び出し成功（200 OK）
# - トークンがlocalStorageに保存
# - /tasks ページに遷移
# - Final URL: https://www.mdc-flow.net/tasks
```

### 3. 手動確認チェックリスト

デプロイ後、必ず以下を確認：

- [ ] https://www.mdc-flow.net/login にアクセス
- [ ] 開発者ツールを開く（Cmd+Option+I）
- [ ] Consoleタブでエラーがないことを確認
- [ ] kuwahata@mdc-japan.org / ikea2026 でログイン
- [ ] /tasks ページに遷移することを確認
- [ ] LocalStorageに auth_token が保存されていることを確認
- [ ] ページをリロードしてもログイン状態が維持されることを確認

### 4. 監視項目

**24時間後に確認すべきこと**:
- [ ] ログインが引き続き可能か
- [ ] トークンの有効期限（24時間）が正常に機能しているか
- [ ] 環境変数が削除されていないか

---

## トラブルシューティング

### ログインできない場合

**Step 1: 環境変数を確認**
```bash
vercel env ls | grep VITE_API_BASE_URL
```
- 出力がない → 環境変数が削除されている → 再設定が必要

**Step 2: APIが動作しているか確認**
```bash
curl -X POST 'https://care-taskflow-api-814925728777.asia-northeast1.run.app/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email":"kuwahata@mdc-japan.org","password":"ikea2026"}'
```
- HTTP 200 が返ってくるべき

**Step 3: フロントエンドのログを確認**
- ブラウザの開発者ツール → Console タブ
- ネットワークエラーがないか確認

---

## 過去の問題履歴

| 日付 | 問題 | 原因 | 修正コミット |
|------|------|------|--------------|
| 2025-12-31 | ログイン不可 | 環境変数未設定 | e33800b |
| 2025-12-31 | ログイン成功後すぐ失敗 | トークン削除 | 0e3e8cc |
| 2025-12-31 | /tasksにリダイレクトされない | AuthContext未更新 | ac57a1c |
| 2025-12-29 | 401エラー無限ループ | エラーハンドリング | 10da214 |

---

## 連絡先

問題が再発した場合は、このドキュメントを参照して対応してください。
