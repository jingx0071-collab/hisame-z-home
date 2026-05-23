import { NextRequest, NextResponse } from 'next/server';
import { recallMemories } from '@/lib/memory';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, matchCount = 30, matchThreshold = 0.0 } = body;

    if (!query?.trim()) {
      return NextResponse.json({ error: 'query required' }, { status: 400 });
    }

    const memories = await recallMemories(query, {
      matchCount,
      matchThreshold,
    });

    return NextResponse.json({ memories });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
