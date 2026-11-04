import React from 'react';

interface RetroTickerProps {
  text?: string;
  variant?: 'cream' | 'espresso' | 'crimson' | 'mustard';
  className?: string;
}

export function RetroTicker({
  text = 'DIFOTOIN ★ PILIH FOTO FAVORITMU ★ ABADIKAN SETIAP MOMEN ★',
  variant = 'cream',
  className = '',
}: RetroTickerProps) {
  const variantClasses: Record<NonNullable<RetroTickerProps['variant']>, string> = {
    cream: 'bg-cream-dark text-espresso',
    espresso: 'bg-espresso text-mustard',
    crimson: 'bg-crimson text-cream',
    mustard: 'bg-mustard text-espresso',
  };

  const repeatedItems = Array.from({ length: 8 }, (_, idx) => (
    <span
      key={idx}
      className="font-anton text-[13px] md:text-[14px] uppercase tracking-[0.1em] mx-4 inline-flex items-center gap-3 shrink-0"
    >
      {text}
    </span>
  ));

  return (
    <div
      className={`w-full border-t-[1.5px] border-b-[1.5px] border-espresso py-1.5 overflow-hidden select-none ${variantClasses[variant]} ${className}`}
    >
      <div className="flex whitespace-nowrap animate-marquee w-max">
        <div className="flex items-center">{repeatedItems}</div>
        <div className="flex items-center" aria-hidden="true">
          {repeatedItems}
        </div>
      </div>
    </div>
  );
}

export default RetroTicker;
