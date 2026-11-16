'use client';

import React, { useEffect, useState } from 'react';
import { Check, Palette, X } from 'lucide-react';

type ThemeKey = 'cyan' | 'gold' | 'emerald' | 'rose' | 'violet';

const THEME_STORAGE_KEY = 'bukafoto_color_theme_v1';

const COLOR_THEMES: Array<{
  id: ThemeKey;
  label: string;
  swatch: string;
}> = [
  { id: 'cyan', label: 'Cosmic Cyan', swatch: '#22d3ee' },
  { id: 'gold', label: 'Editorial Gold', swatch: '#f59e0b' },
  { id: 'emerald', label: 'Emerald Aurora', swatch: '#10b981' },
  { id: 'rose', label: 'Rose Velvet', swatch: '#f43f5e' },
  { id: 'violet', label: 'Violet Nebula', swatch: '#a855f7' },
];

export default function ThemeSwitcher() {
  const [activeTheme, setActiveTheme] = useState<ThemeKey>('cyan');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeKey | null;
      if (saved && COLOR_THEMES.some((t) => t.id === saved)) {
        setActiveTheme(saved);
        if (saved === 'cyan') {
          document.documentElement.removeAttribute('data-theme');
        } else {
          document.documentElement.setAttribute('data-theme', saved);
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  function applyTheme(next: ThemeKey) {
    setActiveTheme(next);
    if (next === 'cyan') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', next);
    }
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
    setIsOpen(false);
  }

  const current =
    COLOR_THEMES.find((t) => t.id === activeTheme) || COLOR_THEMES[0];

  return (
    <div className="fixed bottom-3.5 right-3.5 sm:bottom-4 sm:right-4 z-40 flex flex-col items-end">
      {isOpen && (
        <div className="mb-2 w-48 glass-panel-strong rounded-2xl p-2.5 flex flex-col gap-1 shadow-2xl border border-white/15 animate-fade-up">
          <div className="flex items-center justify-between px-2 py-1 border-b border-white/10 mb-1">
            <span className="font-jakarta font-bold text-[10px] uppercase tracking-[0.18em] text-slate-300">
              Pilih Tema Warna
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white"
              aria-label="Tutup pemilih tema"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {COLOR_THEMES.map((t) => {
            const isSelected = t.id === activeTheme;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTheme(t.id)}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs font-jakarta font-semibold transition-colors ${
                  isSelected
                    ? 'bg-white/10 text-white'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white/30 shrink-0"
                    style={{
                      backgroundColor: t.swatch,
                      boxShadow: `0 0 8px ${t.swatch}`,
                    }}
                  />
                  <span>{t.label}</span>
                </span>
                {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        data-cursor="TEMA"
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#060911]/88 backdrop-blur-md border border-white/15 hover:border-cyan-400/60 text-white text-[10px] sm:text-[11px] font-jakarta font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.6)] transition-all"
      >
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{
            backgroundColor: current.swatch,
            boxShadow: `0 0 8px ${current.swatch}`,
          }}
        />
        <Palette className="w-3 h-3 text-cyan-400" />
        <span className="hidden sm:inline">Tema: {current.label}</span>
        <span className="sm:hidden">Tema</span>
      </button>
    </div>
  );
}
