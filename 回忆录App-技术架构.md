# 老年人回忆录写作App - 技术架构设计

**设计人**：技术负责人 老邢  
**日期**：2026年2月27日  
**版本**：v1.0

---

## 1. 系统架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                         客户端层                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  iOS App    │  │ Android App │  │  Web (H5)   │             │
│  │  (React     │  │  (React     │  │  (子女端)   │             │
│  │   Native)   │  │   Native)   │  │             │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
└─────────┼────────────────┼────────────────┼────────────────────┘
          │                │                │
          └────────────────┴────────────────┘
                           │
                    ┌──────┴──────┐
                    │   API Gateway │
                    │   (Nginx)     │
                    └──────┬──────┘
                           │
┌──────────────────────────┼─────────────────────────────────────┐
│                         服务层                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  访谈服务    │  │  语音服务    │  │  AI服务      │             │
│  │  Interview  │  │  Voice      │  │  (LLM)      │             │
│  │  Service    │  │  Service    │  │             │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  整理服务    │  │  润色服务    │  │  导出服务    │             │
│  │  Organize   │  │  Polish     │  │  Export     │             │
│  │  Service    │  │  Service    │  │  Service    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────┼─────────────────────────────────────┐
│                         数据层                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ PostgreSQL  │  │    Redis    │  │    OSS      │             │
│  │  (主数据库)  │  │   (缓存)    │  │  (文件存储)  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│  ┌─────────────┐  ┌─────────────┐                              │
│  │ Elasticsearch│  │  ClickHouse │                              │
│  │  (全文搜索)  │  │  (数据分析)  │                              │
│  └─────────────┘  └─────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 核心服务设计

### 2.1 访谈服务 (Interview Service)

#### 职责
- 管理访谈会话生命周期
- 维护问题库和追问策略
- 记录用户回答和元数据
- 协调AI服务生成问题

#### 核心API
```python
# 创建访谈会话
POST /api/interview/session
{
    "user_id": "user_123",
    "stage": "childhood",  # childhood/youth/adult/elder
    "title": "张阿姨的回忆录"
}

# 获取下一个问题
GET /api/interview/session/{id}/next_question
Response: {
    "question_id": "q_001",
    "text": "您小时候家里有几口人？",
    "audio_url": "https://.../q_001.mp3",
    "context": {...}
}

# 提交回答
POST /api/interview/session/{id}/answer
{
    "question_id": "q_001",
    "audio_url": "https://.../answer_001.mp3",
    "transcript": "我家有五口人...",
    "duration": 45
}

# AI追问
POST /api/interview/session/{id}/follow_up
Response: {
    "should_ask": true,
    "question": "您刚才提到那时候，大概是什么时候呢？",
    "type": "when"
}
```

#### 数据模型
```sql
-- 访谈会话表
CREATE TABLE interview_sessions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    title VARCHAR(255),
    current_stage VARCHAR(50),
    status VARCHAR(20), -- active/paused/completed
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- 问答记录表
CREATE TABLE interview_qa (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES interview_sessions(id),
    question_id VARCHAR(50),
    question_text TEXT,
    answer_audio_url VARCHAR(500),
    answer_transcript TEXT,
    follow_up_count INT DEFAULT 0,
    emotion_tags JSONB,
    created_at TIMESTAMP
);
```

### 2.2 语音服务 (Voice Service)

#### 职责
- 文字转语音 (TTS)
- 语音转文字 (ASR)
- 语音存储和管理
- 方言适配

#### 技术选型
| 功能 | 方案 | 原因 |
|------|------|------|
| TTS | Azure Neural Voice | 中文自然度高，支持方言 |
| ASR | 科大讯飞 | 方言识别准确率高 |
| 音频存储 | 阿里云OSS | 成本低，CDN加速 |

#### 核心API
```python
# 文字转语音
POST /api/voice/tts
{
    "text": "您小时候家里有几口人？",
    "voice": "zh-CN-XiaoxiaoNeural",
    "speed": 0.8,
    "style": "gentle"
}

# 语音转文字
POST /api/voice/asr
Content-Type: multipart/form-data
file: [音频文件]
language: "zh-CN"
dialect: "sichuan"

Response: {
    "transcript": "我家有五口人...",
    "confidence": 0.92,
    "segments": [...]
}
```

### 2.3 AI服务 (LLM Service)

#### 职责
- 生成访谈问题
- 智能追问决策
- 文本润色
- 风格迁移

#### 架构设计
```
┌─────────────────────────────────────────┐
│           AI Service Gateway            │
│         (负载均衡/限流/缓存)             │
└─────────────────┬───────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───▼───┐   ┌────▼────┐   ┌────▼────┐
│ GPT-4 │   │ Claude  │   │ 本地模型 │
│ 主模型 │   │ 备用模型 │   │ (边缘端) │
└───────┘   └─────────┘   └─────────┘
```

#### Prompt设计

**1. 问题生成Prompt**
```
你是一位温柔的回忆录访谈助手，正在帮助一位老人回忆人生。

老人信息：
- 姓名：{name}
- 年龄：{age}
- 当前阶段：{stage}
- 已回答问题数：{answered_count}

请根据以下原则生成下一个问题：
1. 问题要开放式，避免是/否回答
2. 从具体场景切入，引发回忆
3. 语气亲切，像孙女/孙子一样
4. 考虑老人的情绪和疲劳程度

上一个回答摘要：{last_answer_summary}

请生成下一个问题：
```

**2. 追问决策Prompt**
```
分析老人的回答，判断是否需要追问。

老人回答：{answer}

检查以下维度：
- [ ] 时间模糊（"那时候"、"很久以前"）
- [ ] 地点缺失
- [ ] 人物不清
- [ ] 事件笼统
- [ ] 原因未提
- [ ] 过程简略
- [ ] 心情未表

如果存在以上情况，生成一个温和的追问问题。
追问要自然，像好奇的倾听者，不要像审问。

输出格式：
{
    "should_follow_up": true/false,
    "follow_up_type": "when/where/who/what/why/how/emotion",
    "question": "追问问题",
    "reason": "追问原因"
}
```

**3. 润色Prompt**
```
将老人的口语化讲述润色成流畅的回忆录文本。

原始文本：
{raw_text}

润色要求：
1. 删除语气词（"那个"、"就是"、"嗯"）
2. 修正口误和重复
3. 调整语序，让叙述更通顺
4. 保留老人的语言风格和时代用语
5. 保留情感表达和感叹词
6. 不要添加不存在的信息

输出润色后的文本，保持第一人称。
```

**4. 风格迁移Prompt**
```
将回忆录文本改写成{style}的风格。

原始文本：
{original_text}

{style}风格特点：
{style_description}

要求：
1. 保留所有事实内容
2. 改变表达方式，体现风格特点
3. 保持第一人称
4. 保持情感真挚

输出改写后的文本。
```

### 2.4 整理服务 (Organize Service)

#### 职责
- 提取时间信息
- 识别人物关系
- 生成时间线
- 章节结构化

#### 核心算法
```python
class StoryOrganizer:
    def extract_timeline(self, qa_list):
        """从问答中提取时间线"""
        timeline = []
        for qa in qa_list:
            # 提取时间实体
            time_entities = self.ner.extract_time(qa.answer)
            # 提取事件
            events = self.extract_events(qa.answer)
            timeline.append({
                "time": time_entities,
                "event": events,
                "qa_id": qa.id
            })
        return self.sort_by_time(timeline)
    
    def generate_chapters(self, timeline):
        """生成章节结构"""
        chapters = []
        for stage in ["childhood", "youth", "adult", "elder"]:
            stage_events = self.filter_by_stage(timeline, stage)
            chapter = {
                "title": self.get_stage_title(stage),
                "events": stage_events,
                "summary": self.generate_summary(stage_events)
            }
            chapters.append(chapter)
        return chapters
```

### 2.5 导出服务 (Export Service)

#### 职责
- PDF生成
- EPUB生成
- 音频合成
- 排版渲染

#### 技术选型
| 格式 | 技术方案 |
|------|----------|
| PDF | Puppeteer + HTML模板 |
| EPUB | epub-gen (Node.js) |
| Word | python-docx |
| 音频 | FFmpeg合成 |

---

## 3. 数据流设计

### 3.1 访谈流程数据流

```
用户打开App
    ↓
创建访谈会话 (POST /interview/session)
    ↓
获取第一个问题
    ├── 从问题库选择
    ├── AI生成个性化问题
    └── TTS生成语音 (缓存)
    ↓
播放问题语音
    ↓
用户语音回答
    ├── 本地录音
    ├── 上传至OSS
    └── ASR转文字
    ↓
保存问答记录
    ↓
AI分析回答
    ├── 提取关键信息
    ├── 判断是否需要追问
    └── 生成追问问题（如需要）
    ↓
获取下一个问题
    └── 循环直到用户结束
```

### 3.2 回忆录生成数据流

```
用户选择"生成回忆录"
    ↓
拉取所有问答记录
    ↓
时间线整理
    ├── 提取时间实体
    ├── 识别人物关系
    └── 生成章节结构
    ↓
AI润色
    ├── 分段润色
    ├── 保持风格一致
    └── 生成白描版本
    ↓
风格迁移（如选择）
    ├── 加载风格模板
    ├── 逐章改写
    └── 生成风格版本
    ↓
排版渲染
    ├── 加载排版模板
    ├── 插入图片/音频
    └── 生成PDF/EPUB
    ↓
通知用户完成
```

---

## 4. 关键技术方案

### 4.1 离线支持

**场景**：老人网络不稳定

**方案**：
1. 问题语音预下载（前10个问题）
2. 回答先本地存储，联网后批量上传
3. 关键操作（生成回忆录）需要联网

### 4.2 方言识别

**方案**：
1. 首次使用选择方言
2. ASR使用方言模型
3. 置信度低时提示用户确认
4. 支持用户纠正，持续优化

### 4.3 情感识别

**方案**：
1. 语音情感分析（语调、语速）
2. 文本情感分析（关键词）
3. 老人疲劳时自动建议休息
4. 情绪激动时给予安慰

### 4.4 数据安全

**方案**：
1. 传输：HTTPS + 证书 pinning
2. 存储：数据库加密 + 文件加密
3. 隐私：数据最小化收集，本地优先
4. 合规：符合《个人信息保护法》

---

## 5. 部署架构

```
┌─────────────────────────────────────────┐
│              阿里云 / AWS                │
│  ┌─────────────────────────────────┐    │
│  │         Kubernetes集群           │    │
│  │  ┌─────────┐  ┌─────────┐       │    │
│  │  │  API    │  │  API    │       │    │
│  │  │ Pod x3  │  │ Pod x3  │       │    │
│  │  └─────────┘  └─────────┘       │    │
│  │  ┌─────────┐  ┌─────────┐       │    │
│  │  │ Worker  │  │ Worker  │       │    │
│  │  │ Pod x2  │  │ Pod x2  │       │    │
│  │  └─────────┘  └─────────┘       │    │
│  └─────────────────────────────────┘    │
│  ┌─────────┐  ┌─────────┐  ┌────────┐  │
│  │   RDS   │  │  Redis  │  │  OSS   │  │
│  │PostgreSQL│  │ Cluster │  │        │  │
│  └─────────┘  └─────────┘  └────────┘  │
└─────────────────────────────────────────┘
```

---

## 6. 性能指标

| 指标 | 目标值 | 说明 |
|------|--------|------|
| API响应时间 | < 200ms | P99 |
| TTS延迟 | < 1s | 首字节 |
| ASR延迟 | < 2s | 实时转写 |
| AI响应 | < 3s | 问题生成 |
| PDF导出 | < 30s | 10万字 |
| 并发用户 | 1000+ | 同时访谈 |
| 可用性 | 99.9% | 年度 |

---

## 7. 技术风险与应对

| 风险 | 影响 | 应对方案 |
|------|------|----------|
| AI服务不稳定 | 高 | 多模型备份，本地降级方案 |
| ASR方言准确率低 | 高 | 多轮确认，人工校对入口 |
| 存储成本过高 | 中 | 音频压缩，冷热分层存储 |
| 数据泄露 | 高 | 加密存储，最小权限原则 |

---

## 8. 开发计划

| 周次 | 任务 | 负责人 |
|------|------|--------|
| W1 | 基础架构搭建 | 老邢 |
| W2 | 访谈服务开发 | 小全 |
| W3 | 语音服务集成 | 小全 |
| W4 | AI服务接入 | 小数 |
| W5 | 追问系统开发 | 小全 |
| W6 | 整理服务开发 | 小数 |
| W7 | 润色服务开发 | 小数 |
| W8 | 风格迁移开发 | 小数 |
| W9 | 导出服务开发 | 小全 |
| W10 | 客户端开发 | 小影 |
| W11 | 集成测试 | 小陈 |
| W12 | 优化上线 | 小邢 |

---

**下一步**：等待产品需求确认，开始W1架构搭建。
