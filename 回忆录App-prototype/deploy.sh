#!/bin/bash

# 回忆录App部署脚本

echo "🚀 开始部署回忆录App到公网..."

# 获取服务器IP
SERVER_IP=$(curl -s ifconfig.me)
echo "📍 服务器IP: $SERVER_IP"

# 1. 复制前端文件到nginx目录
echo "📁 部署前端文件..."
mkdir -p /var/www/memoir
cp -r /root/.openclaw/workspace/回忆录App-prototype/frontend/* /var/www/memoir/
chown -R www-data:www-data /var/www/memoir

# 2. 配置nginx
echo "🔧 配置Nginx..."
cp /root/.openclaw/workspace/回忆录App-prototype/nginx.conf /etc/nginx/sites-available/memoir
ln -sf /etc/nginx/sites-available/memoir /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# 3. 启动后端服务
echo "📡 启动后端服务..."
cd /root/.openclaw/workspace/回忆录App-prototype/backend
source venv/bin/activate

# 使用nohup后台运行
nohup python main.py > /var/log/memoir-backend.log 2>&1 &
echo $! > /var/run/memoir-backend.pid

sleep 3

# 4. 检查服务状态
echo ""
echo "🔍 检查服务状态..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ 后端服务运行正常"
else
    echo "❌ 后端服务启动失败，查看日志: /var/log/memoir-backend.log"
fi

if curl -s http://localhost > /dev/null; then
    echo "✅ Nginx运行正常"
else
    echo "❌ Nginx启动失败"
fi

echo ""
echo "=========================================="
echo "🎉 回忆录App部署完成！"
echo "=========================================="
echo ""
echo "🌐 访问地址: http://$SERVER_IP"
echo ""
echo "📱 使用方法:"
echo "   1. 在手机或电脑浏览器打开 http://$SERVER_IP"
echo "   2. 输入姓名和年龄开始访谈"
echo "   3. 可以语音回答或打字"
echo ""
echo "⚠️  注意事项:"
echo "   - 确保服务器防火墙开放80端口"
echo "   - 需要配置Kimi API Key才能使用AI功能"
echo "   - 重启服务器后需要重新运行此脚本"
echo ""
echo "📋 管理命令:"
echo "   查看后端日志: tail -f /var/log/memoir-backend.log"
echo "   重启后端: kill \$(cat /var/run/memoir-backend.pid) && ./deploy.sh"
echo "   重启Nginx: systemctl restart nginx"
echo ""
