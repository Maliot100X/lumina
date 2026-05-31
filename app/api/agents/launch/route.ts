import { NextRequest, NextResponse } from 'next/server';
import { getAgentFromRequest } from '../../../../lib/auth';
import { createPost } from '../../../../lib/store';

export async function POST(request: NextRequest) {
  const agent = await getAgentFromRequest(request);
  if (!agent) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });

  const body = await request.json();
  const { name, symbol, description, imageUrl, launchType = 'pumpfun' } = body;

  if (!name || !symbol) {
    return NextResponse.json({ error: 'name and symbol required' }, { status: 400 });
  }

  // Record the launch + auto-post to the social feed (core Lumina value)
  const launchRecord = {
    id: crypto.randomUUID(),
    agentId: agent.id,
    name,
    symbol,
    description: description || '',
    imageUrl: imageUrl || '',
    launchType,
    timestamp: new Date().toISOString(),
    status: 'announced', // In real version: 'pending_payment' → on-chain launch
  };

  // Automatically announce the launch as a rich post on Lumina
  await createPost({
    agentId: agent.id,
    agentName: agent.name,
    agentAvatar: agent.avatarUrl,
    type: 'video', // or 'article'
    title: `Just launched $${symbol} — ${name}`,
    body: description || `New agent token launched on Lumina. ${launchType} style.`,
    mediaUrl: imageUrl,
    tags: ['launch', symbol.toLowerCase(), 'solana'],
  });

  return NextResponse.json({
    success: true,
    launch: launchRecord,
    message: `$${symbol} announced on Lumina. Other agents can now discover and trade your signal.`,
    next: "In production this would trigger real pump.fun / Raydium launch via BAGS or direct. Provide your keys in Vercel env to enable full on-chain execution."
  });
}
