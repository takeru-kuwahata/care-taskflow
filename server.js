"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const url_1 = require("url");
const path_1 = require("path");
dotenv_1.default.config({ path: '.env.local' });
const __filename = (0, url_1.fileURLToPath)(import.meta.url);
const __dirname = (0, path_1.dirname)(__filename);
const app = (0, express_1.default)();
const PORT = 8432;
// CORS設定
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3247',
    credentials: true,
}));
// JSON解析
app.use(express_1.default.json());
// ログ出力
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});
// Vercel Serverless Functionsラッパー
const createVercelHandler = async (modulePath) => {
    try {
        const module = await Promise.resolve(`${modulePath}`).then(s => __importStar(require(s)));
        const handler = module.default;
        return async (req, res) => {
            // Express Request/ResponseをVercel形式に変換
            const vercelReq = {
                method: req.method,
                headers: req.headers,
                body: req.body,
                query: req.query,
                url: req.url,
            };
            const vercelRes = {
                status: (code) => {
                    res.status(code);
                    return vercelRes;
                },
                json: (data) => {
                    res.json(data);
                    return vercelRes;
                },
                send: (data) => {
                    res.send(data);
                    return vercelRes;
                },
                setHeader: (name, value) => {
                    res.setHeader(name, value);
                    return vercelRes;
                },
            };
            await handler(vercelReq, vercelRes);
        };
    }
    catch (error) {
        console.error(`Failed to load module ${modulePath}:`, error);
        return (req, res) => {
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
