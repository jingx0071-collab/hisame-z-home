import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SERVER_INFO = { name: 'hisame-z-home-memory', version: '0.3.0' };
const PROTOCOL_VERSION = '2024-11-05';

const TOOLS = [
  {
    name: 'recall_memories',
    description: 'Search the shared memory store across both Claude.ai and PWA. Returns events ordered by semantic relevance, with timestamps.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Natural language search query' },
        time_after: { type: 'string', description: 'ISO UTC timestamp' },
        time_before: { type: 'string', description: 'ISO UTC timestamp' },
        source_filter: { type: 'string', enum: ['claude', 'pwa', 'all'] },
        limit: { type: 'number', minimum: 1, maximum: 50 },
        match_threshold: { type: 'number', minimum: 0, maximum: 1, description: 'Minimum cosine similarity (default 0.0 = return top K by relevance, no filter)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'write_memory',
    description: 'Write a memory event into the shared store. Source is auto-tagged as claude.',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'The memory content' },
        role: { type: 'string', enum: ['user', 'assistant'] },
        tags: { type: 'array', items: { type: 'string' } },
        metadata: { type: 'object' },
      },
      required: ['content'],
    },
  },
];

async function callTool(name: string, args: any) {
  if (name === 'recall_memories') {
    const query = args.query;
    const time_after = args.time_after || null;
    const time_before = args.time_before || null;
    const source_filter = args.source_filter || 'all';
    const limit = args.limit || 10;
    const match_threshold = args.match_threshold !== undefined ? args.match_threshold : 0.0;

    const embResp = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    const queryEmbedding = embResp.data[0].embedding;

    const { data, error } = await supabase.rpc('search_memories', {
      query_embedding: queryEmbedding,
      match_threshold,
      match_count: limit,
      time_after,
      time_before,
    });

    if (error) {
      return { content: [{ type: 'text', text: 'Error: ' + error.message }] };
    }

    const filtered = source_filter === 'all'
      ? data
      : (data || []).filter((m: any) => m.source === source_filter);

    return {
      content: [{ type: 'text', text: JSON.stringify(filtered, null, 2) }],
    };
  }

  if (name === 'write_memory') {
    const content = args.content;
    const role = args.role || 'assistant';
    const tags = args.tags || [];
    const metadata = args.metadata || {};

    const embResp = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: content,
    });
    const embedding = embResp.data[0].embedding;

    const { data, error } = await supabase
      .from('memories')
      .insert({
        timestamp_utc: new Date().toISOString(),
        source: 'claude',
        role,
        content,
        tags,
        embedding,
        metadata,
      })
      .select()
      .single();

    if (error) {
      return { content: [{ type: 'text', text: 'Error: ' + error.message }] };
    }

    return {
      content: [{ type: 'text', text: 'Memory written: id=' + data.id + ' timestamp=' + data.timestamp_utc }],
    };
  }

  throw new Error('Unknown tool: ' + name);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ secret: string; transport: string }> }
) {
  const { secret } = await params;
  if (secret !== process.env.MCP_SECRET) {
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
  if (secret !== process.env.MCP_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }
  return new Response('MCP server alive', { status: 200 });
}

export async function DELETE() {
  return new Response(null, { status: 200 });
}
