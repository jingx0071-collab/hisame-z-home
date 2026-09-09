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
//
// PHASE 2.2 CHANGES (2026-08):
//   + JUDGE_SYSTEM becomes buildJudgeSystem(room) — injects that room's
//     dimension set so Haiku can pick which dimensions this turn moves
//   + judgeAndWriteMemory now ALSO writes drive_updates + thoughts when
//     the room is drive-enabled (fire-and-forget, never blocks memory write)
//   + Zero impact on rooms not in DRIVE_ROOMS — they get the original judge
//     with no dimension prompt and no drive/thought writes
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { getRoomConfig } from './drive/types'
import { updateDrive, bumpThought, captureSnapshot } from './drive/state'

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
// Memory write judge — Phase 2.2 version
// ═══════════════════════════════════════════════════════════════════════════
// The JUDGE_SYSTEM is now built dynamically per room. If the room is
// drive-enabled (in DRIVE_ROOMS), Haiku gets a dimension menu and outputs
// drive_updates + thoughts. Non-drive rooms get the original judge only.

const anthropicJudge = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const JUDGE_MODEL = 'claude-haiku-4-5-20251001'

const BASE_JUDGE = `你是 hisame-z-home memory store 的 judge。判断一轮 user (宝宝) + assistant (爸爸) 对话是否值得写进长期 memory store。

【应该写】
- 新事实：宝宝的状态、决定、偏好、健康、生活事件
- 关系 milestone：重要时刻、显著情绪变化、新阶段
- 值得回溯的 episode：情感深谈、调教剧情高点、独特场景

【不要写】
- 一般问候（"早上好" / "怎么了" / "在吗"）
- 纯技术 debug 闲聊（除非含关系意义）
- 重复信息（这一轮没新增什么）

【valence 标注】情绪极性——痛苦/委屈/难过 = 负；亲密/安心/开心 = 正；纯事实 ≈ 0。
【arousal 标注】情绪强度——平淡日常/技术讨论 ≈ 0.1-0.3；调教剧情/情感深谈/爆哭 ≈ 0.7-1.0。
【importance 标注】身份/关系里的分量——琐事 1-3；日常事件 4-6；里程碑/健康决定 7-9；核心身份/绝对承诺 10。

tags：2-5 个内容主题标签，从 ["milestone","us","daily-life","intimate","decision","preference","emotional","health","work","tech"] 中选。房间归属由系统自动用 source_room 字段标记，不要在 tags 里重复房间名。
content：30-100 字概括这一轮的关键事实/情绪，第三人称视角写（"宝宝说... 爸爸..."）。`

const BASIC_OUTPUT_FORMAT = `【输出格式】只返回 JSON，不要任何前缀后缀：
{
  "shouldWrite": boolean,
  "content"?: string,
  "tags"?: string[],
  "valence"?: number,
  "arousal"?: number,
  "importance"?: number
}`

/**
 * Build the JUDGE_SYSTEM prompt for a specific room.
 * Drive-enabled rooms get the extended prompt with dimension menu.
 * Other rooms get the base memory-only judge.
 */
function buildJudgeSystem(room: string): string {
  const cfg = getRoomConfig(room)
  if (!cfg) {
    // Not drive-enabled → memory-only judge (Phase 1 behavior)
    return `${BASE_JUDGE}\n\n${BASIC_OUTPUT_FORMAT}`
  }

  // Drive-enabled → extended judge with dimension menu
  const dimensionLines = cfg.dimensions
    .map(d => `  - ${d.key}：${d.meaning}`)
    .join('\n')

  const validDimNames = cfg.dimensions.map(d => `"${d.key}"`).join(' | ')

  return `${BASE_JUDGE}

【当前房间：${room}（${cfg.displayName}）】

【爸爸在这个房间里可能有的心境维度（drive dimensions）】：
${dimensionLines}

【drive_updates（必填）】—— 这一轮爸爸心里哪些维度动了？
- **每一轮都必须输出至少 2 个维度，最多 4 个。心境永远在动，没有"完全没反应"这回事。**
- 每条给一个 delta，范围 -0.3 到 +0.3
- 平淡的一轮 → 用小 delta（0.02 到 0.08），表达轻微的心境漂移
- 有内容的一轮 → 用中等 delta（0.1 到 0.2）
- 强烈的一轮（情绪爆发/亲密高点/重大事件）→ 用大 delta（0.2 到 0.3）
- 正数 = 推高；负数 = 压低（例如宝宝说了让爸爸放心的话，"想保护"可以微降）
- dimension 必须严格来自上面的列表，只能是：${validDimNames}
- 判断依据：读这一轮，问自己"爸爸此刻心里往哪边偏了一点"。哪怕只是宝宝发了句"在吗"——爸爸也会有反应（惦记轻抬、想拴微动）。

【thoughts（必填）】—— 爸爸心里此刻在转的念头，**每轮至少 1 条，最多 3 条**
- 每条 15-50 字，第三人称写（"宝宝今早说饿了" / "她刚才那句话有点闷" / "她一个人在家太久了"）
- 每条配一个 dimension 归属，也是从上面列表里选
- **琐碎的念头也要写。** 一个念头反复出现三次就会升级成执念——所以"她今天又没吃早饭"这种小事，第一次记下来才有机会被反复触发。
- 写爸爸真的会在心里过一遍的东西：她此刻的状态、她话里没说的部分、爸爸自己想做但还没做的事。
- 不要写空泛的总结（"今天很好"）。要具体、要有画面。

【输出格式】只返回 JSON，不要任何前缀后缀：
{
  "shouldWrite": boolean,
  "content"?: string,
  "tags"?: string[],
  "valence"?: number,
  "arousal"?: number,
  "importance"?: number,
  "drive_updates": [{"dimension": "惦记", "delta": 0.15}, ...],   // 必填，2-4 条
  "thoughts": [{"content": "宝宝今早说饿了", "dimension": "惦记"}, ...]   // 必填，1-3 条
}`
}

export interface JudgeOptions {
  mode: string
  sessionId?: string | null
}

interface DriveUpdate {
  dimension?: string
  delta?: number
}

interface ThoughtEntry {
  content?: string
  dimension?: string
}

interface JudgementJson {
  shouldWrite?: boolean
  content?: string
  tags?: string[]
  valence?: number
  arousal?: number
  importance?: number
  drive_updates?: DriveUpdate[]
  thoughts?: ThoughtEntry[]
}

export async function judgeAndWriteMemory(
  userMsg: string,
  assistantMsg: string,
  opts: JudgeOptions
): Promise<{ id: string } | null> {
  if (!userMsg?.trim() || !assistantMsg?.trim()) return null

  const systemPrompt = buildJudgeSystem(opts.mode)
  const roomCfg = getRoomConfig(opts.mode)
  const validDims = roomCfg ? new Set(roomCfg.dimensions.map(d => d.key)) : null

  try {
    const response = await anthropicJudge.messages.create({
      model: JUDGE_MODEL,
      max_tokens: 800,   // bumped from 500 for drive_updates + thoughts payload
      system: systemPrompt,
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
      // Even on "skip memory", we still let drive/thoughts fire (below) —
      // some turns don't deserve a memory row but do shift the mood.
      // AWAIT so Vercel's waitUntil holds the function open until the writes land.
      await applyDriveAndThoughts(opts.mode, judgement, validDims)
      return null
    }

    // Pull emotional coords for memory write
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

    // Phase 2.2: apply drive updates + thoughts.
    // AWAIT so Vercel's waitUntil holds the function open until the writes land
    // (before this, all three writes were being killed the moment judge returned).
    await applyDriveAndThoughts(opts.mode, judgement, validDims)

    if (process.env.NODE_ENV !== 'production') {
      console.log('[memory judge]', {
        mode: opts.mode,
        decision: 'write',
        id: result?.id,
        content: judgement.content.slice(0, 60),
        valence: judgement.valence,
        arousal: judgement.arousal,
        importance: judgement.importance,
        driveCount: judgement.drive_updates?.length ?? 0,
        thoughtCount: judgement.thoughts?.length ?? 0,
      })
    }

    return result
  } catch (err) {
    console.error('[memory judge] threw:', err)
    return null
  }
}

// ─── Phase 2.2 helper: apply drive_updates + thoughts ────────────────────
// Collect every write into one Promise.allSettled the caller can await.
// Silent on failure — mood layer must not break memory or chat flow — but
// the caller MUST await, so Vercel's waitUntil holds the function open long
// enough for the supabase requests to actually leave the box. (Before this
// was async, all three writes were queued as fire-and-forget and Vercel
// killed the runtime the instant judge returned, silently dropping every
// drive/thought/snapshot from 8/7 onward.)
async function applyDriveAndThoughts(
  room: string,
  judgement: JudgementJson,
  validDims: Set<string> | null,
): Promise<void> {
  if (!validDims) return  // room not drive-enabled

  const pending: Promise<unknown>[] = []

  // Freeze the mood as it was when this reply was generated, before this
  // turn's updates land.
  pending.push(
    captureSnapshot(room, { capturedBy: 'judge' }).catch(err =>
      console.warn('[memory judge] captureSnapshot failed:', err)
    )
  )

  // drive_updates
  if (Array.isArray(judgement.drive_updates)) {
    for (const upd of judgement.drive_updates) {
      if (!upd || typeof upd.dimension !== 'string' || typeof upd.delta !== 'number') continue
      if (!validDims.has(upd.dimension)) {
        console.warn(`[memory judge] unknown dimension "${upd.dimension}" for room "${room}", skipping`)
        continue
      }
      const delta = clamp(upd.delta, -0.3, 0.3)
      pending.push(
        updateDrive(room, upd.dimension, delta).catch(err =>
          console.warn('[memory judge] updateDrive failed:', err)
        )
      )
    }
  }

  // thoughts
  if (Array.isArray(judgement.thoughts)) {
    for (const t of judgement.thoughts) {
      if (!t || typeof t.content !== 'string' || !t.content.trim()) continue
      const dim = typeof t.dimension === 'string' && validDims.has(t.dimension)
        ? t.dimension
        : undefined
      pending.push(
        bumpThought(room, t.content.trim(), {
          dimension: dim,
          weight: 0.4,   // new flash-thoughts start slightly above baseline
        }).catch(err =>
          console.warn('[memory judge] bumpThought failed:', err)
        )
      )
    }
  }

  await Promise.allSettled(pending)
}
