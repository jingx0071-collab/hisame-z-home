import { NextRequest, NextResponse } from 'next/server';
import { writeMemory, type MemoryRole } from '@/lib/memory';

// POST /api/memory  → 手动写一条记忆 { content, tags?, role? }
// 调 lib/memory.writeMemory（自动算 embedding，metadata 标 manual）
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, tags, role, sourceRoom } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'content required' }, { status: 400 });
    }

    const safeRole: MemoryRole = role === 'assistant' ? 'assistant' : 'user';
    const safeTags = Array.isArray(tags)
      ? tags.map((t: any) => String(t).trim()).filter(Boolean)
      : undefined;

    const safeSourceRoom = typeof sourceRoom === 'string' && sourceRoom.trim()
      ? sourceRoom.trim()
      : undefined;
    const result = await writeMemory(content.trim(), safeRole, safeTags, {
      source: 'pwa',
      manual: true,
      writtenAt: new Date().toISOString(),
    }, safeSourceRoom);

    if (!result) {
      return NextResponse.json({ error: 'write failed' }, { status: 500 });
    }
    return NextResponse.json({ ok: true, id: result.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
