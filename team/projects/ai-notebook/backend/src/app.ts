import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import notesRouter from './routes/notes';
import tagsRouter from './routes/tags';
import aiRouter from './routes/ai';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'http://localhost:5173'
    : 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API路由
app.use('/api/notes', notesRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/ai', aiRouter);

// 404处理
app.use((req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '接口不存在' } });
});

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    error: { 
      code: 'INTERNAL_ERROR', 
      message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message 
    } 
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API endpoints:`);
  console.log(`   - GET    /api/notes`);
  console.log(`   - POST   /api/notes`);
  console.log(`   - GET    /api/notes/:id`);
  console.log(`   - PUT    /api/notes/:id`);
  console.log(`   - DELETE /api/notes/:id`);
  console.log(`   - POST   /api/notes/:id/summarize`);
  console.log(`   - GET    /api/tags`);
  console.log(`   - POST   /api/tags`);
  console.log(`   - DELETE /api/tags/:id`);
  console.log(`   - POST   /api/ai/chat`);
});

export default app;
