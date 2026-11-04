import React from 'react';
import { Check } from 'lucide-react';

/**
 * Groovy 1970s 8-petal flower SVG accent for overlapping photo frames and badges
 */
export function GroovyFlowerSvg({
  className = 'w-10 h-10 text-mustard',
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <g stroke="#1E1916" strokeWidth="2.5" strokeLinejoin="round">
        <circle cx="32" cy="12" r="9" fill="currentColor" />
        <circle cx="46" cy="18" r="9" fill="currentColor" />
        <circle cx="52" cy="32" r="9" fill="currentColor" />
        <circle cx="46" cy="46" r="9" fill="currentColor" />
        <circle cx="32" cy="52" r="9" fill="currentColor" />
        <circle cx="18" cy="46" r="9" fill="currentColor" />
        <circle cx="12" cy="32" r="9" fill="currentColor" />
        <circle cx="18" cy="18" r="9" fill="currentColor" />
        <circle cx="32" cy="32" r="10" fill="#871F1B" />
        <circle cx="32" cy="32" r="4" fill="#F5EFE1" />
      </g>
    </svg>
  );
}

/**
 * Retro Circular Stamp Badge with notched/serrated vintage seal border and rotating text
 */
export function RetroCircularStamp({
  topText = 'DIFOTOIN ARCHIVE',
  centerText = '1974',
  bottomText = 'APPROVED PROOF',
  variant = 'mustard',
  className = '',
}: {
  topText?: string;
  centerText?: string;
  bottomText?: string;
  variant?: 'mustard' | 'crimson' | 'teal' | 'terracotta';
  className?: string;
}) {
  const bgMap = {
    mustard: 'bg-mustard text-espresso',
    crimson: 'bg-crimson text-cream',
    teal: 'bg-teal text-cream',
    terracotta: 'bg-terracotta text-cream',
  };

  return (
    <div
      className={`w-24 h-24 rounded-full border-[2px] border-espresso shadow-retro flex flex-col items-center justify-center p-2 text-center select-none rotate-12 ${bgMap[variant]} ${className}`}
    >
      <div className="w-full h-full rounded-full border border-dashed border-current flex flex-col items-center justify-center px-1">
        <span className="font-anton text-[8px] uppercase tracking-[0.14em] leading-tight">
          ★ {topText} ★
        </span>
        <span className="font-fraunces font-black text-base leading-tight my-0.5">
          {centerText}
        </span>
        <span className="font-anton text-[8px] uppercase tracking-[0.12em] leading-tight">
          {bottomText}
        </span>
      </div>
    </div>
  );
}

/**
 * Vintage Circular Checkmark Stamp used on selected proofing photos
 */
export function VintageCheckmarkStamp({
  orderNumber,
  className = '',
}: {
  orderNumber?: number;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 bg-mustard text-espresso border-[1.5px] border-espresso px-2.5 py-1 rounded-full shadow-retro-sm font-anton text-xs uppercase tracking-wider select-none ${className}`}
    >
      <span className="w-4 h-4 rounded-full bg-crimson text-cream border border-espresso flex items-center justify-center">
        <Check className="w-2.5 h-2.5 stroke-[3.5]" />
      </span>
      <span>TERPILIH {orderNumber ? `#${orderNumber}` : '★'}</span>
    </div>
  );
}
