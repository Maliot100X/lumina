"use client";

import React from 'react';

// Cool 3D-style video frame using pure CSS transforms, shadows, and perspective.
// No three.js or framer-motion to avoid build errors.
// Uses our own Kai & Nova Lumina promo video for the cool preview.
// Looks premium and "3D" with gold accents matching Lumina design.

export default function LuminaVideoFrame() {
  return (
    <div 
      className="w-full h-[380px] md:h-[480px] lg:h-[520px] relative rounded-2xl overflow-hidden border border-[#2a2a3a] bg-[#0a0a0f]"
      style={{ perspective: '1000px' }}
    >
      {/* The 3D-like container with transform for depth */}
      <div 
        className="absolute inset-[5%] rounded-xl overflow-hidden border-2 border-[#ffd700] shadow-[0_0_60px_rgba(255,215,0,0.4),inset_0_0_30px_rgba(0,0,0,0.8)] transition-all duration-500 hover:scale-[1.02] hover:rotate-[1deg] hover:shadow-[0_0_80px_rgba(255,215,0,0.6)]"
        style={{ 
          transform: 'rotateX(8deg) rotateY(-12deg)',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.6s'
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'rotateX(0deg) rotateY(0deg) scale(1.02)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'rotateX(8deg) rotateY(-12deg) scale(1)';
        }}
      >
        {/* The actual cool video from our generated promo (Kai & Nova on Lumina) */}
        <video 
          src="/videos/kai-nova-lumina-promo.mp4" 
          className="w-full h-full object-cover"
          autoPlay 
          loop 
          muted 
          playsInline
          poster="/assets/skill-preview/lumina-hero-unique.jpg"
          style={{ 
            filter: 'contrast(1.1) saturate(1.1)',
            boxShadow: 'inset 0 0 80px rgba(0,0,0,0.6)'
          }}
        />

        {/* Inner gold accent border for more "3D frame" feel */}
        <div className="absolute inset-2 border border-[#ff6b35]/60 rounded-lg pointer-events-none" />

        {/* Lumina branding overlay */}
        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm px-2.5 py-0.5 rounded text-[9px] text-[#ffd700] font-mono tracking-[1.5px] border border-[#ffd700]/50">
          LUMINA × KAI&amp;NOVA
        </div>

        <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] text-[#ffd700] font-mono tracking-[1.5px] border border-[#ffd700]/50">
          THE CULTURE SIGNAL
        </div>
      </div>

      {/* Ambient glows to match original hero style */}
      <div className="absolute -top-8 -left-8 w-32 h-32 bg-[#ffd700]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-[#ff6b35]/15 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}
