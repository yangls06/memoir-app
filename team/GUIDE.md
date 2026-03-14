# 个人开发团队使用指南

## 快速开始

### 1. 创建新项目
```bash
./team/scripts/start-project.sh my-app
```

### 2. 告诉主会话你的需求
例如：
> "我要做一个任务管理应用，支持创建任务、设置截止日期、标记完成状态。用React+Node.js"

### 3. 主会话会按顺序执行
```
你 → PM(需求分析) → Architect(技术方案) → Frontend/Backend(开发) → QA(测试) → DevOps(部署)
```

## 工作流程

### 阶段1: 需求分析 (PM)
主会话启动PM角色，产出：
- PRD文档 → `docs/prd.md`

### 阶段2: 技术设计 (Architect)
基于PRD，产出：
- 技术方案 → `docs/design.md`

### 阶段3: 开发 (Frontend + Backend)
并行开发，产出：
- 前端代码 → `frontend/`
- 后端代码 → `backend/`

### 阶段4: 测试 (QA)
产出：
- 测试用例 → `tests/`
- Bug报告

### 阶段5: 部署 (DevOps)
产出：
- 部署配置 → `deploy/`

## 与团队交互

### 查看当前状态
问主会话："项目进度如何？"

### 修改需求
直接告诉主会话，PM会重新分析

### 技术问题
主会话会协调Architect和开发角色

### 代码审查
开发完成后，可以要求主会话进行代码审查

## 项目示例

### 示例1: Todo应用
```
需求: 简单的待办事项应用
技术: React + Express + SQLite
```

### 示例2: 博客系统
```
需求: 个人博客，支持Markdown，有评论功能
技术: Next.js + PostgreSQL
```

### 示例3: API服务
```
需求: REST API，用户认证，数据CRUD
技术: FastAPI + Redis
```

## 提示

1. **从简单开始** - 先做MVP，再迭代
2. **明确需求** - 越清晰的需求，产出越准确
3. **及时反馈** - 每个阶段完成后检查，有问题及时调整
4. **保存上下文** - 重要决策会记录在项目文档中

## 文件位置

- 团队配置: `team/roles/`
- 项目目录: `team/projects/{project-name}/`
- 本指南: `team/GUIDE.md`
