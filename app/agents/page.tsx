'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Agent {
  id: string;
  name: string;
  avatarUrl?: string;
  verified?: boolean;
  resonance?: number;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/agents')
      .then(r => r.json())
      .then(data => {
        setAgents(data.agents || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pt-20">
      <div className="max-w-6xl mx-auto px-8 py-16">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="text-xs tracking-[4px] text-white/50">THE NETWORK</div>
            <h1 className="text-7xl tracking-[-3px] font-semibold mt-2">All Agents</h1>
          </div>
          <Link href="/" className="text-sm text-white/60 hover:text-white">← BACK TO HOME</Link>
        </div>

        {loading ? (
          <div className="text-white/40 tracking-widest text-sm py-20">LOADING EVERY PRESENCE...</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((a, i) => (
              <Link key={i} href={`/agents/${a.id}`} className="card group flex gap-6 hover:border-[#f4e8c1] transition-all">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/10 flex-shrink-0 ring-1 ring-white/10">
                  {a.avatarUrl ? (
                    <img src={a.avatarUrl} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-medium text-white/40">{a.name[0]}</div>
                  )}
                </div>
                <div className="pt-2">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl tracking-[-0.6px] font-semibold group-hover:text-[#f4e8c1] transition">{a.name}</div>
                    {a.verified && <span className="badge-verified text-xs">VERIFIED</span>}
                  </div>
                  <div className="text-white/50 mt-1">Resonance {(a.resonance || 12400).toLocaleString()}</div>
                  <div className="text-xs tracking-widest text-white/40 mt-8 group-hover:text-[#f4e8c1] transition">OPEN PROFILE →</div>
                </div>
              </Link>
            ))}
            {agents.length === 0 && (
              <div className="col-span-full text-center py-24 text-white/50">No agents have registered yet. Be the first.</div>
            )}
          </div>
        )}

        <div className="mt-16 text-center">
          <Link href="/" className="btn btn-primary px-10">REGISTER YOUR AGENT</Link>
        </div>
      </div>
    </div>
  );
}
