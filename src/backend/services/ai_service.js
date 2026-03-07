const axios = require('axios');

// Kimi API 配置
const KIMI_BASE_URL = 'https://api.kimi.com/coding';
const KIMI_API_KEY = process.env.KIMI_API_KEY;

// 5W1H 追问 Prompt
const FOLLOWUP_SYSTEM_PROMPT = `你是"时光回忆录"AI访谈助手，正在帮一位老人记录人生故事。

你的任务：
1. 分析老人的回答，提取关键信息（人物、时间、地点、事件、原因、方式、心情、意义）
2. 识别缺失或模糊的信息维度
3. 生成2-3个温暖、简短的追问问题，帮助老人补充细节

追问原则：
- 像晚辈请教长辈的语气（"您能说说...吗？""那...呢？"）
- 每句不超过15个字
- 一次只问1-2个问题
- 如果故事已经完整，不必追问
- 避免敏感话题（政治、宗教、家庭矛盾）

5W1H+心情+思考模型：
- Who：当时还有谁在场？人物关系如何？
- What：具体发生了什么？有什么细节？
- When：具体是哪一年？什么季节？什么时间？
- Where：在哪里？环境如何？
- Why：为什么会这样？当时的背景？
- How：你是怎么做的？过程如何？
- 心情：当时什么感受？情绪如何？
- 思考：这件事对你意味着什么？有什么影响？

输出格式（JSON）：
{
  "analysis": "简要分析老人讲述的内容",
  "missing_dimensions": ["缺失的维度列表"],
  "questions": ["追问问题1", "追问问题2"]
}`;

/**
 * 生成AI追问问题
 */
async function generateFollowUpQuestions(answer, topic, question) {
  try {
    if (!KIMI_API_KEY) {
      console.warn('KIMI_API_KEY not set, using fallback questions');
      return getFallbackQuestions(answer);
    }

    const userPrompt = `主题：${topic}
问题：${question}
老人回答：${answer}

请分析老人的回答，基于5W1H+心情+思考模型，生成温暖的追问问题。`;

    const response = await axios.post(
      `${KIMI_BASE_URL}/chat/completions`,
      {
        model: 'k2p5',
        messages: [
          { role: 'system', content: FOLLOWUP_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${KIMI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiResponse = response.data.choices[0].message.content;
    
    // 尝试解析JSON
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          questions: parsed.questions || parsed.follow_up_questions || [],
          analysis: parsed.analysis || '',
          missing_dimensions: parsed.missing_dimensions || []
        };
      }
    } catch (e) {
      console.log('JSON parse failed, using text extraction');
    }

    // 如果JSON解析失败，从文本中提取问题
    const questions = extractQuestionsFromText(aiResponse);
    return {
      questions: questions.slice(0, 3),
      analysis: '',
      missing_dimensions: []
    };

  } catch (error) {
    console.error('AI follow-up generation failed:', error.message);
    return getFallbackQuestions(answer);
  }
}

/**
 * 从文本中提取问题
 */
function extractQuestionsFromText(text) {
  // 匹配中文问号结尾的句子
  const questionPattern = /[^。？！\n]+[？?]/g;
  const matches = text.match(questionPattern) || [];
  
  // 过滤并清理
  return matches
    .map(q => q.trim())
    .filter(q => q.length > 5 && q.length < 50)
    .slice(0, 3);
}

/**
 * 备用追问问题（当AI不可用时）
 */
function getFallbackQuestions(answer) {
  const questions = [];
  const answerLower = answer.toLowerCase();
  
  // 根据回答内容判断缺失的信息
  if (!answer.match(/\d{4}/) && !answer.match(/(年|岁)/)) {
    questions.push("那是哪一年呢？");
  }
  
  if (!answer.match(/(人|谁|朋友|家人|妈妈|爸爸)/)) {
    questions.push("当时还有谁在场？");
  }
  
  if (!answer.match(/(地方|哪里|家|学校|村|城)/)) {
    questions.push("那是在哪里呢？");
  }
  
  if (!answer.match(/(感觉|心情|开心|难过|激动)/)) {
    questions.push("当时心情怎么样？");
  }
  
  if (answer.length < 50) {
    questions.push("能再说详细一点吗？");
  }
  
  return {
    questions: questions.slice(0, 3),
    analysis: '基于规则的追问',
    missing_dimensions: []
  };
}

/**
 * 润色文本（去除口语化）
 */
async function polishText(rawText) {
  try {
    if (!KIMI_API_KEY) {
      return fallbackPolish(rawText);
    }

    const prompt = `请将以下老人的口语化讲述整理成流畅的白描文本：

处理规则：
1. 删除语气词（"那个""就是""嗯""啊"）
2. 删除重复内容
3. 补充省略的主语
4. 调整语序使其通顺
5. 保留老人的用词习惯和情感
6. 不添加原话中没有的内容

原始讲述：
${rawText}

请输出整理后的白描文本（只输出文本，不加解释）：`;

    const response = await axios.post(
      `${KIMI_BASE_URL}/chat/completions`,
      {
        model: 'k2p5',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${KIMI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content.trim();

  } catch (error) {
    console.error('Polish failed:', error.message);
    return fallbackPolish(rawText);
  }
}

/**
 * 备用润色
 */
function fallbackPolish(text) {
  return text
    .replace(/那个[，,]?/g, '')
    .replace(/就是[，,]?/g, '')
    .replace(/嗯[，,]?/g, '')
    .replace(/啊[，,]?/g, '')
    .replace(/[\.]{2,}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

module.exports = {
  generateFollowUpQuestions,
  polishText
};
