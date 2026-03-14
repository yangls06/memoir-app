# 回忆录App - Vercel 部署版

## 项目说明
老年人回忆录写作App，AI引导访谈，语音交互，自动生成精美回忆录。

## 功能特性
- AI引导式访谈（4个人生阶段，32个问题）
- 语音朗读与语音输入
- 5W1H智能追问
- 时间线故事整理
- AI润色与作家风格

## 技术栈
- 前端：HTML + JavaScript
- 后端：Python + FastAPI
- AI：Kimi API
- 部署：Vercel

## 本地开发
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

## 部署
自动部署到 Vercel，访问地址：https://memoir-app.vercel.app
