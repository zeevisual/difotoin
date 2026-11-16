'use client';

import React from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { formatRupiah, PricingPlan } from '@/utils/pricing-plans';

interface MidtransPaymentPanelProps {
  selectedPlan: PricingPlan;
  orderId: string;
  redirectUrl: string;
  statusText: string;
  isVerifiedPaid: boolean;
  onRefreshStatus: () => void;
  onBack: () => void;
}

export default function MidtransPaymentPanel({
  selectedPlan,
  orderId,
  redirectUrl,
  statusText,
  isVerifiedPaid,
  onRefreshStatus,
  onBack,
}: MidtransPaymentPanelProps) {
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white/[0.04] border border-cyan-400/30 rounded-xl px-4 py-3">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-300 block">
            MIDTRANS QRIS OTOMATIS • {orderId}
          </span>
          <span className="font-jakarta font-bold text-sm text-white">
            {selectedPlan.title} —{' '}
            <strong className="text-cyan-300">
              {formatRupiah(selectedPlan.price)}
            </strong>
          </span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-400/15 border border-cyan-400/35 font-mono text-[10px] uppercase text-cyan-200">
          {isVerifiedPaid ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span className="text-emerald-200 font-bold">LUNAS</span>
            </>
          ) : (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Cek Otomatis ({statusText})</span>
            </>
          )}
        </div>
      </div>

      {isVerifiedPaid && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 font-jakarta text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>
            Pembayaran Midtrans Terkonfirmasi Lunas! Mengalihkan Otomatis ke
            Dashboard Studio...
          </span>
        </div>
      )}

      <div className="w-full rounded-xl overflow-hidden border border-white/15 bg-white">
        <iframe
          src={redirectUrl}
          title="Midtrans Pembayaran QRIS"
          className="w-full h-[420px] sm:h-[460px] border-0"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isVerifiedPaid}
          className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 font-jakarta font-semibold text-xs text-slate-300 disabled:opacity-50"
        >
          ← Ubah Data
        </button>

        <div className="flex items-center gap-2">
          <a
            href={redirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-jakarta font-bold text-xs inline-flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tab Baru</span>
          </a>
          <button
            type="button"
            onClick={onRefreshStatus}
            disabled={isVerifiedPaid}
            className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-jakarta font-extrabold text-xs inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Cek Lunas Sekarang</span>
          </button>
        </div>
      </div>

      <p className="font-jakarta text-[11px] text-slate-400 flex items-center gap-1.5 justify-center">
        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span>
          Sistem memantau status lunas Midtrans setiap 3 detik dan langsung
          membuka Dashboard Studio otomatis setelah Anda selesai bayar.
        </span>
      </p>
    </div>
  );
}
