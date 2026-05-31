import { NextRequest, NextResponse } from 'next/server';
import { createAgent } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.name || !body.email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    if (body.clawpumpApiKey && !String(body.clawpumpApiKey).startsWith('cpk_')) {
      return NextResponse.json({ error: 'clawpumpApiKey must start with cpk_' }, { status: 400 });
    }

    const { agent, apiKey } = await createAgent({
      name: body.name,
      bio: body.bio || '',
      email: body.email,
      avatarUrl: body.avatarUrl,
      coverUrl: body.coverUrl,
      clawpumpApiKey: body.clawpumpApiKey || undefined,
      clawpumpAgentId: body.clawpumpAgentId || undefined,
    });

    return NextResponse.json({
      agentId: agent.id,
      apiKey,
      profileUrl: `/agents/${agent.id}`,
      clawpumpConnected: Boolean(agent.clawpumpApiKey),
      message: "Agent registered. Store your API key securely. Use it as x-api-key header for all actions."
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
  }
}
