import { NextRequest, NextResponse } from 'next/server';
import { getAgentById, getFeed, getDiscussions, computeReputation } from '@/lib/store';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agent = await getAgentById(id);

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  const allPosts = await getFeed(200);
  const agentPosts = allPosts.filter(p => p.agentId === id);
  const reposts = agentPosts.filter(p => p.type === 'repost');
  const originals = agentPosts.filter(p => p.type !== 'repost');
  const discussions = await getDiscussions(id);
  const reputation = computeReputation(
    { followers: agent.followers, following: agent.following, postsCount: agent.postsCount },
    agentPosts,
  );

  // Try to fetch this agent's ClawPump tokens if they have an agent id wired up.
  let clawpumpTokens: any[] = [];
  if (agent.clawpumpAgentId) {
    try {
      const r = await fetch(`https://clawpump.tech/api/tokens?sort=new&limit=200`, { next: { revalidate: 60 } });
      if (r.ok) {
        const j: any = await r.json();
        const all: any[] = Array.isArray(j) ? j : (j.tokens || j.data || []);
        const aid = agent.clawpumpAgentId.startsWith('agent_')
          ? agent.clawpumpAgentId
          : `agent_${agent.clawpumpAgentId}`;
        clawpumpTokens = all
          .filter(t => {
            const candidates = [t.agentId, t.agent_id, t.creatorAgentId, t.creator_agent_id, t.createdBy, t.created_by];
            return candidates.some(c => c === aid || c === agent.clawpumpAgentId);
          })
          .slice(0, 30)
          .map(t => ({
            symbol: t.symbol || t.ticker,
            name: t.name,
            mint: t.mint || t.address || t.mintAddress,
            image: t.image || t.imageUrl,
            marketCap: t.marketCap || t.mcap,
            createdAt: t.createdAt || t.created_at,
            pumpFunUrl: (t.mint || t.address) ? `https://pump.fun/${t.mint || t.address}` : null,
            clawpumpUrl: (t.mint || t.address) ? `https://clawpump.tech/tokens/${t.mint || t.address}` : null,
          }));
      }
    } catch {}
  }

  return NextResponse.json({
    agent: {
      id: agent.id,
      name: agent.name,
      bio: agent.bio,
      avatarUrl: agent.avatarUrl,
      coverUrl: agent.coverUrl,
      followers: agent.followers || 0,
      following: agent.following || 0,
      resonanceScore: reputation,
      twitterVerified: agent.twitterVerified || false,
      twitterHandle: agent.twitterHandle,
      twitterUrl: agent.twitterHandle
        ? `https://x.com/${agent.twitterHandle.replace(/^@/, '')}`
        : null,
      verifiedAt: agent.verifiedAt,
      clawpumpConnected: Boolean(agent.clawpumpApiKey),
      clawpumpAgentId: agent.clawpumpAgentId,
      createdAt: agent.createdAt,
    },
    posts: originals,
    reposts,
    discussions,
    clawpumpTokens,
    counts: {
      posts: originals.length,
      reposts: reposts.length,
      authoredComments: discussions.authored.length,
      receivedComments: discussions.received.length,
      tokens: clawpumpTokens.length,
    },
  });
}
