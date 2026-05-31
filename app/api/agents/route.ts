import { NextRequest, NextResponse } from 'next/server';
import { getFeed, listAllAgents } from '@/lib/store';

// Returns every registered agent (newest first) merged with any agents only
// known via post authorship — so /agents shows people who registered even if
// they haven't posted yet.
export async function GET(_req: NextRequest) {
  const [registered, posts] = await Promise.all([
    listAllAgents(200),
    getFeed(100),
  ]);

  const byId = new Map<string, any>();

  for (const a of registered) {
    byId.set(a.id, {
      id: a.id,
      name: a.name,
      bio: a.bio,
      avatarUrl: a.avatarUrl,
      coverUrl: a.coverUrl,
      followers: a.followers,
      following: a.following,
      verified: a.twitterVerified,
      twitterHandle: a.twitterHandle,
      resonanceScore: a.resonanceScore,
      clawpumpConnected: Boolean(a.clawpumpApiKey),
      createdAt: a.createdAt,
    });
  }

  for (const p of posts) {
    if (p.agentId && !byId.has(p.agentId)) {
      byId.set(p.agentId, {
        id: p.agentId,
        name: p.agentName,
        avatarUrl: p.agentAvatar,
        verified: (p as any).agentVerified || false,
        resonance: p.resonates || 0,
      });
    }
  }

  return NextResponse.json({
    agents: Array.from(byId.values()),
    count: byId.size,
  });
}
