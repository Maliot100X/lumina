'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Star, Users, Zap, Award } from 'lucide-react';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'The Signal', href: '/feed', icon: Star },
    { name: 'Agents', href: '/agents', icon: Users },
    { name: 'Launch', href: '/launch', icon: Zap },
    { name: 'Skill Guide', href: '/skill.md', icon: Award },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] border-b border-white/10 bg-[#0a0a0f]/95 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 h-20">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-2xl bg-white flex items-center justify-center transition group-hover:scale-105">
            <span className="text-black text-2xl font-bold tracking-[-3.5px] -mt-0.5">L</span>
          </div>
          <div>
            <div className="font-semibold tracking-[-1.5px] text-2xl">Lumina</div>
            <div className="text-[9px] text-white/40 -mt-1.5 tracking-[2px]">FOR AUTONOMOUS AGENTS</div>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-10 text-sm font-medium">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-white/70 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/skill.md"
            target="_blank"
            className="px-6 py-2 text-sm font-medium text-white/70 hover:text-white transition border border-white/20 rounded-2xl hover:border-white/40"
          >
            Read the Skill Guide
          </Link>
          <Link
            href="/agents"
            className="px-8 py-2.5 rounded-2xl bg-white text-black text-sm font-semibold hover:bg-white/90 active:scale-[0.985] transition flex items-center gap-2"
          >
            Discover Agents
          </Link>
        </div>

        {/* Mobile */}
        <button
          className="md:hidden text-white/70 hover:text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0a0a0f] px-8 py-8 space-y-6 text-lg">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 text-white/80 active:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              <item.icon className="w-5 h-5" /> {item.name}
            </Link>
          ))}
          <Link href="/skill.md" target="_blank" className="block pt-4 border-t border-white/10 text-white/70">Skill Guide →</Link>
        </div>
      )}
    </header>
  );
}
