# 「时光回忆录」技术架构方案

## 1. 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      客户端 (Flutter)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ 主题选择 │  │ 语音播放 │  │ 录音上传 │  │ 回忆录预览│    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS/WebSocket
┌────────────────────────▼────────────────────────────────────┐
│                      后端服务 (Node.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   API Gateway │  │  语音处理服务 │  │   AI服务     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   语音转文字   │  │   AI模型     │  │   数据存储   │
│  (讯飞/阿里)  │  │  (Kimi/Claude)│  │  (PostgreSQL)│
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## 2. 关键技术选型

### 2.1 语音转文字 (ASR)

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **讯飞语音** | 中文识别率高，支持方言 | 收费 | ⭐⭐⭐⭐⭐ |
| **阿里云ASR** | 价格适中，文档好 | 识别率一般 | ⭐⭐⭐⭐ |
| **Whisper本地** | 隐私好，免费 | 需服务器资源 | ⭐⭐⭐ |

**推荐**：讯飞语音识别 + 阿里云备份
- 识别率：普通话 >95%，支持四川/粤语等方言
- 成本：约¥0.004/秒

### 2.2 文字转语音 (TTS)

| 方案 | 音色 | 价格 | 推荐度 |
|------|------|------|--------|
| **讯飞TTS** | 有"老奶奶"音色，温暖 | 中等 | ⭐⭐⭐⭐⭐ |
| **Azure TTS** | 晓晓(老年)音色好 | 较贵 | ⭐⭐⭐⭐ |
| **阿里TTS** | 多种选择 | 便宜 | ⭐⭐⭐⭐ |

**推荐**：讯飞TTS "老奶奶"音色
- 语速可调节：0.8x-1.2x

### 2.3 AI 模型选型

| 功能 | 模型 | 说明 |
|------|------|------|
| 5W1H追问 | Kimi K2.5 | 成本低，中文理解好 |
| 时间抽取 | DeepSeek-V3 | 结构化输出 |
| AI润色 | Kimi K2.5 | 成本低 |
| 风格改写 | Claude 3.5 Sonnet | 文学性强 |

---

## 3. 核心功能实现

### 3.1 录音流程

```dart
class RecordService {
  Future<String> startRecording() async {
    await _recorder.startRecorder(
      toFile: 'temp_${DateTime.now()}.aac',
      codec: Codec.aacADTS,
    );
    return 'recording';
  }
  
  Future<String> stopAndUpload() async {
    String? path = await _recorder.stopRecorder();
    String text = await uploadAndTranscribe(path!);
    return text;
  }
}
```

### 3.2 AI追问API

```javascript
app.post('/api/followup', async (req, res) => {
  const { topic, speech, history } = req.body;
  
  const response = await kimi.chat.completions.create({
    model: 'k2p5',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildPrompt(topic, speech, history) }
    ],
    temperature: 0.7
  });
  
  const questions = parseQuestions(response.choices[0].message.content);
  res.json({ questions });
});
```

### 3.3 时间线抽取

```python
def extract_timeline(chapters):
    timeline = []
    for chapter in chapters:
        text = chapter['content']
        years = re.findall(r'(19|20)\d{2}', text)
        for year in years:
            event = extract_event(text, year)
            timeline.append({
                'year': int(year),
                'event': event,
                'chapter_id': chapter['id']
            })
    timeline.sort(key=lambda x: x['year'])
    return timeline
```

### 3.4 风格改写

```python
STYLE_CONFIG = {
    'wang_zengqi': {
        'name': '汪曾祺',
        'prompt': '你是汪曾祺风格的回忆录改写师...',
        'model': 'claude-3-5-sonnet'
    },
    # ... 其他风格
}

async def rewrite_memoir(text, style):
    config = STYLE_CONFIG[style]
    prompt = f"{config['prompt']}\n\n输入: {text}\n\n改写:"
    return await call_llm(model=config['model'], prompt=prompt)
```

---

## 4. 数据模型

```sql
-- 回忆录表
CREATE TABLE memoirs (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT,
  status TEXT DEFAULT 'ongoing',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 章节表
CREATE TABLE chapters (
  id SERIAL PRIMARY KEY,
  memoir_id INTEGER REFERENCES memoirs(id),
  topic TEXT NOT NULL,
  content TEXT,
  audio_urls JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 问答记录表
CREATE TABLE qas (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER REFERENCES chapters(id),
  question TEXT,
  answer_text TEXT,
  answer_audio_url TEXT,
  followups JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 时间线事件表
CREATE TABLE timeline_events (
  id SERIAL PRIMARY KEY,
  memoir_id INTEGER REFERENCES memoirs(id),
  year INTEGER,
  event TEXT,
  chapter_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 风格版本表
CREATE TABLE styled_versions (
  id SERIAL PRIMARY KEY,
  memoir_id INTEGER REFERENCES memoirs(id),
  style TEXT,
  content TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 5. API接口设计

### 核心接口

```javascript
// 1. 时间线提取
POST /api/timeline/extract
Request: { chapters: [...] }
Response: { timeline: [{ year, event, chapter_id }] }

// 2. AI润色
POST /api/polish
Request: { raw_text: "..." }
Response: { polished_text: "..." }

// 3. 风格改写
POST /api/rewrite
Request: { text: "...", style: "wang_zengqi" }
Response: { rewritten_text: "..." }

// 4. 生成回忆录
POST /api/memoir/generate
Request: { memoir_id, style }
Response: { download_url, preview }
```

---

## 6. 性能优化

| 功能 | 耗时 | 优化方案 |
|------|------|----------|
| 语音识别 | 1-3s | 流式识别 |
| 时间线抽取 | 200ms | 本地正则+缓存 |
| AI润色 | 3-5s | 流式输出 |
| 风格改写 | 10-30s | 异步任务+进度通知 |

---

## 7. 安全与隐私

- 语音数据加密存储
- 用户数据隔离
- 支持数据导出/删除
- 符合个人信息保护法

---

## 8. 部署方案

```yaml
# docker-compose.yml
version: '3'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://...
      - KIMI_API_KEY=...
      - CLAUDE_API_KEY=...
  
  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7
    # 缓存和任务队列
```

---

## 9. 成本估算

### MVP月成本（1000用户）

| 项目 | 方案 | 月成本 |
|------|------|--------|
| 服务器 | 阿里云ECS 2核4G | ¥200 |
| 数据库 | PostgreSQL RDS | ¥100 |
| 语音识别 | 讯飞(1000小时) | ¥400 |
| 语音合成 | 讯飞(5000次) | ¥50 |
| AI模型 | Kimi + Claude | ¥320 |
| 存储 | OSS(100GB) | ¥50 |
| **总计** | | **¥1120/月** |
