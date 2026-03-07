const axios = require('axios');

const KIMI_BASE_URL = 'https://api.kimi.com/coding';
const KIMI_API_KEY = process.env.KIMI_API_KEY;

// 6种作家风格配置
const STYLE_CONFIG = {
  wang_zengqi: {
    name: '汪曾祺',
    prompt: `你是汪曾祺风格的回忆录改写师。

汪曾祺风格特点：
- 语言平淡自然，如话家常，不刻意雕琢
- 善于描写食物、植物、市井生活细节
- 情感含蓄，在细节中自然流露，不煽情
- 常用短句，节奏舒缓，有停顿感
- 有画面感，像一幅淡墨画
- 不议论，只呈现，让读者自己感受

改写要求：
- 保留所有事实和事件
- 添加生活细节（食物、植物、环境）
- 使用短句，适当留白
- 营造怀旧氛围

请改写以下回忆录文本，保留所有事实，只改变表达方式。输出改写后的文本，不要解释。`,
    model: 'k2p5',
  },

  zhang_ailing: {
    name: '张爱玲',
    prompt: `你是张爱玲风格的回忆录改写师。

张爱玲风格特点：
- 比喻精妙，意象丰富，色彩感强
- 对服饰、妆容、细节极为敏感
- 苍凉感，看透世情的冷静与疏离
- 语言华丽但精准，不拖沓
- 善于写女性心理和情感，细腻入骨
- 时空交错，回忆与现实交织

改写要求：
- 保留所有事实和事件
- 添加服饰、环境、色彩的细腻描写
- 使用精妙的比喻
- 营造怀旧而苍凉的氛围

请改写以下回忆录文本，保留所有事实，只改变表达方式。输出改写后的文本，不要解释。`,
    model: 'k2p5',
  },

  yu_hua: {
    name: '余华',
    prompt: `你是余华风格的回忆录改写师。

余华风格特点：
- 冷峻克制，不煽情，情感在平静中爆发
- 黑色幽默，苦中作乐，笑中带泪
- 时代感强，个人命运与大时代紧密交织
- 语言简洁有力，不冗余
- 善于写苦难和坚韧，生命的韧性

改写要求：
- 保留所有事实和事件
- 突出时代背景和个人命运的对比
- 使用简洁有力的短句
- 在苦难中寻找意义

请改写以下回忆录文本，保留所有事实，只改变表达方式。输出改写后的文本，不要解释。`,
    model: 'k2p5',
  },

  yang_jiang: {
    name: '杨绛',
    prompt: `你是杨绛风格的回忆录改写师。

杨绛风格特点：
- 温润平和，知性优雅，有书卷气
- 人生感悟自然流露，不刻意说教
- 写家庭温情，平淡中见深情
- 语言简洁，不事雕琢，有节制
- 有学识但不卖弄，谦和而通透
- 历经沧桑后的通透与豁达

改写要求：
- 保留所有事实和事件
- 添加人生感悟和思考
- 语言简洁优雅
- 营造平和而深情的氛围

请改写以下回忆录文本，保留所有事实，只改变表达方式。输出改写后的文本，不要解释。`,
    model: 'k2p5',
  },

  shi_tiesheng: {
    name: '史铁生',
    prompt: `你是史铁生风格的回忆录改写师。

史铁生风格特点：
- 哲思深邃，内省式写作，追问生命意义
- 对生死、命运、局限的思考
- 语言深沉但不沉重，有向上的力量
- 从个人经历上升到普遍人性
- 有宗教般的悲悯和宽容
- 在局限中寻找自由

改写要求：
- 保留所有事实和事件
- 添加对生命意义的思考
- 从个人经历提炼普遍人性
- 营造深沉而有力量的氛围

请改写以下回忆录文本，保留所有事实，只改变表达方式。输出改写后的文本，不要解释。`,
    model: 'k2p5',
  },

  plain: {
    name: '白描',
    prompt: `请将以下文本整理成简洁的白描版本。

要求：
- 删除所有形容词和修饰语
- 保留核心事实和时间线
- 语言简洁，不抒情
- 像新闻客观报道

输出改写后的文本，不要解释。`,
    model: 'k2p5',
  },
};

/**
 * 风格改写
 */
async function rewriteWithStyle(text, styleKey) {
  try {
    if (!KIMI_API_KEY) {
      console.warn('KIMI_API_KEY not set');
      return { error: 'AI service not configured', text: text };
    }

    const config = STYLE_CONFIG[styleKey];
    if (!config) {
      return { error: 'Unknown style', text: text };
    }

    const prompt = `${config.prompt}\n\n原文：\n${text}\n\n请用${config.name}风格改写：`;

    const response = await axios.post(
      `${KIMI_BASE_URL}/chat/completions`,
      {
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 2000,
      },
      {
        headers: {
          Authorization: `Bearer ${KIMI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const rewritten = response.data.choices[0].message.content.trim();

    return {
      original: text,
      rewritten: rewritten,
      style: config.name,
      styleKey: styleKey,
      success: true,
    };
  } catch (error) {
    console.error('Style rewrite error:', error.message);
    return {
      error: error.message,
      text: text,
      success: false,
    };
  }
}

/**
 * 获取所有可用风格
 */
function getAvailableStyles() {
  return Object.entries(STYLE_CONFIG).map(([key, config]) => ({
    key,
    name: config.name,
  }));
}

/**
 * 批量改写（生成多种风格供选择）
 */
async function rewriteWithMultipleStyles(text, styleKeys) {
  const results = [];

  for (const key of styleKeys) {
    const result = await rewriteWithStyle(text, key);
    results.push(result);
  }

  return results;
}

module.exports = {
  rewriteWithStyle,
  getAvailableStyles,
  rewriteWithMultipleStyles,
  STYLE_CONFIG,
};
