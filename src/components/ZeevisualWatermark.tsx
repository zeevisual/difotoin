'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function ZeevisualWatermark() {
  return (
    <div className="fixed bottom-3.5 left-3.5 z-40 pointer-events-auto select-none">
      <Link
        href="/"
        data-cursor="ZEEVISUAL"
        className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#040812]/75 hover:bg-[#071120]/90 backdrop-blur-xl border border-white/10 hover:border-cyan-400/50 shadow-[0_4px_24px_rgba(0,0,0,0.45)] transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.25)]"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
        </span>
        <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-slate-400 group-hover:text-slate-200 transition-colors">
          Crafted by{' '}
          <strong className="text-white group-hover:text-cyan-300 font-bold transition-colors">
            Zeevisual
          </strong>
        </span>
        <Sparkles className="w-3 h-3 text-cyan-400/70 group-hover:text-cyan-300 group-hover:rotate-12 transition-all" />
      </Link>
    </div>
  );
}
