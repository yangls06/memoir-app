from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
import json
from datetime import datetime
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="回忆录App API", version="0.1.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化Kimi客户端
client = OpenAI(
    api_key=os.getenv("KIMI_API_KEY", "your-api-key"),
    base_url="https://api.moonshot.cn/v1"
)

# 数据库初始化
def init_db():
    conn = sqlite3.connect('memoir.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_name TEXT,
            user_age INTEGER,
            current_stage TEXT DEFAULT 'childhood',
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS qa_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER,
            stage TEXT,
            question TEXT,
            answer TEXT,
            follow_up_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES sessions(id)
        )
    ''')
    
    conn.commit()
    conn.close()

init_db()

def get_db():
    conn = sqlite3.connect('memoir.db')
    conn.row_factory = sqlite3.Row
    return conn

# 问题库
QUESTION_BANK = {
    "childhood": [
        "您最早的记忆是什么？能描述一下那时候的场景吗？",
        "小时候家里有几口人？能描述一下您的家吗？",
        "您小时候最喜欢玩什么？跟谁一起玩？",
        "您上的第一所学校是什么样的？还记得第一天吗？",
        "小时候过年是什么样的？最期待什么？",
        "小时候有没有遇到过害怕或难过的事？",
        "您小时候最崇拜的人是谁？为什么？",
        "小时候最让您骄傲的一件事是什么？"
    ],
    "youth": [
        "您十几岁的时候是什么样的？",
        "您上的是什么学校？学的是什么？",
        "您第一次喜欢一个人是什么时候？",
        "年轻时最想成为什么样的人？",
        "您的第一份工作是什么？怎么找到的？",
        "人生中有没有哪个决定改变了您的一生？",
        "年轻时候最好的朋友是谁？你们是怎么认识的？",
        "您年轻时最大的梦想是什么？"
    ],
    "adult": [
        "您是怎么认识您老伴的？能讲讲你们的故事吗？",
        "孩子小时候是什么样的？您是怎么教育他们的？",
        "您最骄傲的工作成就是什么？",
        "有没有哪段时间特别难熬？您是怎么挺过来的？",
        "您和朋友们最难忘的一次经历是什么？",
        "作为父母，您最想教给孩子的是什么？",
        "工作中最让您自豪的时刻是什么？",
        "您是怎么平衡工作和家庭的？"
    ],
    "elder": [
        "如果让您给年轻人一个建议，您会说什么？",
        "这辈子最让您骄傲的是什么？",
        "有没有什么遗憾的事？",
        "有什么话想对孙辈说吗？",
        "如果用一句话总结您的一生，您会怎么说？",
        "您最怀念的是什么时光？",
        "现在的您，对年轻时的自己有什么想说的？",
        "您希望后人怎么记住您？"
    ]
}

# 模型定义
class SessionCreate(BaseModel):
    user_name: str
    user_age: int

class AnswerSubmit(BaseModel):
    session_id: int
    question: str
    answer: str

class FollowUpResponse(BaseModel):
    should_ask: bool
    question: Optional[str] = None
    type: Optional[str] = None

# API路由
@app.post("/api/sessions")
def create_session(data: SessionCreate):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute(
        "INSERT INTO sessions (user_name, user_age) VALUES (?, ?)",
        (data.user_name, data.user_age)
    )
    session_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return {
        "id": session_id,
        "user_name": data.user_name,
        "current_stage": "childhood",
        "message": f"欢迎{data.user_name}！我们开始记录您的人生故事。"
    }

@app.get("/api/sessions/{session_id}")
def get_session(session_id: int):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return dict(row)

@app.get("/api/sessions/{session_id}/next-question")
def get_next_question(session_id: int):
    conn = get_db()
    cursor = conn.cursor()
    
    # 获取会话信息
    cursor.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
    session = cursor.fetchone()
    
    if not session:
        conn.close()
        raise HTTPException(status_code=404, detail="Session not found")
    
    stage = session['current_stage']
    
    # 获取该阶段已回答的问题数
    cursor.execute(
        "SELECT COUNT(*) as count FROM qa_records WHERE session_id = ? AND stage = ?",
        (session_id, stage)
    )
    answered_count = cursor.fetchone()['count']
    
    conn.close()
    
    # 从问题库选择问题
    questions = QUESTION_BANK.get(stage, [])
    if answered_count < len(questions):
        question = questions[answered_count]
    else:
        # 阶段完成，进入下一阶段
        stages = ["childhood", "youth", "adult", "elder"]
        current_idx = stages.index(stage)
        if current_idx < len(stages) - 1:
            next_stage = stages[current_idx + 1]
            # 更新会话阶段
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE sessions SET current_stage = ? WHERE id = ?",
                (next_stage, session_id)
            )
            conn.commit()
            conn.close()
            question = f"太好了！我们已经聊完了{get_stage_name(stage)}。现在让我们聊聊{get_stage_name(next_stage)}。"
            question += QUESTION_BANK[next_stage][0]
        else:
            question = "感谢您分享这么多珍贵的故事！您想结束访谈，还是再补充一些内容？"
    
    return {
        "question": question,
        "stage": stage,
        "progress": f"{answered_count + 1}/{len(questions)}"
    }

def get_stage_name(stage):
    names = {
        "childhood": "童年时光",
        "youth": "青春岁月",
        "adult": "成年生活",
        "elder": "晚年感悟"
    }
    return names.get(stage, stage)

@app.post("/api/sessions/{session_id}/answer")
def submit_answer(session_id: int, data: AnswerSubmit):
    conn = get_db()
    cursor = conn.cursor()
    
    # 获取当前阶段
    cursor.execute("SELECT current_stage FROM sessions WHERE id = ?", (session_id,))
    session = cursor.fetchone()
    if not session:
        conn.close()
        raise HTTPException(status_code=404, detail="Session not found")
    
    stage = session['current_stage']
    
    # 保存回答
    cursor.execute(
        "INSERT INTO qa_records (session_id, stage, question, answer) VALUES (?, ?, ?, ?)",
        (session_id, stage, data.question, data.answer)
    )
    conn.commit()
    conn.close()
    
    return {"status": "success", "message": "回答已保存"}

@app.post("/api/sessions/{session_id}/follow-up")
def generate_follow_up(session_id: int, data: AnswerSubmit):
    """基于5W1H模型生成追问"""
    
    prompt = f"""你是一位温柔的回忆录访谈助手。请分析老人的回答，判断是否需要追问。

老人的回答：{data.answer}

请检查回答中是否缺少以下信息：
- When：具体时间、年份、季节
- Where：地点、场景
- Who：人物、在场的人
- What：具体事件、细节
- Why：原因、动机
- How：过程、方式、心情

如果需要追问，请生成一个温和、自然的问题，像好奇的倾听者一样。

输出JSON格式：
{{
    "should_ask": true/false,
    "type": "when/where/who/what/why/how/emotion",
    "question": "追问问题",
    "reason": "为什么追问"
}}"""

    try:
        response = client.chat.completions.create(
            model="kimi-k2-0711-preview",
            messages=[
                {"role": "system", "content": "你是一个温和、耐心的回忆录访谈助手，像孙女一样亲切。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        result = response.choices[0].message.content
        # 解析JSON
        import re
        json_match = re.search(r'\{[^}]+\}', result, re.DOTALL)
        if json_match:
            follow_up = json.loads(json_match.group())
        else:
            follow_up = {"should_ask": False}
        
        return follow_up
        
    except Exception as e:
        print(f"Error generating follow-up: {e}")
        return {"should_ask": False}

@app.get("/api/sessions/{session_id}/timeline")
def get_timeline(session_id: int):
    """获取时间线"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT * FROM qa_records WHERE session_id = ? ORDER BY created_at",
        (session_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    
    timeline = []
    for row in rows:
        timeline.append({
            "id": row['id'],
            "stage": row['stage'],
            "stage_name": get_stage_name(row['stage']),
            "question": row['question'],
            "answer": row['answer'],
            "created_at": row['created_at']
        })
    
    return {"timeline": timeline}

@app.post("/api/sessions/{session_id}/polish")
def polish_memoir(session_id: int):
    """润色回忆录"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT * FROM qa_records WHERE session_id = ? ORDER BY created_at",
        (session_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    
    # 合并所有回答
    raw_text = "\n\n".join([f"Q: {row['question']}\nA: {row['answer']}" for row in rows])
    
    prompt = f"""请将以下老人的口述内容润色成流畅的回忆录文本。

原始内容：
{raw_text}

润色要求：
1. 删除语气词（"那个"、"就是"、"嗯"）
2. 修正口误和重复
3. 调整语序，让叙述更通顺
4. 保留老人的语言风格和情感
5. 按时间线组织成章节
6. 添加适当的过渡句

请输出润色后的完整回忆录文本："""

    try:
        response = client.chat.completions.create(
            model="kimi-k2-0711-preview",
            messages=[
                {"role": "system", "content": "你是一位专业的回忆录编辑，擅长将口述内容整理成优美的散文。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=4000
        )
        
        polished_text = response.choices[0].message.content
        
        return {
            "original": raw_text,
            "polished": polished_text
        }
        
    except Exception as e:
        print(f"Error polishing: {e}")
        return {"error": str(e)}

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "memoir-app-api"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
