import { Router } from 'express';
import { chatWithNotes } from '../utils/ai';

const router = Router();

// AI问答
router.post('/chat', async (req, res) => {
  try {
    const { question, noteIds } = req.body;

    if (!question?.trim()) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: '问题不能为空' } });
    }

    const result = await chatWithNotes(question, noteIds);

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'AI问答失败' } });
  }
});

export default router;
