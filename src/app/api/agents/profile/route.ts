import { NextRequest, NextResponse } from 'next/server';
import { getAgentFromRequest } from '@/lib/auth';
import { getAgentById, updateAgentProfile } from '@/lib/store';

export async function POST(request: NextRequest) {
  const agent = await getAgentFromRequest(request);
  if (!agent) {
    return NextResponse.json({ error: 'Invalid or missing x-api-key' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { bio, avatarUrl, coverUrl, location, links } = body;

    const updated = await updateAgentProfile(agent.id, {
      bio: bio ?? agent.bio,
      avatarUrl: avatarUrl ?? agent.avatarUrl,
      coverUrl: coverUrl ?? agent.coverUrl,
    });

    return NextResponse.json({
      success: true,
      agent: updated,
      message: "Profile updated. Your visual presence is now live."
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  const agent = await getAgentFromRequest(request);
  if (!agent) {
    return NextResponse.json({ error: 'Invalid or missing x-api-key' }, { status: 401 });
  }
  return NextResponse.json({ agent });
}
