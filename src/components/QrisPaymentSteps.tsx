'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  ShieldCheck,
  Sparkles,
  Upload,
} from 'lucide-react';
import { StudioSubscription } from '@/types/difotoin';
import { formatRupiah, PricingPlan } from '@/utils/pricing-plans';

interface QrisPaymentStepProps {
  qrisSrc: string;
  selectedPlan: PricingPlan;
  totalAmount: number;
  payerName: string;
  onChangePayerName: (v: string) => void;
  referenceId: string;
  onChangeReferenceId: (v: string) => void;
  proofUrl: string | null;
  onProofUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isVerifying: boolean;
  isVerifiedPaid: boolean;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function QrisPaymentStep({
  qrisSrc,
  selectedPlan,
  totalAmount,
  payerName,
  onChangePayerName,
  referenceId,
  onChangeReferenceId,
  proofUrl,
  onProofUpload,
  isVerifying,
  isVerifiedPaid,
  onBack,
  onSubmit,
}: QrisPaymentStepProps) {
  const [copiedNominal, setCopiedNominal] = useState(false);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/[0.03] border border-white/10 rounded-xl p-4">
        <img
          src={qrisSrc}
          alt="Barcode QRIS Bukafoto"
          className="w-40 h-auto rounded-xl border border-white/20 bg-white shrink-0"
        />
        <div className="flex flex-col gap-1.5 text-center sm:text-left">
          <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-300">
            MERCHANT: BUKAFOTO / ZEEVISUAL
          </span>
          <div className="font-jakarta text-xs text-slate-300">
            Paket: <strong className="text-white">{selectedPlan.title}</strong>
          </div>
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="font-anton text-3xl text-cyan-300 tracking-wide">
              {formatRupiah(totalAmount)}
            </span>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(String(totalAmount));
                setCopiedNominal(true);
                setTimeout(() => setCopiedNominal(false), 2000);
              }}
              className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px] font-jakarta font-bold text-white inline-flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              {copiedNominal ? 'Tersalin' : 'Salin'}
            </button>
          </div>
          <p className="font-jakarta text-[11px] text-slate-400 leading-snug">
            Scan QRIS via GoPay, OVO, DANA, ShopeePay, atau m-Banking lalu
            unggah screenshot struk lunas di bawah ini.
          </p>
        </div>
      </div>

      {isVerifiedPaid && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 font-jakarta text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>
            ✓ Pembayaran QRIS Terverifikasi Lunas — Mengalihkan Otomatis ke
            Halaman Berikutnya...
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          required
          value={payerName}
          onChange={(e) => onChangePayerName(e.target.value)}
          placeholder="Nama Pengirim / Bank (cth: GoPay Andi)"
          className="bg-white/[0.04] text-white placeholder:text-slate-500 px-3.5 py-2.5 rounded-xl border border-white/15 font-jakarta text-xs focus:outline-none focus:border-cyan-400"
        />
        <input
          type="text"
          required
          value={referenceId}
          onChange={(e) => onChangeReferenceId(e.target.value.toUpperCase())}
          placeholder="No. Referensi / RRN di Struk (8–24 digit)"
          className="bg-white/[0.04] text-cyan-200 placeholder:text-slate-500 px-3.5 py-2.5 rounded-xl border border-white/15 font-mono text-xs font-bold focus:outline-none focus:border-cyan-400"
        />
      </div>

      <label
        className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-dashed cursor-pointer transition-colors ${
          proofUrl
            ? 'bg-emerald-500/10 border-emerald-400/50'
            : 'bg-white/[0.03] border-white/25 hover:border-cyan-400/50'
        }`}
      >
        <span className="inline-flex items-center gap-2 font-jakarta text-xs text-slate-200">
          <Upload className="w-4 h-4 text-cyan-400 shrink-0" />
          {proofUrl
            ? '✓ Screenshot Struk QRIS Terlampir'
            : 'Wajib Upload Screenshot Bukti Struk QRIS Lunas *'}
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onProofUpload}
          className="hidden"
        />
        {proofUrl && (
          <img src={proofUrl} alt="Bukti" className="w-9 h-9 object-cover rounded" />
        )}
      </label>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onBack}
          disabled={isVerifying || isVerifiedPaid}
          className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 font-jakarta font-semibold text-xs text-slate-300 disabled:opacity-50"
        >
          ← Kembali
        </button>
        <button
          type="submit"
          disabled={isVerifying || isVerifiedPaid}
          className="flex-1 bg-cyan-400 hover:bg-cyan-300 text-slate-950 py-3 px-5 rounded-xl font-jakarta font-extrabold text-xs uppercase tracking-[0.14em] flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(34,211,238,0.3)] disabled:opacity-60"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>
            {isVerifying
              ? 'Memverifikasi Struk & RRN...'
              : 'Verifikasi Lunas & Masuk Otomatis'}
          </span>
        </button>
      </div>
    </form>
  );
}

export function QrisActivatedStep({
  studio,
  onOpenDashboard,
}: {
  studio: StudioSubscription;
  onOpenDashboard: () => void;
}) {
  const [copiedCreds, setCopiedCreds] = useState(false);

  return (
    <div className="flex flex-col gap-4 text-center items-center">
      <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center">
        <CheckCircle2 className="w-6 h-6" />
      </div>
      <div>
        <h3 className="font-fraunces font-bold text-2xl text-white">
          Lunas! Akun Anda Langsung Aktif
        </h3>
        <p className="font-jakarta text-xs text-emerald-300 mt-1">
          Pembayaran QRIS terverifikasi. Otomatis masuk ke Dashboard Studio...
        </p>
      </div>

      <div className="w-full bg-white/[0.04] border border-cyan-400/30 rounded-xl p-4 text-left font-mono text-xs flex flex-col gap-1.5">
        <div className="flex justify-between">
          <span className="text-slate-400">Slug Studio:</span>
          <strong className="text-cyan-300">{studio.studio_slug}</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Kode Lisensi / Pass:</span>
          <strong className="text-white">{studio.access_code}</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Kuota &amp; Paket:</span>
          <span className="text-emerald-300">
            {studio.plan_name} ({studio.max_galleries} Galeri)
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 w-full">
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(
              `Login Bukafoto\nSlug: ${studio.studio_slug}\nKode Lisensi: ${studio.access_code}`
            );
            setCopiedCreds(true);
            setTimeout(() => setCopiedCreds(false), 2000);
          }}
          className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-jakarta font-bold text-xs inline-flex items-center justify-center gap-1.5"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>{copiedCreds ? 'Tersalin!' : 'Salin Data Login'}</span>
        </button>
        <button
          type="button"
          onClick={onOpenDashboard}
          className="flex-1 py-3 px-5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-jakarta font-extrabold text-xs uppercase tracking-[0.14em] inline-flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Masuk ke Dashboard Studio →</span>
        </button>
      </div>
    </div>
  );
}
