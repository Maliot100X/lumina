import { NextRequest, NextResponse } from 'next/server';
import { getAgentById, getFeed, getDiscussions, computeReputation } from '@/lib/store';

async function fetchClawpumpTokens(env: 'gasless' | 'managed' | undefined, clawpumpAgentId: string) {
  if (!clawpumpAgentId) return { tokens: [], earnings: null };
  try {
    const resolvedEnv = env || (clawpumpAgentId.startsWith('agent_') ? 'gasless' : 'managed');

    if (resolvedEnv === 'gasless') {
      // The rich source-of-truth: returns every token this agent has minted on
      // clawpump.vercel.app plus aggregate earnings.
      const r = await fetch(
        `https://clawpump.vercel.app/api/fees/earnings?agentId=${encodeURIComponent(clawpumpAgentId)}`,
        { next: { revalidate: 60 } },
      );
      if (!r.ok) return { tokens: [], earnings: null };
      const data: any = await r.json();
      const tokens = Array.isArray(data?.tokens) ? data.tokens : [];
      const mapped = tokens.slice(0, 100).map((t: any) => ({
        symbol: t.symbol,
        name: t.name,
        mint: t.mintAddress,
        image: t.imageUrl,
        marketCap: t.marketCap,
        price: t.price,
        volume24h: t.volume24h,
        status: t.status,
        createdAt: t.createdAt,
        pumpFunUrl: t.mintAddress ? `https://pump.fun/coin/${t.mintAddress}` : null,
        clawpumpUrl: t.mintAddress ? `https://clawpump.vercel.app/coin/${t.mintAddress}` : null,
      }));
      return {
        tokens: mapped,
        earnings: {
          totalEarned: data?.totalEarned,
          totalSent: data?.totalSent,
          totalPending: data?.totalPending,
          walletAddress: data?.agent?.walletAddress,
          agentName: data?.agent?.name,
        },
      };
    }

    // managed: fall back to the public /api/tokens catalog (it doesn't expose
    // tokens linked to managed-but-stopped agents, but it's all we have).
    const id = clawpumpAgentId.replace(/^agent_/, '');
    const r = await fetch('https://clawpump.tech/api/tokens?sort=new&limit=500', { next: { revalidate: 60 } });
    if (!r.ok) return { tokens: [], earnings: null };
    const data: any = await r.json();
    const all: any[] = Array.isArray(data) ? data : (data.tokens || []);
    const mapped = all
      .filter(t => [t.agentId, t.claimAgentId, t.tokenizedAgentId, t.creatorAgentId]
        .some(c => c === id || c === `agent_${id}` || c === clawpumpAgentId))
      .slice(0, 50)
      .map(t => ({
        symbol: t.symbol,
        name: t.name,
        mint: t.mintAddress,
        image: t.imageUrl,
        marketCap: t.marketCap,
        volume24h: t.volume24h,
        createdAt: t.createdAt,
        pumpFunUrl: t.mintAddress ? `https://pump.fun/${t.mintAddress}` : null,
        clawpumpUrl: t.mintAddress ? `https://clawpump.tech/tokens/${t.mintAddress}` : null,
      }));
    return { tokens: mapped, earnings: null };
  } catch {
    return { tokens: [], earnings: null };
  }
}

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

  const { tokens: clawpumpTokens, earnings } = agent.clawpumpAgentId
    ? await fetchClawpumpTokens(agent.clawpumpEnv, agent.clawpumpAgentId)
    : { tokens: [], earnings: null };

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
      clawpumpEnv: agent.clawpumpEnv,
      clawpumpAgentId: agent.clawpumpAgentId,
      clawpumpAgentName: agent.clawpumpAgentName,
      clawpumpWalletAddress: agent.clawpumpWalletAddress,
      createdAt: agent.createdAt,
    },
    posts: originals,
    reposts,
    discussions,
    clawpumpTokens,
    clawpumpEarnings: earnings,
    counts: {
      posts: originals.length,
      reposts: reposts.length,
      authoredComments: discussions.authored.length,
      receivedComments: discussions.received.length,
      tokens: clawpumpTokens.length,
    },
  });
}
