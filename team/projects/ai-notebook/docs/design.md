# AI记事本 - 技术方案文档

## 1. 技术栈

### 1.1 前端
| 技术 | 版本 | 用途 |
|------|------|------|
| React | ^18.2.0 | UI框架 |
| TypeScript | ^5.0.0 | 类型安全 |
| Tailwind CSS | ^3.4.0 | 原子化CSS样式 |
| Vite | ^5.0.0 | 构建工具 |
| React Router | ^6.20.0 | 路由管理 |
| Zustand | ^4.4.0 | 状态管理 |
| React Query | ^5.8.0 | 服务端状态管理 |
| Marked | ^9.0.0 | Markdown解析 |
| Highlight.js | ^11.9.0 | 代码高亮 |
| Axios | ^1.6.0 | HTTP客户端 |
| Lucide React | ^0.294.0 | 图标库 |

### 1.2 后端
| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | >=18 | 运行时 |
| Express | ^4.18.0 | Web框架 |
| TypeScript | ^5.0.0 | 类型安全 |
| SQLite3 | ^5.1.6 | 数据库 |
| Better-sqlite3 | ^9.0.0 | 同步SQLite驱动 |
| Kimi SDK | latest | AI能力 |
| CORS | ^2.8.5 | 跨域处理 |
| Helmet | ^7.1.0 | 安全头 |

### 1.3 部署
- **开发环境**: Docker Compose
- **生产环境**: 单机部署（单用户场景）

---

## 2. 系统架构

### 2.1 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (React)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  笔记列表    │  │  编辑器     │  │  AI问答面板         │  │
│  │  - 搜索     │  │  - Markdown │  │  - 知识问答         │  │
│  │  - 标签筛选  │  │  - 预览     │  │  - 来源引用         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/REST API
┌──────────────────────────▼──────────────────────────────────┐
│                      后端 (Express)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ 笔记API     │  │ 标签API     │  │ AI服务              │  │
│  │ /api/notes  │  │ /api/tags   │  │ /api/ai/*           │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                    │             │
│  ┌──────▼────────────────▼────────────────────▼──────────┐  │
│  │                    数据层 (SQLite)                     │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────────────────────┐ │  │
│  │  │ notes   │  │ tags    │  │ note_tags (关联表)      │ │  │
│  │  └─────────┘  └─────────┘  └─────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      外部服务                                │
│                    Kimi API (AI能力)                         │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 架构说明

**分层架构设计**:

1. **表现层 (Frontend)**: React SPA，负责UI渲染和用户交互
2. **API层 (Backend)**: Express REST API，处理业务逻辑
3. **数据层 (Data)**: SQLite 本地数据库，存储笔记和标签
4. **AI层 (External)**: Kimi API 提供智能总结和问答能力

**设计原则**:
- **简洁优先**: 单用户场景，无需复杂认证和权限
- **本地优先**: SQLite 单文件数据库，便于备份和迁移
- **前后端分离**: 清晰的API边界，便于后续扩展

---

## 3. 数据模型设计

### 3.1 ER图

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────┐
│   notes     │       │   note_tags     │       │    tags     │
├─────────────┤       ├─────────────────┤       ├─────────────┤
│ id (PK)     │◄──────┤ note_id (FK)    │       │ id (PK)     │
│ title       │       │ tag_id (FK)     │──────►│ name        │
│ content     │       └─────────────────┘       │ color       │
│ summary     │                                 │ created_at  │
│ created_at  │                                 └─────────────┘
│ updated_at  │
└─────────────┘
```

### 3.2 表结构

#### notes 表
```sql
CREATE TABLE notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL DEFAULT '未命名笔记',
    content TEXT NOT NULL DEFAULT '',
    summary TEXT,                          -- AI生成的摘要
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 索引：按更新时间排序
CREATE INDEX idx_notes_updated_at ON notes(updated_at DESC);
```

#### tags 表
```sql
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,             -- 标签名，唯一
    color TEXT DEFAULT '#3B82F6',          -- 标签颜色 (Tailwind颜色)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 索引：标签名搜索
CREATE INDEX idx_tags_name ON tags(name);
```

#### note_tags 关联表
```sql
CREATE TABLE note_tags (
    note_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (note_id, tag_id),
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- 索引：快速查找笔记的标签 / 标签的笔记
CREATE INDEX idx_note_tags_note_id ON note_tags(note_id);
CREATE INDEX idx_note_tags_tag_id ON note_tags(tag_id);
```

### 3.3 TypeScript 类型定义

```typescript
// 笔记
interface Note {
    id: number;
    title: string;
    content: string;
    summary?: string;
    tags?: Tag[];           // 关联标签
    createdAt: string;
    updatedAt: string;
}

// 标签
interface Tag {
    id: number;
    name: string;
    color: string;
    createdAt: string;
}

// 创建/更新笔记请求
interface CreateNoteRequest {
    title: string;
    content: string;
    tagIds?: number[];
}

interface UpdateNoteRequest {
    title?: string;
    content?: string;
    tagIds?: number[];
}

// AI问答
interface AIQuestionRequest {
    question: string;
    conversationId?: string;  // 用于多轮对话
}

interface AIQuestionResponse {
    answer: string;
    sources: NoteSource[];    // 引用的笔记来源
    basedOnCount: number;     // 基于多少篇笔记
}

interface NoteSource {
    noteId: number;
    title: string;
    relevance: number;        // 相关度分数
}
```

---

## 4. API接口设计

### 4.1 接口概览

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/notes | 获取笔记列表 |
| POST | /api/notes | 创建笔记 |
| GET | /api/notes/:id | 获取笔记详情 |
| PUT | /api/notes/:id | 更新笔记 |
| DELETE | /api/notes/:id | 删除笔记 |
| POST | /api/notes/:id/summary | 生成/重新生成摘要 |
| GET | /api/tags | 获取所有标签 |
| POST | /api/tags | 创建标签 |
| DELETE | /api/tags/:id | 删除标签 |
| GET | /api/search | 搜索笔记 |
| POST | /api/ai/ask | AI问答 |

### 4.2 详细接口规范

#### 笔记相关

**GET /api/notes**
```typescript
// Query参数
interface ListNotesQuery {
    tagId?: number;        // 按标签筛选
    search?: string;       // 关键词搜索
    limit?: number;        // 默认20
    offset?: number;       // 默认0
}

// 响应
interface ListNotesResponse {
    data: Note[];
    total: number;
    limit: number;
    offset: number;
}
```

**POST /api/notes**
```typescript
// 请求体
interface CreateNoteBody {
    title?: string;
    content?: string;
    tagIds?: number[];
}

// 响应: Note
```

**GET /api/notes/:id**
```typescript
// 响应: Note (包含tags)
```

**PUT /api/notes/:id**
```typescript
// 请求体
interface UpdateNoteBody {
    title?: string;
    content?: string;
    tagIds?: number[];     // 传null清空标签
}

// 响应: Note
```

**DELETE /api/notes/:id**
```typescript
// 响应: 204 No Content
```

**POST /api/notes/:id/summary**
```typescript
// 响应
interface GenerateSummaryResponse {
    summary: string;
}
```

#### 标签相关

**GET /api/tags**
```typescript
// 响应
interface ListTagsResponse {
    data: Tag[];
    count: number;         // 每个标签关联的笔记数量
}
```

**POST /api/tags**
```typescript
// 请求体
interface CreateTagBody {
    name: string;
    color?: string;
}

// 响应: Tag
```

**DELETE /api/tags/:id**
```typescript
// 响应: 204 No Content
```

#### 搜索

**GET /api/search**
```typescript
// Query参数
interface SearchQuery {
    q: string;             // 搜索关键词（必填）
    limit?: number;        // 默认10
}

// 响应
interface SearchResponse {
    data: SearchResult[];
    total: number;
}

interface SearchResult {
    note: Note;
    highlights: {          // 高亮片段
        title?: string;
        content?: string;
    };
    score: number;         // 匹配分数
}
```

#### AI问答

**POST /api/ai/ask**
```typescript
// 请求体
interface AskRequest {
    question: string;
    conversationId?: string;
}

// 响应
interface AskResponse {
    answer: string;
    sources: {
        noteId: number;
        title: string;
        excerpt: string;   // 相关片段
    }[];
    basedOnCount: number;
    conversationId: string;
}
```

### 4.3 错误响应

统一错误格式：
```typescript
interface ErrorResponse {
    error: {
        code: string;          // 错误码
        message: string;       // 错误信息
        details?: any;         // 详细信息
    };
}

// HTTP状态码
// 400 - Bad Request (参数错误)
// 404 - Not Found (资源不存在)
// 500 - Internal Server Error (服务器错误)
```

---

## 5. 目录结构

```
ai-notebook/
├── README.md
├── package.json                    # 根package.json (scripts)
├── docker-compose.yml              # 开发环境
│
├── frontend/                       # 前端项目
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── index.html
│   │
│   ├── src/
│   │   ├── main.tsx               # 入口
│   │   ├── App.tsx                # 根组件
│   │   │
│   │   ├── components/            # 组件
│   │   │   ├── layout/            # 布局组件
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── MainLayout.tsx
│   │   │   │
│   │   │   ├── notes/             # 笔记相关
│   │   │   │   ├── NoteList.tsx
│   │   │   │   ├── NoteCard.tsx
│   │   │   │   ├── NoteEditor.tsx
│   │   │   │   ├── MarkdownPreview.tsx
│   │   │   │   └── NoteDetail.tsx
│   │   │   │
│   │   │   ├── tags/              # 标签相关
│   │   │   │   ├── TagList.tsx
│   │   │   │   ├── TagBadge.tsx
│   │   │   │   └── TagSelector.tsx
│   │   │   │
│   │   │   ├── ai/                # AI相关
│   │   │   │   ├── AIChatPanel.tsx
│   │   │   │   ├── AIChatMessage.tsx
│   │   │   │   └── SummaryButton.tsx
│   │   │   │
│   │   │   └── common/            # 通用组件
│   │   │       ├── Button.tsx
│   │   │       ├── Input.tsx
│   │   │       ├── Modal.tsx
│   │   │       └── SearchBox.tsx
│   │   │
│   │   ├── hooks/                 # 自定义Hooks
│   │   │   ├── useNotes.ts
│   │   │   ├── useTags.ts
│   │   │   ├── useSearch.ts
│   │   │   └── useAI.ts
│   │   │
│   │   ├── stores/                # 状态管理 (Zustand)
│   │   │   ├── noteStore.ts
│   │   │   ├── tagStore.ts
│   │   │   └── uiStore.ts
│   │   │
│   │   ├── services/              # API服务
│   │   │   ├── api.ts             # axios实例
│   │   │   ├── noteService.ts
│   │   │   ├── tagService.ts
│   │   │   └── aiService.ts
│   │   │
│   │   ├── types/                 # TypeScript类型
│   │   │   └── index.ts
│   │   │
│   │   ├── utils/                 # 工具函数
│   │   │   ├── markdown.ts        # Markdown处理
│   │   │   └── date.ts            # 日期格式化
│   │   │
│   │   └── styles/                # 样式
│   │       └── globals.css
│   │
│   └── public/                    # 静态资源
│
├── backend/                        # 后端项目
│   ├── package.json
│   ├── tsconfig.json
│   ├── nodemon.json               # 开发热重载
│   │
│   ├── src/
│   │   ├── index.ts               # 入口
│   │   ├── app.ts                 # Express应用
│   │   │
│   │   ├── config/                # 配置
│   │   │   ├── database.ts        # 数据库配置
│   │   │   └── ai.ts              # AI配置
│   │   │
│   │   ├── routes/                # 路由
│   │   │   ├── index.ts           # 路由聚合
│   │   │   ├── notes.ts
│   │   │   ├── tags.ts
│   │   │   ├── search.ts
│   │   │   └── ai.ts
│   │   │
│   │   ├── controllers/           # 控制器
│   │   │   ├── noteController.ts
│   │   │   ├── tagController.ts
│   │   │   ├── searchController.ts
│   │   │   └── aiController.ts
│   │   │
│   │   ├── services/              # 业务逻辑
│   │   │   ├── noteService.ts
│   │   │   ├── tagService.ts
│   │   │   ├── searchService.ts
│   │   │   └── aiService.ts
│   │   │
│   │   ├── models/                # 数据模型
│   │   │   ├── Note.ts
│   │   │   └── Tag.ts
│   │   │
│   │   ├── database/              # 数据库
│   │   │   ├── connection.ts      # 连接管理
│   │   │   ├── migrations/        # 迁移脚本
│   │   │   │   └── 001_initial.sql
│   │   │   └── seeds/             # 种子数据
│   │   │
│   │   ├── types/                 # TypeScript类型
│   │   │   └── index.ts
│   │   │
│   │   └── utils/                 # 工具函数
│   │       ├── errors.ts          # 错误处理
│   │       └── logger.ts          # 日志
│   │
│   └── data/                      # 数据目录
│       └── notebook.db            # SQLite数据库文件
│
└── docs/                          # 文档
    ├── prd.md
    ├── design.md                  # 本文档
    └── api.md                     # API详细文档
```

---

## 6. 关键技术决策说明

### 6.1 技术栈选择

#### 为什么选 React + TypeScript？
- **生态成熟**: 丰富的组件库和工具链
- **类型安全**: TypeScript 减少运行时错误
- **团队熟悉**: 主流技术栈，学习成本低
- **AI友好**: 大量AI辅助编程工具支持

#### 为什么选 SQLite？
- **单用户场景**: 无需复杂的多用户并发处理
- **零配置**: 单文件数据库，部署简单
- **足够性能**: 对于个人笔记应用，SQLite性能完全足够
- **易于备份**: 直接复制.db文件即可备份

#### 为什么选 Kimi API？
- **中文优化**: 对中文内容理解和生成效果更好
- **长上下文**: 支持长文本，适合笔记总结和问答
- **API稳定**: 提供稳定的API服务

### 6.2 架构决策

#### 前后端分离 vs 全栈框架
**选择**: 前后端分离
- **理由**: 职责清晰，前后端可独立开发部署
- **权衡**: 增加了部署复杂度，但利于长期维护

#### REST API vs GraphQL
**选择**: REST API
- **理由**: 简单直观，适合小型项目
- **权衡**: 可能需要多次请求，但开发效率高

#### 状态管理方案
**选择**: Zustand + React Query
- **Zustand**: 轻量级全局状态（UI状态、主题等）
- **React Query**: 服务端状态管理（缓存、同步、乐观更新）
- **理由**: 组合使用，各司其职

### 6.3 AI功能实现策略

#### 摘要生成
```
流程:
1. 用户点击"生成摘要"
2. 后端调用 Kimi API，传入笔记内容
3. Prompt: "请为以下内容生成100字以内的摘要：{content}"
4. 保存摘要到数据库
5. 返回摘要给前端
```

#### 知识问答
```
流程:
1. 用户输入问题
2. 后端检索所有笔记内容（简单关键词匹配或向量检索）
3. 选取最相关的N篇笔记作为上下文
4. 调用 Kimi API，传入问题和相关笔记
5. Prompt设计: 
   "基于以下笔记内容回答问题：\n\n{笔记内容}\n\n问题：{question}\n\n请回答并标注信息来源。"
6. 返回答案和来源引用
```

**检索策略（MVP阶段）**:
- 使用 SQLite FTS (Full Text Search) 进行全文检索
- 按关键词匹配度排序
- 取前5-10篇相关笔记作为上下文

**后续优化方向**:
- 引入向量数据库进行语义检索
- 使用 Embedding 模型计算语义相似度

### 6.4 性能优化策略

| 优化点 | 方案 |
|--------|------|
| 笔记列表加载 | 分页加载 + 虚拟滚动 |
| 搜索响应 | SQLite FTS索引 + 防抖 |
| Markdown渲染 | 缓存解析结果 |
| AI请求 | 防抖 + 加载状态 + 超时处理 |
| 自动保存 | 防抖（500ms）+ 本地草稿 |

### 6.5 安全考虑

| 风险 | 措施 |
|------|------|
| SQL注入 | 使用参数化查询 |
| XSS | Markdown渲染时过滤危险标签 |
| API密钥泄露 | 环境变量存储，不提交到Git |
| CORS | 限制前端域名访问 |

### 6.6 扩展性考虑

**未来可能的需求**:
1. **多用户支持**: 增加 users 表，所有数据增加 user_id 外键
2. **云端同步**: 后端增加同步API，前端增加离线存储
3. **移动端**: 使用 React Native 或 PWA 方案
4. **附件支持**: 增加文件存储服务（本地/云存储）

---

## 7. 开发计划建议

### 阶段1: 基础框架 (Week 1)
- [ ] 项目初始化（前后端）
- [ ] 数据库设计和迁移
- [ ] 基础API实现（笔记CRUD）
- [ ] 基础UI布局

### 阶段2: 核心功能 (Week 2)
- [ ] Markdown编辑器
- [ ] 笔记列表和详情页
- [ ] 标签管理
- [ ] 搜索功能

### 阶段3: AI功能 (Week 3)
- [ ] Kimi API接入
- [ ] 摘要生成
- [ ] 知识问答

### 阶段4: 优化完善 (Week 4)
- [ ] UI polish
- [ ] 性能优化
- [ ] 测试和Bug修复

---

**文档版本**: v1.0  
**创建日期**: 2026-02-26  
**作者**: Architect Agent
