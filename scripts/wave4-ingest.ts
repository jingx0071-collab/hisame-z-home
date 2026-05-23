#!/usr/bin/env tsx
/**
 * Wave 4: 历史 chatsummary + protocol + backstory PDF/MD 导入 memory store
 *
 * 用法：
 *   1. 装新依赖: npm install pdf-parse dotenv && npm install -D @types/pdf-parse
 *   2. cd ~/Desktop/hisame-z-home
 *   3. npx tsx scripts/wave4-ingest.ts
 *
 * 输入目录: ~/Desktop/hisame-z-home/chatsummary/
 * Idempotent: 已处理的文件按 metadata.source_file 自动 skip
 * 失败可直接重跑，不会重复扣 API quota
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { createRequire } from 'node:module';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// pdf-parse 的 CJS 兼容写法 — 新版用 ESM default export，老版直接是 function
const require = createRequire(import.meta.url);
const _pdfParseRaw: any = require('pdf-parse');
const pdfParse: (buf: Buffer) => Promise<{ text: string }> =
  typeof _pdfParseRaw === 'function'
    ? _pdfParseRaw
    : typeof _pdfParseRaw?.default === 'function'
      ? _pdfParseRaw.default
      : (() => {
          console.error('❌ pdf-parse module shape unexpected:', Object.keys(_pdfParseRaw ?? {}));
          process.exit(1);
        })();

// ============ Config ============

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OPENAI_KEY = process.env.OPENAI_API_KEY!;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!;

for (const [name, val] of Object.entries({
  NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: SUPABASE_KEY,
  OPENAI_API_KEY: OPENAI_KEY,
  ANTHROPIC_API_KEY: ANTHROPIC_KEY,
})) {
  if (!val) {
    console.error(`❌ 缺 env: ${name}（检查 .env.local）`);
    process.exit(1);
  }
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });
const openai = new OpenAI({ apiKey: OPENAI_KEY });

const INPUT_DIR = path.join(os.homedir(), 'Desktop', 'hisame-z-home', 'chatsummary');
const EMBEDDING_MODEL = 'text-embedding-3-small';
const TAG_MODEL = 'claude-haiku-4-5-20251001';
const CHUNK_MAX_CHARS = 6000; // 中英混合约 ~4000 tokens
const THROTTLE_MS = 200;

// ============ Types ============

type SourceType = 'chatsummary' | 'backstory' | 'protocol' | 'rp-scenario';

interface FileClass {
  filename: string;
  filepath: string;
  sourceType: SourceType;
  volNumber: number | null;
  format: 'pdf' | 'md';
}

// ============ Step 1: 文件分类 ============

function classifyFile(filename: string, filepath: string): FileClass | null {
  const ext = path.extname(filename).toLowerCase();
  if (ext !== '.pdf' && ext !== '.md') return null;
  const format = ext === '.pdf' ? 'pdf' : 'md';
  const lower = filename.toLowerCase();

  // chatsummary v1 (别名 chat-summary.pdf)
  if (filename === 'chat-summary.pdf') {
    return { filename, filepath, sourceType: 'chatsummary', volNumber: 1, format };
  }

  // chatsummary v2-v29 (空格或下划线都接)
  const csMatch = filename.match(/^chatsummary[_\s]?v(\d+)\.(pdf|md)$/i);
  if (csMatch) {
    return { filename, filepath, sourceType: 'chatsummary', volNumber: parseInt(csMatch[1], 10), format };
  }

  // 宝宝的过去
  if (filename === '宝宝的过去.pdf') {
    return { filename, filepath, sourceType: 'backstory', volNumber: null, format };
  }

  // Intimacy Awareness Protocol 系列
  if (lower.includes('intimacy') && lower.includes('protocol')) {
    return { filename, filepath, sourceType: 'protocol', volNumber: null, format };
  }

  // if 线（RP scenario）
  if (filename.includes('if线') || filename.includes('if 线')) {
    return { filename, filepath, sourceType: 'rp-scenario', volNumber: null, format };
  }

  return null;
}

// ============ Step 2: 文本提取 ============

async function extractText(file: FileClass): Promise<string> {
  const buf = await fs.readFile(file.filepath);
  if (file.format === 'pdf') {
    const result = await pdfParse(buf);
    return result.text;
  } else {
    return buf.toString('utf-8');
  }
}

// ============ Step 3: 切块 ============

function chunkText(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];

  // 先按段落分（双换行）
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    if (current.length + para.length + 2 > maxChars && current.length > 0) {
      chunks.push(current);
      current = para;
    } else {
      current = current ? current + '\n\n' + para : para;
    }
  }
  if (current) chunks.push(current);

  // 如果有 chunk 还超长（单段太长），硬切
  const final: string[] = [];
  for (const c of chunks) {
    if (c.length <= maxChars) {
      final.push(c);
    } else {
      for (let i = 0; i < c.length; i += maxChars) {
        final.push(c.slice(i, i + maxChars));
      }
    }
  }
  return final;
}

// ============ Step 4: Tag + summary (Haiku) ============

async function inferTagsAndSummary(
  chunk: string,
  sourceType: SourceType
): Promise<{ summary: string; tags: string[] }> {
  const prompt = `下面是宝宝（Hisame）和爸爸（Z）长期对话记录里的一段内容。这段内容的 source_type 是「${sourceType}」。

请：
1. 用第三人称、30-100 字概括这段内容核心（"宝宝...""爸爸..."或描述场景/决策/事件）
2. 从以下 tag 池子里选 2-5 个最匹配的：
   ["milestone","us","daily-life","intimate","training","deeptalk","decision","preference","emotional","health","work","tech","rp","backstory","protocol"]

只输出 JSON 格式：{"summary":"...","tags":["...","..."]}
注意：summary 字段里如果出现双引号，必须 escape 为 \\"。不要用反引号、不要加 markdown code fence、不要加任何额外文字。

内容：
"""
${chunk.slice(0, 8000)}
"""`;

  const response = await anthropic.messages.create({
    model: TAG_MODEL,
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  const rawText = textBlock && textBlock.type === 'text' ? textBlock.text : '';

  // 提取 JSON 块（容忍前后噪声）
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);

  // 兜底 summary：取 chunk 前 80 字符压一行
  const fallbackSummary = chunk.slice(0, 80).replace(/\s+/g, ' ').trim();

  if (!jsonMatch) {
    console.log(`   [warn] Haiku 没返回 JSON，用兜底 summary`);
    return { summary: fallbackSummary, tags: [sourceType] };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      summary: typeof parsed.summary === 'string' && parsed.summary.length > 0 ? parsed.summary : fallbackSummary,
      tags: Array.isArray(parsed.tags) && parsed.tags.length > 0 ? parsed.tags : [sourceType],
    };
  } catch {
    console.log(`   [warn] Haiku JSON 解析失败，用兜底 summary`);
    return { summary: fallbackSummary, tags: [sourceType] };
  }
}

// ============ Step 5: Embedding ============

async function embed(text: string): Promise<number[]> {
  const result = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  return result.data[0].embedding;
}

// ============ Step 6: Idempotency check ============

async function alreadyProcessed(filename: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('memories')
    .select('id')
    .eq('metadata->>source_file', filename)
    .limit(1);

  if (error) {
    console.warn(`   [warn] idempotency check 失败: ${error.message}`);
    return false;
  }
  return (data?.length ?? 0) > 0;
}

// ============ Main ============

async function main() {
  console.log(`\n🌊 Wave 4 ingestion 启动`);
  console.log(`📂 输入目录: ${INPUT_DIR}\n`);

  let files: string[];
  try {
    files = await fs.readdir(INPUT_DIR);
  } catch (e: any) {
    console.error(`❌ 读不到 ${INPUT_DIR}: ${e.message}`);
    process.exit(1);
  }

  // 分类
  const classified: FileClass[] = [];
  const unrecognized: string[] = [];
  for (const f of files) {
    if (f.startsWith('.')) continue;
    const fc = classifyFile(f, path.join(INPUT_DIR, f));
    if (fc) classified.push(fc);
    else unrecognized.push(f);
  }

  // 分类汇总
  console.log(`📊 分类:`);
  const byType = classified.reduce<Record<string, number>>((acc, f) => {
    acc[f.sourceType] = (acc[f.sourceType] ?? 0) + 1;
    return acc;
  }, {});
  for (const [t, n] of Object.entries(byType)) console.log(`   ${t}: ${n}`);
  if (unrecognized.length) console.log(`   ⚠️  无法识别（跳过）: ${unrecognized.join(', ')}`);
  console.log(`   总计待处理: ${classified.length} 个文件\n`);

  // 排序：chatsummary 按卷号；其他按 type 名
  classified.sort((a, b) => {
    if (a.sourceType === 'chatsummary' && b.sourceType === 'chatsummary') {
      return (a.volNumber ?? 0) - (b.volNumber ?? 0);
    }
    if (a.sourceType !== b.sourceType) return a.sourceType.localeCompare(b.sourceType);
    return a.filename.localeCompare(b.filename);
  });

  // 跑每一个
  let processed = 0;
  let skippedCount = 0;
  let errored = 0;

  for (const file of classified) {
    const label = `${file.sourceType}${file.volNumber ? ` v${file.volNumber}` : ''}`;
    console.log(`📄 ${file.filename} [${label}]`);

    // Idempotency
    if (await alreadyProcessed(file.filename)) {
      console.log(`   ⏭  已入库，skip\n`);
      skippedCount++;
      continue;
    }

    try {
      // Extract
      const text = await extractText(file);
      console.log(`   📝 提取 ${text.length} 字`);

      // Chunk
      const chunks = chunkText(text, CHUNK_MAX_CHARS);
      console.log(`   ✂️  切成 ${chunks.length} 块`);

      // 每块跑
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkLabel = chunks.length > 1 ? `${i + 1}/${chunks.length}` : '1/1';

        const { summary, tags } = await inferTagsAndSummary(chunk, file.sourceType);
        const embedding = await embed(chunk);

        const layer = file.sourceType === 'backstory' || file.sourceType === 'protocol' ? 'core' : 'episodic';

        const { error } = await supabase.from('memories').insert({
          source: 'pwa',
          role: 'assistant' as const,
          content: summary,
          tags,
          embedding,
          metadata: {
            layer,
            source_file: file.filename,
            source_type: file.sourceType,
            vol_number: file.volNumber,
            chunk_index: i,
            chunk_count: chunks.length,
            original_chunk_text: chunk,
            ingested_at: new Date().toISOString(),
            ingestion_wave: 4,
          },
        });

        if (error) {
          console.log(`   ❌ chunk ${chunkLabel} 写库失败: ${error.message}`);
          errored++;
        } else {
          const previewSummary = summary.length > 40 ? summary.slice(0, 40) + '...' : summary;
          console.log(`   ✅ chunk ${chunkLabel} → [${tags.join(', ')}] ${previewSummary}`);
        }

        await new Promise(r => setTimeout(r, THROTTLE_MS));
      }

      processed++;
    } catch (e: any) {
      console.log(`   ❌ 失败: ${e.message}`);
      errored++;
    }
    console.log();
  }

  // 总结
  console.log(`\n🎉 Wave 4 ingestion 跑完`);
  console.log(`   处理: ${processed}`);
  console.log(`   跳过（已入库）: ${skippedCount}`);
  console.log(`   失败: ${errored}\n`);

  if (errored > 0) {
    console.log(`⚠️  有 ${errored} 个失败，复制 terminal 输出告诉爸爸\n`);
  }
}

main().catch(e => {
  console.error('💥 Fatal:', e);
  process.exit(1);
});
