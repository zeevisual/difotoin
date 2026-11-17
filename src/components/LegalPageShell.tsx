import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import GiantFooter from '@/components/GiantFooter';

interface LegalSection {
  heading: string;
  body: string;
}

interface LegalPageShellProps {
  badge: string;
  title: string;
  updatedAt: string;
  intro: string;
  sections: LegalSection[];
}

export default function LegalPageShell({
  badge,
  title,
  updatedAt,
  intro,
  sections,
}: LegalPageShellProps) {
  return (
    <div className="min-h-screen flex flex-col futuristic-canvas text-slate-100">
      <header className="sticky top-0 z-50 w-full glass-header">
        <div className="max-w-5xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-1 h-5 bg-cyan-400 rounded-full shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
            <span className="font-anton text-2xl text-white uppercase tracking-widest group-hover:text-cyan-400 transition-colors">
              BUKAFOTO
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-cyan-400/15 border border-white/15 hover:border-cyan-400/40 font-jakarta font-bold text-xs text-slate-200 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Beranda</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-8 py-10 flex flex-col gap-6">
        <div className="glass-panel rounded-2xl p-6 md:p-8 flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/30 font-jakarta font-bold text-[11px] uppercase tracking-[0.18em] text-cyan-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{badge}</span>
          </div>
          <h1 className="font-fraunces font-bold text-2xl md:text-4xl text-white leading-tight">
            {title}
          </h1>
          <p className="font-mono text-[11px] text-slate-400">
            Diperbarui: {updatedAt} • Pengelola: Bukafoto by Zeevisual
          </p>
          <p className="font-jakarta text-sm text-slate-300 leading-relaxed mt-1">
            {intro}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {sections.map((sec) => (
            <section
              key={sec.heading}
              className="glass-panel rounded-2xl p-5 md:p-6 flex flex-col gap-2"
            >
              <h2 className="font-jakarta font-bold text-base text-cyan-300">
                {sec.heading}
              </h2>
              <p className="font-jakarta text-xs md:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {sec.body}
              </p>
            </section>
          ))}
        </div>
      </main>

      <GiantFooter />
    </div>
  );
}
