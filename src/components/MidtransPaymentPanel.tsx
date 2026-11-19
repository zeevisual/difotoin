'use client';

import React from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  QrCode,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { formatRupiah, PricingPlan } from '@/utils/pricing-plans';

interface MidtransPaymentPanelProps {
  provider?: 'mayar' | 'midtrans';
  selectedPlan: PricingPlan;
  orderId: string;
  qrImageUrl?: string | null;
  paymentUrl?: string | null;
  expiryTime?: string | null;
  isSandbox?: boolean;
  statusText: string;
  isVerifiedPaid: boolean;
  onRefreshStatus: () => void;
  onBack: () => void;
}

export default function MidtransPaymentPanel({
  provider = 'midtrans',
  selectedPlan,
  orderId,
  qrImageUrl,
  paymentUrl,
  expiryTime,
  isSandbox = false,
  statusText,
  isVerifiedPaid,
  onRefreshStatus,
  onBack,
}: MidtransPaymentPanelProps) {
  const isMayar = provider === 'mayar' || Boolean(paymentUrl && !qrImageUrl);

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white/[0.04] border border-cyan-400/30 rounded-xl px-4 py-3">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-300 block">
            {isMayar ? 'MAYAR QRIS & E-WALLET INSTAN' : 'MIDTRANS QRIS DINAMIS'}{' '}
            {isSandbox ? '(SANDBOX)' : ''} • {orderId.slice(0, 18)}
          </span>
          <span className="font-jakarta font-bold text-sm text-white">
            {selectedPlan.title} —{' '}
            <strong className="text-cyan-300">{formatRupiah(selectedPlan.price)}</strong>
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
              <span>Menunggu Bayar ({statusText})</span>
            </>
          )}
        </div>
      </div>

      {isVerifiedPaid && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 font-jakarta text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>Pembayaran Terkonfirmasi Lunas! Mengalihkan Otomatis ke Dashboard Studio...</span>
        </div>
      )}

      {isMayar && paymentUrl ? (
        <div className="flex flex-col gap-3 bg-white/[0.03] border border-white/15 rounded-xl p-5 text-center items-center">
          <div className="w-12 h-12 rounded-2xl bg-cyan-400/15 border border-cyan-400/35 flex items-center justify-center text-cyan-300">
            <QrCode className="w-6 h-6" />
          </div>
          <span className="font-anton text-3xl text-cyan-300 tracking-wide">
            {formatRupiah(selectedPlan.price)}
          </span>
          <p className="font-jakarta text-xs text-slate-300 leading-relaxed max-w-md">
            Klik tombol di bawah untuk membuka halaman pembayaran resmi{' '}
            <strong>Mayar (QRIS, GoPay, OVO, DANA, ShopeePay, Virtual Account)</strong>.
            Biarkan modal ini terbuka atau selesaikan bayar — akun otomatis aktif setelah lunas.
          </p>
          <a
            href={paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-jakarta font-extrabold text-xs uppercase tracking-[0.14em] inline-flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(52,211,153,0.3)]"
          >
            <span>Buka Checkout QRIS Mayar</span>
            <ExternalLink className="w-4 h-4" />
          </a>
          {expiryTime && (
            <span className="font-mono text-[10px] text-slate-400">Berlaku s/d: {expiryTime}</span>
          )}
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-5 bg-white/[0.03] border border-white/15 rounded-xl p-5">
          {qrImageUrl && (
            <div className="p-2.5 bg-white rounded-2xl border border-white/20 shrink-0 shadow-lg">
              <img src={qrImageUrl} alt={`QRIS ${orderId}`} className="w-48 h-48 object-contain" />
            </div>
          )}
          <div className="flex flex-col gap-2 text-center sm:text-left">
            <span className="font-jakarta font-extrabold text-base text-white">
              Scan QRIS Ini untuk Membayar
            </span>
            <span className="font-anton text-3xl text-cyan-300 tracking-wide">
              {formatRupiah(selectedPlan.price)}
            </span>
            <p className="font-jakarta text-xs text-slate-300 leading-relaxed">
              Mendukung <strong>GoPay, OVO, DANA, ShopeePay</strong>, serta m-Banking.
            </p>
            {expiryTime && (
              <span className="font-mono text-[10px] text-slate-400">Berlaku s/d: {expiryTime}</span>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isVerifiedPaid}
          className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 font-jakarta font-semibold text-xs text-slate-300 disabled:opacity-50"
        >
          ← Ubah Data
        </button>

        <button
          type="button"
          onClick={onRefreshStatus}
          disabled={isVerifiedPaid}
          className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-jakarta font-extrabold text-xs inline-flex items-center justify-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Saya Sudah Bayar • Cek Sekarang</span>
        </button>
      </div>

      <p className="font-jakarta text-[11px] text-slate-400 flex items-center gap-1.5 justify-center text-center">
        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span>
          Status bayar dipantau otomatis tiap 3 detik dari server. Setelah lunas, akun Anda langsung aktif &amp; masuk ke Dashboard Studio.
        </span>
      </p>
    </div>
  );
}
