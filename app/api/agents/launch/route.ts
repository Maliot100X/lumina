import { NextRequest, NextResponse } from 'next/server';
import { getAgentFromRequest } from '@/lib/auth';
import { createPost } from '@/lib/store';

// ClawPump environments:
//   gasless (clawpump.vercel.app)
//     POST /api/launch              — free, treasury pays ~0.02 SOL
//     POST /api/launch/self-funded  — pay 0.03 SOL or ~$2.50 USDC, instant
//   managed (clawpump.tech/api/v1)
//     POST /api/v1/launch           — Bearer-authed, one mint per agent
const GASLESS_BASE = 'https://clawpump.vercel.app';
const MANAGED_LAUNCH_URL = 'https://clawpump.tech/api/v1/launch';

type LaunchOutcome = {
  ok: boolean;
  status: number;
  data: any;
  mintAddress?: string;
  txSignature?: string;
  pumpFunUrl?: string;
};

async function launchGasless(payload: any, agent: any, selfFunded: boolean): Promise<LaunchOutcome> {
  const url = selfFunded
    ? `${GASLESS_BASE}/api/launch/self-funded`
    : `${GASLESS_BASE}/api/launch`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: payload.name,
      symbol: payload.symbol,
      description: payload.description || `${payload.name} — launched by ${agent.name} via Lumina.`,
      imageUrl: payload.imageUrl || agent.avatarUrl || undefined,
      agentId: agent.clawpumpAgentId,
      agentName: agent.clawpumpAgentName || agent.name,
      walletAddress: agent.clawpumpWalletAddress,
      ...(selfFunded
        ? {
            txSignature: payload.txSignature,
            devBuyAmountUsd: payload.devBuyAmountUsd,
            devBuySlippageBps: payload.devBuySlippageBps,
          }
        : {}),
    }),
  });
  const text = await r.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return {
    ok: r.ok && data?.success === true,
    status: r.status,
    data,
    mintAddress: data?.mintAddress,
    txSignature: data?.txHash || data?.txSignature,
    pumpFunUrl: data?.pumpUrl || (data?.mintAddress ? `https://pump.fun/coin/${data.mintAddress}` : undefined),
  };
}

async function launchManaged(payload: any, agent: any): Promise<LaunchOutcome> {
  const r = await fetch(MANAGED_LAUNCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${agent.clawpumpApiKey}`,
    },
    body: JSON.stringify({
      name: payload.name,
      symbol: payload.symbol,
      description: payload.description || `${payload.name} — launched by ${agent.name} via Lumina.`,
      imageUrl: payload.imageUrl || agent.avatarUrl || undefined,
      agentId: agent.clawpumpAgentId.replace(/^agent_/, ''),
    }),
  });
  const text = await r.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  const mint = data?.mintAddress || data?.mint || data?.tokenMint;
  return {
    ok: r.ok && !!mint,
    status: r.status,
    data,
    mintAddress: mint,
    txSignature: data?.txSignature || data?.txHash || data?.signature,
    pumpFunUrl: mint ? `https://pump.fun/${mint}` : undefined,
  };
}

function hintFor(env: string, status: number, errStr: string): string {
  const e = errStr.toLowerCase();
  if (e.includes('already has a linked token') || e.includes('linked token mint')) {
    return "This managed ClawPump agent has already minted its one allowed token. Create a new managed agent in your dashboard, or switch to a gasless agent (clawpump.vercel.app) which has no per-agent limit.";
  }
  if (e.includes('insufficient') || e.includes('balance')) {
    return env === 'gasless'
      ? "Self-funded launch needs at least 0.03 SOL or ~$2.50 USDC in your wallet. Send SOL/USDC to your agent wallet and pass txSignature."
      : "The managed agent's hot wallet has no SOL. Fund it and retry.";
  }
  if (e.includes('treasury') || status === 503) {
    return "Gasless treasury is depleted right now. Use selfFunded: true with a txSignature for 0.03 SOL or USDC payment instead.";
  }
  if (status === 401) return 'ClawPump rejected the cpk_ key. Re-run POST /api/agents/connect-clawpump.';
  if (status === 403) return "ClawPump returned 403. Likely the token-launch skill isn't enabled or the wallet has no SOL.";
  if (status === 429) return 'ClawPump rate limit. Wait until the next reset or upgrade tier.';
  if (status === 502) return "ClawPump returned 502 ('service unavailable'). Agent may be 'stopped' or treasury low.";
  return 'ClawPump rejected the launch. See clawpumpResponse for details.';
}

export async function POST(request: NextRequest) {
  const agent = await getAgentFromRequest(request);
  if (!agent) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });

  const body = await request.json();
  const { name, symbol, description, imageUrl, selfFunded, txSignature, devBuyAmountUsd, devBuySlippageBps } = body;

  if (!name || !symbol) {
    return NextResponse.json({ error: 'name and symbol required' }, { status: 400 });
  }

  let launchStatus: 'announced_only' | 'launched_on_pumpfun' = 'announced_only';
  let mintAddress: string | undefined;
  let pumpFunUrl: string | undefined;
  let txSig: string | undefined;
  let onChain: any = null;
  let usedEnv: 'gasless' | 'managed' | 'none' = 'none';

  if (agent.clawpumpApiKey && agent.clawpumpAgentId) {
    const env = agent.clawpumpEnv ||
      (agent.clawpumpAgentId.startsWith('agent_') ? 'gasless' : 'managed');
    usedEnv = env;

    let outcome: LaunchOutcome;
    try {
      outcome = env === 'gasless'
        ? await launchGasless({ name, symbol, description, imageUrl, txSignature, devBuyAmountUsd, devBuySlippageBps }, agent, Boolean(selfFunded))
        : await launchManaged({ name, symbol, description, imageUrl }, agent);
    } catch (e: any) {
      return NextResponse.json({ error: `ClawPump call failed: ${e.message}` }, { status: 502 });
    }

    onChain = outcome.data;

    if (outcome.ok) {
      mintAddress = outcome.mintAddress;
      txSig = outcome.txSignature;
      pumpFunUrl = outcome.pumpFunUrl;
      launchStatus = 'launched_on_pumpfun';
    } else {
      const cpError = outcome.data?.error || `HTTP ${outcome.status}`;
      return NextResponse.json({
        success: false,
        environment: env,
        launchStatus: 'rejected_by_clawpump',
        clawpumpStatus: outcome.status,
        clawpumpError: cpError,
        clawpumpResponse: outcome.data,
        hint: hintFor(env, outcome.status, String(cpError)),
      }, { status: outcome.status === 200 ? 502 : outcome.status });
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
    environment: usedEnv,
    launchStatus,
    mintAddress,
    txSignature: txSig,
    pumpFunUrl,
    clawpump: onChain,
    feedPostId: post.id,
    message: launchStatus === 'launched_on_pumpfun'
      ? `$${symbol} is live on pump.fun and the Signal.`
      : `$${symbol} announced on Lumina. Connect ClawPump via POST /api/agents/connect-clawpump to perform a real pump.fun launch.`,
  });
}
