# AI记事本后端

AI记事本的后端服务，提供笔记CRUD、标签管理、AI摘要和问答功能。

## 技术栈

- **运行时**: Node.js 20
- **框架**: Express 4
- **语言**: TypeScript
- **ORM**: Prisma
- **数据库**: SQLite
- **AI SDK**: OpenAI SDK (兼容Kimi API)

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，设置 KIMI_API_KEY
```

### 3. 初始化数据库

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:3001 启动

## API文档

### 笔记 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/notes | 获取笔记列表 |
| POST | /api/notes | 创建笔记 |
| GET | /api/notes/:id | 获取单篇笔记 |
| PUT | /api/notes/:id | 更新笔记 |
| DELETE | /api/notes/:id | 删除笔记 |
| POST | /api/notes/:id/summarize | 生成摘要 |

### 标签 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/tags | 获取所有标签 |
| POST | /api/tags | 创建标签 |
| DELETE | /api/tags/:id | 删除标签 |

### AI API

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/ai/chat | AI问答 |

## 目录结构

```
src/
├── routes/          # 路由定义
│   ├── notes.ts
│   ├── tags.ts
│   └── ai.ts
├── services/        # 业务逻辑
│   ├── noteService.ts
│   ├── tagService.ts
│   └── aiService.ts
├── middleware/      # 中间件
│   └── errorHandler.ts
├── utils/           # 工具函数
│   ├── db.ts
│   └── ai.ts
├── types/           # 类型定义
│   └── index.ts
└── app.ts           # 入口文件
```

## 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| DATABASE_URL | 数据库连接URL | file:./dev.db |
| KIMI_API_KEY | Kimi API密钥 | - |
| KIMI_BASE_URL | Kimi API地址 | https://api.moonshot.cn/v1 |
| PORT | 服务器端口 | 3001 |
| FRONTEND_URL | 前端地址 | http://localhost:5173 |
