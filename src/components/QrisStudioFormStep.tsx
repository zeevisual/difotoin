'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { slugifyClientName } from '@/lib/drive-utils';
import {
  formatRupiah,
  PricingPlan,
  SUBSCRIPTION_PLANS,
} from '@/utils/pricing-plans';

interface QrisStudioFormStepProps {
  planId: string;
  selectedPlan: PricingPlan;
  onSelectPlan: (id: string) => void;
  studioName: string;
  onChangeStudioName: (v: string) => void;
  studioSlug: string;
  onChangeStudioSlug: (v: string) => void;
  ownerName: string;
  onChangeOwnerName: (v: string) => void;
  whatsapp: string;
  onChangeWhatsapp: (v: string) => void;
  accessCode: string;
  onChangeAccessCode: (v: string) => void;
  isChecking: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function QrisStudioFormStep({
  planId,
  selectedPlan,
  onSelectPlan,
  studioName,
  onChangeStudioName,
  studioSlug,
  onChangeStudioSlug,
  ownerName,
  onChangeOwnerName,
  whatsapp,
  onChangeWhatsapp,
  accessCode,
  onChangeAccessCode,
  isChecking,
  onSubmit,
}: QrisStudioFormStepProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
      <div>
        <label className="font-jakarta font-bold text-[11px] uppercase tracking-wider text-slate-300">
          Pilih Paket Langganan
        </label>
        <div className="grid grid-cols-2 gap-2 mt-1.5">
          {SUBSCRIPTION_PLANS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectPlan(p.id)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                planId === p.id
                  ? 'bg-cyan-400/15 border-cyan-400 text-white'
                  : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.06]'
              }`}
            >
              <div className="font-jakarta font-bold text-xs truncate">
                {p.title}
              </div>
              <div className="font-mono font-bold text-xs text-cyan-300 mt-0.5">
                {formatRupiah(p.price)}{' '}
                <span className="text-[10px] text-slate-400 font-normal">
                  {p.periodLabel}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          required
          value={studioName}
          onChange={(e) => {
            onChangeStudioName(e.target.value);
            onChangeStudioSlug(slugifyClientName(e.target.value));
          }}
          placeholder="Nama Studio (cth: Zee Studio)"
          className="bg-white/[0.04] text-white placeholder:text-slate-500 px-3.5 py-2.5 rounded-xl border border-white/15 font-jakarta text-xs font-semibold focus:outline-none focus:border-cyan-400"
        />
        <input
          type="text"
          required
          value={studioSlug}
          onChange={(e) => onChangeStudioSlug(slugifyClientName(e.target.value))}
          placeholder="Slug URL (cth: zeestudio)"
          className="bg-white/[0.03] text-cyan-300 placeholder:text-slate-500 px-3.5 py-2.5 rounded-xl border border-white/15 font-mono text-xs font-bold focus:outline-none focus:border-cyan-400"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          required
          value={ownerName}
          onChange={(e) => onChangeOwnerName(e.target.value)}
          placeholder="Nama Pemilik Studio"
          className="bg-white/[0.04] text-white placeholder:text-slate-500 px-3.5 py-2.5 rounded-xl border border-white/15 font-jakarta text-xs focus:outline-none focus:border-cyan-400"
        />
        <input
          type="tel"
          required
          value={whatsapp}
          onChange={(e) => onChangeWhatsapp(e.target.value)}
          placeholder="No. WhatsApp (cth: 0812...)"
          className="bg-white/[0.04] text-white placeholder:text-slate-500 px-3.5 py-2.5 rounded-xl border border-white/15 font-jakarta text-xs focus:outline-none focus:border-cyan-400"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-jakarta font-bold text-[11px] uppercase tracking-wider text-slate-300">
          Password / Kode Lisensi Login (Boleh Ubah Sendiri)
        </label>
        <input
          type="text"
          required
          minLength={4}
          value={accessCode}
          onChange={(e) => onChangeAccessCode(e.target.value)}
          className="bg-white/[0.03] text-cyan-300 px-3.5 py-2.5 rounded-xl border border-white/15 font-mono text-xs font-bold tracking-wider focus:outline-none focus:border-cyan-400"
        />
      </div>

      <button
        type="submit"
        disabled={isChecking}
        className="mt-1 w-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 py-3 px-5 rounded-xl font-jakarta font-extrabold text-xs uppercase tracking-[0.16em] flex items-center justify-center gap-2"
      >
        <span>
          {isChecking
            ? 'Memeriksa Ketersediaan Slug...'
            : `Lanjut Bayar QRIS (${formatRupiah(selectedPlan.price)})`}
        </span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}
