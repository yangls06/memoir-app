# AI记事本 - Vercel 部署指南

## 方案概述

由于AI记事本需要后端API和数据库，我们采用以下架构部署到Vercel：

```
Vercel (前端 + Serverless API)
    ↓
Vercel Postgres (数据库)
    ↓
Kimi API (AI功能)
```

## 部署步骤

### 1. 准备代码

```bash
# 克隆项目
git clone <your-repo> ai-notebook
cd ai-notebook

# 安装 Vercel CLI
npm i -g vercel
```

### 2. 创建 Vercel 配置文件

创建 `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    },
    {
      "src": "backend/src/app.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/src/app.ts"
    },
    {
      "src": "/(.*)",
      "dest": "frontend/dist/$1"
    }
  ]
}
```

### 3. 配置数据库

Vercel Dashboard → Storage → Create Database → Postgres

获取连接字符串，格式：
```
postgres://username:password@host:port/database?sslmode=require
```

### 4. 配置环境变量

Vercel Dashboard → Project Settings → Environment Variables

添加以下变量：

| 变量名 | 值 |
|--------|-----|
| `DATABASE_URL` | Vercel Postgres 连接字符串 |
| `KIMI_API_KEY` | 你的 Kimi API Key |
| `NODE_ENV` | production |

### 5. 修改后端适配 Serverless

更新 `backend/src/app.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

import notesRouter from './routes/notes';
import tagsRouter from './routes/tags';
import aiRouter from './routes/ai';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API路由
app.use('/api/notes', notesRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/ai', aiRouter);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Vercel Serverless 导出
export default app;

// 本地开发启动
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
```

### 6. 更新 Prisma 配置

修改 `backend/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url = env("DATABASE_URL")
}

model Note {
  id        String   @id @default(uuid())
  title     String
  content   String   @default("")
  summary   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  tags      Tag[]
  
  @@index([updatedAt])
}

model Tag {
  id        String   @id @default(uuid())
  name      String   @unique
  color     String   @default("#3b82f6")
  createdAt DateTime @default(now())
  notes     Note[]
}
```

### 7. 配置前端 API 地址

创建 `frontend/.env.production`:

```
VITE_API_BASE_URL=/api
```

修改 `frontend/src/api/config.ts`:

```typescript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
```

### 8. 部署

```bash
# 登录 Vercel
vercel login

# 部署
vercel --prod
```

## 替代方案：Railway + Vercel

如果 Vercel Postgres 不可用，可以使用 Railway：

### Railway 部署后端

1. 登录 https://railway.app
2. New Project → Deploy from GitHub repo
3. 添加 PostgreSQL 数据库
4. 配置环境变量
5. 获取部署后的域名

### Vercel 部署前端

1. 导入前端代码
2. 配置环境变量 `VITE_API_BASE_URL=https://your-railway-app.up.railway.app/api`
3. 部署

## 文件结构

```
ai-notebook/
├── frontend/          # Vercel 静态部署
│   ├── src/
│   ├── dist/          # 构建输出
│   ├── package.json
│   └── vite.config.ts
├── backend/           # Vercel Serverless
│   ├── src/
│   ├── prisma/
│   └── package.json
├── vercel.json        # Vercel 配置
└── package.json       # 根配置
```

## 常见问题

### 1. Prisma 在 Vercel 上无法连接数据库

确保 `DATABASE_URL` 包含 `sslmode=require`

### 2. API 404

检查 `vercel.json` 路由配置

### 3. 前端无法连接后端

确保前端使用相对路径 `/api` 而不是绝对 URL

## 一键部署按钮

创建 `deploy-button.md`:

```markdown
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/ai-notebook)
```

---

需要我帮你准备 Railway 部署的具体步骤吗？
