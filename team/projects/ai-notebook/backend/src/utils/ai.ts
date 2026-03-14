import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Kimi API 客户端 (OpenAI兼容)
const openai = new OpenAI({
  apiKey: process.env.KIMI_API_KEY || '',
  baseURL: 'https://api.moonshot.cn/v1',
});

export async function generateSummary(content: string): Promise<string> {
  if (!content.trim()) {
    return '';
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'kimi-k2.5',
      messages: [
        {
          role: 'system',
          content: '你是一个笔记助手。请为以下内容生成一句话摘要，不超过100字。',
        },
        {
          role: 'user',
          content: `请为以下内容生成摘要：\n\n${content}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 150,
    });

    return response.choices[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('生成摘要失败:', error);
    throw new Error('生成摘要失败');
  }
}

export async function chatWithNotes(
  question: string,
  noteIds?: string[]
): Promise<{ answer: string; sources: { noteId: string; title: string }[] }> {
  try {
    // 获取相关笔记
    let notes;
    if (noteIds && noteIds.length > 0) {
      notes = await prisma.note.findMany({
        where: { id: { in: noteIds } },
        select: { id: true, title: true, content: true },
      });
    } else {
      // 如果没有指定笔记，搜索所有笔记
      notes = await prisma.note.findMany({
        select: { id: true, title: true, content: true },
      });
    }

    if (notes.length === 0) {
      return {
        answer: '没有找到相关笔记内容。',
        sources: [],
      };
    }

    // 构建上下文
    const context = notes
      .map((note) => `【${note.title}】\n${note.content}`)
      .join('\n\n---\n\n');

    const response = await openai.chat.completions.create({
      model: 'kimi-k2.5',
      messages: [
        {
          role: 'system',
          content: `你是一个知识助手。基于以下笔记内容回答用户问题。如果内容中没有相关信息，请明确说明。

笔记内容：
${context}`,
        },
        {
          role: 'user',
          content: question,
        },
      ],
      temperature: 0.5,
      max_tokens: 1000,
    });

    const answer = response.choices[0]?.message?.content?.trim() || '';

    return {
      answer,
      sources: notes.map((n) => ({ noteId: n.id, title: n.title })),
    };
  } catch (error) {
    console.error('AI问答失败:', error);
    throw new Error('AI问答失败');
  }
}
