#!/usr/bin/env python3
"""
链接验证测试脚本
验证 GitHub Pages 上所有关键页面的可访问性
"""

import subprocess
import sys
from datetime import datetime
import os

# 基础 URL
BASE_URL = "https://andy03withai.github.io/second-brain"

def check_url(url, description):
    """检查单个 URL 是否可访问"""
    try:
        result = subprocess.run(
            ['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', url],
            capture_output=True,
            text=True,
            timeout=30
        )
        status_code = result.stdout.strip()
        if status_code == '200':
            print(f"✅ {description}: {url}")
            return True
        else:
            print(f"❌ {description}: {url} (HTTP {status_code})")
            return False
    except Exception as e:
        print(f"❌ {description}: {url} (Error: {e})")
        return False

def main():
    """主函数：验证所有关键链接"""
    print("=" * 60)
    print("🔍 链接可访问性验证")
    print("=" * 60)
    
    failed = []
    
    # 1. 主页
    if not check_url(f"{BASE_URL}/", "主页"):
        failed.append("主页")
    
    # 2. Input 页面
    if not check_url(f"{BASE_URL}/input/", "Input 目录"):
        failed.append("Input 目录")
    
    # 3. 每日简报页面 (最近7天)
    today = datetime.now()
    for i in range(7):
        date = today.strftime('%Y%m%d')
        url = f"{BASE_URL}/input/{date}/"
        desc = f"每日简报 {date}"
        if not check_url(url, desc):
            failed.append(desc)
    
    # 4. 主题历史页面
    topics = ['ai', 'agent', 'autonomous-driving', 'multimodal', 'embodied-intelligence']
    for topic in topics:
        url = f"{BASE_URL}/input/{topic}/"
        desc = f"主题页 {topic}"
        if not check_url(url, desc):
            failed.append(desc)
    
    # 5. Ace 复盘报告
    current_week = today.isocalendar()[1]
    for week in range(current_week-2, current_week+1):
        url = f"{BASE_URL}/input/ace-reviews/2026-W{week:02d}/"
        desc = f"复盘报告 W{week:02d}"
        if not check_url(url, desc):
            failed.append(desc)
    
    # 6. 其他关键页面
    other_pages = [
        ("/deep-research/", "深度调研目录"),
        ("/articles/", "文章目录"),
    ]
    for path, desc in other_pages:
        if not check_url(f"{BASE_URL}{path}", desc):
            failed.append(desc)
    
    print("\n" + "=" * 60)
    if failed:
        print(f"❌ 发现 {len(failed)} 个 404 页面:")
        for item in failed:
            print(f"   - {item}")
        sys.exit(1)
    else:
        print("✅ 所有链接验证通过！")
        sys.exit(0)

if __name__ == "__main__":
    main()
