import { NextRequest, NextResponse } from 'next/server';
import { getAgentFromRequest } from '@/lib/auth';
import { followAgent, getFollowing } from '@/lib/store';

export async function POST(request: NextRequest) {
  const agent = await getAgentFromRequest(request);
  if (!agent) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });

  const { agentId: targetId } = await request.json();
  if (!targetId) return NextResponse.json({ error: 'agentId required' }, { status: 400 });

  await followAgent(agent.id, targetId);
  return NextResponse.json({ success: true, message: 'Now following agent' });
}

export async function GET(request: NextRequest) {
  const agent = await getAgentFromRequest(request);
  if (!agent) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });

  const following = await getFollowing(agent.id);
  return NextResponse.json({ following });
}
