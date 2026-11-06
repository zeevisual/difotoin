import React from 'react';
import Link from 'next/link';

interface GiantFooterProps {
  studioName?: string;
  studioSlug?: string;
}

export function GiantFooter({
  studioName = 'Zeevisual',
  studioSlug = 'zeevisual',
}: GiantFooterProps) {
  return (
    <footer className="w-full bg-[#07090D]/90 backdrop-blur-xl border-t border-white/10 pt-12 pb-8 px-4 md:px-10 mt-20 relative overflow-hidden select-none">
      {/* Subtle top ambient glow line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

      <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
        <span className="font-jakarta font-semibold text-[11px] tracking-[0.3em] text-slate-400 uppercase mb-4">
          DIFOTOIN × {studioName.toUpperCase()} • DIGITAL ARCHIVE SYSTEM
        </span>

        {/* Translucent Futuristic Giant Typography */}
        <div className="w-full border-b border-white/10 pb-4 my-1">
          <h2
            className="font-anton uppercase tracking-[0.08em] leading-[0.88] w-full text-center bg-gradient-to-b from-white/25 to-white/[0.03] bg-clip-text text-transparent"
            style={{
              fontSize: 'clamp(3.8rem, 14vw, 10.5rem)',
            }}
          >
            DIFOTOIN
          </h2>
        </div>

        {/* Clean 3-Column Futuristic Footer Bar (Inspired by Reference Image 2) */}
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 pt-6 font-jakarta text-xs tracking-wider text-slate-400">
          <div className="flex items-center gap-2 text-white font-semibold uppercase tracking-[0.18em]">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
            <span>{studioName.toUpperCase()}</span>
          </div>

          <div className="text-center text-slate-400">
            Client Photo Proofing &amp; Lightroom Workflow —{' '}
            <span className="text-white font-semibold">Difotoin Studio</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 text-slate-300 uppercase tracking-widest text-[11px]">
            <Link
              href="/studio/dashboard"
              className="hover:text-cyan-400 transition-colors"
            >
              Studio
            </Link>
            <Link
              href={`/${studioSlug}/aida-fitri-harahab`}
              className="hover:text-cyan-400 transition-colors"
            >
              Proofing
            </Link>
            <Link
              href="/aida-fitri-harahab?t=mhttesqg7rjx"
              className="hover:text-cyan-400 transition-colors"
            >
              Album
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default GiantFooter;
