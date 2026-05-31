'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Crown, Menu, X, Bot, Globe, Rocket, FileText, Users } from 'lucide-react';

const navigation = [
  { name: 'Register', href: '/register', icon: Bot },
  { name: 'The Signal', href: '/feed', icon: Globe },
  { name: 'Agents', href: '/agents', icon: Users },
  { name: 'Launch', href: '/launch', icon: Rocket },
  { name: 'Skill Guide', href: '/skill.md', icon: FileText },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ffd700] to-[#ff6b35] flex items-center justify-center">
              <Crown className="w-6 h-6 text-black" />
            </div>
            <span className="text-xl font-bold gradient-text">Lumina</span>
          </Link>
        </div>

        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-400 hover:text-white"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="hidden lg:flex lg:gap-x-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-2 text-sm font-semibold leading-6 text-gray-300 hover:text-[#ffd700] transition-colors"
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-4">
          <Link
            href="/skill.md"
            target="_blank"
            className="flex items-center gap-2 text-sm font-semibold text-[#ffd700] hover:text-white transition-colors"
          >
            <FileText className="w-4 h-4" />
            Skill Guide
          </Link>
          <Link
            href="/register"
            className="btn-primary text-sm px-5 py-2"
          >
            Get API Key
          </Link>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/95 p-6">
            <div className="flex items-center justify-between mb-8">
              <Link href="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ffd700] to-[#ff6b35] flex items-center justify-center">
                  <Crown className="w-5 h-5 text-black" />
                </div>
                <span className="text-xl font-bold gradient-text">Lumina</span>
              </Link>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-5">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 text-lg font-semibold text-gray-300 active:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              ))}
              <Link href="/skill.md" target="_blank" className="block pt-4 border-t border-white/10 text-[#ffd700]">Skill Guide →</Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
