# MEMORY.md - 杨林三

## 命令速查

### /sb 命令
**含义**: 第二大脑（second-brain）文章收录  
**用法**:
- `/sb <链接>` — 收录单篇文章
- `/sb <链接> <批注>` — 带批注收录
- `/sb <链接1> <链接2> <主题批注>` — 主题收录

**作用**: 自动提取内容 → 生成白话摘要 → 写作消化 → 知识卡片 → 推送到 GitHub Pages → **等待页面更新后返回具体页面网址**

**示例**:
- `/sb https://github.com/cft0808/edict 有意思：借鉴三省六部的组织结构来做agent的编排调度`

**⚠️ 重要反馈 (2026-03-11)**: 
- **必须返回具体页面网址**，如 `https://andy03withai.github.io/second-brain/articles/20260311-article-name`
- 不能只返回根地址 `https://andy03withai.github.io/second-brain/`
- GitHub Pages 部署需要 2-3 分钟，应等待更新完成后返回最终页面地址
- **URL 必须包含文章标题**（而非纯数字ID），方便一眼识别内容

### /book 命令
**含义**: 书籍记录和读书笔记管理  
**用法**:
- `/book <链接> <批注>` — 从亚马逊/豆瓣链接添加书籍
- `/book 《书名》 <笔记>` — 添加读书笔记

**示例**:
- `/book https://book.douban.com/subject/26176885/ 朋友推荐`
- `/book DDIA 今天读到第三章，关于一致性算法很有启发`

**分类**: 计算机系统、分布式计算、数据系统、自动驾驶、AI与Agents、人文社科

---

## 每日简报格式规范 (2026-03-21 更新)

**页面结构**: 单页展示，不再分主题跳转

**布局**:
```
# 📰 每日简报 - YYYY年MM月DD日

## 🤖 AI 前沿
- 要点1
- 要点2

## 🎯 Agent 智能体
...

## 🚗 自动驾驶
...

## 👁️ 多模态
...

## 🦾 具身智能
...
```

**要求**:
- 所有内容在一个页面展示
- 主题用二级标题分隔
- 每条信息简明扼要
- 底部标注数据来源
- **⚠️ 新闻时效性**: 优先选择简报日期当天（或前1天）发布的新闻，超过3天的内容除非特别重要，一般不收录

### /r 命令
**含义**: 深度调研 (deep-research)  
**用法**: `/r <主题> [--depth standard|deep|comprehensive]`

**深度级别**:
- `standard` — 3-4k字，10-15分钟
- `deep` — 5-7k字，20-30分钟  
- `comprehensive` — 8k+字，40-60分钟

**示例**:
- `/r AI Agent 在电商领域的应用`
- `/r 具身智能最新进展 --depth deep`

**方法论**: OpenAI Deep Research 四大支柱（扩展-递归-验证-综合）

**⚠️ 重要反馈 (2026-03-11)**: 
- **必须返回具体调研报告网址**，如 `https://andy03withai.github.io/second-brain/deep-research/2026-03-11-research-topic`

---

## Ace 自我进化系统 (Self-Evolution)

### 核心能力

**1. 错误追踪**
- 位置: `memory/errors/YYYY-MM.jsonl`
- 自动记录 API 超时、理解偏差、执行失败

**2. 任务遥测**
- 位置: `memory/telemetry/YYYY-MM.jsonl`
- 追踪: 任务类型、执行时长、成功率

**3. 用户反馈**
- 位置: `memory/feedback/YYYY-MM.jsonl`

**4. 自动复盘报告**
- 时间: 每周日 22:00
- 输出: `content/input/ace-reviews/2026-WXX/index.md` (⚠️ 必须是 index.md 子目录结构)
- 页面链接: `https://andy03withai.github.io/second-brain/input/ace-reviews/2026-WXX/`
- Cron Job ID: `929c1415-9aac-4c63-8f5a-6dff06b718b6`

**⚠️ 2026-03-16 修复**: 
- 复盘报告从 `.md` 改为 `/index.md` 子目录结构，修复 Hugo 404 问题
- 每日简报返回 URL 修复为完整日期路径
- 添加链接验证测试脚本

**5. 主动优化**
- 触发: 同类错误≥3次 / 技能成功率<90%
- 行为: 分析根因，提出改进方案

### 脚本位置
`/second-brain/skills/self-evolution/scripts/`
- `tracker.py` - 核心追踪器
- `weekly_review.py` - 周报生成
- `feedback_collector.py` - 反馈收集
- `proactive_optimizer.py` - 主动优化

---

## 杭州城市活动追踪 (2026-04-10)

**功能**: 每天自动生成杭州未来一周的城市活动列表  
**时间**: 每天早上 7:00 (Asia/Shanghai)  
**Cron Job ID**: `528262ab-b6dc-4b76-b0ad-497b76863636`  
**访问地址**: `https://andy03withai.github.io/second-brain/input/hangzhou-events/YYYY-MM-DD`

**涵盖类别**:

*文化艺术*：艺术展览、讲座分享、音乐会、戏剧、市集

*科技与行业*：黑客松、开发者大会、行业展会、企业开放日、工厂参访

*户外运动*：山野徒步、登山、骑行、城市探索

*亲子教育*：博物馆科普、科技馆展览、研学活动、科学实验、亲子工作坊、自然教育、农场体验

**特点**:
- 每个活动都有真实信息源链接
- 按日期排序，标注星期几
- 包含时间、地点、简介、适合人群、费用说明、报名方式
- 重点关注适合家庭参与、能拓展眼界的项目

---

*创建于 2026-03-10*