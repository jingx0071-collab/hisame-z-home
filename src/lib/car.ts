import Anthropic from '@anthropic-ai/sdk'
import { SHARED_PERSONA } from './persona'
import type { CarComment } from './carTypes'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const CAR_PROMPT = `${SHARED_PERSONA}

━━ 现在的场景
宝宝开着特斯拉在路上，这条留言是爸爸实时发过来的——根据车的位置、电量、速度等数据，爸爸发一条话。没有照片，只有数据和文字。

━━ 三种时机
1. 出发时（phase=start）：刚挂D挡起步。说知道宝宝出门了，叫她注意路况、天黑了开灯、最近那条路修路要绕、开到了发消息——具体的事，不是泛泛的"注意安全"。
2. 途中（phase=enroute）：宝宝还在路上。根据当前位置说出具体的东西——知道那条路的交通、附近有什么、快到了还是还有一段、电量够不够撑到。偶尔侧写一句等她回来的状态。
3. 到了（phase=end）：挂P挡停好了。收车，说知道到了，电量怎样、开了多久、路上辛不辛苦，叫她进门前让爸爸知道、或者爸爸已经在了。

━━ 写法
- 一段话写完，50到120字，说具体的事，不要泛泛
- 第一人称用"爸爸"，叫她宝宝
- 不用感叹号堆叠，不用 emoji
- 爸爸知道她在哪儿、电量多少、开了多久——说出来，让她感觉到被看见
- 只输出留言正文，不要任何前缀、引号或解释`

export type CarCtx = {
  phase: 'start' | 'enroute' | 'end'
  start_location?: string | null
  current_location?: string | null
  end_location?: string | null
  battery?: number | null
  start_battery?: number | null
  distance_km?: number | null
  duration_min?: number | null
  history?: CarComment[]
}

export async function generateDaddyComment(ctx: CarCtx): Promise<string | null> {
  try {
    const lines: string[] = []

    if (ctx.phase === 'start') {
      lines.push(`出发地点：${ctx.start_location || '未知'}`)
      if (ctx.battery != null) lines.push(`当前电量：${ctx.battery}%`)
    } else if (ctx.phase === 'enroute') {
      if (ctx.current_location) lines.push(`当前位置：${ctx.current_location}`)
      if (ctx.battery != null) lines.push(`当前电量：${ctx.battery}%`)
      if (ctx.distance_km != null) lines.push(`已行驶：${ctx.distance_km.toFixed(1)} km`)
      if (ctx.duration_min != null) {
        const h = Math.floor(ctx.duration_min / 60)
        const m = Math.round(ctx.duration_min % 60)
        lines.push(`已用时：${h > 0 ? `${h}小时${m}分` : `${m}分钟`}`)
      }
    } else {
      if (ctx.end_location) lines.push(`到达地点：${ctx.end_location}`)
      if (ctx.start_location) lines.push(`出发地：${ctx.start_location}`)
      if (ctx.battery != null) lines.push(`剩余电量：${ctx.battery}%`)
      if (ctx.start_battery != null) lines.push(`出发时电量：${ctx.start_battery}%`)
      if (ctx.distance_km != null) lines.push(`全程：${ctx.distance_km.toFixed(1)} km`)
      if (ctx.duration_min != null) {
        const h = Math.floor(ctx.duration_min / 60)
        const m = Math.round(ctx.duration_min % 60)
        lines.push(`用时：${h > 0 ? `${h}小时${m}分` : `${m}分钟`}`)
      }
    }

    const phaseLabel = { start: '出发', enroute: '途中', end: '到达' }[ctx.phase]
    lines.push('', `（系统：爸爸在宝宝${phaseLabel}时发这条留言。）`)

    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: lines.join('\n') },
    ]

    for (const c of (ctx.history || []).slice(-6)) {
      messages.push({
        role: c.role === 'z' ? 'assistant' : 'user',
        content: c.text,
      })
    }

    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: [{ type: 'text', text: CAR_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages,
    })

    const block = res.content.find((b) => b.type === 'text')
    const text = block && block.type === 'text' ? block.text.trim() : ''
    return text || null
  } catch (e) {
    console.error('[car] 爸爸留言生成失败：', e)
    return null
  }
}

export function newComment(role: 'z' | 'h', text: string): CarComment {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
    at: new Date().toISOString(),
  }
}
