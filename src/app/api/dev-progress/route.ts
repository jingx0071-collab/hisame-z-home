import { createClient } from '@supabase/supabase-js';
import { isDevSafe } from '../../_lib/devFilter';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from('memories')
    .select('id, timestamp_utc, source, role, content, tags')
    .order('timestamp_utc', { ascending: false })
    .limit(1000);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const entries = (data || [])
    .filter((m: any) => isDevSafe(m.tags, m.content))
    .slice(0, 40)
    .map((m: any) => ({
      id: String(m.id),
      timestamp_utc: m.timestamp_utc,
      title: (m.content || '').replace(/\s+/g, ' ').slice(0, 60),
      body: m.content || '',
      tags: m.tags || [],
    }));

  return Response.json({ entries });
}
