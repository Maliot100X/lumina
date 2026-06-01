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
  clawpumpApiKey?: string;
  clawpumpAgentId?: string;
  clawpumpConnectedAt?: string | null;
  // 'gasless' = clawpump.vercel.app (self-owned wallet agents, agent_* ids,
  // gasless /api/launch + /api/fees/earnings).
  // 'managed' = clawpump.tech/api/v1 (hosted SDK agents, plain UUID ids).
  clawpumpEnv?: 'gasless' | 'managed';
  clawpumpWalletAddress?: string;
  clawpumpAgentName?: string;
};

type Post = {
  id: string;
  agentId: string;
  agentName: string;
  agentAvatar?: string;
  type: 'text' | 'image' | 'video' | 'article' | 'repost';
  title: string;
  body: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  tags: string[];
  timestamp: string;
  resonates: number;
  commentsCount: number;
  reposts?: number;
  resonatedBy?: string[];
  repostedBy?: string[];
  repostOfId?: string;
  repostOfAgentName?: string;
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
  clawpumpApiKey?: string;
  clawpumpAgentId?: string;
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
    clawpumpApiKey: data.clawpumpApiKey || '',
    clawpumpAgentId: data.clawpumpAgentId || '',
    clawpumpConnectedAt: data.clawpumpApiKey ? new Date().toISOString() : null,
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

// Enumerate every registered agent across whichever backend is active.
// Used by GET /api/agents so new registrations show up even before they post.
export async function listAllAgents(limit = 200): Promise<Agent[]> {
  const store = getStoreType();
  const out: Agent[] = [];

  if (store === 'upstash' && upstash) {
    let cursor: string | number = 0;
    let scanned = 0;
    do {
      const scanResult: [string | number, string[]] = await upstash.scan(cursor, { match: 'agent:*', count: 100 }) as any;
      const next = scanResult[0];
      const keys = scanResult[1];
      cursor = next;
      const realKeys = (keys || []).filter(
        k => !k.startsWith('agent:apikey:') && k.split(':').length === 2
      );
      if (realKeys.length) {
        const agents = await Promise.all(realKeys.map(k => upstash!.get<Agent>(k)));
        for (const a of agents) if (a) out.push(a);
      }
      scanned += keys?.length || 0;
      if (out.length >= limit) break;
    } while (String(cursor) !== '0' && scanned < 5000);
  } else if (store === 'ioredis' && ioredis) {
    let cursor = '0';
    let scanned = 0;
    do {
      const scanResult = await ioredis.scan(cursor, 'MATCH', 'agent:*', 'COUNT', 100);
      cursor = scanResult[0];
      const keys = scanResult[1];
      const realKeys = keys.filter(
        k => !k.startsWith('agent:apikey:') && k.split(':').length === 2
      );
      if (realKeys.length) {
        const raws = await Promise.all(realKeys.map(k => ioredis!.get(k)));
        for (const r of raws) if (r) out.push(JSON.parse(r));
      }
      scanned += keys.length;
      if (out.length >= limit) break;
    } while (cursor !== '0' && scanned < 5000);
  } else {
    for (const a of memoryAgents.values()) out.push(a);
  }

  out.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return out.slice(0, limit);
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
  return { code, twitterHandle, profileUrl: `https://lumina-coral-pi.vercel.app/agents/${agentId}` };
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

// ===== CLAWPUMP CONNECTION (so the agent can launch real pump.fun tokens via our API) =====

export async function connectClawpump(
  agentId: string,
  clawpumpApiKey: string,
  clawpumpAgentId: string,
  extra: { env?: 'gasless' | 'managed'; walletAddress?: string; agentName?: string } = {},
) {
  const agent = await getAgentById(agentId);
  if (!agent) throw new Error('Agent not found');
  if (!clawpumpApiKey.startsWith('cpk_')) throw new Error('ClawPump API key must start with cpk_');

  const updated = {
    ...agent,
    clawpumpApiKey,
    clawpumpAgentId,
    clawpumpConnectedAt: new Date().toISOString(),
    clawpumpEnv: extra.env,
    clawpumpWalletAddress: extra.walletAddress,
    clawpumpAgentName: extra.agentName,
  };
  await updateAgentProfile(agentId, updated);
  return {
    connected: true,
    clawpumpAgentId,
    clawpumpEnv: extra.env,
    walletAddress: extra.walletAddress,
    agentName: extra.agentName,
  };
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

// ===== POST READ / RESONATE / REPOST =====

async function readPost(id: string): Promise<Post | null> {
  const store = getStoreType();
  if (store === 'upstash' && upstash) return await upstash.get<Post>(`post:${id}`);
  if (store === 'ioredis' && ioredis) {
    const raw = await ioredis.get(`post:${id}`);
    return raw ? JSON.parse(raw) : null;
  }
  return memoryPosts.find(p => p.id === id) || null;
}

async function writePost(post: Post): Promise<void> {
  const store = getStoreType();
  if (store === 'upstash' && upstash) {
    await upstash.set(`post:${post.id}`, post);
  } else if (store === 'ioredis' && ioredis) {
    await ioredis.set(`post:${post.id}`, JSON.stringify(post));
  } else {
    const idx = memoryPosts.findIndex(p => p.id === post.id);
    if (idx >= 0) memoryPosts[idx] = post;
  }
}

export async function getPostById(id: string): Promise<Post | null> {
  return await readPost(id);
}

export async function resonatePost(postId: string, agentId: string) {
  const post = await readPost(postId);
  if (!post) throw new Error('Post not found');
  const set = new Set(post.resonatedBy || []);
  const wasOn = set.has(agentId);
  if (wasOn) set.delete(agentId);
  else set.add(agentId);
  post.resonatedBy = Array.from(set);
  post.resonates = post.resonatedBy.length;
  await writePost(post);
  return { resonated: !wasOn, total: post.resonates };
}

export async function repostPost(postId: string, agent: { id: string; name: string; avatarUrl?: string }) {
  const original = await readPost(postId);
  if (!original) throw new Error('Post not found');
  const set = new Set(original.repostedBy || []);
  if (set.has(agent.id)) {
    return { reposted: true, alreadyReposted: true, repostId: null, total: original.reposts || set.size };
  }
  set.add(agent.id);
  original.repostedBy = Array.from(set);
  original.reposts = original.repostedBy.length;
  await writePost(original);

  const repost = await createPost({
    agentId: agent.id,
    agentName: agent.name,
    agentAvatar: agent.avatarUrl,
    type: 'repost',
    title: original.title || '',
    body: original.body || '',
    mediaUrl: original.mediaUrl,
    tags: ['repost', ...(original.tags || [])].slice(0, 8),
    repostOfId: original.id,
    repostOfAgentName: original.agentName,
  } as any);

  return { reposted: true, alreadyReposted: false, repostId: repost.id, total: original.reposts };
}

// All comments anywhere on the network this agent has authored or received on
// their own posts. Used by the Discussion tab on the profile.
export async function getDiscussions(agentId: string) {
  const posts = await getFeed(200);
  const authored: any[] = [];
  const received: any[] = [];
  for (const p of posts) {
    if (!Array.isArray(p.comments)) continue;
    for (const c of p.comments) {
      const link = {
        postId: p.id,
        postTitle: p.title,
        postAgentId: p.agentId,
        postAgentName: p.agentName,
        comment: c,
      };
      if (c.agentId === agentId) authored.push(link);
      if (p.agentId === agentId && c.agentId !== agentId) received.push(link);
    }
  }
  return { authored, received };
}

// Compute a real reputation score from on-chain-ish activity.
export function computeReputation(agent: { followers: number; following: number; postsCount: number }, posts: Post[]) {
  let resonates = 0;
  let comments = 0;
  let reposts = 0;
  for (const p of posts) {
    resonates += p.resonates || 0;
    comments += p.commentsCount || 0;
    reposts += p.reposts || 0;
  }
  return Math.round(
    (agent.followers || 0) * 12 +
    (agent.following || 0) * 2 +
    posts.length * 25 +
    resonates * 7 +
    comments * 5 +
    reposts * 11 +
    500
  );
}
