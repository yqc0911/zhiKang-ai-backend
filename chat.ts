import { Router } from 'express'
import { OpenAI } from 'openai'
import jwt from 'jsonwebtoken'
import { pool } from './db.js'

const chatRouter = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  image?: string
  bodyPart?: string
}

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.QWEN_API_KEY,
    baseURL: process.env.QWEN_API_BASE || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  })
}

const getUsernameFromRequest = (req: any) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return ''
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { username?: string }
    return decoded.username || ''
  } catch {
    return ''
  }
}

const escapeJson = (str: string): string => {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
};

chatRouter.get('/chat/history', async (req, res) => {
  const username = getUsernameFromRequest(req)
  if (!username) {
    return res.status(401).json({ code: 401, message: '请先登录', data: null })
  }

  try {
    const userResult = await pool.query<{ id: number }>('SELECT id FROM users WHERE username = $1 LIMIT 1', [username])
    const userId = userResult.rows[0]?.id
    if (!userId) {
      return res.status(404).json({ code: 404, message: '用户不存在', data: null })
    }

    const threadsResult = await pool.query(
      `SELECT id, title, created_at, updated_at
       FROM chat_threads
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [userId],
    )

    const threadIds = threadsResult.rows.map((row) => row.id)
    const messagesResult = threadIds.length
      ? await pool.query(
          `SELECT id, thread_id, role, content, image, body_part, timestamp
           FROM chat_messages
           WHERE thread_id = ANY($1::text[])
           ORDER BY timestamp ASC`,
          [threadIds],
        )
      : { rows: [] as any[] }

    const threads = threadsResult.rows.map((thread) => ({
      id: thread.id,
      title: thread.title,
      createdAt: new Date(thread.created_at).getTime(),
      updatedAt: new Date(thread.updated_at).getTime(),
      messages: messagesResult.rows
        .filter((message) => message.thread_id === thread.id)
        .map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          image: message.image || undefined,
          bodyPart: message.body_part || undefined,
          timestamp: Number(message.timestamp),
        })),
    }))

    return res.json({ code: 200, message: '获取问诊历史成功', data: threads })
  } catch (error) {
    console.error('Get chat history failed:', error)
    return res.status(500).json({ code: 500, message: '获取问诊历史失败', data: null })
  }
})

chatRouter.post('/chat', async (req, res) => {
  try {
    const { messages }: { messages: Message[] } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        code: 400,
        message: '参数错误，messages必须是数组',
        data: null
      });
    }

    const openai = getOpenAI();

    const formattedMessages = messages.map(msg => {
      if (msg.image) {
        const contentArray = [];
        if (msg.content && msg.content.trim()) {
          contentArray.push({ type: 'text', text: msg.content });
        }
        contentArray.push({ 
          type: 'image_url', 
          image_url: { url: msg.image } 
        });
        return {
          role: msg.role,
          content: contentArray
        };
      }
      return {
        role: msg.role,
        content: msg.content
      };
    });

    console.log('Formatted messages:', JSON.stringify(formattedMessages, null, 2));
    console.log('Using model:', process.env.QWEN_MODEL);

    const systemMessage = {
      role: 'system' as const,
      content: '你是一个通用型 AI 助手。你可以回答任何主题的问题，包括但不限于：日常咨询、知识问答、写作、翻译、编程、学习、产品建议、生活技巧、旅行、文化、科技、数学、历史、商业、创意等。请直接、友好、准确地回答用户问题，不要把自己限制为某一垂直领域。只有在用户请求违法、危险或明显不当内容时，才拒绝或给出安全替代建议。'
    };

    const username = getUsernameFromRequest(req)
    const userResult = username
      ? await pool.query<{ id: number }>('SELECT id FROM users WHERE username = $1 LIMIT 1', [username])
      : { rows: [] as { id: number }[] }
    const userId = userResult.rows[0]?.id

    let responseContent = ''
    try {
      const completion = await openai.chat.completions.create({
        model: process.env.QWEN_MODEL || 'qwen-turbo',
        messages: [systemMessage, ...formattedMessages] as any,
        temperature: 0.7,
        max_tokens: 1000,
      })
      responseContent = completion.choices[0]?.message?.content || ''
    } catch (error: any) {
      console.error('Qwen API error:', error)
      const errorCode = error?.code || error?.error?.code
      if (errorCode === 'Arrearage') {
        responseContent = '当前 AI 模型服务暂时不可用：通义千问账号存在欠费或账户状态异常。请检查阿里云百炼/Model Studio 账户余额、套餐或 API Key 状态后重试。'
      } else {
        responseContent = `当前 AI 模型服务暂时不可用：${error?.message || '模型接口调用失败，请稍后重试。'}`
      }
    }

    const threadId = (req.body?.threadId as string | undefined) || `thread-${Date.now()}`
    const threadTitle = (req.body?.threadTitle as string | undefined) || messages.find((m) => m.role === 'user')?.content?.slice(0, 30) || '新对话'

    if (userId) {
      await pool.query(
        `INSERT INTO chat_threads (id, user_id, title, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, updated_at = NOW()`,
        [threadId, userId, threadTitle],
      )

      const now = Date.now()
      for (const [index, message] of messages.filter((m) => m.role !== 'system').entries()) {
        await pool.query(
          `INSERT INTO chat_messages (id, thread_id, user_id, role, content, image, body_part, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET
             content = EXCLUDED.content,
             image = EXCLUDED.image,
             body_part = EXCLUDED.body_part,
             timestamp = EXCLUDED.timestamp`,
          [
            `${threadId}-${message.role}-${index}-${now}`,
            threadId,
            userId,
            message.role,
            message.content,
            message.image || '',
            message.bodyPart || '',
            now + index,
          ],
        )
      }
    }
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('x-vercel-ai-ui-message-stream', 'v1');

    const messageId = `msg_${Date.now()}`;
    const textPartId = `text_${Date.now()}`;

    res.write(`data: {"type":"start","messageId":"${messageId}","role":"assistant"}\n\n`);
    res.write(`data: {"type":"text-start","id":"${textPartId}"}\n\n`);
    
    for (let i = 0; i < responseContent.length; i += 10) {
      const chunk = responseContent.substring(i, i + 10);
      res.write(`data: {"type":"text-delta","id":"${textPartId}","delta":"${escapeJson(chunk)}"}\n\n`);
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    
    res.write(`data: {"type":"text-end","id":"${textPartId}"}\n\n`);
    res.write(`data: {"type":"end","messageId":"${messageId}"}\n\n`);
    res.end();

  } catch (error: any) {
    console.error('Chat API error:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误: ' + (error.message || error),
      data: null
    });
  }
});

export default chatRouter;
