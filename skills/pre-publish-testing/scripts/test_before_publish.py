#!/usr/bin/env python3
"""
发布前测试脚本 - 验证每日简报和其他内容的完整性
"""

import os
import sys
import re
from datetime import datetime, timedelta
from pathlib import Path

def check_daily_brief(date_str):
    """检查指定日期的每日简报是否完整"""
    base_path = f"/root/.openclaw/workspace/second-brain/content/input/{date_str}"
    
    if not os.path.exists(base_path):
        return False, f"目录不存在: {base_path}"
    
    required_files = ['index.md', 'ai.md', 'agent.md', 'autonomous-driving.md', 'multimodal.md', 'embodied-intelligence.md']
    missing = []
    
    for f in required_files:
        filepath = os.path.join(base_path, f)
        if not os.path.exists(filepath):
            missing.append(f)
        elif os.path.getsize(filepath) < 500:  # 文件太小可能是占位符
            print(f"  ⚠️  {f} 文件过小 ({os.path.getsize(filepath)} bytes)，可能是占位符")
    
    if missing:
        return False, f"缺少文件: {', '.join(missing)}"
    
    return True, "所有必需文件都存在"

def check_input_index():
    """检查 input/index.md 是否正确更新"""
    index_path = "/root/.openclaw/workspace/second-brain/content/input/index.md"
    
    if not os.path.exists(index_path):
        return False, "input/index.md 不存在"
    
    with open(index_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    issues = []
    
    # 检查是否有"等待生成"的占位符
    if "等待每日简报生成" in content or "等待生成" in content:
        issues.append("存在'等待生成'占位符，需要更新为今日链接")
    
    # 检查主题表格链接
    today = datetime.now().strftime('%Y%m%d')
    if f"[[input/{today}/ai|" not in content and "📅 今日" not in content:
        issues.append("主题表格中的链接未更新为今日")
    
    if issues:
        return False, "; ".join(issues)
    
    return True, "input/index.md 检查通过"

def check_topic_history_pages():
    """检查主题历史页面是否存在"""
    topics = ['ai', 'agent', 'autonomous-driving', 'multimodal', 'embodied-intelligence']
    missing = []
    
    for topic in topics:
        path = f"/root/.openclaw/workspace/second-brain/content/input/{topic}/index.md"
        if not os.path.exists(path):
            missing.append(topic)
    
    if missing:
        return False, f"缺少主题历史页面: {', '.join(missing)}"
    
    return True, "所有主题历史页面都存在"

def check_github_status():
    """检查 GitHub 是否有未提交的更改"""
    repo_path = "/root/.openclaw/workspace/second-brain"
    
    try:
        import subprocess
        result = subprocess.run(
            ['git', 'status', '--porcelain'],
            cwd=repo_path,
            capture_output=True,
            text=True
        )
        
        if result.stdout.strip():
            return False, f"有未提交的更改:\n{result.stdout[:200]}"
        
        return True, "Git 工作区干净"
    except Exception as e:
        return False, f"Git 检查失败: {e}"

def main():
    """主函数"""
    print("=" * 60)
    print("🔍 发布前测试流程")
    print("=" * 60)
    
    all_passed = True
    
    # 1. 检查今日简报
    today = datetime.now().strftime('%Y%m%d')
    print(f"\n📋 1. 检查今日简报 ({today})")
    passed, msg = check_daily_brief(today)
    print(f"   {'✅' if passed else '❌'} {msg}")
    all_passed = all_passed and passed
    
    # 2. 检查昨日简报（确保昨天的也完整）
    yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y%m%d')
    print(f"\n📋 2. 检查昨日简报 ({yesterday})")
    passed, msg = check_daily_brief(yesterday)
    print(f"   {'✅' if passed else '❌'} {msg}")
    all_passed = all_passed and passed
    
    # 3. 检查 input/index.md
    print("\n📋 3. 检查 input/index.md")
    passed, msg = check_input_index()
    print(f"   {'✅' if passed else '❌'} {msg}")
    all_passed = all_passed and passed
    
    # 4. 检查主题历史页面
    print("\n📋 4. 检查主题历史页面")
    passed, msg = check_topic_history_pages()
    print(f"   {'✅' if passed else '❌'} {msg}")
    all_passed = all_passed and passed
    
    # 5. 检查 Git 状态
    print("\n📋 5. 检查 Git 状态")
    passed, msg = check_github_status()
    print(f"   {'✅' if passed else '❌'} {msg}")
    all_passed = all_passed and passed
    
    print("\n" + "=" * 60)
    if all_passed:
        print("🎉 所有测试通过！可以安全发布。")
        return 0
    else:
        print("❌ 测试未通过，请修复上述问题后再发布。")
        return 1

if __name__ == "__main__":
    sys.exit(main())
