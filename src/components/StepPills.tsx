'use client';

import React from 'react';
import { Check, Heart, MessageSquareText, Send } from 'lucide-react';

interface StepPillsProps {
  activeStep?: 1 | 2 | 3;
  showCards?: boolean;
  onSelectStep?: (step: 1 | 2 | 3) => void;
}

export function StepPills({
  activeStep = 1,
  showCards = true,
  onSelectStep,
}: StepPillsProps) {
  const steps = [
    {
      num: 1 as const,
      pillLabel: 'STEP 1: Pilih Foto',
      tag: 'LANGKAH 01',
      title: 'Pilih Foto Favorit',
      desc: 'Klik tombol hati atau "+ Pilih Foto" pada foto yang ingin dimasukkan ke album.',
      icon: Heart,
    },
    {
      num: 2 as const,
      pillLabel: 'STEP 2: Beri Catatan',
      tag: 'LANGKAH 02',
      title: 'Tulis Catatan Revisi',
      desc: 'Tambahkan catatan opsional untuk penyesuaian tone warna atau retouch detail.',
      icon: MessageSquareText,
    },
    {
      num: 3 as const,
      pillLabel: 'STEP 3: Kirim',
      tag: 'LANGKAH 03',
      title: 'Kirim & Kunci Pilihan',
      desc: 'Kirim daftar pilihan final ke Zeevisual untuk proses editing Lightroom.',
      icon: Send,
    },
  ];

  return (
    <div className="flex flex-col gap-3.5 w-full">
      {/* Clean Vintage Packaging Label Step Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((step) => {
          const isActive = activeStep === step.num;
          const isCompleted = activeStep > step.num;
          const IconComponent = step.icon;

          return (
            <button
              key={step.num}
              type="button"
              onClick={() => onSelectStep?.(step.num)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border-[1.5px] border-espresso font-jakarta text-xs font-bold tracking-wide transition-all ${
                isActive
                  ? 'bg-mustard text-espresso shadow-retro-sm'
                  : 'bg-white text-espresso hover:bg-cream-light'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full border border-espresso flex items-center justify-center text-[10px] font-anton ${
                  isActive || isCompleted
                    ? 'bg-espresso text-cream'
                    : 'bg-cream text-espresso'
                }`}
              >
                {isCompleted ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : step.num}
              </span>
              <span className="uppercase font-anton tracking-wider text-xs">
                {step.pillLabel}
              </span>
              <IconComponent className="w-3.5 h-3.5 opacity-70" />
            </button>
          );
        })}
      </div>

      {/* Clean Minimal Editorial Step Cards */}
      {showCards && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {steps.map((step) => {
            const isActive = activeStep === step.num;
            return (
              <div
                key={step.num}
                onClick={() => onSelectStep?.(step.num)}
                className={`rounded-xl p-4 border-[1.5px] border-espresso transition-all cursor-pointer flex items-start gap-3 ${
                  isActive
                    ? 'bg-white shadow-retro'
                    : 'bg-cream-light/80 hover:bg-white'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg border-[1.5px] border-espresso flex items-center justify-center font-anton text-base shrink-0 ${
                    isActive
                      ? 'bg-mustard text-espresso'
                      : 'bg-cream text-espresso'
                  }`}
                >
                  {step.num}
                </div>
                <div className="flex flex-col">
                  <span className="font-jakarta font-bold text-[10px] text-espresso-muted uppercase tracking-widest">
                    {step.tag}
                  </span>
                  <h3 className="font-fraunces font-bold text-sm md:text-base text-espresso leading-snug">
                    {step.title}
                  </h3>
                  <p className="font-jakarta text-xs text-espresso-muted mt-0.5 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default StepPills;
