'use client';

import React from 'react';

// Deterministic star positions so SSR and CSR match without hydration mismatch
const SMALL_STARS = Array.from({ length: 95 }, (_, i) => {
  const top = ((i * 37 + 11) % 96) + 2;
  const left = ((i * 61 + 23) % 96) + 2;
  const size = i % 6 === 0 ? 2.2 : i % 2 === 0 ? 1.5 : 1;
  const delay = ((i * 7) % 50) / 10;
  const duration = 2.0 + ((i * 11) % 35) / 10;
  const isCyan = i % 5 === 0;
  const isWarmGold = i % 9 === 0;

  return {
    id: i,
    top: `${top}%`,
    left: `${left}%`,
    size,
    delay: `${delay}s`,
    duration: `${duration}s`,
    colorClass: isCyan
      ? 'bg-cyan-300 shadow-[0_0_8px_#38bdf8]'
      : isWarmGold
        ? 'bg-amber-200/90 shadow-[0_0_6px_rgba(253,230,138,0.8)]'
        : 'bg-white shadow-[0_0_5px_rgba(255,255,255,0.9)]',
  };
});

const SPARKLE_STARS = [
  { id: 'sp-1', top: '9%', left: '12%', delay: '0.4s', duration: '3.4s' },
  { id: 'sp-2', top: '16%', left: '34%', delay: '1.2s', duration: '4.1s' },
  { id: 'sp-3', top: '24%', left: '62%', delay: '2.1s', duration: '3.0s' },
  { id: 'sp-4', top: '36%', left: '8%', delay: '0.8s', duration: '3.8s' },
  { id: 'sp-5', top: '48%', left: '22%', delay: '1.7s', duration: '4.4s' },
  { id: 'sp-6', top: '12%', left: '78%', delay: '2.6s', duration: '3.2s' },
  { id: 'sp-7', top: '68%', left: '14%', delay: '0.3s', duration: '3.9s' },
  { id: 'sp-8', top: '82%', left: '28%', delay: '1.9s', duration: '3.6s' },
  { id: 'sp-9', top: '29%', left: '44%', delay: '1.1s', duration: '4.2s' },
];

export default function SpaceBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none bg-[#02050A]"
    >
      {/* 1. Authentic Spherical Earth from Space Background (Proportional 1:1, Never Squashed) */}
      <img
        src="/space-earth-bg.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-right-bottom opacity-95"
      />

      {/* 2. Subtle Spherical Atmospheric Glow on the Round Earth Limb (1:1 aspect-square circle) */}
      <div
        className="absolute -bottom-[32vh] -right-[18vw] w-[85vmin] h-[85vmin] rounded-full pointer-events-none opacity-45"
        style={{
          boxShadow:
            '-18px -18px 90px rgba(56, 189, 248, 0.38), -4px -4px 30px rgba(125, 211, 252, 0.35)',
        }}
      />

      {/* Soft dark vignette on top-left so typography & glass cards remain super crisp */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#02050A]/65 via-transparent to-[#02050A]/35" />

      {/* 3. Animated Twinkling Tiny Stars (Bintang Kecil Kelap-Kelip) */}
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
            <span className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-sky-200 to-transparent" />
            <span className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-sky-200 to-transparent" />
            <span className="w-1 h-1 rounded-full bg-white shadow-[0_0_8px_#38bdf8]" />
          </div>
        ))}
      </div>

      {/* 4. Subtle Shooting Star across the deep space sky */}
      <div className="shooting-star" />
    </div>
  );
}
