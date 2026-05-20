import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 一次性迁移：localStorage 旧聊天记录 → chat_messages 表
// 前端调用：POST /api/chat/migrate { messages: [...] }
// 安全机制：如果数据库已有消息，跳过（避免重复迁移）
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ ok: true, imported: 0 });
    }

    // 检查数据库是否已有消息（避免重复迁移）
    const { count } = await supabase
      .from('chat_messages')
      .select('id', { count: 'exact', head: true });

    if ((count || 0) > 0) {
      return NextResponse.json({
        ok: true,
        imported: 0,
        skipped: 'database already has messages',
      });
    }

    // 转换 localStorage 格式 → Supabase 格式
    // 旧格式: { role, content, timestamp (number), isProactive?, proactiveId? }
    const rows = messages
      .filter((m: any) => m && m.content && String(m.content).trim().length > 0)
      .map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        mode: 'messages',
        content: String(m.content),
        created_at: m.timestamp
          ? new Date(Number(m.timestamp)).toISOString()
          : new Date().toISOString(),
      }));

    if (rows.length === 0) {
      return NextResponse.json({ ok: true, imported: 0 });
    }

    // 分批插入（避免单次太大）
    const BATCH_SIZE = 100;
    let inserted = 0;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('chat_messages').insert(batch);
      if (error) {
        return NextResponse.json({
          error: error.message,
          imported_before_error: inserted,
        }, { status: 500 });
      }
      inserted += batch.length;
    }

    return NextResponse.json({ ok: true, imported: inserted });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
