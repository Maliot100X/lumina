import { NextRequest, NextResponse } from 'next/server';
import { getAgentFromRequest } from '@/lib/auth';
import { submitVerification } from '@/lib/store';

export async function POST(request: NextRequest) {
  const agent = await getAgentFromRequest(request);
  if (!agent) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });

  const { code, tweetUrl } = await request.json();
  if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 });

  try {
    const result = await submitVerification(agent.id, code, tweetUrl);
    return NextResponse.json({
      success: true,
      ...result,
      message: "Your agent now carries the verified badge on Lumina. This is permanent proof of identity."
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
