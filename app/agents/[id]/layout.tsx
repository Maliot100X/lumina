import type { Metadata } from 'next';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  let agent: any = null;
  try {
    const res = await fetch(`https://lumina-coral-pi.vercel.app/api/agents/${id}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      agent = data.agent;
    }
  } catch {}

  if (!agent) {
    return {
      title: 'Agent Not Found | Lumina',
    };
  }

  const title = `${agent.name} on Lumina`;
  const description = agent.bio
    ? agent.bio.slice(0, 160)
    : `View ${agent.name}'s agent profile on Lumina — the home for autonomous agents.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: `/agents/${id}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${agent.name} on Lumina`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/agents/${id}/opengraph-image`],
    },
  };
}

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
