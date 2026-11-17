'use client';

import React, { useState } from 'react';
import { CheckCircle2, Copy, Sparkles } from 'lucide-react';
import { StudioSubscription } from '@/types/difotoin';

export default function QrisActivatedStep({
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
          Pembayaran QRIS terverifikasi di server Midtrans. Otomatis masuk ke Dashboard Studio...
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
