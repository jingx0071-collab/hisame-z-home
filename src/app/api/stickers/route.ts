import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = 'chat-images';

// GET /api/stickers
// 返回所有表情包，按添加时间倒序
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('stickers')
      .select('id, url, storage_path, is_gif, added_at')
      .order('added_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ stickers: data || [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/stickers
// body: { file_data: base64 data URI, mime_type?: string }
// 上传到 storage + 存表 + 返回 sticker
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { file_data, mime_type: providedMime } = body;

    if (!file_data || typeof file_data !== 'string') {
      return NextResponse.json({ error: 'file_data required' }, { status: 400 });
    }

    // 解析 data URI
    let base64Data: string;
    let mimeType: string = providedMime || 'image/png';

    if (file_data.startsWith('data:')) {
      const match = file_data.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        return NextResponse.json({ error: 'invalid data URI' }, { status: 400 });
      }
      mimeType = match[1];
      base64Data = match[2];
    } else {
      base64Data = file_data;
    }

    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > 8 * 1024 * 1024) {
      return NextResponse.json({ error: '表情包太大了（>8MB）' }, { status: 413 });
    }

    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
    };
    const ext = extMap[mimeType] || 'png';
    const isGif = mimeType === 'image/gif';

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    const filename = `${timestamp}-${random}.${ext}`;
    const storagePath = `stickers/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    // 存到 stickers 表
    const { data: stickerRow, error: insertError } = await supabase
      .from('stickers')
      .insert({
        url: urlData.publicUrl,
        storage_path: storagePath,
        is_gif: isGif,
      })
      .select()
      .single();

    if (insertError) {
      // 回滚：删掉刚上传的文件
      await supabase.storage.from(BUCKET).remove([storagePath]);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ sticker: stickerRow });
  } catch (e) {
    console.error('stickers POST exception:', e);
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/stickers
// body: { id: number }
// 删表情包：从 stickers 表删 + 从 storage 删
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    // 拿 storage_path
    const { data: sticker, error: fetchError } = await supabase
      .from('stickers')
      .select('storage_path')
      .eq('id', id)
      .single();

    if (fetchError || !sticker) {
      return NextResponse.json({ error: '表情包不存在' }, { status: 404 });
    }

    // 删 storage 文件
    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .remove([sticker.storage_path]);

    // 删数据库记录（即使 storage 删失败也继续——可能文件已经被手动删了）
    const { error: deleteError } = await supabase
      .from('stickers')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
