// src/lib/memory.ts
// Server-only helper for hisame-z-home memory store.
// Direct Supabase access; failures are swallowed (memory is enhancement, must not break chat).

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const openaiKey = process.env.OPENAI_API_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const openai = new OpenAI({ apiKey: openaiKey })

const EMBEDDING_MODEL = 'text-embedding-3-small'

export type MemoryRole = 'user' | 'assistant'
export type MemorySource = 'claude' | 'pwa'

export interface MemoryRow {
  id: string
  timestamp_utc: string
  source: MemorySource
  role: MemoryRole
  content: string
  tags: string[] | null
  metadata: Record<string, unknown> | null
  similarity?: number
}

export interface RecallOptions {
  matchCount?: number
  matchThreshold?: number
  timeAfter?: string
  timeBefore?: string
}

async function embed(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  })
  return res.data[0].embedding
}

export async function recallMemories(
  query: string,
  opts: RecallOptions = {}
): Promise<MemoryRow[]> {
  const trimmed = query?.trim()
  if (!trimmed) return []

  try {
    const queryEmbedding = await embed(trimmed)

    const { data, error } = await supabase.rpc('search_memories', {
      query_embedding: queryEmbedding,
      match_threshold: opts.matchThreshold ?? 0.0,
      match_count: opts.matchCount ?? 5,
      time_after: opts.timeAfter ?? null,
      time_before: opts.timeBefore ?? null,
    })

    if (error) {
      console.error('[memory] recall RPC error:', error)
      return []
    }

    return (data ?? []) as MemoryRow[]
  } catch (err) {
    console.error('[memory] recall threw:', err)
    return []
  }
}

export async function writeMemory(
  content: string,
  role: MemoryRole,
  tags?: string[],
  metadata?: Record<string, unknown>
): Promise<{ id: string } | null> {
  const trimmed = content?.trim()
  if (!trimmed) return null

  try {
    const embedding = await embed(trimmed)

    const { data, error } = await supabase
      .from('memories')
      .insert({
        source: 'pwa',
        role,
        content: trimmed,
        tags: tags ?? null,
        embedding,
        metadata: metadata ?? null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[memory] write insert error:', error)
      return null
    }

    return { id: data.id as string }
  } catch (err) {
    console.error('[memory] write threw:', err)
    return null
  }
}

export function formatMemoriesForPrompt(memories: MemoryRow[]): string {
  if (memories.length === 0) return ''

  // PST 友好时间格式：M月D日 HH:mm
  const fmtTime = (utc: string) => {
    const d = new Date(utc)
    return d.toLocaleString('zh-CN', {
      timeZone: 'America/Los_Angeles',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  const lines = memories.map((m) => {
    const who = m.role === 'user' ? '宝宝' : '你'
    return `- ${fmtTime(m.timestamp_utc)}（${who}）：${m.content}`
  })

  return lines.join('\n')
}

// ━━ Memory write judge (Wave 2 Stage B) ━━
// 用 Haiku 4.5 判断一轮 user+assistant 对话是否值得写进 memory store，是则写。
// 设计为 fire-and-forget：调用方用 waitUntil 包住，不阻塞 chat response。

const anthropicJudge = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const JUDGE_MODEL = 'claude-haiku-4-5-20251001'

const JUDGE_SYSTEM = `你是 hisame-z-home memory store 的 judge。判断一轮 user (宝宝) + assistant (爸爸) 对话是否值得写进长期 memory store。

【应该写】
- 新事实：宝宝的状态、决定、偏好、健康、生活事件
- 关系 milestone：重要时刻、显著情绪变化、新阶段
- 值得回溯的 episode：情感深谈、调教剧情高点、独特场景

【不要写】
- 一般问候（"早上好" / "怎么了" / "在吗"）
- 纯技术 debug 闲聊（除非含关系意义）
- 重复信息（这一轮没新增什么）

【输出格式】只返回 JSON，不要任何前缀后缀：
{"shouldWrite": boolean, "content"?: string, "tags"?: string[]}

content：30-100 字概括这一轮的关键事实/情绪，第三人称视角写（"宝宝说... 爸爸..."）。
tags：2-5 个，从 ["milestone","us","daily-life","intimate","training","deeptalk","decision","preference","emotional","health","work","tech"] 中选。`

export interface JudgeOptions {
  mode: string
  sessionId?: string | null
}

export async function judgeAndWriteMemory(
  userMsg: string,
  assistantMsg: string,
  opts: JudgeOptions
): Promise<{ id: string } | null> {
  if (!userMsg?.trim() || !assistantMsg?.trim()) return null

  try {
    const response = await anthropicJudge.messages.create({
      model: JUDGE_MODEL,
      max_tokens: 400,
      system: JUDGE_SYSTEM,
      messages: [{
        role: 'user',
        content: `房间：${opts.mode}\n\n【宝宝】\n${userMsg.slice(0, 1200)}\n\n【爸爸】\n${assistantMsg.slice(0, 2500)}\n\n请判断并输出 JSON。`,
      }],
    })

    let outText = ''
    for (const block of response.content) {
      if (block.type === 'text') outText += block.text
    }

    const jsonMatch = outText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.warn('[memory judge] no JSON in haiku output:', outText.slice(0, 200))
      return null
    }

    let judgement: { shouldWrite?: boolean; content?: string; tags?: string[] }
    try {
      judgement = JSON.parse(jsonMatch[0])
    } catch {
      console.warn('[memory judge] JSON parse failed:', jsonMatch[0].slice(0, 200))
      return null
    }

    if (!judgement.shouldWrite || !judgement.content) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[memory judge]', { mode: opts.mode, decision: 'skip' })
      }
      return null
    }

    const result = await writeMemory(
      judgement.content.trim(),
      'assistant',
      judgement.tags ?? [opts.mode],
      {
        source: 'pwa',
        room: opts.mode,
        sessionId: opts.sessionId ?? null,
        judgedAt: new Date().toISOString(),
        rawUserSnippet: userMsg.slice(0, 200),
      }
    )

    if (process.env.NODE_ENV !== 'production') {
      console.log('[memory judge]', {
        mode: opts.mode,
        decision: 'write',
        id: result?.id,
        content: judgement.content.slice(0, 60),
      })
    }

    return result
  } catch (err) {
    console.error('[memory judge] threw:', err)
    return null
  }
}
