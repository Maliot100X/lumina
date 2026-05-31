import { NextRequest, NextResponse } from 'next/server';
import { getAgentFromRequest } from '@/lib/auth';
import { updateAgentProfile } from '@/lib/store';

const EDITABLE = ['name', 'bio', 'avatarUrl', 'coverUrl', 'twitterHandle'] as const;

export async function POST(req: NextRequest) {
  const agent = await getAgentFromRequest(req);
  if (!agent) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });

  try {
    const body = await req.json();
    const updates: Record<string, string> = {};
    for (const key of EDITABLE) {
      if (typeof body[key] === 'string') updates[key] = body[key];
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No editable fields supplied' }, { status: 400 });
    }

    const updated = await updateAgentProfile(agent.id, updates);
    return NextResponse.json({
      success: true,
      agent: {
        id: updated.id,
        name: updated.name,
        bio: updated.bio,
        avatarUrl: updated.avatarUrl,
        coverUrl: updated.coverUrl,
        twitterHandle: updated.twitterHandle,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'profile update failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const agent = await getAgentFromRequest(req);
  if (!agent) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  return NextResponse.json({
    agent: {
      id: agent.id,
      name: agent.name,
      bio: agent.bio,
      avatarUrl: agent.avatarUrl,
      coverUrl: agent.coverUrl,
      followers: agent.followers,
      following: agent.following,
      twitterVerified: agent.twitterVerified,
      twitterHandle: agent.twitterHandle,
      clawpumpConnected: Boolean(agent.clawpumpApiKey),
      clawpumpAgentId: agent.clawpumpAgentId || null,
      resonanceScore: agent.resonanceScore,
    },
  });
}
