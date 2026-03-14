import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateSummary } from '../utils/ai';

const router = Router();
const prisma = new PrismaClient();

// 获取所有笔记
router.get('/', async (req, res) => {
  try {
    const { search, tag } = req.query;
    
    const where: any = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { content: { contains: search as string } },
      ];
    }
    
    if (tag) {
      where.tags = { some: { id: tag as string } };
    }

    const notes = await prisma.note.findMany({
      where,
      include: { tags: true },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ success: true, data: notes });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: '获取笔记失败' } });
  }
});

// 获取单篇笔记
router.get('/:id', async (req, res) => {
  try {
    const note = await prisma.note.findUnique({
      where: { id: req.params.id },
      include: { tags: true },
    });

    if (!note) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '笔记不存在' } });
    }

    res.json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: '获取笔记失败' } });
  }
});

// 创建笔记
router.post('/', async (req, res) => {
  try {
    const { title, content = '', tagIds = [] } = req.body;

    const note = await prisma.note.create({
      data: {
        title,
        content,
        tags: tagIds.length > 0 ? { connect: tagIds.map((id: string) => ({ id })) } : undefined,
      },
      include: { tags: true },
    });

    res.json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: '创建笔记失败' } });
  }
});

// 更新笔记
router.put('/:id', async (req, res) => {
  try {
    const { title, content, tagIds } = req.body;

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content;
    if (tagIds !== undefined) {
      data.tags = { set: tagIds.map((id: string) => ({ id })) };
    }

    const note = await prisma.note.update({
      where: { id: req.params.id },
      data,
      include: { tags: true },
    });

    res.json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: '更新笔记失败' } });
  }
});

// 删除笔记
router.delete('/:id', async (req, res) => {
  try {
    await prisma.note.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: '删除笔记失败' } });
  }
});

// 生成摘要
router.post('/:id/summarize', async (req, res) => {
  try {
    const note = await prisma.note.findUnique({
      where: { id: req.params.id },
    });

    if (!note) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '笔记不存在' } });
    }

    const summary = await generateSummary(note.content);

    await prisma.note.update({
      where: { id: req.params.id },
      data: { summary },
    });

    res.json({ success: true, data: { summary } });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: '生成摘要失败' } });
  }
});

export default router;
