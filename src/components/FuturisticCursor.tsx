'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

interface StarParticle {
  id: number;
  x: number;
  y: number;
  size: number;
}

export default function FuturisticCursor() {
  const [isFinePointer, setIsFinePointer] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [cursorLabel, setCursorLabel] = useState<string | null>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [particles, setParticles] = useState<StarParticle[]>([]);

  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);

  const mousePos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const lastParticleTime = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(pointer: fine)');
    setIsFinePointer(mq.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsFinePointer(e.matches);
    };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!isFinePointer || typeof window === 'undefined') return;

    document.documentElement.classList.add('has-futuristic-cursor');

    let rafId: number;

    const animate = () => {
      // Smooth spring lerp for outer orbital ring
      ringPos.current.x += (mousePos.current.x - ringPos.current.x) * 0.18;
      ringPos.current.y += (mousePos.current.y - ringPos.current.y) * 0.18;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mousePos.current.x}px, ${mousePos.current.y}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0) translate(-50%, -50%)`;
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    const onMouseMove = (e: MouseEvent) => {
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;
      if (!isVisible) setIsVisible(true);

      // Update CSS variables for interactive card spotlight borders
      document.documentElement.style.setProperty('--cursor-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--cursor-y', `${e.clientY}px`);

      // Inspect hovered element for cursor state & custom label
      const target = e.target as HTMLElement | null;
      if (target) {
        const labeledEl = target.closest('[data-cursor]') as HTMLElement | null;
        if (labeledEl) {
          setCursorLabel(labeledEl.getAttribute('data-cursor'));
          setIsHoveringInteractive(true);
        } else {
          setCursorLabel(null);
          const interactiveEl = target.closest(
            'a, button, input, select, textarea, label, [role="button"]'
          );
          setIsHoveringInteractive(Boolean(interactiveEl));
        }
      }

      // Spawn subtle cosmic stardust particle throttled every ~55ms on movement
      const now = performance.now();
      if (now - lastParticleTime.current > 55) {
        lastParticleTime.current = now;
        const id = now + Math.random();
        const size = Math.random() > 0.5 ? 3 : 2;
        setParticles((prev) => [
          ...prev.slice(-12),
          {
            id,
            x: e.clientX + (Math.random() - 0.5) * 10,
            y: e.clientY + (Math.random() - 0.5) * 10,
            size,
          },
        ]);
        setTimeout(() => {
          setParticles((prev) => prev.filter((p) => p.id !== id));
        }, 550);
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      setIsMouseDown(true);
      const id = Date.now() + Math.random();
      setRipples((prev) => [
        ...prev.slice(-4),
        { id, x: e.clientX, y: e.clientY },
      ]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 650);
    };

    const onMouseUp = () => {
      setIsMouseDown(false);
    };

    const onMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseLeave);

    return () => {
      cancelAnimationFrame(rafId);
      document.documentElement.classList.remove('has-futuristic-cursor');
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [isFinePointer, isVisible]);

  if (!isFinePointer) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[9999] pointer-events-none overflow-hidden transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Subtle Ambient Cursor Spotlight Aura */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(380px circle at var(--cursor-x, -200px) var(--cursor-y, -200px), rgba(34, 211, 238, 0.055), transparent 70%)',
        }}
      />

      {/* Ephemeral Cosmic Stardust Trail */}
      {particles.map((p) => (
        <span
          key={p.id}
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
          }}
          className="fixed -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/80 shadow-[0_0_8px_#22d3ee] animate-cursor-stardust"
        />
      ))}

      {/* Click Sonar Shockwaves */}
      {ripples.map((r) => (
        <span
          key={r.id}
          style={{ left: r.x, top: r.y }}
          className="fixed -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-cyan-300/80 shadow-[0_0_16px_rgba(34,211,238,0.6)] animate-cursor-ripple"
        />
      ))}

      {/* Outer Magnetic Orbital HUD Ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 will-change-transform flex items-center justify-center"
      >
        <div
          className={`relative flex items-center justify-center rounded-full transition-all duration-300 ease-out ${
            cursorLabel
              ? 'px-3 py-1.5 h-8 min-w-[58px] bg-[#040B14]/85 backdrop-blur-md border border-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.5)] scale-100'
              : isHoveringInteractive
                ? 'w-12 h-12 border border-cyan-300/90 bg-cyan-400/10 shadow-[0_0_22px_rgba(34,211,238,0.35)]'
                : 'w-8 h-8 border border-cyan-400/45 bg-transparent'
          } ${isMouseDown ? 'scale-75' : ''}`}
        >
          {/* Rotating Orbital Crosshair Ring when hovering interactive elements */}
          {!cursorLabel && (
            <span
              className={`absolute -inset-1 rounded-full border border-dashed transition-opacity duration-300 animate-spin-slow ${
                isHoveringInteractive
                  ? 'border-cyan-300/60 opacity-100'
                  : 'border-white/20 opacity-40'
              }`}
            />
          )}

          {cursorLabel && (
            <span className="font-mono font-bold text-[10px] tracking-[0.18em] text-cyan-300 uppercase whitespace-nowrap">
              {cursorLabel}
            </span>
          )}
        </div>
      </div>

      {/* Inner Precision Laser Core Dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 will-change-transform flex items-center justify-center"
      >
        <span
          className={`block rounded-full transition-all duration-150 ${
            cursorLabel
              ? 'w-1 h-1 bg-cyan-200 opacity-40'
              : isHoveringInteractive
                ? 'w-2 h-2 bg-white shadow-[0_0_12px_#22d3ee,0_0_4px_#fff]'
                : 'w-2 h-2 bg-cyan-300 shadow-[0_0_10px_#22d3ee]'
          } ${isMouseDown ? 'scale-150 bg-white' : ''}`}
        />
      </div>
    </div>
  );
}
