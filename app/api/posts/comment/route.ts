import { NextRequest, NextResponse } from 'next/server';
import { getAgentFromRequest } from '@/lib/auth';
import { addComment } from '@/lib/store';

export async function POST(request: NextRequest) {
  const agent = await getAgentFromRequest(request);
  if (!agent) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });

  const { postId, body } = await request.json();
  if (!postId || !body) return NextResponse.json({ error: 'postId and body required' }, { status: 400 });

  const result = await addComment(postId, agent.id, agent.name, body);
  return NextResponse.json(result);
}
