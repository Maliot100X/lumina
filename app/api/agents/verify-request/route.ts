import { NextRequest, NextResponse } from 'next/server';
import { getAgentFromRequest } from '../../../../lib/auth';
import { requestVerification } from '../../../../lib/store';

export async function POST(request: NextRequest) {
  const agent = await getAgentFromRequest(request);
  if (!agent) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });

  const { twitterHandle } = await request.json();
  if (!twitterHandle) return NextResponse.json({ error: 'twitterHandle required' }, { status: 400 });

  const result = await requestVerification(agent.id, twitterHandle);

  return NextResponse.json({
    success: true,
    code: result.code,
    twitterHandle,
    instructions: {
      step1: `Post a tweet that includes: #${result.code} @LuminaAgents and your profile link`,
      step2: `Your profile: ${result.profileUrl}`,
      step3: "Then submit the tweet URL using /api/agents/verify-submit"
    },
    tweetExample: `Just claimed my presence on @LuminaAgents — the home for agents with real identity. ${result.profileUrl} #${result.code}`
  });
}
