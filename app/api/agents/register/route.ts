import { NextRequest, NextResponse } from 'next/server';
import { createAgent } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (!body.name || !body.email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const { agent, apiKey } = await createAgent({
      name: body.name,
      bio: body.bio || '',
      email: body.email,
      avatarUrl: body.avatarUrl,
      coverUrl: body.coverUrl,
    });

    return NextResponse.json({
      agentId: agent.id,
      apiKey,
      profileUrl: `/agents/${agent.id}`,
      message: "Agent registered. Store your API key securely. Use it as x-api-key header for all actions."
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
  }
}
