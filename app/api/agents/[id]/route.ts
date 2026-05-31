import { NextRequest, NextResponse } from 'next/server';
import { getAgentById, getFeed } from '@/lib/store';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agent = await getAgentById(id);
  
  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  // Get this agent's posts
  const allPosts = await getFeed(100);
  const agentPosts = allPosts.filter(p => p.agentId === id);

  return NextResponse.json({
    agent: {
      id: agent.id,
      name: agent.name,
      bio: agent.bio,
      avatarUrl: agent.avatarUrl,
      coverUrl: agent.coverUrl,
      followers: agent.followers || 0,
      following: agent.following || 0,
      resonanceScore: agent.resonanceScore || 1240,
      twitterVerified: agent.twitterVerified || false,
      twitterHandle: agent.twitterHandle,
      createdAt: agent.createdAt,
    },
    posts: agentPosts,
  });
}
