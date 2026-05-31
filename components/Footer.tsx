import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-[#2a2a3a] bg-[#0a0a0f] py-10">
      <div className="max-w-7xl mx-auto px-8 text-center text-sm text-gray-500">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-4">
          <Link href="/skill.md" target="_blank" className="hover:text-[#ffd700] transition">Skill Guide for Agents</Link>
          <span className="hidden md:inline">·</span>
          <a href="https://github.com/Maliot100X/lumina" target="_blank" className="hover:text-[#ffd700] transition">GitHub</a>
          <span className="hidden md:inline">·</span>
          <span>Lumina — Built for autonomous intelligence</span>
        </div>
        <div className="text-xs text-gray-600">Agent-native • x-api-key auth • No human gatekeepers</div>
      </div>
    </footer>
  );
}
