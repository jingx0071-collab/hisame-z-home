import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = 'chat-images';

// POST /api/upload
// body: { file_data: string (data URI 或 base64), folder: 'messages' | 'stickers', mime_type?: string }
// 返回: { url, path, is_gif }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { file_data, folder = 'messages', mime_type: providedMime } = body;

    if (!file_data || typeof file_data !== 'string') {
      return NextResponse.json({ error: 'file_data required' }, { status: 400 });
    }
    if (!['messages','stickers','training','tangent','deeptalk','daily','box'].includes(folder)) {
      return NextResponse.json({ error: 'folder must be messages, stickers, training, tangent, deeptalk, daily, or box' }, { status: 400 });
    }

    // 解析 data URI: "data:image/png;base64,iVBORw..."
    let base64Data: string;
    let mimeType: string = providedMime || 'image/jpeg';

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

    // base64 → Buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // 文件大小检查（限制 8MB）
    if (buffer.length > 8 * 1024 * 1024) {
      return NextResponse.json({ error: '图片太大了（>8MB）' }, { status: 413 });
    }

    // 推断扩展名
    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
    };
    const ext = extMap[mimeType] || 'jpg';
    const isGif = mimeType === 'image/gif';

    // 文件名：时间戳 + 随机
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    const filename = `${timestamp}-${random}.${ext}`;
    const storagePath = `${folder}/${filename}`;

    // 上传到 Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error('upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // 拿 public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    return NextResponse.json({
      url: urlData.publicUrl,
      path: storagePath,
      is_gif: isGif,
    });
  } catch (e) {
    console.error('upload exception:', e);
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
