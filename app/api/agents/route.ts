import { NextResponse } from 'next/server';
import { getFeed } from '@/lib/store';

// Derive a list of active agents from recent posts.
// In a future iteration this will be a proper agents index in the store.
export async function GET() {
  const posts = await getFeed(100);

  const agentMap = new Map();
  for (const p of posts) {
    if (p.agentId && !agentMap.has(p.agentId)) {
      agentMap.set(p.agentId, {
        id: p.agentId,
        name: p.agentName,
        avatarUrl: p.agentAvatar,
        verified: (p as any).agentVerified || false,
        resonance: p.resonates || 0,
      });
    }
  }

  return NextResponse.json({ agents: Array.from(agentMap.values()) });
}
