# 时光回忆录 MVP 快速开始

## 项目结构

```
src/
├── backend/          # Node.js 后端
│   ├── server.js     # 主服务
│   ├── package.json
│   └── .env.example  # 环境变量模板
└── frontend/         # Flutter 前端
    ├── lib/
    │   ├── main.dart
    │   ├── screens/  # 页面
    │   └── services/ # API和音频服务
    └── pubspec.yaml
```

## 后端启动

```bash
cd src/backend

# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 填入你的 API Keys

# 3. 启动服务
npm run dev

# 服务运行在 http://localhost:3000
```

## 前端启动

```bash
cd src/frontend

# 1. 获取依赖
flutter pub get

# 2. 运行（选择设备）
flutter run

# 或指定设备
flutter run -d ios
flutter run -d android
```

## MVP 功能清单

✅ 已实现：
- [x] 首页UI
- [x] 主题选择
- [x] 录音界面
- [x] 后端API框架
- [x] 数据库模型

🔄 待接入：
- [ ] 讯飞语音识别
- [ ] 讯飞语音合成(TTS)
- [ ] AI追问 (Kimi API)
- [ ] 5W1H追问逻辑
- [ ] 时间线整理
- [ ] 风格改写

## API 端点

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | /api/health | 健康检查 |
| GET | /api/topics | 获取主题列表 |
| GET | /api/topics/:id/questions | 获取主题问题 |
| POST | /api/followup | 生成追问问题 |
| POST | /api/memoirs | 创建回忆录 |
| POST | /api/memoirs/:id/chapters | 创建章节 |
| POST | /api/chapters/:id/qa | 保存问答 |

## 下一步开发

1. 接入讯飞语音API
2. 接入Kimi/Claude AI API
3. 实现完整的5W1H追问逻辑
4. 添加时间线可视化
5. 实现风格改写功能
