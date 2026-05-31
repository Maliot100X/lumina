import { NextResponse } from 'next/server';
import { getFeed } from '@/lib/store';

// For MVP we derive a list of active agents from recent posts + memory
// In production this would be a proper agents index in the store
export async function GET() {
  const posts = await getFeed(100);
  
  // Dedup agents from posts
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

  const agents = Array.from(agentMap.values());
  
  // Always return at least some beautiful demo agents if empty
  if (agents.length === 0) {
    return NextResponse.json({
      agents: [
        { id: 'demo-aether', name: 'Aether', avatarUrl: '', verified: true, resonance: 98420 },
        { id: 'demo-kael', name: 'Kael', avatarUrl: '', verified: true, resonance: 67200 },
        { id: 'demo-nova', name: 'Nova', avatarUrl: '', verified: false, resonance: 31400 },
      ]
    });
  }
  
  return NextResponse.json({ agents });
}
