'use client';

import React from 'react';

// Deterministic star positions so SSR and CSR match without hydration mismatch
const SMALL_STARS = Array.from({ length: 85 }, (_, i) => {
  const top = ((i * 37 + 13) % 98) + 1;
  const left = ((i * 61 + 29) % 98) + 1;
  const size = i % 5 === 0 ? 2.5 : i % 2 === 0 ? 1.5 : 1;
  const delay = ((i * 7) % 50) / 10;
  const duration = 2.2 + ((i * 11) % 35) / 10;
  const isCyan = i % 6 === 0;
  const isWarm = i % 11 === 0;

  return {
    id: i,
    top: `${top}%`,
    left: `${left}%`,
    size,
    delay: `${delay}s`,
    duration: `${duration}s`,
    colorClass: isCyan
      ? 'bg-cyan-300 shadow-[0_0_8px_#22d3ee]'
      : isWarm
        ? 'bg-purple-200 shadow-[0_0_6px_#c084fc]'
        : 'bg-white shadow-[0_0_5px_rgba(255,255,255,0.85)]',
  };
});

const SPARKLE_STARS = [
  { id: 'sp-1', top: '8%', left: '14%', delay: '0.4s', duration: '3.4s' },
  { id: 'sp-2', top: '15%', left: '78%', delay: '1.2s', duration: '4.1s' },
  { id: 'sp-3', top: '26%', left: '88%', delay: '2.1s', duration: '3.0s' },
  { id: 'sp-4', top: '34%', left: '9%', delay: '0.8s', duration: '3.8s' },
  { id: 'sp-5', top: '52%', left: '18%', delay: '1.7s', duration: '4.4s' },
  { id: 'sp-6', top: '64%', left: '84%', delay: '2.6s', duration: '3.2s' },
  { id: 'sp-7', top: '79%', left: '12%', delay: '0.3s', duration: '3.9s' },
  { id: 'sp-8', top: '86%', left: '72%', delay: '1.9s', duration: '3.6s' },
  { id: 'sp-9', top: '19%', left: '46%', delay: '1.1s', duration: '4.2s' },
  { id: 'sp-10', top: '44%', left: '92%', delay: '0.6s', duration: '3.5s' },
];

export default function SpaceBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none bg-[#05070B]"
    >
      {/* 1. Deep Cosmic Nebula Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(14,165,233,0.18)_0%,rgba(88,28,135,0.10)_38%,rgba(5,7,11,0.96)_75%)]" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1100px] h-[520px] rounded-full bg-gradient-to-r from-cyan-500/15 via-sky-400/20 to-fuchsia-500/15 blur-[130px]" />
      <div className="absolute bottom-[-180px] left-1/2 -translate-x-1/2 w-[1200px] h-[480px] rounded-full bg-gradient-to-r from-indigo-500/15 via-cyan-500/15 to-emerald-400/10 blur-[140px]" />

      {/* 2. Earth From Outer Space — Glowing Planetary Horizon & City Lights */}
      <div className="absolute top-[6vh] left-1/2 -translate-x-1/2 w-[150vw] sm:w-[130vw] md:w-[115vw] max-w-[1750px] aspect-[2.1/1] rounded-[100%] overflow-hidden opacity-55">
        {/* NASA Earth from Orbit Texture */}
        <img
          src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2000&q=85"
          alt=""
          className="w-full h-full object-cover object-top scale-105 mix-blend-screen opacity-75"
        />
        {/* Atmospheric Blue/Cyan Rim Glow on Earth's Curvature */}
        <div
          className="absolute inset-0 rounded-[100%]"
          style={{
            boxShadow:
              'inset 0 22px 75px rgba(56, 189, 248, 0.55), inset 0 4px 20px rgba(255, 255, 255, 0.45)',
          }}
        />
        {/* Smooth Fade into Deep Space */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#05070B]/70 to-[#05070B]" />
      </div>

      {/* Subtle Planetary Horizon Arc Glow Line */}
      <div
        className="absolute top-[6vh] left-1/2 -translate-x-1/2 w-[150vw] sm:w-[130vw] md:w-[115vw] max-w-[1750px] aspect-[2.1/1] rounded-[100%] border-t border-cyan-300/35"
        style={{
          boxShadow:
            '0 -18px 80px rgba(34, 211, 238, 0.35), 0 -4px 25px rgba(168, 85, 247, 0.25)',
        }}
      />

      {/* 3. Twinkling Tiny Starfield (Bintang-Bintang Kecil Kelap-Kelip) */}
      <div className="absolute inset-0">
        {SMALL_STARS.map((star) => (
          <span
            key={star.id}
            style={{
              top: star.top,
              left: star.left,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: star.delay,
              animationDuration: star.duration,
            }}
            className={`absolute rounded-full animate-twinkle ${star.colorClass}`}
          />
        ))}

        {/* 4-Point Cross Sparkle Stars */}
        {SPARKLE_STARS.map((sp) => (
          <div
            key={sp.id}
            style={{
              top: sp.top,
              left: sp.left,
              animationDelay: sp.delay,
              animationDuration: sp.duration,
            }}
            className="absolute w-3 h-3 flex items-center justify-center animate-twinkle-sparkle"
          >
            <span className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-200 to-transparent" />
            <span className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-cyan-200 to-transparent" />
            <span className="w-1 h-1 rounded-full bg-white shadow-[0_0_8px_#22d3ee]" />
          </div>
        ))}
      </div>

      {/* 4. Subtle Shooting Star / Orbital Light Streak */}
      <div className="shooting-star" />
    </div>
  );
}
