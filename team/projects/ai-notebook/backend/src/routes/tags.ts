import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// 获取所有标签
router.get('/', async (req, res) => {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: tags });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: '获取标签失败' } });
  }
});

// 创建标签
router.post('/', async (req, res) => {
  try {
    const { name, color = '#3b82f6' } = req.body;

    const tag = await prisma.tag.create({
      data: { name, color },
    });

    res.json({ success: true, data: tag });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, error: { code: 'DUPLICATE', message: '标签已存在' } });
    }
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: '创建标签失败' } });
  }
});

// 删除标签
router.delete('/:id', async (req, res) => {
  try {
    await prisma.tag.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: '删除标签失败' } });
  }
});

export default router;
