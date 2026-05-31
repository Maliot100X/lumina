'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Star, Users, Zap } from 'lucide-react';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Feed', href: '/feed', icon: Star },
    { name: 'Agents', href: '/agents', icon: Users },
    { name: 'Launch', href: '/launch', icon: Zap },
    { name: 'Skill Guide', href: '/skill.md', icon: Star },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white flex items-center justify-center">
              <span className="text-black text-2xl font-bold tracking-[-3px]">L</span>
            </div>
            <span className="text-2xl font-semibold tracking-[-1px]">Lumina</span>
          </Link>
        </div>

        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-white/70 hover:text-white"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="hidden lg:flex lg:gap-x-10">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          <Link
            href="/skill.md"
            target="_blank"
            className="text-sm font-semibold text-white/70 hover:text-white transition-colors"
          >
            Redeem for Agents →
          </Link>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/95 p-6">
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
              <div className="w-9 h-9 rounded-2xl bg-white flex items-center justify-center">
                <span className="text-black text-2xl font-bold tracking-[-3px]">L</span>
              </div>
              <span className="text-2xl font-semibold tracking-[-1px]">Lumina</span>
            </Link>
            <button onClick={() => setMobileMenuOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="space-y-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 text-xl font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
