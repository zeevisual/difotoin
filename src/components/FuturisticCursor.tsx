'use client';

import React, { useEffect, useRef, useState } from 'react';

const PARTICLE_POOL_SIZE = 8;
const RIPPLE_POOL_SIZE = 4;

export default function FuturisticCursor() {
  const [isFinePointer, setIsFinePointer] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const auraRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const dotInnerRef = useRef<HTMLSpanElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const ringBoxRef = useRef<HTMLDivElement | null>(null);
  const crosshairRef = useRef<HTMLSpanElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);

  const particleRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const rippleRefs = useRef<Array<HTMLSpanElement | null>>([]);

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

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let isVisible = false;
    let isRunning = false;
    let rafId = 0;

    let currentHoverInteractive = false;
    let currentLabel: string | null = null;
    let currentMouseDown = false;
    let lastTarget: EventTarget | null = null;

    let lastParticleAt = 0;
    let particleIdx = 0;
    let rippleIdx = 0;

    const applyVisualState = () => {
      const ringBox = ringBoxRef.current;
      const crosshair = crosshairRef.current;
      const labelEl = labelRef.current;
      const dotInner = dotInnerRef.current;
      if (!ringBox || !dotInner) return;

      const downScale = currentMouseDown ? ' scale(0.78)' : '';

      if (currentLabel) {
        ringBox.className =
          'relative flex items-center justify-center rounded-full px-2.5 py-1 h-7 min-w-[52px] bg-[#040B14]/92 border border-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.4)] transition-[width,height,background-color,border-color] duration-150';
        ringBox.style.transform = downScale.trim();
        if (crosshair) crosshair.style.display = 'none';
        if (labelEl) {
          labelEl.textContent = currentLabel;
          labelEl.style.display = 'block';
        }
        dotInner.className =
          'block w-1 h-1 rounded-full bg-cyan-200 opacity-50';
      } else if (currentHoverInteractive) {
        ringBox.className =
          'relative flex items-center justify-center rounded-full w-11 h-11 border border-cyan-300/90 bg-cyan-400/10 shadow-[0_0_16px_rgba(34,211,238,0.3)] transition-[width,height,background-color,border-color] duration-150';
        ringBox.style.transform = downScale.trim();
        if (crosshair) {
          crosshair.style.display = 'block';
          crosshair.style.opacity = '0.9';
        }
        if (labelEl) labelEl.style.display = 'none';
        dotInner.className =
          'block w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#22d3ee]';
      } else {
        ringBox.className =
          'relative flex items-center justify-center rounded-full w-7 h-7 border border-cyan-400/45 bg-transparent transition-[width,height,background-color,border-color] duration-150';
        ringBox.style.transform = downScale.trim();
        if (crosshair) {
          crosshair.style.display = 'block';
          crosshair.style.opacity = '0.35';
        }
        if (labelEl) labelEl.style.display = 'none';
        dotInner.className =
          'block w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee]';
      }
    };

    const tick = () => {
      const dx = mouseX - ringX;
      const dy = mouseY - ringY;

      // Snappy 0.38 spring lerp so outer ring feels responsive with zero sluggishness
      ringX += dx * 0.38;
      ringY += dy * 0.38;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      }
      if (auraRef.current) {
        auraRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      }

      // Auto-sleep rAF loop as soon as ring settles onto pointer
      if (Math.abs(dx) > 0.12 || Math.abs(dy) > 0.12) {
        rafId = requestAnimationFrame(tick);
      } else {
        isRunning = false;
      }
    };

    const startLoop = () => {
      if (!isRunning) {
        isRunning = true;
        rafId = requestAnimationFrame(tick);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        ringX = mouseX;
        ringY = mouseY;
        if (containerRef.current) {
          containerRef.current.style.opacity = '1';
        }
      }

      // 0ms immediate update on precision core dot (zero frame delay!)
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      }

      startLoop();

      // Only query DOM ancestry when crossing onto a different element
      if (e.target !== lastTarget) {
        lastTarget = e.target;
        const target = e.target as HTMLElement | null;
        let nextLabel: string | null = null;
        let nextInteractive = false;

        if (target && typeof target.closest === 'function') {
          const labeledEl = target.closest('[data-cursor]');
          if (labeledEl) {
            nextLabel = labeledEl.getAttribute('data-cursor');
            nextInteractive = true;
          } else {
            nextInteractive = Boolean(
              target.closest(
                'a, button, input, select, textarea, label, [role="button"]'
              )
            );
          }
        }

        if (
          nextLabel !== currentLabel ||
          nextInteractive !== currentHoverInteractive
        ) {
          currentLabel = nextLabel;
          currentHoverInteractive = nextInteractive;
          applyVisualState();
        }
      }

      // Zero-React-render pooled stardust particle (throttled every 90ms)
      const now = performance.now();
      if (now - lastParticleAt > 90) {
        lastParticleAt = now;
        const pEl = particleRefs.current[particleIdx % PARTICLE_POOL_SIZE];
        particleIdx++;
        if (pEl && typeof pEl.animate === 'function') {
          const jx = mouseX + (Math.random() - 0.5) * 8;
          const jy = mouseY + (Math.random() - 0.5) * 8;
          pEl.style.left = `${jx}px`;
          pEl.style.top = `${jy}px`;
          pEl.animate(
            [
              {
                transform: 'translate(-50%, -50%) scale(1)',
                opacity: 0.75,
              },
              {
                transform: 'translate(-50%, calc(-50% + 10px)) scale(0)',
                opacity: 0,
              },
            ],
            { duration: 420, easing: 'ease-out', fill: 'forwards' }
          );
        }
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      currentMouseDown = true;
      applyVisualState();

      const rEl = rippleRefs.current[rippleIdx % RIPPLE_POOL_SIZE];
      rippleIdx++;
      if (rEl && typeof rEl.animate === 'function') {
        rEl.style.left = `${e.clientX}px`;
        rEl.style.top = `${e.clientY}px`;
        rEl.animate(
          [
            {
              transform: 'translate(-50%, -50%) scale(0.45)',
              opacity: 0.9,
            },
            {
              transform: 'translate(-50%, -50%) scale(3.6)',
              opacity: 0,
            },
          ],
          {
            duration: 520,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            fill: 'forwards',
          }
        );
      }
    };

    const onPointerUp = () => {
      currentMouseDown = false;
      applyVisualState();
    };

    const onMouseLeave = () => {
      isVisible = false;
      if (containerRef.current) {
        containerRef.current.style.opacity = '0';
      }
    };

    applyVisualState();

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);

    return () => {
      cancelAnimationFrame(rafId);
      document.documentElement.classList.remove('has-futuristic-cursor');
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [isFinePointer]);

  if (!isFinePointer) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden transition-opacity duration-150"
    >
      {/* GPU-Translated Ambient Glow (Zero full-screen gradient repaint!) */}
      <div
        ref={auraRef}
        style={{
          background:
            'radial-gradient(circle, rgba(34, 211, 238, 0.06) 0%, transparent 70%)',
        }}
        className="fixed top-0 left-0 w-[300px] h-[300px] rounded-full pointer-events-none will-change-transform"
      />

      {/* Pre-allocated Pooled Stardust Nodes (Zero React re-renders!) */}
      {Array.from({ length: PARTICLE_POOL_SIZE }).map((_, i) => (
        <span
          key={`p-${i}`}
          ref={(el) => {
            particleRefs.current[i] = el;
          }}
          style={{ opacity: 0, left: -100, top: -100 }}
          className="fixed w-1 h-1 rounded-full bg-cyan-300 pointer-events-none will-change-transform"
        />
      ))}

      {/* Pre-allocated Pooled Click Sonar Nodes (Zero React re-renders!) */}
      {Array.from({ length: RIPPLE_POOL_SIZE }).map((_, i) => (
        <span
          key={`r-${i}`}
          ref={(el) => {
            rippleRefs.current[i] = el;
          }}
          style={{ opacity: 0, left: -100, top: -100 }}
          className="fixed w-4 h-4 rounded-full border border-cyan-300/80 pointer-events-none will-change-transform"
        />
      ))}

      {/* Snappy Outer Magnetic Orbital HUD Ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 will-change-transform flex items-center justify-center"
      >
        <div ref={ringBoxRef}>
          <span
            ref={crosshairRef}
            className="absolute -inset-1 rounded-full border border-dashed border-cyan-300/50 animate-spin-slow"
          />
          <span
            ref={labelRef}
            style={{ display: 'none' }}
            className="font-mono font-bold text-[10px] tracking-[0.18em] text-cyan-300 uppercase whitespace-nowrap"
          />
        </div>
      </div>

      {/* 0ms Instant Precision Laser Core Dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 will-change-transform flex items-center justify-center"
      >
        <span ref={dotInnerRef} />
      </div>
    </div>
  );
}
