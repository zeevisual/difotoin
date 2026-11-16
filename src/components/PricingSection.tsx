'use client';

import React, { useState } from 'react';
import { CheckCircle2, QrCode, Sparkles, Zap } from 'lucide-react';
import { formatRupiah, SUBSCRIPTION_PLANS } from '@/utils/pricing-plans';
import QrisCheckoutModal from '@/components/QrisCheckoutModal';
import { StudioSubscription } from '@/types/difotoin';

interface PricingSectionProps {
  compact?: boolean;
  onSuccessLogin?: (studio: StudioSubscription) => void;
}

export default function PricingSection({
  compact = false,
  onSuccessLogin,
}: PricingSectionProps) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(SUBSCRIPTION_PLANS[1].id);

  function openCheckout(planId: string) {
    setSelectedPlanId(planId);
    setCheckoutOpen(true);
  }

  return (
    <section id="pricing" className="w-full flex flex-col gap-7 py-6">
      <div className="flex flex-col items-center text-center gap-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-[11px] font-jakarta font-bold uppercase tracking-[0.2em] text-cyan-300">
          <QrCode className="w-3.5 h-3.5" />
          <span>Aktivasi Instan Otomatis via QRIS</span>
        </div>
        <h2
          className={`font-jakarta font-extrabold text-white tracking-wide ${
            compact ? 'text-xl md:text-2xl' : 'text-2xl md:text-4xl'
          }`}
        >
          Harga Langganan Studio Terjangkau
        </h2>
        <p className="font-jakarta text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
          Pilih paket sesuai kebutuhan studio Anda, scan QRIS, dan akun langsung
          aktif otomatis dalam hitungan detik tanpa perlu menunggu admin.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`glass-panel p-6 flex flex-col justify-between gap-6 transition-all duration-300 hover:-translate-y-1 ${
              plan.isPopular
                ? 'border border-cyan-400/70 shadow-[0_0_32px_rgba(34,211,238,0.18)] bg-cyan-400/[0.04]'
                : 'border border-white/10 hover:border-cyan-400/40'
            }`}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full font-jakarta font-bold text-[10px] uppercase tracking-wider ${
                    plan.isPopular
                      ? 'bg-cyan-400 text-slate-950'
                      : 'bg-white/10 text-cyan-300 border border-white/15'
                  }`}
                >
                  {plan.badge}
                </span>
                {plan.isPopular && (
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                )}
              </div>

              <div>
                <h3 className="font-jakarta font-bold text-lg text-white">
                  {plan.title}
                </h3>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-anton text-3xl text-cyan-300 tracking-wide">
                    {formatRupiah(plan.price)}
                  </span>
                  <span className="font-jakarta text-xs text-slate-400">
                    {plan.periodLabel}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-slate-500 line-through">
                  {formatRupiah(plan.originalPrice)}
                </span>
              </div>

              <div className="h-px bg-white/10 my-1" />

              <ul className="flex flex-col gap-2">
                {plan.features.map((feat) => (
                  <li
                    key={feat}
                    className="flex items-start gap-2 font-jakarta text-xs text-slate-200 leading-snug"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => openCheckout(plan.id)}
              data-cursor="PILIH"
              className={`btn-futuristic w-full py-3 px-4 font-jakarta font-extrabold text-xs uppercase tracking-[0.14em] inline-flex items-center justify-center gap-1.5 transition-all ${
                plan.isPopular
                  ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.3)]'
                  : 'bg-white/10 hover:bg-cyan-400 hover:text-slate-950 text-white border border-white/15'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Pilih Paket &amp; Aktifkan</span>
            </button>
          </div>
        ))}
      </div>

      <QrisCheckoutModal
        isOpen={checkoutOpen}
        initialPlanId={selectedPlanId}
        onClose={() => setCheckoutOpen(false)}
        onSuccessLogin={onSuccessLogin}
      />
    </section>
  );
}
