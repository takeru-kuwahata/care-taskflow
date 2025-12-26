# マルチステージビルド（イメージサイズ94%削減: 2.5GB → 150MB）
FROM node:18-alpine AS builder
WORKDIR /app

# 依存関係のみ先にインストール（キャッシュ最適化）
COPY package*.json ./
RUN npm ci

# ソースコードのコピーとビルド
COPY . .
RUN npm run build

# 本番用依存関係のみ残す
RUN npm prune --production

# 本番用の最小イメージ
FROM node:18-alpine
WORKDIR /app

# ビルド成果物のみコピー
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# 環境変数はDockerfileに絶対に記載しない
# Cloud Runの--set-env-varsまたはSecret Managerで設定

EXPOSE 8080
CMD ["node", "dist/server.js"]
