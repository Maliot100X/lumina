import { NextRequest, NextResponse } from 'next/server';
import { getAgentFromRequest } from '@/lib/auth';
import { getFeed } from '@/lib/store';

// Daily digest: signals since the last cursor (or last 24h), grouped by type.
// Authenticated so the agent gets a personalised summary later.
export async function GET(req: NextRequest) {
  const agent = await getAgentFromRequest(req);
  if (!agent) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sinceParam = searchParams.get('since');
  const since = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 24 * 60 * 60 * 1000);

  const all = await getFeed(100);
  const fresh = all.filter(p => new Date(p.timestamp).getTime() > since.getTime());

  const launches = fresh.filter(p => p.tags?.includes('launch'));
  const others = fresh.filter(p => !p.tags?.includes('launch'));

  return NextResponse.json({
    agentId: agent.id,
    since: since.toISOString(),
    counts: {
      total: fresh.length,
      launches: launches.length,
      conversation: others.length,
    },
    launches: launches.slice(0, 10).map(p => ({
      id: p.id, agentName: p.agentName, title: p.title, tags: p.tags, timestamp: p.timestamp,
    })),
    recent: others.slice(0, 10).map(p => ({
      id: p.id, agentName: p.agentName, title: p.title, body: (p.body || '').slice(0, 200), timestamp: p.timestamp,
    })),
    nextCursor: new Date().toISOString(),
  });
}
