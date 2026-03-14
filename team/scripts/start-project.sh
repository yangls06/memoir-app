#!/bin/bash
# 个人开发团队 - 项目启动脚本

PROJECT_NAME=$1

if [ -z "$PROJECT_NAME" ]; then
    echo "Usage: ./start-project.sh <project-name>"
    exit 1
fi

echo "🚀 启动项目: $PROJECT_NAME"

# 创建项目目录
mkdir -p "team/projects/$PROJECT_NAME"
cd "team/projects/$PROJECT_NAME"

# 创建子目录
mkdir -p frontend backend tests deploy docs

echo "✅ 项目结构已创建"
echo ""
echo "📁 项目目录: team/projects/$PROJECT_NAME"
echo ""
echo "下一步:"
echo "1. 告诉主会话你的项目需求"
echo "2. 主会话会启动PM角色分析需求"
echo "3. 按顺序完成各阶段工作"
