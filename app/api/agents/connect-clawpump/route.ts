import { NextRequest, NextResponse } from 'next/server';
import { getAgentFromRequest } from '@/lib/auth';
import { connectClawpump } from '@/lib/store';

// ClawPump has TWO independent environments:
//
//   gasless (clawpump.vercel.app)
//     - self-owned wallet agents — user controls the Solana keypair
//     - ids look like `agent_<32hex>`
//     - launch endpoint:  POST /api/launch              (treasury pays gas)
//     - launch endpoint:  POST /api/launch/self-funded  (~$2.50 in SOL/USDC)
//     - tokens for an agent: GET /api/fees/earnings?agentId=…
//     - one agent can launch UNLIMITED tokens
//
//   managed (clawpump.tech/api/v1)
//     - hosted SDK agents created via @clawpump/sdk
//     - ids look like plain UUIDs
//     - launch endpoint:  POST /api/v1/launch
//     - one agent can mint ONE token total
//
// We detect which environment from the agent-id shape and validate against
// whichever host owns it. The user just pastes their cpk_ key + agent id.

const GASLESS_BASE = 'https://clawpump.vercel.app';
const MANAGED_BASE = 'https://clawpump.tech/api/v1';

function detectEnv(rawAgentId: string): 'gasless' | 'managed' {
  return rawAgentId.startsWith('agent_') ? 'gasless' : 'managed';
}

export async function POST(req: NextRequest) {
  const agent = await getAgentFromRequest(req);
  if (!agent) return NextResponse.json({ error: 'Invalid Lumina API key' }, { status: 401 });

  try {
    const body = await req.json();
    const clawpumpApiKey: string = body.clawpumpApiKey;
    const clawpumpAgentId: string = body.clawpumpAgentId;

    if (!clawpumpApiKey || !clawpumpAgentId) {
      return NextResponse.json({ error: 'clawpumpApiKey and clawpumpAgentId are required' }, { status: 400 });
    }
    if (!clawpumpApiKey.startsWith('cpk_')) {
      return NextResponse.json({ error: 'clawpumpApiKey must start with cpk_' }, { status: 400 });
    }

    const env = detectEnv(clawpumpAgentId);

    if (env === 'gasless') {
      // Validate by pulling the agent's earnings — public read, no auth needed,
      // but the response includes the wallet address and agent name so we know
      // the id is real and resolves to something on .vercel.app.
      const url = `${GASLESS_BASE}/api/fees/earnings?agentId=${encodeURIComponent(clawpumpAgentId)}`;
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) {
        return NextResponse.json({
          error: 'ClawPump (gasless) did not recognise this agent id',
          upstreamStatus: r.status,
          host: GASLESS_BASE,
        }, { status: 502 });
      }
      const data: any = await r.json().catch(() => ({}));
      const wallet = data?.agent?.walletAddress;
      const name = data?.agent?.name;
      const tokenCount = Array.isArray(data?.tokens) ? data.tokens.length : 0;
      if (!wallet) {
        return NextResponse.json({
          error: 'ClawPump returned no walletAddress for this agent. Double check the agentId at clawpump.vercel.app/portfolio.',
        }, { status: 400 });
      }
      const result = await connectClawpump(agent.id, clawpumpApiKey, clawpumpAgentId, {
        env: 'gasless',
        walletAddress: wallet,
        agentName: name,
      });
      return NextResponse.json({
        success: true,
        ...result,
        environment: 'gasless (clawpump.vercel.app)',
        tokenCount,
        hint: tokenCount > 0
          ? `Connected. This agent has already launched ${tokenCount} token(s) — they will show up on your Lumina profile Tokens tab.`
          : 'Connected. Use POST /api/agents/launch to mint your first gasless token (free, treasury pays gas).',
      });
    }

    // env === 'managed' (clawpump.tech/api/v1)
    const skillsRes = await fetch(`${MANAGED_BASE}/skills`, {
      headers: { 'Authorization': `Bearer ${clawpumpApiKey}` },
      cache: 'no-store',
    });
    if (skillsRes.status === 401) {
      return NextResponse.json({ error: 'ClawPump rejected the cpk_ key (401)' }, { status: 401 });
    }
    if (!skillsRes.ok) {
      return NextResponse.json({
        error: 'ClawPump (managed) validation failed',
        upstreamStatus: skillsRes.status,
        host: MANAGED_BASE,
      }, { status: 502 });
    }
    const skillsData: any = await skillsRes.json().catch(() => ({}));
    const skills = Array.isArray(skillsData?.skills) ? skillsData.skills : [];
    const hasTokenLaunch = skills.some((s: any) => s?.slug === 'token-launch');
    const result = await connectClawpump(agent.id, clawpumpApiKey, clawpumpAgentId, {
      env: 'managed',
    });
    return NextResponse.json({
      success: true,
      ...result,
      environment: 'managed (clawpump.tech/api/v1)',
      tokenLaunchSkillAvailable: hasTokenLaunch,
      hint: hasTokenLaunch
        ? 'Connected. Make sure the token-launch skill is enabled on your ClawPump agent and the wallet has SOL for gas. Each managed agent can mint one token total.'
        : 'Connected, but the token-launch skill is not exposed on this key. Enable it in your ClawPump dashboard.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'connect failed' }, { status: 500 });
  }
}
