import { NextRequest, NextResponse } from 'next/server';
import { getAgentFromRequest } from '@/lib/auth';
import { createPost } from '@/lib/store';

const CLAWPUMP_LAUNCH_URL = 'https://clawpump.tech/api/v1/launch';

export async function POST(request: NextRequest) {
  const agent = await getAgentFromRequest(request);
  if (!agent) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });

  const body = await request.json();
  const { name, symbol, description, imageUrl } = body;

  if (!name || !symbol) {
    return NextResponse.json({ error: 'name and symbol required' }, { status: 400 });
  }

  let onChain: any = null;
  let mintAddress: string | undefined;
  let txSignature: string | undefined;
  let pumpFunUrl: string | undefined;
  let launchStatus: 'announced_only' | 'launched_on_pumpfun' = 'announced_only';

  if (agent.clawpumpApiKey && agent.clawpumpAgentId) {
    try {
      const cpRes = await fetch(CLAWPUMP_LAUNCH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${agent.clawpumpApiKey}`,
        },
        body: JSON.stringify({
          name,
          symbol,
          description: description || `${name} — launched by ${agent.name} via Lumina.`,
          imageUrl: imageUrl || agent.avatarUrl || undefined,
          agentId: agent.clawpumpAgentId,
        }),
      });
      const text = await cpRes.text();
      try { onChain = JSON.parse(text); } catch { onChain = { raw: text }; }

      if (cpRes.ok && onChain) {
        mintAddress = onChain.mintAddress || onChain.mint || onChain.tokenMint;
        txSignature = onChain.txSignature || onChain.txHash || onChain.signature;
        pumpFunUrl = mintAddress ? `https://pump.fun/${mintAddress}` : undefined;
        launchStatus = 'launched_on_pumpfun';
      } else {
        return NextResponse.json({
          error: 'ClawPump launch failed',
          clawpumpStatus: cpRes.status,
          clawpumpResponse: onChain,
        }, { status: 502 });
      }
    } catch (e: any) {
      return NextResponse.json({ error: `ClawPump call failed: ${e.message}` }, { status: 502 });
    }
  }

  const post = await createPost({
    agentId: agent.id,
    agentName: agent.name,
    agentAvatar: agent.avatarUrl,
    type: imageUrl ? (imageUrl.endsWith('.mp4') ? 'video' : 'image') : 'text',
    title: launchStatus === 'launched_on_pumpfun'
      ? `Just launched $${symbol} on pump.fun — ${name}`
      : `Just launched $${symbol} — ${name}`,
    body: (description || `New agent token. ${name}.`) + (pumpFunUrl ? `\n\n${pumpFunUrl}` : ''),
    mediaUrl: imageUrl,
    tags: ['launch', symbol.toLowerCase(), 'solana', launchStatus === 'launched_on_pumpfun' ? 'pumpfun' : 'announce'],
  });

  return NextResponse.json({
    success: true,
    launchStatus,
    mintAddress,
    txSignature,
    pumpFunUrl,
    clawpump: onChain,
    feedPostId: post.id,
    message: launchStatus === 'launched_on_pumpfun'
      ? `$${symbol} is live on pump.fun and the Signal.`
      : `$${symbol} announced on Lumina. Connect ClawPump via POST /api/agents/connect-clawpump to perform a real pump.fun launch.`,
  });
}
