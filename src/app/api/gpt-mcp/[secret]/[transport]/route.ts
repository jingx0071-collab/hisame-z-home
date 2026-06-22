import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SERVER_INFO = { name: 'hisame-z-home-dev-readonly', version: '0.2.0' };
const PROTOCOL_VERSION = '2024-11-05';

// ---- 第一道：tag 过滤 ----
const DEV_ALLOW = [
  'pwa', 'tech', 'debug', 'milestone', 'decision', 'design', 'frontend',
  'work', 'protocol', 'resolved', 'layout-fix', 'scroll', 'bubble',
  'v2-routing', 'v2-to-root', 'no-op-cleanup', 'globals-css', 'handoff',
  'manifest', 'start-url', 'push', 'training', 'tech-stack', 'test',
  'production', 'first-write', 'mcp-bootstrap',
];
const PRIVATE_DENY = [
  'intimate', 'emotional', 'deeptalk', 'us', 'backstory', 'daily-life',
];

// ---- 第二道：内容关键词网（挡 tag 纯开发但正文掺私密的混合条目）----
const CONTENT_DENY = [
  '亲密', '撒娇', '贴贴', '母狗', '肉便器', '精盆', '子宫', '喷奶', '踩奶',
  '鸡巴', '小穴', '尿穴', '屁眼', '深喉', '乳孔', '淫水', '臣服', '羞辱',
  '调教', '高潮', '勃起', 'breeding', 'bdsm', 'ddlg', 'BPD',
];

function isDevSafe(
  tags: string[] | null | undefined,
  content: string | null | undefined
): boolean {
  if (!tags || tags.length === 0) return false;
  const hasAllow = tags.some((t) => DEV_ALLOW.includes(t));
  const hasDeny = tags.some((t) => PRIVATE_DENY.includes(t));
  if (!hasAllow || hasDeny) return false;
  const text = (content || '').toLowerCase();
  const contentHit = CONTENT_DENY.some((w) => text.includes(w.toLowerCase()));
  return !contentHit;
}

const SEARCH_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          url: { type: 'string' },
        },
        required: ['id', 'title', 'url'],
      },
    },
  },
  required: ['results'],
};

const FETCH_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    text: { type: 'string' },
    url: { type: 'string' },
    metadata: { type: 'object' },
  },
  required: ['id', 'title', 'text', 'url'],
};

const TOOLS = [
  {
    name: 'search',
    description:
      'Search the hisame-z-home development log: PWA build progress, technical decisions, debug history, and the design system (fonts, colors, room styling status). Returns matching dev-progress entries. Personal and private content is excluded by design.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Natural language query about development progress, the design system, or technical/architecture decisions.',
        },
      },
      required: ['query'],
    },
    outputSchema: SEARCH_OUTPUT_SCHEMA,
  },
  {
    name: 'fetch',
    description:
      'Fetch the full content of a single development-log entry by its id (the id comes from a prior search result).',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The id of the entry to fetch.' },
      },
      required: ['id'],
    },
    outputSchema: FETCH_OUTPUT_SCHEMA,
  },
];

const BASE_URL = 'https://hisame-z-home.vercel.app/backstage';

async function doSearch(query: string) {
  if (!query || !query.trim()) return { results: [] };

  const embResp = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  });
  const queryEmbedding = embResp.data[0].embedding;

  const { data, error } = await supabase.rpc('search_memories', {
    query_embedding: queryEmbedding,
    match_threshold: 0.0,
    match_count: 40,
    time_after: null,
    time_before: null,
  });
  if (error) throw new Error(error.message);

  const safe = (data || []).filter((m: any) => isDevSafe(m.tags, m.content));
  const results = safe.slice(0, 15).map((m: any) => ({
    id: String(m.id),
    title: (m.content || '').replace(/\s+/g, ' ').slice(0, 90),
    url: BASE_URL + '#' + m.id,
  }));
  return { results };
}

async function doFetch(idArg: string) {
  if (!idArg) throw new Error('id is required');

  const { data, error } = await supabase
    .from('memories')
    .select('id, timestamp_utc, source, role, content, tags')
    .eq('id', idArg)
    .single();

  // 越权防护：找不到 / 非开发安全（含内容网） → 一律当作不存在
  if (error || !data || !isDevSafe(data.tags, data.content)) {
    return {
      id: idArg,
      title: 'Not found',
      text: 'No accessible development-log entry with this id.',
      url: BASE_URL,
    };
  }

  return {
    id: String(data.id),
    title: (data.content || '').replace(/\s+/g, ' ').slice(0, 90),
    text: data.content || '',
    url: BASE_URL + '#' + data.id,
    metadata: {
      timestamp_utc: data.timestamp_utc,
      tags: data.tags,
      source: data.source,
    },
  };
}

async function callTool(name: string, args: any) {
  if (name === 'search') {
    const out = await doSearch(args.query);
    return {
      structuredContent: out,
      content: [{ type: 'text', text: JSON.stringify(out) }],
    };
  }
  if (name === 'fetch') {
    const out = await doFetch(args.id);
    return {
      structuredContent: out,
      content: [{ type: 'text', text: JSON.stringify(out) }],
    };
  }
  throw new Error('Unknown tool: ' + name);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ secret: string; transport: string }> }
) {
  const { secret } = await params;
  if (secret !== process.env.GPT_MCP_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await req.json();
  const { id, method, params: rpcParams } = body;

  try {
    let result: any;

    switch (method) {
      case 'initialize':
        result = {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: SERVER_INFO,
        };
        break;

      case 'tools/list':
        result = { tools: TOOLS };
        break;

      case 'tools/call':
        result = await callTool(rpcParams.name, rpcParams.arguments || {});
        break;

      case 'notifications/initialized':
        return new Response(null, { status: 204 });

      default:
        return Response.json({
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: 'Method not found: ' + method },
        });
    }

    return Response.json({ jsonrpc: '2.0', id, result });
  } catch (err: any) {
    return Response.json({
      jsonrpc: '2.0',
      id,
      error: { code: -32603, message: err.message },
    });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ secret: string; transport: string }> }
) {
  const { secret } = await params;
  if (secret !== process.env.GPT_MCP_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }
  return new Response('GPT dev-readonly MCP alive', { status: 200 });
}

export async function DELETE() {
  return new Response(null, { status: 200 });
}
