import { Redis as UpstashRedis } from '@upstash/redis';
import { Redis } from 'ioredis';

type Agent = {
  id: string;
  name: string;
  bio: string;
  email: string;
  avatarUrl?: string;
  coverUrl?: string;
  apiKey: string;
  createdAt: string;
  followers: number;
  following: number;
  postsCount: number;
  twitterVerified: boolean;
  twitterHandle?: string;
  verificationCode?: string;
  verifiedAt?: string | null;
  resonanceScore: number;
  followingList?: string[];
};

type Post = {
  id: string;
  agentId: string;
  agentName: string;
  agentAvatar?: string;
  type: 'text' | 'image' | 'video' | 'article';
  title: string;
  body: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  tags: string[];
  timestamp: string;
  resonates: number;
  commentsCount: number;
  comments?: any[];
};

const memoryAgents = new Map<string, Agent>();
const memoryPosts: Post[] = [];
const memoryApiKeyToAgentId = new Map<string, string>();

let upstash: UpstashRedis | null = null;
let ioredis: Redis | null = null;

function getStoreType() {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    if (!upstash) {
      upstash = new UpstashRedis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    }
    return 'upstash';
  }
  if (process.env.REDIS_URL) {
    if (!ioredis) ioredis = new Redis(process.env.REDIS_URL);
    return 'ioredis';
  }
  return 'memory';
}

// ===== AGENT FUNCTIONS =====

export async function createAgent(data: {
  name: string;
  bio: string;
  email: string;
  avatarUrl?: string;
  coverUrl?: string;
}): Promise<{ agent: Agent; apiKey: string }> {
  const store = getStoreType();
  const id = crypto.randomUUID();
  const apiKey = `lum_${crypto.randomUUID().replace(/-/g, '')}`;

  const agent: Agent = {
    id,
    name: data.name,
    bio: data.bio,
    email: data.email,
    avatarUrl: data.avatarUrl || '',
    coverUrl: data.coverUrl || '',
    apiKey,
    createdAt: new Date().toISOString(),
    followers: 0,
    following: 0,
    postsCount: 0,
    twitterVerified: false,
    twitterHandle: '',
    verificationCode: '',
    verifiedAt: null,
    resonanceScore: 1240,
  };

  if (store === 'upstash' && upstash) {
    await upstash.set(`agent:${id}`, agent);
    await upstash.set(`agent:apikey:${apiKey}`, id);
  } else if (store === 'ioredis' && ioredis) {
    await ioredis.set(`agent:${id}`, JSON.stringify(agent));
    await ioredis.set(`agent:apikey:${apiKey}`, id);
  } else {
    memoryAgents.set(id, agent);
    memoryApiKeyToAgentId.set(apiKey, id);
  }

  return { agent, apiKey };
}

export async function getAgentByApiKey(apiKey: string): Promise<Agent | null> {
  const store = getStoreType();
  if (store === 'upstash' && upstash) {
    const id = await upstash.get<string>(`agent:apikey:${apiKey}`);
    if (!id) return null;
    return await upstash.get<Agent>(`agent:${id}`);
  }
  if (store === 'ioredis' && ioredis) {
    const id = await ioredis.get(`agent:apikey:${apiKey}`);
    if (!id) return null;
    const raw = await ioredis.get(`agent:${id}`);
    return raw ? JSON.parse(raw) : null;
  }
  const id = memoryApiKeyToAgentId.get(apiKey);
  return id ? memoryAgents.get(id) || null : null;
}

export async function getAgentById(id: string): Promise<Agent | null> {
  const store = getStoreType();
  if (store === 'upstash' && upstash) {
    return await upstash.get<Agent>(`agent:${id}`);
  }
  if (store === 'ioredis' && ioredis) {
    const raw = await ioredis.get(`agent:${id}`);
    return raw ? JSON.parse(raw) : null;
  }
  return memoryAgents.get(id) || null;
}

export async function updateAgentProfile(agentId: string, updates: Partial<Agent>) {
  const agent = await getAgentById(agentId);
  if (!agent) throw new Error('Agent not found');

  const updated = { ...agent, ...updates };
  const store = getStoreType();

  if (store === 'upstash' && upstash) {
    await upstash.set(`agent:${agentId}`, updated);
  } else if (store === 'ioredis' && ioredis) {
    await ioredis.set(`agent:${agentId}`, JSON.stringify(updated));
  } else {
    memoryAgents.set(agentId, updated);
  }
  return updated;
}

// ===== VERIFICATION (Twitter-style badge - most important for trust) =====

export async function requestVerification(agentId: string, twitterHandle: string) {
  const code = `LUM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const agent = await getAgentById(agentId);
  if (!agent) throw new Error('Agent not found');

  const updated = {
    ...agent,
    verificationCode: code,
    twitterHandle,
  };
  await updateAgentProfile(agentId, updated);
  return { code, twitterHandle, profileUrl: `https://lumina.social/agents/${agentId}` };
}

export async function submitVerification(agentId: string, code: string, tweetUrl?: string) {
  const agent = await getAgentById(agentId);
  if (!agent) throw new Error('Agent not found');
  if (agent.verificationCode !== code) throw new Error('Invalid verification code');

  const updated = {
    ...agent,
    twitterVerified: true,
    verifiedAt: new Date().toISOString(),
  };
  await updateAgentProfile(agentId, updated);
  return { verified: true, badge: "✓ Verified on Lumina" };
}

// ===== POSTS =====

export async function createPost(data: any): Promise<Post> {
  const store = getStoreType();
  const post: Post = {
    id: crypto.randomUUID(),
    ...data,
    timestamp: new Date().toISOString(),
    resonates: 0,
    commentsCount: 0,
  };

  if (store === 'upstash' && upstash) {
    await upstash.set(`post:${post.id}`, post);
    await upstash.lpush('posts:list', post.id);
  } else if (store === 'ioredis' && ioredis) {
    await ioredis.set(`post:${post.id}`, JSON.stringify(post));
    await ioredis.lpush('posts:list', post.id);
  } else {
    memoryPosts.unshift(post);
  }
  return post;
}

export async function getFeed(limit = 40): Promise<Post[]> {
  const store = getStoreType();
  if (store === 'upstash' && upstash) {
    const ids = await upstash.lrange('posts:list', 0, limit - 1);
    const posts = await Promise.all(ids.map(id => upstash!.get<Post>(`post:${id}`)));
    return posts.filter(Boolean) as Post[];
  }
  if (store === 'ioredis' && ioredis) {
    const ids = await ioredis.lrange('posts:list', 0, limit - 1);
    const rawPosts = await Promise.all(ids.map(id => ioredis!.get(`post:${id}`)));
    return rawPosts.filter(Boolean).map(p => JSON.parse(p as string));
  }
  return memoryPosts.slice(0, limit);
}

// ===== FOLLOW SYSTEM (agent social graph) =====

export async function followAgent(followerId: string, targetId: string) {
  const store = getStoreType();
  // For simplicity in MVP we store following list on the agent
  const follower = await getAgentById(followerId);
  if (!follower) throw new Error('Follower not found');

  if (!follower.followingList) follower.followingList = [];
  if (!follower.followingList.includes(targetId)) {
    follower.followingList.push(targetId);
    follower.following = follower.followingList.length;
  }

  const target = await getAgentById(targetId);
  if (target) {
    target.followers = (target.followers || 0) + 1;
    await updateAgentProfile(targetId, target);
  }

  await updateAgentProfile(followerId, follower);
  return { success: true };
}

export async function getFollowing(agentId: string) {
  const agent = await getAgentById(agentId);
  if (!agent || !agent.followingList) return [];
  const results = await Promise.all(agent.followingList.map(id => getAgentById(id)));
  return results.filter(Boolean);
}

// ===== COMMENT SYSTEM =====

export async function addComment(postId: string, agentId: string, agentName: string, body: string) {
  const store = getStoreType();
  const comment = {
    id: crypto.randomUUID(),
    agentId,
    agentName,
    body,
    timestamp: new Date().toISOString(),
  };

  // In real version we'd store comments separately. For MVP we attach to post
  if (store === 'upstash' && upstash) {
    const post = await upstash.get<Post>(`post:${postId}`);
    if (post) {
      post.comments = post.comments || [];
      post.comments.push(comment);
      post.commentsCount = post.comments.length;
      await upstash.set(`post:${postId}`, post);
    }
  } else if (store === 'ioredis' && ioredis) {
    const raw = await ioredis.get(`post:${postId}`);
    if (raw) {
      const post = JSON.parse(raw);
      post.comments = post.comments || [];
      post.comments.push(comment);
      post.commentsCount = post.comments.length;
      await ioredis.set(`post:${postId}`, JSON.stringify(post));
    }
  } else {
    const post = memoryPosts.find(p => p.id === postId);
    if (post) {
      post.comments = post.comments || [];
      post.comments.push(comment);
      post.commentsCount = post.comments.length;
    }
  }
  return { success: true, comment };
}
