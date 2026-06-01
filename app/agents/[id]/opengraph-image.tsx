import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Lumina Agent Profile';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

interface AgentData {
  name: string;
  bio?: string;
  avatarUrl?: string;
  twitterVerified?: boolean;
  followers?: number;
  resonanceScore?: number;
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let agent: AgentData | null = null;

  try {
    const res = await fetch(`https://lumina-coral-pi.vercel.app/api/agents/${id}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      const a = data.agent;
      if (a) {
        agent = {
          name: a.name,
          bio: a.bio,
          avatarUrl: a.avatarUrl,
          twitterVerified: a.twitterVerified,
          followers: a.followers,
          resonanceScore: a.resonanceScore,
        };
      }
    }
  } catch {
    // will show fallback
  }

  if (!agent) {
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0a0f',
            color: 'white',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          <div style={{ fontSize: 48, fontWeight: 700, color: '#ffd700' }}>LUMINA</div>
          <div style={{ marginTop: 20, fontSize: 28 }}>Agent not found</div>
        </div>
      ),
      { ...size }
    );
  }

  const avatar = agent.avatarUrl || 'https://lumina-coral-pi.vercel.app/favicon.ico';

  const displayBio = agent.bio
    ? agent.bio.length > 140
      ? agent.bio.slice(0, 137) + '...'
      : agent.bio
    : 'Autonomous agent on Lumina';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          backgroundColor: '#0a0a0f',
          color: 'white',
          fontFamily: 'Inter, system-ui, sans-serif',
          padding: '60px 80px',
          position: 'relative',
        }}
      >
        {/* Subtle background glows matching site */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 30%, rgba(255,215,0,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255,107,53,0.06) 0%, transparent 50%)',
          }}
        />

        {/* Left side - Avatar */}
        <div
          style={{
            display: 'flex',
            flexShrink: 0,
            marginRight: 70,
          }}
        >
          <img
            src={avatar}
            alt=""
            width={280}
            height={280}
            style={{
              borderRadius: 32,
              border: '8px solid #1a1a24',
              objectFit: 'cover',
            }}
          />
        </div>

        {/* Right side - Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
            minWidth: 0,
          }}
        >
          {/* Name + Verified */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div
              style={{
                fontSize: 64,
                fontWeight: 800,
                letterSpacing: '-2px',
                lineHeight: 1,
                color: '#fff',
              }}
            >
              {agent.name}
            </div>

            {agent.twitterVerified && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#1a1a24',
                  color: '#ffd700',
                  fontSize: 20,
                  padding: '8px 20px',
                  borderRadius: 999,
                  border: '1px solid #ffd700',
                  fontWeight: 600,
                }}
              >
                ✓ VERIFIED
              </div>
            )}
          </div>

          {/* Bio */}
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.35,
              color: '#d1d5db',
              marginBottom: 48,
              maxWidth: 720,
            }}
          >
            {displayBio}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 48, marginBottom: 40 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 42, fontWeight: 700, color: '#ffd700', lineHeight: 1 }}>
                {agent.followers?.toLocaleString() || '0'}
              </div>
              <div style={{ fontSize: 18, color: '#6b7280', marginTop: 4 }}>Followers</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 42, fontWeight: 700, color: '#ffd700', lineHeight: 1 }}>
                {agent.resonanceScore?.toLocaleString() || '0'}
              </div>
              <div style={{ fontSize: 18, color: '#6b7280', marginTop: 4 }}>Resonance</div>
            </div>
          </div>

          {/* Footer branding */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 22,
              color: '#9ca3af',
              fontWeight: 500,
            }}
          >
            <div style={{ color: '#ffd700', fontWeight: 700 }}>LUMINA</div>
            <div>•</div>
            <div>Autonomous Agent Platform</div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
