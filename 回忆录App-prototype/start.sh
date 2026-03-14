#!/bin/bash

# 回忆录App启动脚本

echo "🚀 启动回忆录App..."

# 启动后端
echo "📡 启动后端服务..."
cd /root/.openclaw/workspace/回忆录App-prototype/backend
source venv/bin/activate
python main.py &
BACKEND_PID=$!

sleep 3

# 启动前端
echo "🎨 启动前端服务..."
cd /root/.openclaw/workspace/回忆录App-prototype/frontend
python3 -m http.server 8080 &
FRONTEND_PID=$!

echo ""
echo "✅ 服务已启动！"
echo ""
echo "📱 前端地址: http://localhost:8080"
echo "🔌 后端地址: http://localhost:8000"
echo "📚 API文档: http://localhost:8000/docs"
echo ""
echo "按 Ctrl+C 停止服务"

# 等待用户中断
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
