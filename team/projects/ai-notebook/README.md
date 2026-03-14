# AI记事本

一个支持Markdown的AI增强型笔记应用。

## 功能特性

- ✍️ **Markdown编辑** - 支持实时预览和语法高亮
- 🤖 **AI摘要** - 自动生成笔记摘要
- 💬 **AI问答** - 基于笔记库的智能问答
- 🏷️ **标签管理** - 灵活的笔记分类
- 🔍 **全文搜索** - 快速找到所需笔记

## 技术栈

- **前端**: React + TypeScript + Tailwind CSS + Vite
- **后端**: Node.js + Express + Prisma + SQLite
- **AI**: Kimi K2.5 API

## 快速开始

### 1. 安装依赖

```bash
# 后端
cd backend
npm install
npx prisma migrate dev
npx prisma generate

# 前端
cd ../frontend
npm install
```

### 2. 配置环境变量

```bash
cd backend
cp .env.example .env
# 编辑 .env，填入你的 Kimi API Key
```

### 3. 启动开发服务器

```bash
# 后端 (端口 3001)
cd backend
npm run dev

# 前端 (端口 5173)
cd frontend
npm run dev
```

### 4. 访问应用

打开 http://localhost:5173

## Docker部署

```bash
cd deploy
docker-compose up -d
```

访问 http://localhost:3000

## 项目结构

```
ai-notebook/
├── frontend/          # 前端代码
├── backend/           # 后端代码
├── deploy/            # 部署配置
└── docs/              # 文档
    ├── prd.md         # 产品需求文档
    └── design.md      # 技术方案文档
```

## 开发团队

本项目由AI多智能体协作完成：
- PM - 需求分析
- Architect - 技术设计
- Frontend - 前端开发
- Backend - 后端开发

---

**创建日期**: 2026-02-26
