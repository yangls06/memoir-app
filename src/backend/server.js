const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// 文件上传配置
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// 数据库初始化
const db = new sqlite3.Database('./memoir.db');

db.serialize(() => {
  // 回忆录表
  db.run(`CREATE TABLE IF NOT EXISTS memoirs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    title TEXT,
    status TEXT DEFAULT 'ongoing',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 章节表
  db.run(`CREATE TABLE IF NOT EXISTS chapters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    memoir_id INTEGER,
    topic TEXT,
    content TEXT,
    audio_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (memoir_id) REFERENCES memoirs(id)
  )`);

  // 问答记录表
  db.run(`CREATE TABLE IF NOT EXISTS qas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapter_id INTEGER,
    question TEXT,
    answer_text TEXT,
    answer_audio_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id)
  )`);
});

// ===== API 路由 =====

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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

// 保存问答记录
app.post('/api/chapters/:chapterId/qa', upload.single('audio'), (req, res) => {
  const { chapterId } = req.params;
  const { question, answer_text } = req.body;
  const audio_url = req.file ? `/uploads/${req.file.filename}` : null;
  
  db.run(
    'INSERT INTO qas (chapter_id, question, answer_text, answer_audio_url) VALUES (?, ?, ?, ?)',
    [chapterId, question, answer_text, audio_url],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, message: '问答记录保存成功' });
    }
  );
});

// 生成AI追问问题（模拟）
app.post('/api/followup', (req, res) => {
  const { answer, topic } = req.body;
  
  // 简单的追问逻辑（实际应调用AI API）
  const followups = [
    "那是哪一年呢？",
    "当时还有谁在场？",
    "您当时心情怎么样？"
  ];
  
  res.json({ 
    questions: followups.slice(0, 2),
    analysis: "回答可以补充时间和人物细节"
  });
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

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 时光回忆录后端服务运行在端口 ${PORT}`);
  console.log(`📚 API文档: http://localhost:${PORT}/api/health`);
});

module.exports = app;
