---
name: pre-publish-testing
description: 发布前测试流程，验证内容完整性和链接正确性。在发布任何内容到 GitHub Pages 之前使用，包括：检查每日简报文件完整性、验证 input/index.md 更新状态、确认主题历史页面存在、确保 Git 工作区干净。
---

# 发布前测试流程

在将内容推送到 GitHub Pages 之前，必须执行此测试流程以确保内容完整性。

## 何时使用

- 每日简报生成后
- 手动修改 content/ 目录后
- 修复链接或页面问题后
- 任何推送到 GitHub 之前

## 测试内容

### 1. 每日简报完整性检查

验证指定日期的每日简报包含所有必需文件：
- `index.md` - 每日总索引
- `ai.md` - AI 前沿简报
- `agent.md` - Agent 智能体简报
- `autonomous-driving.md` - 自动驾驶简报
- `multimodal.md` - 多模态简报
- `embodied-intelligence.md` - 具身智能简报

### 2. input/index.md 更新检查

验证 input/index.md 已正确更新：
- 主题表格中的链接指向今日（📅 今日）
- 没有"等待生成"占位符

### 3. 主题历史页面检查

验证所有主题历史页面存在：
- `input/ai/index.md`
- `input/agent/index.md`
- `input/autonomous-driving/index.md`
- `input/multimodal/index.md`
- `input/embodied-intelligence/index.md`

### 4. Git 状态检查

验证 Git 工作区干净，无未提交更改。

## 使用方法

运行测试脚本：

```bash
python3 /root/.openclaw/workspace/skills/pre-publish-testing/scripts/test_before_publish.py
```

## 失败处理

如果测试失败：

1. **缺少文件** - 检查每日简报生成任务是否完成，或手动创建缺失文件
2. **input/index.md 未更新** - 运行 `update_input_index()` 函数或手动更新
3. **缺少主题历史页面** - 创建对应的 `input/{topic}/index.md` 文件
4. **Git 未提交** - 执行 `git add . && git commit && git push`

## 集成到工作流

将测试脚本集成到每日简报生成流程的最后一步：

```python
# 在 daily_brief_generator.py 的 main() 函数末尾添加：
subprocess.run([
    'python3', 
    '/root/.openclaw/workspace/skills/pre-publish-testing/scripts/test_before_publish.py'
], check=True)
```

测试通过后才执行 `git push`。
