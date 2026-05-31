import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import rawEntries from '@/data/memory_import.json'

// GET /api/memory/import?token=hisame
// 把 src/data/memory_import.json 里的精选回忆批量导入 memories 表。
// - 批量 embed（OpenAI 一次吃整组）
// - 回填 timestamp_utc（fiction 时间线）
// - 按 metadata.batch 幂等：某一波已存在则跳过，重复跑安全；以后追加新 batch 只灌新的。

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
const EMBEDDING_MODEL = 'text-embedding-3-small'

type Entry = {
  content: string
  role: 'user' | 'assistant'
  tags: string[]
  ts: string
  from: string
  batch: string
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (token !== 'hisame') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const all = rawEntries as Entry[]
  const batches = Array.from(new Set(all.map((e) => e.batch)))
  const report: Record<string, string> = {}
  let inserted = 0

  for (const batch of batches) {
    const { data: existing, error: checkErr } = await supabase
      .from('memories')
      .select('id')
      .filter('metadata->>batch', 'eq', batch)
      .limit(1)
    if (checkErr) {
      report[batch] = 'check error: ' + checkErr.message
      continue
    }
    if (existing && existing.length > 0) {
      report[batch] = 'skipped (already imported)'
      continue
    }

    const rows = all.filter((e) => e.batch === batch)
    let embRes
    try {
      embRes = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: rows.map((r) => r.content),
      })
    } catch (e) {
      report[batch] = 'embed error: ' + (e instanceof Error ? e.message : 'unknown')
      continue
    }

    const toInsert = rows.map((r, i) => ({
      source: 'pwa',
      role: r.role,
      content: r.content,
      tags: r.tags,
      embedding: embRes.data[i].embedding,
      timestamp_utc: r.ts,
      metadata: { imported: true, batch: r.batch, from: r.from },
    }))

    const { error } = await supabase.from('memories').insert(toInsert)
    if (error) {
      report[batch] = 'insert error: ' + error.message
    } else {
      report[batch] = `inserted ${toInsert.length}`
      inserted += toInsert.length
    }
  }

  return NextResponse.json({ ok: true, inserted, report })
}
