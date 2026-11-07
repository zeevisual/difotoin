'use client';

import React, { useEffect, useRef } from 'react';

// Deterministic star positions so SSR and CSR match without hydration mismatch
const SMALL_STARS = Array.from({ length: 115 }, (_, i) => {
  const top = ((i * 37 + 11) % 96) + 2;
  const left = ((i * 61 + 23) % 96) + 2;
  const size = i % 7 === 0 ? 2.2 : i % 2 === 0 ? 1.4 : 1;
  const delay = ((i * 7) % 50) / 10;
  const duration = 2.0 + ((i * 11) % 35) / 10;
  const isCyan = i % 5 === 0;
  const isWarmGold = i % 8 === 0;

  return {
    id: i,
    top: `${top}%`,
    left: `${left}%`,
    size,
    delay: `${delay}s`,
    duration: `${duration}s`,
    colorClass: isCyan
      ? 'bg-sky-300 shadow-[0_0_8px_#38bdf8]'
      : isWarmGold
        ? 'bg-amber-200/90 shadow-[0_0_6px_rgba(253,230,138,0.85)]'
        : 'bg-white shadow-[0_0_5px_rgba(255,255,255,0.9)]',
  };
});

const SPARKLE_STARS = [
  { id: 'sp-1', top: '9%', left: '12%', delay: '0.4s', duration: '3.4s' },
  { id: 'sp-2', top: '16%', left: '34%', delay: '1.2s', duration: '4.1s' },
  { id: 'sp-3', top: '22%', left: '58%', delay: '2.1s', duration: '3.0s' },
  { id: 'sp-4', top: '36%', left: '8%', delay: '0.8s', duration: '3.8s' },
  { id: 'sp-5', top: '48%', left: '22%', delay: '1.7s', duration: '4.4s' },
  { id: 'sp-6', top: '11%', left: '76%', delay: '2.6s', duration: '3.2s' },
  { id: 'sp-7', top: '68%', left: '14%', delay: '0.3s', duration: '3.9s' },
  { id: 'sp-8', top: '82%', left: '26%', delay: '1.9s', duration: '3.6s' },
  { id: 'sp-9', top: '28%', left: '41%', delay: '1.1s', duration: '4.2s' },
];

export default function SpaceBackdrop() {
  const starLayerRef = useRef<HTMLDivElement | null>(null);
  const earthLayerRef = useRef<HTMLDivElement | null>(null);
  const moonLayerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(pointer: fine)');
    if (!mq.matches) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId: number;

    const onMouseMove = (e: MouseEvent) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const tick = () => {
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;

      if (starLayerRef.current) {
        starLayerRef.current.style.transform = `translate3d(${currentX * -12}px, ${currentY * -12}px, 0)`;
      }
      if (moonLayerRef.current) {
        moonLayerRef.current.style.transform = `translate3d(${currentX * -20}px, ${currentY * -16}px, 0) rotate(-15deg)`;
      }
      if (earthLayerRef.current) {
        earthLayerRef.current.style.transform = `translate3d(${currentX * 16}px, ${currentY * 12}px, 0)`;
      }

      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none bg-[#010307]"
    >
      {/* 1. Deep Space Ambient Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_62%,rgba(14,165,233,0.10)_0%,rgba(2,5,13,0.92)_48%,rgba(1,2,5,1)_100%)]" />

      {/* 2. Interactive Parallax Twinkling Starfield (115+ Crisp Vector/CSS Stars) */}
      <div
        ref={starLayerRef}
        className="absolute -inset-6 will-change-transform"
      >
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

      {/* 3. Crisp Vector Crescent Moon in High Orbit (with Depth Parallax) */}
      <div
        ref={moonLayerRef}
        className="absolute top-[14%] left-[46%] w-5 h-5 md:w-6 md:h-6 rounded-full opacity-85 will-change-transform"
        style={{
          boxShadow: 'inset -4px -2px 0 0 rgba(224, 242, 254, 0.9)',
          filter: 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.45))',
          transform: 'rotate(-15deg)',
        }}
      />

      {/* 4. SUPER-HD 4K SPHERICAL EARTH IN BOTTOM-RIGHT (100% Filled Edge-to-Edge + Slow Orbital Rotation & Parallax) */}
      <div
        ref={earthLayerRef}
        className="absolute -bottom-[34vmin] -right-[18vmin] w-[96vmin] h-[96vmin] md:w-[108vmin] md:h-[108vmin] rounded-full will-change-transform"
      >
        {/* Outer Atmospheric Cyan-Blue Halo radiating into space */}
        <div
          className="absolute -inset-3 rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 26% 24%, rgba(56, 189, 248, 0.35) 0%, rgba(14, 165, 233, 0.14) 38%, transparent 66%)',
            filter: 'blur(28px)',
          }}
        />

        {/* Main 1:1 Spherical Planet Body — Rich Ocean & Atmosphere Base so ZERO black gap at top */}
        <div
          className="relative w-full h-full rounded-full overflow-hidden"
          style={{
            background:
              'radial-gradient(circle at 25% 22%, #1e4b6b 0%, #0c2b47 32%, #051324 58%, #010409 85%)',
            boxShadow:
              '-10px -10px 48px rgba(56, 189, 248, 0.36), -2px -2px 14px rgba(186, 230, 253, 0.5), inset 18px 18px 52px rgba(56, 189, 248, 0.48), inset 3px 3px 12px rgba(224, 242, 254, 0.72)',
          }}
        >
          {/* Layer A: Full-Frame 4K Satellite Cloud & Cyclone Swirl Texture (Slowly Drifting Clouds!) */}
          <img
            src="https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=3840&q=100"
            alt=""
            className="w-full h-full object-cover object-center scale-115 opacity-60 brightness-[0.68] contrast-125 saturate-90 animate-earth-clouds"
          />

          {/* Layer B: 4K NASA Earth Continents & Clouds shifted up so clouds fill the top curve */}
          <img
            src="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=3840&q=100"
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-bottom scale-[1.65] translate-y-[-14%] opacity-45 brightness-[0.65] contrast-125 mix-blend-lighten"
          />

          {/* Layer C: 3D Spherical Atmospheric Cyan-Blue Scattering right up to the top-left curve */}
          <div
            className="absolute inset-0 rounded-full mix-blend-screen"
            style={{
              background:
                'radial-gradient(circle at 20% 18%, rgba(125, 211, 252, 0.42) 0%, rgba(56, 189, 248, 0.22) 26%, rgba(14, 165, 233, 0.08) 46%, transparent 65%)',
            }}
          />

          {/* Layer D: Deep Day-to-Night Terminator Shadow (Darkens Bottom-Right of Globe smoothly) */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                'radial-gradient(circle at 20% 18%, rgba(1, 5, 14, 0.15) 0%, rgba(2, 6, 15, 0.58) 34%, rgba(1, 3, 8, 0.92) 60%, #010307 80%)',
            }}
          />
        </div>

        {/* Razor-Sharp Vector Atmospheric Rim Line on the Sunlit Upper-Left Curve */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            borderTop: '1.5px solid rgba(186, 230, 253, 0.68)',
            borderLeft: '1.5px solid rgba(125, 211, 252, 0.58)',
            maskImage:
              'linear-gradient(135deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.68) 30%, transparent 54%)',
            WebkitMaskImage:
              'linear-gradient(135deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.68) 30%, transparent 54%)',
          }}
        />
      </div>

      {/* 5. Subtle Shooting Star across the deep space sky */}
      <div className="shooting-star" />
    </div>
  );
}
