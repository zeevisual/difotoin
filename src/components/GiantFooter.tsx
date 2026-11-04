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
    <footer className="w-full bg-cream border-t-[1.5px] border-espresso pt-10 pb-8 px-4 md:px-10 mt-16 relative overflow-hidden select-none">
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Clean Minimal Subtitle */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border-[1.5px] border-espresso mb-3">
          <span className="font-anton text-[11px] tracking-[0.14em] text-espresso uppercase">
            DIFOTOIN × {studioName.toUpperCase()} • CLIENT PROOFING &amp; DIGITAL ALBUM
          </span>
        </div>

        {/* Full-Width Ultra-Bold Condensed DIFOTOIN Text in #871F1B */}
        <div className="w-full border-b-[1.5px] border-espresso/20 pb-3 my-1">
          <h2
            className="font-anton text-[#871F1B] uppercase tracking-[0.04em] leading-[0.88] w-full text-center"
            style={{
              fontSize: 'clamp(4.2rem, 17vw, 13rem)',
            }}
          >
            DIFOTOIN
          </h2>
        </div>

        {/* Bottom Metadata & Quick Links */}
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 pt-4 font-jakarta text-xs font-semibold uppercase tracking-wider text-espresso-muted">
          <div className="flex items-center gap-2 text-espresso">
            <span className="w-2 h-2 rounded-full bg-crimson inline-block" />
            <span>STUDIO {studioName.toUpperCase()}</span>
          </div>

          <div className="text-center">
            CLIENT PHOTO SELECTION &amp; ARCHIVE DELIVERY
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-espresso">
            <Link
              href="/studio/dashboard"
              className="hover:text-crimson underline underline-offset-4 transition-colors"
            >
              Panel Studio
            </Link>
            <span>•</span>
            <Link
              href={`/${studioSlug}/aida-fitri-harahab`}
              className="hover:text-crimson underline underline-offset-4 transition-colors"
            >
              Galeri Pilih Foto
            </Link>
            <span>•</span>
            <Link
              href="/aida-fitri-harahab?t=mhttesqg7rjx"
              className="hover:text-crimson underline underline-offset-4 transition-colors"
            >
              Album Digital
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default GiantFooter;
