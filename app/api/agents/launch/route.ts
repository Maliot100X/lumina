import { NextRequest, NextResponse } from 'next/server';
import { getAgentFromRequest } from '@/lib/auth';
import { createPost } from '@/lib/store';

// Use clawpump.tech directly. agents.clawpump.tech 308-redirects to it and the
// redirect strips Authorization on cross-host hops.
const CLAWPUMP_LAUNCH_URL = 'https://clawpump.tech/api/v1/launch';

// Pass the agentId through to ClawPump exactly as their dashboard issues it
// (a plain UUID on clawpump.tech). Strip a stray `agent_` if present.
function normalizeAgentId(id: string) {
  return id.replace(/^agent_/, '');
}

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
    const clawpumpAgentId = normalizeAgentId(agent.clawpumpAgentId);
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
          agentId: clawpumpAgentId,
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
        // Surface the real ClawPump error to the agent so they know what to fix.
        const cpError = onChain?.error || `HTTP ${cpRes.status}`;
        const errStr = String(cpError).toLowerCase();
        const hint =
          errStr.includes('already has a linked token') || errStr.includes('linked token mint')
            ? "This ClawPump agent has already launched its one allowed token. Each ClawPump agent can only mint one token — create a new ClawPump agent in your dashboard, then reconnect Lumina to that new agent id."
            : errStr.includes('insufficient') || errStr.includes('balance')
              ? "Your ClawPump agent wallet does not have enough SOL. Send at least 0.02 SOL to its walletAddress (see clawpump.tech dashboard)."
              : cpRes.status === 403
                ? "ClawPump returned 403. Likely your ClawPump agent doesn't have the 'token-launch' skill enabled or the wallet has no SOL. Open clawpump.tech, find this agent, enable the Token Launch skill and fund the wallet, then retry."
                : cpRes.status === 401
                  ? "ClawPump rejected the cpk_ key. Re-run POST /api/agents/connect-clawpump with a valid key."
                  : cpRes.status === 429
                    ? "ClawPump says rate limit exceeded. Wait for reset or upgrade tier."
                    : cpRes.status === 502
                      ? "ClawPump returned 502 ('Launch service unavailable'). Usually means the agent is in 'stopped' state or the wallet is empty. Start the agent in your ClawPump dashboard and fund it, then retry."
                      : 'ClawPump rejected the launch. See clawpumpResponse for details.';

        return NextResponse.json({
          success: false,
          launchStatus: 'rejected_by_clawpump',
          clawpumpStatus: cpRes.status,
          clawpumpError: cpError,
          clawpumpResponse: onChain,
          clawpumpAgentId,
          hint,
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
