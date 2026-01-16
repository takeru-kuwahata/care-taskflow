#!/bin/bash

API_URL="http://localhost:8432"

# ログイン
echo "=== ログイン ==="
TOKEN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass2025!"}' | jq -r '.token')

echo "Token: ${TOKEN:0:50}..."

# コメント取得
echo -e "\n=== コメント取得 ==="
TASK_ID="3acf7b9f-9840-4bef-b9f7-721693549dde"
curl -s -X GET "$API_URL/api/tasks/$TASK_ID/comments" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
