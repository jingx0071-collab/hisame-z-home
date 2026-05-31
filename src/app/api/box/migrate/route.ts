import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 一次性迁移：localStorage 旧铁盒（用户项）→ box_items
// 前端调用：POST /api/box/migrate { items: [{ type, content, caption, date, createdAt, source }] }
// 照片在前端已先走 /api/upload 换成 URL，这里只哑插入
// 安全：库里已有项则跳过（防重复迁移）
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ ok: true, imported: 0 });
    }

    const { count } = await supabase
      .from('box_items')
      .select('id', { count: 'exact', head: true });

    if ((count || 0) > 0) {
      return NextResponse.json({ ok: true, imported: 0, skipped: 'box_items already populated' });
    }

    const rows = items
      .filter((it: any) => it && it.content && String(it.content).trim().length > 0)
      .filter((it: any) => it.source !== 'z')
      .filter((it: any) => ['photo', 'text', 'link'].includes(it.type))
      .map((it: any) => ({
        type: it.type,
        content: String(it.content),
        caption: it.caption ? String(it.caption) : '',
        item_date: it.date || null,
        created_at: it.createdAt
          ? new Date(Number(it.createdAt)).toISOString()
          : new Date().toISOString(),
      }));

    if (rows.length === 0) {
      return NextResponse.json({ ok: true, imported: 0 });
    }

    const BATCH = 100;
    let inserted = 0;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const { error } = await supabase.from('box_items').insert(batch);
      if (error) {
        return NextResponse.json(
          { error: error.message, imported_before_error: inserted },
          { status: 500 }
        );
      }
      inserted += batch.length;
    }

    return NextResponse.json({ ok: true, imported: inserted });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
