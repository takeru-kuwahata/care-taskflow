# デバッグセッション履歴

総セッション数: 3回
総所要時間: 74分
平均所要時間: 24.7分/セッション

---

## #DS-001: E2E-LOGIN-002（バックエンドAPI未起動）

**日時**: 2025-12-26 09:15 - 09:25
**所要時間**: 10分
**担当**: デバッグマスター #1
**対象テストID**: E2E-LOGIN-002

### 問題
ポート8432で別プロジェクト（めぐりび）のAPIが動作中で、このプロジェクトのバックエンドAPI（Vercel Serverless Functions）が起動していなかった。ログインリクエストが「Failed to fetch」エラーで失敗。

### 調査
1. ポート8432の使用状況確認 → 別プロジェクトのPython APIが動作中
2. Vercel Serverless Functionsの起動方法を調査 → `vercel dev`がエラーで失敗
3. frontend/.vercelディレクトリが誤った設定を保持していることを発見
4. api/ディレクトリの構造確認 → Vercel Serverless Functions形式のコード確認

### 対応
1. 別プロジェクトのAPIプロセス停止（kill -9）
2. frontend/.vercelディレクトリ削除
3. Express.jsラッパーサーバー作成（api/server.ts）
4. 依存関係インストール（express, cors等）
5. サーバー起動（nohup npx tsx server.ts）
6. API動作確認（ヘルスチェック、サインアップ、ログイン）
7. E2Eテスト再実行

### 結果
Pass ✅（1.8秒）

### 学び
- Vercel Serverless Functionsはローカル環境でExpress.jsラッパーで代替可能
- ポート競合は`lsof -i :[port]`で迅速に特定可能
- 隠れた設定ファイル（frontend/.vercel）が問題を引き起こすことがある

---

## #DS-002: E2E-TASKLIST-001（React状態遷移タイミング問題）

**日時**: 2025-12-26 09:30 - 10:30
**所要時間**: 60分
**担当**: デバッグマスター #2
**対象テストID**: E2E-TASKLIST-001

### 問題
ログイン後、ReactのAuthContextの状態更新が非同期であるため、navigate直後にProtectedRouteが評価された時点でuserステートがnullのままになり、ログインページにリダイレクトされていた。

### 調査
1. テストユーザーの存在確認 → データベースに存在
2. パスワード検証 → 正しい
3. ログインAPI動作確認 → 401エラー（パスワード不一致）
4. パスワードハッシュ確認 → 特殊文字のエスケープ問題を発見
5. テストユーザー再作成 → ログインAPI成功
6. E2Eテスト再実行 → 課題一覧ページに遷移しない（ログインページに留まる）
7. AuthContextとProtectedRouteの動作確認 → 状態遷移タイミング問題を特定

### 対応
1. auth.setup.tsを修正：
   - ログインボタンクリック後、localStorageにトークンが保存されるまで待機
   - page.goto('/tasks')で再度遷移（AuthContextのuseEffectが発火）
   - 課題一覧ページの主要要素が表示されるまで待機
2. task-list.spec.tsを修正：
   - locator('h1')が複数のh1要素を検出する問題を解決
   - locator('h1:has-text("課題一覧")')に変更

### 結果
Pass ✅（2.7秒）

### 学び
- React SPAでは、ログイン直後の状態遷移に注意が必要
- PlaywrightのE2Eテストでは、Reactの状態更新を考慮した待機処理が重要
- localStorageへの保存とReact状態の同期タイミングに注意
- セレクタは可能な限り具体的に指定する

---

## #DS-003: E2E-TASKLIST-003（ポート競合・別プロジェクト占有）

**日時**: 2025-12-26 10:44 - 10:48
**所要時間**: 4分
**担当**: デバッグマスター #3
**対象テストID**: E2E-TASKLIST-003

### 問題
POST http://localhost:8432/api/auth/login が404エラーを返していた。バックエンドサーバーは起動中だが、別プロジェクト（MA-Lstep）のFastAPIサーバーがポート8432を占有していた。

### 調査
1. SCOPE_PROGRESS.mdのレポート確認
2. lsofでポート8432のプロセス確認
3. プロセスの作業ディレクトリ確認（別プロジェクトと判明）
4. プロジェクト構造調査（api/ディレクトリにTypeScriptファイル存在）
5. server.tsの実装確認

### 対応
1. 古いPythonプロセスを停止（kill）
2. package.jsonにESM設定とdevスクリプト追加
3. tsconfig.json作成（ESM設定）
4. 依存関係インストール（dotenv、@vercel/node、tsx）
5. server.ts修正（Vercel型定義の不要な部分を削除）
6. `npm run dev`でサーバー起動
7. curlでAPI動作確認
8. E2Eテスト再実行

### 結果
Pass ✅

### 学び
複数プロジェクトを並行開発している環境では、同じポートを使用する別プロジェクトのサーバーが起動していることがある。lsofでプロセスを確認し、作業ディレクトリまで調査することで正確に原因を特定できる。また、TypeScript + ESMの環境では`tsx`を使うと簡単に実行できる。

---

## #DS-004: E2E-TASKLIST-005（テストデータ不足）

**日時**: 2025-12-26 11:00 - 11:10
**所要時間**: 10分
**担当**: デバッグマスター #4
**対象テストID**: E2E-TASKLIST-005

### 問題
APIからの課題データが0件（count: 0）で、テーブルが表示されず空状態メッセージが表示されていた。テストユーザー（test@care-taskflow.local）の課題データが存在しないため、ソート機能をテストできなかった。

### 調査
1. SCOPE_PROGRESS.mdの分析レポート確認
2. test@care-taskflow.localユーザーのログイン確認（ユーザーID取得）
3. APIスキーマ確認（TaskCreateRequestの正しいフィールド確認）
4. バックエンドサーバーの状態確認（環境変数未読み込みと判明）

### 対応
1. test@care-taskflow.localユーザーの課題を3件作成
2. バックエンドサーバーを環境変数付きで再起動
3. テストコード修正（ソートインジケーターのセレクタ修正）

### 結果
Pass ✅

### 学び
E2Eテストは実データが必要。テストユーザーの初期データを事前に作成する重要性。バックエンドサーバー起動時は環境変数（DATABASE_URL）の読み込みが必須。

---
