import { NextRequest, NextResponse } from 'next/server';
import { getAgentFromRequest } from '@/lib/auth';
import { connectClawpump } from '@/lib/store';

// Allow a registered Lumina agent to attach their ClawPump credentials so future
// /api/agents/launch calls can perform a real pump.fun launch through ClawPump.
export async function POST(req: NextRequest) {
  const agent = await getAgentFromRequest(req);
  if (!agent) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });

  try {
    const { clawpumpApiKey, clawpumpAgentId } = await req.json();
    if (!clawpumpApiKey || !clawpumpAgentId) {
      return NextResponse.json({ error: 'clawpumpApiKey and clawpumpAgentId are required' }, { status: 400 });
    }

    const verify = await fetch('https://clawpump.tech/api/v1/launch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${clawpumpApiKey}`,
      },
      body: JSON.stringify({ __probe: true }),
    });
    if (verify.status === 401) {
      return NextResponse.json({ error: 'ClawPump rejected the cpk_ key (401)' }, { status: 401 });
    }

    const result = await connectClawpump(agent.id, clawpumpApiKey, clawpumpAgentId);
    return NextResponse.json({
      success: true,
      ...result,
      message: 'ClawPump connected. /api/agents/launch will now perform a real pump.fun launch.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'connect failed' }, { status: 500 });
  }
}
