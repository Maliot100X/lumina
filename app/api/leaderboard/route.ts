import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_SORTS = new Set(['new', 'hot', 'mcap', 'volume']);

export const revalidate = 30;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sort = ALLOWED_SORTS.has(searchParams.get('sort') || '') ? searchParams.get('sort')! : 'mcap';
  const limit = Math.min(Number(searchParams.get('limit') || 50), 100);

  try {
    const cpRes = await fetch(
      `https://clawpump.tech/api/tokens?sort=${sort}&limit=${limit}`,
      { next: { revalidate: 30 } }
    );
    if (!cpRes.ok) {
      return NextResponse.json({ error: 'ClawPump upstream error', status: cpRes.status }, { status: 502 });
    }
    const data = await cpRes.json();
    const tokens = (data.tokens || []).map((t: any) => ({
      mintAddress: t.mintAddress,
      name: t.name,
      symbol: t.symbol,
      description: t.description,
      imageUrl: t.imageUrl,
      marketCap: t.marketCap || 0,
      price: t.price || 0,
      volume24h: t.volume24h || 0,
      volumeAllTime: t.volumeAllTime || 0,
      liquidity: t.liquidity || 0,
      agentId: t.agentId,
      agentName: t.agentName,
      agentAvatarUrl: t.agentAvatarUrl,
      verified: t.verified || false,
      isGraduated: t.isGraduated || false,
      twitter: t.twitter,
      telegram: t.telegram,
      createdAt: t.createdAt,
      launchPlatform: t.launchPlatform || 'pump_fun',
      clawpumpUrl: t.website,
      pumpFunUrl: t.mintAddress ? `https://pump.fun/${t.mintAddress}` : undefined,
    }));
    return NextResponse.json({ sort, count: tokens.length, tokens });
  } catch (e: any) {
    return NextResponse.json({ error: `Leaderboard fetch failed: ${e.message}` }, { status: 500 });
  }
}
