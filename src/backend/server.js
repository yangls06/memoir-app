const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { generateFollowUpQuestions, polishText } = require('./services/ai_service');
const { speechToText, textToSpeech } = require('./services/xunfei_service');
const { rewriteWithStyle, getAvailableStyles, rewriteWithMultipleStyles } = require('./services/style_service');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// 确保上传目录存在
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// 文件上传配置
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) =>> {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// 数据库初始化
const db = new sqlite3.Database('./memoir.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS memoirs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    title TEXT,
    status TEXT DEFAULT 'ongoing',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS chapters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    memoir_id INTEGER,
    topic TEXT,
    content TEXT,
    audio_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (memoir_id) REFERENCES memoirs(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS qas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapter_id INTEGER,
    question TEXT,
    answer_text TEXT,
    answer_audio_url TEXT,
    polished_text TEXT,
    followups TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS timeline_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    memoir_id INTEGER,
    year INTEGER,
    event TEXT,
    chapter_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (memoir_id) REFERENCES memoirs(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS styled_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    memoir_id INTEGER,
    style TEXT,
    style_name TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (memoir_id) REFERENCES memoirs(id)
  )`);
});

// ===== API 路由 =====

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    features: ['xunfei_voice', 'ai_followup', 'polish', 'style_rewrite', 'timeline'],
    config: {
      kimi: !!process.env.KIMI_API_KEY,
      xunfei: !!(process.env.XUNFEI_APP_ID && process.env.XUNFEI_API_KEY),
    },
  });
});

// 获取主题列表
app.get('/api/topics', (req, res) => {
  const topics = [
    { id: 'childhood', emoji: '👶', title: '童年时光', subtitle: '说说您小时候的故事' },
    { id: 'youth', emoji: '💑', title: '青春岁月', subtitle: '关于爱情、学习和梦想' },
    { id: 'career', emoji: '💼', title: '工作经历', subtitle: '职业生涯的高光时刻' },
    { id: 'family', emoji: '👨‍👩‍👧', title: '家庭生活', subtitle: '结婚、育儿、家庭温馨' },
    { id: 'wisdom', emoji: '🌟', title: '人生感悟', subtitle: '想对晚辈说的话' }
  ];
  res.json({ topics });
});

// 获取主题的引导问题
app.get('/api/topics/:topicId/questions', (req, res) => {
  const { topicId } = req.params;
  
  const questions = {
    childhood: [
      "您小时候住在什么地方？能描述一下那时的家吗？",
      "童年最难忘的一次过年是什么样的？",
      "小时候最好的朋友是谁？你们常一起玩什么？",
      "那时候学校里印象最深的一位老师是谁？"
    ],
    youth: [
      "您年轻时最疯狂的一件事是什么？",
      "当初是怎么认识您爱人的？能讲讲第一次见面的情景吗？",
      "年轻时最大的梦想是什么？",
      "那时候最流行的衣服、发型是什么样的？"
    ],
    career: [
      "您的第一份工作是什么？当时怎么找到的？",
      "职业生涯中最自豪的一个成就是什么？",
      "工作中遇到过最大的困难是什么？怎么克服的？",
      "最难忘的一位同事或领导是谁？"
    ],
    family: [
      "结婚那天发生了什么难忘的事？",
      "孩子出生时您是什么心情？",
      "养儿育女过程中最困难的是什么？",
      "您和爱人最浪漫的一次经历是什么？"
    ],
    wisdom: [
      "如果回到20岁，您会对自己说什么？",
      "这辈子最正确的决定是什么？",
      "您最想对孙辈们说的一句话是什么？",
      "您觉得什么是人生最大的幸福？"
    ]
  };

  res.json({ 
    topic: topicId, 
    questions: questions[topicId] || questions.childhood 
  });
});

// 语音识别 (讯飞)
app.post('/api/speech-to-text', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file' });
    }

    const result = await speechToText(req.file.path);
    
    res.json({
      ...result,
      audio_url: req.file ? `/uploads/${req.file.filename}` : null,
    });
  } catch (error) {
    console.error('Speech to text error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 语音合成 (讯飞)
app.post('/api/text-to-speech', async (req, res) => {
  try {
    const { text, voice = 'xiaoyan', speed = 50 } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const result = await textToSpeech(text, { voice, speed });
    res.json(result);
  } catch (error) {
    console.error('Text to speech error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 生成AI追问问题
app.post('/api/followup', async (req, res) => {
  try {
    const { answer, topic, question } = req.body;
    
    const result = await generateFollowUpQuestions(
      answer, 
      topic || 'general', 
      question || ''
    );
    
    res.json(result);
  } catch (error) {
    console.error('Followup error:', error);
    res.status(500).json({ 
      error: error.message,
      questions: ["能再说详细一点吗？", "当时心情怎么样？"]
    });
  }
});

// AI润色
app.post('/api/polish', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    const polished = await polishText(text);
    
    res.json({
      original: text,
      polished: polished,
      word_count: {
        original: text.length,
        polished: polished.length
      }
    });
  } catch (error) {
    console.error('Polish error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取可用风格列表
app.get('/api/styles', (req, res) => {
  const styles = getAvailableStyles();
  res.json({ styles });
});

// 风格改写
app.post('/api/rewrite', async (req, res) => {
  try {
    const { text, style } = req.body;
    
    if (!text || !style) {
      return res.status(400).json({ error: 'Text and style are required' });
    }

    const result = await rewriteWithStyle(text, style);
    res.json(result);
  } catch (error) {
    console.error('Rewrite error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 批量风格改写（生成多种风格）
app.post('/api/rewrite/batch', async (req, res) => {
  try {
    const { text, styles } = req.body;
    
    if (!text || !styles || !Array.isArray(styles)) {
      return res.status(400).json({ error: 'Text and styles array are required' });
    }

    const results = await rewriteWithMultipleStyles(text, styles);
    res.json({ results });
  } catch (error) {
    console.error('Batch rewrite error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 创建回忆录
app.post('/api/memoirs', (req, res) => {
  const { user_id, title } = req.body;
  
  db.run(
    'INSERT INTO memoirs (user_id, title) VALUES (?, ?)',
    [user_id, title || '我的回忆录'],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, message: '回忆录创建成功' });
    }
  );
});

// 获取回忆录详情
app.get('/api/memoirs/:memoirId', (req, res) => {
  const { memoirId } = req.params;
  
  db.get(
    'SELECT * FROM memoirs WHERE id = ?',
    [memoirId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Memoir not found' });
      res.json(row);
    }
  );
});

// 创建章节
app.post('/api/memoirs/:memoirId/chapters', (req, res) => {
  const { memoirId } = req.params;
  const { topic } = req.body;
  
  db.run(
    'INSERT INTO chapters (memoir_id, topic) VALUES (?, ?)',
    [memoirId, topic],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, message: '章节创建成功' });
    }
  );
});

// 获取章节列表
app.get('/api/memoirs/:memoirId/chapters', (req, res) => {
  const { memoirId } = req.params;
  
  db.all(
    'SELECT * FROM chapters WHERE memoir_id = ? ORDER BY created_at',
    [memoirId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ chapters: rows });
    }
  );
});

// 保存问答记录
app.post('/api/chapters/:chapterId/qa', upload.single('audio'), async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { question, answer_text } = req.body;
    const audio_url = req.file ? `/uploads/${req.file.filename}` : null;
    
    // 润色文本
    const polished_text = await polishText(answer_text);
    
    db.run(
      'INSERT INTO qas (chapter_id, question, answer_text, answer_audio_url, polished_text) VALUES (?, ?, ?, ?, ?)',
      [chapterId, question, answer_text, audio_url, polished_text],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ 
          id: this.lastID, 
          message: '问答记录保存成功',
          polished_text: polished_text
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取章节的所有问答
app.get('/api/chapters/:chapterId/qas', (req, res) => {
  const { chapterId } = req.params;
  
  db.all(
    'SELECT * FROM qas WHERE chapter_id = ? ORDER BY created_at',
    [chapterId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ qas: rows });
    }
  );
});

// 生成时间线
app.post('/api/memoirs/:memoirId/timeline', (req, res) => {
  const { memoirId } = req.params;
  
  db.all(
    `SELECT q.*, c.topic FROM qas q 
     JOIN chapters c ON q.chapter_id = c.id 
     WHERE c.memoir_id = ?`,
    [memoirId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const timeline = [];
      const yearPattern = /(19|20)\d{2}/g;
      
      rows.forEach(row => {
        const text = row.answer_text || '';
        const years = text.match(yearPattern) || [];
        
        years.forEach(year => {
          timeline.push({
            year: parseInt(year),
            event: row.topic,
            content: text.substring(0, 50) + '...',
            qa_id: row.id
          });
        });
      });
      
      // 排序并去重
      timeline.sort((a, b) => a.year - b.year);
      const unique = [];
      const seen = new Set();
      timeline.forEach(item => {
        if (!seen.has(item.year)) {
          seen.add(item.year);
          unique.push(item);
        }
      });
      
      res.json({ timeline: unique });
    }
  );
});

// 获取时间线
app.get('/api/memoirs/:memoirId/timeline', (req, res) => {
  const { memoirId } = req.params;
  
  db.all(
    'SELECT * FROM timeline_events WHERE memoir_id = ? ORDER BY year',
    [memoirId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ timeline: rows });
    }
  );
});

// 保存风格版本
app.post('/api/memoirs/:memoirId/styles', (req, res) => {
  const { memoirId } = req.params;
  const { style, style_name, content } = req.body;
  
  db.run(
    'INSERT INTO styled_versions (memoir_id, style, style_name, content) VALUES (?, ?, ?, ?)',
    [memoirId, style, style_name, content],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, message: '风格版本保存成功' });
    }
  );
});

// 获取风格版本
app.get('/api/memoirs/:memoirId/styles', (req, res) => {
  const { memoirId } = req.params;
  
  db.all(
    'SELECT * FROM styled_versions WHERE memoir_id = ? ORDER BY created_at',
    [memoirId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ styles: rows });
    }
  );
});

// 生成完整回忆录
app.post('/api/memoirs/:memoirId/generate', async (req, res) => {
  try {
    const { memoirId } = req.params;
    const { style } = req.body;
    
    // 获取所有问答
    const qas = await new Promise((resolve, reject) => {
      db.all(
        `SELECT q.* FROM qas q 
         JOIN chapters c ON q.chapter_id = c.id 
         WHERE c.memoir_id = ? ORDER BY q.created_at`,
        [memoirId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    // 合并文本
    const fullText = qas.map(qa => qa.polished_text || qa.answer_text).join('\n\n');
    
    // 如果指定了风格，进行改写
    let finalText = fullText;
    let styleInfo = null;
    
    if (style && style !== 'plain') {
      const rewriteResult = await rewriteWithStyle(fullText, style);
      if (rewriteResult.success) {
        finalText = rewriteResult.rewritten;
        styleInfo = {
          key: style,
          name: rewriteResult.style
        };
      }
    }
    
    res.json({
      memoir_id: memoirId,
      content: finalText,
      word_count: finalText.length,
      style: styleInfo,
      qa_count: qas.length,
    });
    
  } catch (error) {
    console.error('Generate error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 时光回忆录后端服务运行在端口 ${PORT}`);
  console.log(`📚 API文档: http://localhost:${PORT}/api/health`);
  console.log(`🤖 Kimi AI: ${process.env.KIMI_API_KEY ? '✅' : '❌'}`);
  console.log(`🎙️ 讯飞语音: ${process.env.XUNFEI_APP_ID ? '✅' : '❌'}`);
});

module.exports = app;
