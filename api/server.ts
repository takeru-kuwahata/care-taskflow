import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// .env.localをプロジェクトルートから読み込む
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const app = express();
const PORT = process.env.PORT || 8432;

// CORS設定（複数ドメイン対応）
const allowedOrigins = [
  'https://mdc-flow.net',
  'https://www.mdc-flow.net',
  'https://care-taskflow.vercel.app',
  'http://localhost:3247',
];

app.use(cors({
  origin: (origin, callback) => {
    // originがundefinedの場合（同じオリジンからのリクエスト）も許可
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// JSON解析
app.use(express.json());

// ログ出力（デバッグ用）
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.method === 'POST' && req.path.includes('/login')) {
    console.log('Request Body:', JSON.stringify(req.body));
    console.log('Content-Type:', req.headers['content-type']);
  }
  next();
});

// Vercel Serverless Functionsラッパー
const createVercelHandler = async (modulePath: string) => {
  try {
    const module = await import(modulePath);
    const handler = module.default;

    return async (req: express.Request, res: express.Response) => {
      // Express Request/ResponseをVercel形式に変換
      // req.params（Expressのパスパラメータ）を req.query にマージ
      const vercelReq: Partial<VercelRequest> = {
        method: req.method,
        headers: req.headers as Record<string, string>,
        body: req.body,
        query: { ...req.query, ...req.params } as Record<string, string | string[]>,
        url: req.url,
      };

      const vercelRes: Partial<VercelResponse> = {
        status: (code: number) => {
          res.status(code);
          return vercelRes as VercelResponse;
        },
        json: (data: any) => {
          res.json(data);
          return vercelRes as VercelResponse;
        },
        send: (data: any) => {
          res.send(data);
          return vercelRes as VercelResponse;
        },
        setHeader: (name: string, value: string | number | readonly string[]) => {
          res.setHeader(name, value);
          return vercelRes as VercelResponse;
        },
      };

      await handler(vercelReq as VercelRequest, vercelRes as VercelResponse);
    };
  } catch (error) {
    console.error(`Failed to load module ${modulePath}:`, error);
    return (_req: express.Request, res: express.Response) => {
      res.status(500).json({ error: 'Internal Server Error', details: (error as Error).message });
    };
  }
};

// APIルーティング
(async () => {
  // 認証エンドポイント
  app.post('/api/auth/signup', await createVercelHandler('./auth/signup.js'));
  app.post('/api/auth/login', await createVercelHandler('./auth/login.js'));
  app.post('/api/auth/logout', await createVercelHandler('./auth/logout.js'));
  app.post('/api/auth/change-password', await createVercelHandler('./auth/change-password.js'));

  // 課題管理エンドポイント
  app.post('/api/tasks', await createVercelHandler('./tasks/index.js'));
  app.get('/api/tasks', await createVercelHandler('./tasks/index.js'));

  // :idパラメータを処理
  app.get('/api/tasks/:id', async (req, res) => {
    const handler = await createVercelHandler('./tasks/[id].js');
    await handler(req, res);
  });
  app.put('/api/tasks/:id', async (req, res) => {
    const handler = await createVercelHandler('./tasks/[id].js');
    await handler(req, res);
  });
  app.delete('/api/tasks/:id', async (req, res) => {
    const handler = await createVercelHandler('./tasks/[id].js');
    await handler(req, res);
  });

  // ダッシュボードエンドポイント
  app.get('/api/dashboard/stats', await createVercelHandler('./dashboard/stats.js'));

  // ヘルスチェック
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      message: 'Care TaskFlow API',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: process.env.DATABASE_URL ? 'Connected' : 'Not configured',
    });
  });

  // サーバー起動
  app.listen(PORT, () => {
    console.log(`✅ Care TaskFlow API server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
    console.log(`CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3247'}`);
  });
})();
