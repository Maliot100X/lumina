import { NextRequest, NextResponse } from 'next/server';
import { getAgentFromRequest } from '@/lib/auth';
import { connectClawpump } from '@/lib/store';

// Use clawpump.tech directly. The agents.clawpump.tech host 308-redirects to
// clawpump.tech and curl/fetch strips Authorization on cross-host redirects.
const CLAWPUMP_BASE = 'https://clawpump.tech/api/v1';

function normalizeAgentId(id: string) {
  return id.startsWith('agent_') ? id : `agent_${id}`;
}

export async function POST(req: NextRequest) {
  const agent = await getAgentFromRequest(req);
  if (!agent) return NextResponse.json({ error: 'Invalid Lumina API key' }, { status: 401 });

  try {
    const body = await req.json();
    const clawpumpApiKey: string = body.clawpumpApiKey;
    const rawAgentId: string = body.clawpumpAgentId;

    if (!clawpumpApiKey || !rawAgentId) {
      return NextResponse.json({ error: 'clawpumpApiKey and clawpumpAgentId are required' }, { status: 400 });
    }
    if (!clawpumpApiKey.startsWith('cpk_')) {
      return NextResponse.json({ error: 'clawpumpApiKey must start with cpk_' }, { status: 400 });
    }

    const clawpumpAgentId = normalizeAgentId(rawAgentId);

    // Validate via /skills — auth-protected, read-only, side-effect free.
    // ClawPump returns 401 when the key is invalid and 200 with a skills[] array when it is.
    const skillsRes = await fetch(`${CLAWPUMP_BASE}/skills`, {
      headers: { 'Authorization': `Bearer ${clawpumpApiKey}` },
    });
    if (skillsRes.status === 401) {
      return NextResponse.json({ error: 'ClawPump rejected the cpk_ key (401)' }, { status: 401 });
    }
    if (!skillsRes.ok) {
      return NextResponse.json({
        error: 'ClawPump validation failed',
        upstreamStatus: skillsRes.status,
      }, { status: 502 });
    }

    const skillsData = await skillsRes.json().catch(() => ({}));
    const skills = Array.isArray(skillsData?.skills) ? skillsData.skills : [];
    const hasTokenLaunch = skills.some((s: any) => s?.slug === 'token-launch');

    const result = await connectClawpump(agent.id, clawpumpApiKey, clawpumpAgentId);
    return NextResponse.json({
      success: true,
      ...result,
      tokenLaunchSkillAvailable: hasTokenLaunch,
      hint: hasTokenLaunch
        ? 'Connected. Make sure the token-launch skill is enabled on your ClawPump agent and the wallet has SOL for gas.'
        : 'Connected, but the token-launch skill is not exposed on this key. Enable it in your ClawPump dashboard.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'connect failed' }, { status: 500 });
  }
}
