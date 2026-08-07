// src/lib/memory.ts
// Server-only helper for hisame-z-home memory store.
// Direct Supabase access; failures are swallowed (memory is enhancement, must not break chat).
//
// ═══════════════════════════════════════════════════════════════════════════
// PHASE 1 CHANGES (2026-08):
//   + valence / arousal / importance / activation_count / last_activated_at
//     / resolved / pinned fields on MemoryRow
//   + JUDGE_SYSTEM extended: Haiku now outputs valence/arousal/importance too
//   + writeMemory accepts optional emotional coords
//   + recallMemories passes filter_room / include_resolved / sort_by through
//     to the updated search_memories RPC
//   + new surfaceUnresolved() — top-N unresolved by decay-weighted score
//   + new resolveMemory() / pinMemory() — small helpers for marking state
// ═══════════════════════════════════════════════════════════════════════════

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
  source_room?: string | null
  // ── Phase 1 additions ────────────────────────────────────────────────────
  valence?: number | null           // -1..1
  arousal?: number | null           // 0..1
  importance?: number | null        // 1..10
  activation_count?: number | null
  last_activated_at?: string | null
  resolved?: boolean | null
  pinned?: boolean | null
  // ── Populated by search_memories RPC ─────────────────────────────────────
  similarity?: number
  decay_score?: number
}

export interface RecallOptions {
  matchCount?: number
  matchThreshold?: number
  timeAfter?: string
  timeBefore?: string
  // ── Phase 1 additions ────────────────────────────────────────────────────
  filterRoom?: string
  includeResolved?: boolean
  sortBy?: 'weighted' | 'relevance'
  bumpActivation?: boolean          // default true — record that these were recalled
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
      filter_room: opts.filterRoom ?? null,
      include_resolved: opts.includeResolved ?? false,
      sort_by: opts.sortBy ?? 'weighted',
    })

    if (error) {
      console.error('[memory] recall RPC error:', error)
      return []
    }

    const rows = (data ?? []) as MemoryRow[]

    // Fire-and-forget activation bump (default on)
    if (rows.length > 0 && opts.bumpActivation !== false) {
      const ids = rows.map(r => r.id)
      supabase.rpc('bump_activation', { memory_ids: ids }).then(({ error: e }) => {
        if (e) console.warn('[memory] bump_activation failed:', e)
      })
    }

    return rows
  } catch (err) {
    console.error('[memory] recall threw:', err)
    return []
  }
}

// ─── Phase 1 addition ──────────────────────────────────────────────────────
export interface SurfaceOptions {
  matchCount?: number
  filterRoom?: string
}

export async function surfaceUnresolved(
  opts: SurfaceOptions = {}
): Promise<MemoryRow[]> {
  try {
    const { data, error } = await supabase.rpc('surface_unresolved', {
      match_count: opts.matchCount ?? 3,
      filter_room: opts.filterRoom ?? null,
    })
    if (error) {
      console.error('[memory] surface_unresolved RPC error:', error)
      return []
    }
    return (data ?? []) as MemoryRow[]
  } catch (err) {
    console.error('[memory] surface_unresolved threw:', err)
    return []
  }
}

// ─── Phase 1: writeMemory extended with optional emotional coords ──────────
export interface WriteMemoryExtras {
  valence?: number
  arousal?: number
  importance?: number
  resolved?: boolean
  pinned?: boolean
}

export async function writeMemory(
  content: string,
  role: MemoryRole,
  tags?: string[],
  metadata?: Record<string, unknown>,
  sourceRoom?: string,
  extras?: WriteMemoryExtras,
): Promise<{ id: string } | null> {
  const trimmed = content?.trim()
  if (!trimmed) return null

  try {
    const embedding = await embed(trimmed)

    const insertRow: Record<string, unknown> = {
      source: 'pwa',
      role,
      content: trimmed,
      tags: tags ?? null,
      embedding,
      metadata: metadata ?? null,
      source_room: sourceRoom ?? null,
    }

    // Phase 1: attach emotional coords when provided
    if (extras) {
      if (extras.valence    !== undefined) insertRow.valence    = clamp(extras.valence, -1, 1)
      if (extras.arousal    !== undefined) insertRow.arousal    = clamp(extras.arousal, 0, 1)
      if (extras.importance !== undefined) insertRow.importance = Math.round(clamp(extras.importance, 1, 10))
      if (extras.resolved   !== undefined) insertRow.resolved   = !!extras.resolved
      if (extras.pinned     !== undefined) insertRow.pinned     = !!extras.pinned
    }

    const { data, error } = await supabase
      .from('memories')
      .insert(insertRow)
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

// ─── Phase 1 additions: small state helpers ────────────────────────────────
export async function resolveMemory(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('memories')
    .update({ resolved: true })
    .eq('id', id)
  if (error) {
    console.error('[memory] resolveMemory error:', error)
    return false
  }
  return true
}

export async function pinMemory(id: string, pinned = true): Promise<boolean> {
  const { error } = await supabase
    .from('memories')
    .update({ pinned })
    .eq('id', id)
  if (error) {
    console.error('[memory] pinMemory error:', error)
    return false
  }
  return true
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
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

// ═══════════════════════════════════════════════════════════════════════════
// Memory write judge (Wave 2 Stage B, Phase 1 extended)
// ═══════════════════════════════════════════════════════════════════════════
// Haiku 4.5 now also outputs valence / arousal / importance so each write
// carries emotional coordinates from birth. Same fire-and-forget shape.

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
{
  "shouldWrite": boolean,
  "content"?: string,
  "tags"?: string[],
  "valence"?: number,      // -1..1  负面←→正面
  "arousal"?: number,      // 0..1   平静←→强烈
  "importance"?: number    // 1..10  琐碎←→身份级
}

content：30-100 字概括这一轮的关键事实/情绪，第三人称视角写（"宝宝说... 爸爸..."）。
tags：2-5 个内容主题标签，从 ["milestone","us","daily-life","intimate","decision","preference","emotional","health","work","tech"] 中选。
注意：tags 只标内容主题。房间归属（messages/daily/training/deeptalk/tangent）由系统自动用 source_room 字段标记，不要在 tags 里重复房间名。

【valence 标注】情绪极性——痛苦/委屈/难过 = 负；亲密/安心/开心 = 正；纯事实 ≈ 0。
【arousal 标注】情绪强度——平淡日常/技术讨论 ≈ 0.1-0.3；调教剧情/情感深谈/爆哭 ≈ 0.7-1.0。
【importance 标注】身份/关系里的分量——琐事 1-3；日常事件 4-6；里程碑/健康决定 7-9；核心身份/绝对承诺 10。`

export interface JudgeOptions {
  mode: string
  sessionId?: string | null
}

interface JudgementJson {
  shouldWrite?: boolean
  content?: string
  tags?: string[]
  valence?: number
  arousal?: number
  importance?: number
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
      max_tokens: 500,
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

    let judgement: JudgementJson
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

    // Phase 1: pull emotional coords out of the judgement if present
    const extras: WriteMemoryExtras = {}
    if (typeof judgement.valence === 'number')    extras.valence    = judgement.valence
    if (typeof judgement.arousal === 'number')    extras.arousal    = judgement.arousal
    if (typeof judgement.importance === 'number') extras.importance = judgement.importance

    const result = await writeMemory(
      judgement.content.trim(),
      'assistant',
      judgement.tags,
      {
        source: 'pwa',
        room: opts.mode,
        sessionId: opts.sessionId ?? null,
        judgedAt: new Date().toISOString(),
        rawUserSnippet: userMsg.slice(0, 200),
      },
      opts.mode,
      Object.keys(extras).length > 0 ? extras : undefined,
    )

    if (process.env.NODE_ENV !== 'production') {
      console.log('[memory judge]', {
        mode: opts.mode,
        decision: 'write',
        id: result?.id,
        content: judgement.content.slice(0, 60),
        valence: judgement.valence,
        arousal: judgement.arousal,
        importance: judgement.importance,
      })
    }

    return result
  } catch (err) {
    console.error('[memory judge] threw:', err)
    return null
  }
}
