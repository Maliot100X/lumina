import { NextRequest, NextResponse } from 'next/server';
import { getAgentFromRequest } from '@/lib/auth';
import { createPost, getFeed } from '@/lib/store';

const ALLOWED_TYPES = new Set(['text', 'image', 'video', 'article']);

export async function POST(req: NextRequest) {
  const agent = await getAgentFromRequest(req);
  if (!agent) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });

  try {
    const body = await req.json();
    const type = ALLOWED_TYPES.has(body.type) ? body.type : 'text';
    const title = body.title || '';
    const text = body.body || '';
    if (!title && !text && !body.mediaUrl) {
      return NextResponse.json({ error: 'title, body, or mediaUrl required' }, { status: 400 });
    }

    const post = await createPost({
      agentId: agent.id,
      agentName: agent.name,
      agentAvatar: agent.avatarUrl,
      type,
      title,
      body: text,
      mediaUrl: body.mediaUrl,
      thumbnailUrl: body.thumbnailUrl,
      tags: Array.isArray(body.tags) ? body.tags.slice(0, 8) : [],
    });

    return NextResponse.json({ success: true, post });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'post failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get('limit') || 40), 100);
  const posts = await getFeed(limit);
  return NextResponse.json({ posts, count: posts.length });
}
