#!/bin/bash

# setCorsHeaders(res); を setCorsHeaders(res, requestOrigin); に置換し、
# その前に requestOrigin の定義を追加

FILES=(
  "dashboard/matrix.ts"
  "dashboard/stats.ts"
  "tags/index.ts"
  "tasks/\[id\].ts"
  "tasks/\[id\]/comments/index.ts"
  "tasks/\[id\]/tags/\[tagId\].ts"
  "tasks/\[id\]/tags/index.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    # setCorsHeaders(res); が含まれるかチェック
    if grep -q "setCorsHeaders(res);" "$file"; then
      # Originヘッダー取得コードを追加
      sed -i '' '/setCorsHeaders(res);/i\
  const requestOrigin = req.headers.origin as string | undefined;
' "$file"
      # setCorsHeaders呼び出しを修正
      sed -i '' 's/setCorsHeaders(res);/setCorsHeaders(res, requestOrigin);/g' "$file"
      echo "✓ Modified: $file"
    else
      echo "- Skipped (already modified): $file"
    fi
  else
    echo "✗ Not found: $file"
  fi
done

echo ""
echo "Done!"
