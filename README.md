# 时光回忆录 - TimeMemoir

> "不用打字，会说话就能为妈妈写回忆录"

一款帮助老年人用语音记录人生故事的 AI 应用。

## 在线演示

- **Web 应用**: https://timememoir-web.vercel.app (待部署)
- **API 文档**: https://timememoir-api.vercel.app/api/health (待部署)

## 核心功能

1. **AI引导问题** - 基于人生主题的智能提问
2. **语音朗读** - 问题语音播报，方便不识字的老人
3. **语音回答** - 老人说话，AI转文字 (讯飞API)
4. **5W1H追问** - AI基于缺失维度追问细节
5. **时间线整理** - 可视化人生地图
6. **AI润色** - 去除口语化，生成白描版本
7. **作家风格** - 6种文学风格改写 (汪曾祺/张爱玲/余华/杨绛/史铁生)

## 快速开始

```bash
# 克隆项目
git clone https://github.com/yangls06/memoir-app.git
cd memoir-app

# 安装后端依赖
cd src/backend
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入 API Keys

# 启动后端
npm run dev

# 启动前端
cd ../frontend
flutter pub get
flutter run
```

## Vercel 部署

详见 [Vercel 部署指南](docs/VERCEL_DEPLOY.md)

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录并部署
vercel login
vercel --prod
```

## 项目结构

```
memoir-app/
├── docs/                  # 文档
│   ├── PRD-v2.0.md
│   ├── UI-Design.md
│   ├── Tech-Architecture.md
│   ├── Marketing-Plan.md
│   └── VERCEL_DEPLOY.md   # Vercel部署指南
├── src/
│   ├── backend/           # Node.js后端
│   │   ├── server.js
│   │   ├── index.js       # Vercel入口
│   │   └── services/
│   │       ├── ai_service.js
│   │       ├── xunfei_service.js      # 讯飞语音
│   │       └── style_service.js       # 作家风格
│   └── frontend/          # Flutter前端
│       └── lib/
│           ├── screens/
│           │   ├── home_screen.dart
│           │   ├── topics_screen.dart
│           │   ├── record_screen.dart
│           │   ├── timeline_screen.dart # 时间线
│           │   └── style_screen.dart    # 风格选择
│           └── services/
├── prompts/               # AI Prompts
├── vercel.json            # Vercel配置
└── README.md
```

## 技术栈

- **后端**: Node.js + Express + SQLite
- **前端**: Flutter (iOS/Android/Web)
- **AI**: Kimi API + 讯飞语音
- **部署**: Vercel

## 版本迭代

| 版本 | 日期 | 功能 |
|------|------|------|
| v0.1 | 2026.03.07 | MVP基础功能 |
| v0.2 | 2026.03.07 | AI追问+润色 |
| v0.3 | 2026.03.07 | 讯飞语音+作家风格+时间线 |
| v0.4 | - | Vercel部署 |

## 截图

(待添加)

## 贡献

本项目由 AI Agent 团队协作完成。

## License

MIT
