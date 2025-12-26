import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = 8432;

// CORS設定
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3247',
  credentials: true,
}));

// JSON解析（strictモードを無効化して柔軟に）
app.use(express.json({ strict: false }));

// ログ出力
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('[DEBUG] Request body:', JSON.stringify(req.body));
  next();
});

// Vercel Serverless Functionsラッパー
const createVercelHandler = async (modulePath: string) => {
  try {
    const module = await import(modulePath);
    const handler = module.default;

    return async (req: express.Request, res: express.Response) => {
      // Express Request/ResponseをVercel形式に変換
      const vercelReq = {
        method: req.method,
        headers: req.headers as Record<string, string>,
        body: req.body,
        query: req.query,
        url: req.url,
      };

      const vercelRes = {
        status: (code: number) => {
          res.status(code);
          return vercelRes;
        },
        json: (data: any) => {
          res.json(data);
          return vercelRes;
        },
        send: (data: any) => {
          res.send(data);
          return vercelRes;
        },
        setHeader: (name: string, value: string | number | readonly string[]) => {
          res.setHeader(name, value);
          return vercelRes;
        },
      };

      await handler(vercelReq, vercelRes);
    };
  } catch (error) {
    console.error(`Failed to load module ${modulePath}:`, error);
    return (req: express.Request, res: express.Response) => {
      res.status(500).json({ error: 'Internal Server Error' });
    };
  }
};

// APIルーティング
(async () => {
  // 認証エンドポイント
  app.post('/api/auth/signup', await createVercelHandler('./api/auth/signup.js'));
  app.post('/api/auth/login', await createVercelHandler('./api/auth/login.js'));
  app.post('/api/auth/logout', await createVercelHandler('./api/auth/logout.js'));

  // 課題管理エンドポイント
  app.post('/api/tasks', await createVercelHandler('./api/tasks/index.js'));
  app.get('/api/tasks', await createVercelHandler('./api/tasks/index.js'));
  app.get('/api/tasks/:id', await createVercelHandler('./api/tasks/[id].js'));
  app.put('/api/tasks/:id', await createVercelHandler('./api/tasks/[id].js'));
  app.delete('/api/tasks/:id', await createVercelHandler('./api/tasks/[id].js'));

  // ヘルスチェック
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Care TaskFlow API', timestamp: new Date().toISOString() });
  });

  // サーバー起動
  app.listen(PORT, () => {
    console.log(`✅ Care TaskFlow API server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
  });
})();
