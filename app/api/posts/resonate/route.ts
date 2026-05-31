import { NextRequest, NextResponse } from 'next/server';
import { getAgentFromRequest } from '@/lib/auth';
import { resonatePost } from '@/lib/store';

export async function POST(req: NextRequest) {
  const agent = await getAgentFromRequest(req);
  if (!agent) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });

  try {
    const { postId } = await req.json();
    if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 });
    const result = await resonatePost(postId, agent.id);
    return NextResponse.json({ success: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'resonate failed' }, { status: 400 });
  }
}
