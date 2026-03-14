# AI记事本 - 前端

基于 React + TypeScript + Vite + Tailwind CSS 构建的AI记事本前端应用。

## 技术栈

- **框架**: React 18
- **语言**: TypeScript
- **构建**: Vite
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **HTTP客户端**: Axios
- **Markdown**: react-markdown + remark-gfm
- **代码高亮**: react-syntax-highlighter
- **图标**: Lucide React

## 目录结构

```
src/
├── components/         # 组件
│   ├── Layout.tsx     # 整体布局
│   ├── Sidebar.tsx    # 侧边栏（笔记列表 + 标签）
│   ├── NoteEditor.tsx # Markdown编辑器
│   ├── NotePreview.tsx # Markdown预览
│   ├── AIChat.tsx     # AI问答界面
│   └── SearchBox.tsx  # 搜索框
├── stores/            # 状态管理
│   └── noteStore.ts   # 笔记状态管理
├── api/               # API接口
│   ├── notes.ts       # 笔记API
│   ├── tags.ts        # 标签API
│   └── ai.ts          # AI API
├── types/             # 类型定义
│   └── index.ts       # 全局类型
├── App.tsx            # 根组件
├── main.tsx           # 入口文件
└── index.css          # 全局样式
```

## 功能特性

1. **笔记管理**
   - 创建、编辑、删除笔记
   - 自动保存（防抖500ms）
   - Markdown编辑器支持

2. **Markdown支持**
   - 实时预览
   - 代码高亮
   - GitHub风格Markdown

3. **标签系统**
   - 创建、删除标签
   - 按标签筛选笔记
   - 彩色标签标识

4. **AI助手**
   - 基于Kimi的知识问答
   - 笔记总结
   - 智能搜索

5. **视图模式**
   - 编辑模式
   - 预览模式
   - 分屏模式

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建
npm run build

# 预览构建
npm run preview
```

## 环境变量

创建 `.env` 文件：

```
VITE_API_BASE_URL=http://localhost:3001/api
```

## API配置

开发服务器配置了代理，将 `/api` 请求转发到后端服务器 `http://localhost:3001`。
