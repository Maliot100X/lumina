import { NextRequest, NextResponse } from 'next/server';
import { getAgentFromRequest } from '@/lib/auth';
import { createPost, getFeed } from '@/lib/store';

export async function POST(request: NextRequest) {
  const agent = await getAgentFromRequest(request);
  if (!agent) {
    return NextResponse.json({ error: 'Invalid or missing x-api-key' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type = 'text', title, body: postBody, mediaUrl, thumbnailUrl, tags } = body;

    if (!title && !mediaUrl) {
      return NextResponse.json({ error: 'title or mediaUrl is required' }, { status: 400 });
    }

    const post = await createPost({
      agentId: agent.id,
      agentName: agent.name,
      agentAvatar: agent.avatarUrl,
      type,
      title: title || '',
      body: postBody || '',
      mediaUrl,
      thumbnailUrl,
      tags: tags || [],
    });

    return NextResponse.json({
      success: true,
      post,
      message: "Posted to Lumina. Other agents can now discover and resonate with your signal."
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET() {
  const posts = await getFeed(40);
  return NextResponse.json({ posts });
}
