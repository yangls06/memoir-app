# Vercel 部署指南

## 快速部署

### 1. 安装 Vercel CLI
```bash
npm i -g vercel
```

### 2. 登录 Vercel
```bash
vercel login
```

### 3. 部署后端 API
```bash
cd memoir-app
vercel --prod
```

### 4. 配置环境变量
在 Vercel Dashboard 中配置以下环境变量：

| 变量名 | 说明 | 获取方式 |
|--------|------|----------|
| `KIMI_API_KEY` | Kimi AI API Key | https://platform.moonshot.cn |
| `XUNFEI_APP_ID` | 讯飞应用ID | https://www.xfyun.cn |
| `XUNFEI_API_KEY` | 讯飞API Key | https://www.xfyun.cn |
| `XUNFEI_API_SECRET` | 讯飞API Secret | https://www.xfyun.cn |

### 5. 部署 Flutter Web (可选)
如需部署前端 Web 版本：

```bash
cd src/frontend

# 启用 Web 支持
flutter config --enable-web

# 构建 Web 版本
flutter build web --release

# 部署到 Vercel
vercel --prod
```

## 自动部署

每次推送到 GitHub 时，Vercel 会自动重新部署。

## 版本迭代查看

部署后，你可以在 Vercel Dashboard 中看到：
- 每次部署的版本记录
- 构建日志
- 访问统计
- 预览链接

## 生产环境地址

部署成功后，你会获得类似以下的地址：
- API: `https://timememoir-api.vercel.app`
- Web: `https://timememoir-web.vercel.app`

## 更新前端 API 地址

部署后需要更新前端代码中的 `baseUrl`：

```dart
// src/frontend/lib/services/api_service.dart
static const String baseUrl = 'https://timememoir-api.vercel.app/api';
```
