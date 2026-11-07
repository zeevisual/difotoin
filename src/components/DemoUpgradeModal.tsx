'use client';

import React from 'react';
import {
  CheckCircle2,
  Crown,
  Lock,
  MessageCircle,
  Sparkles,
  X,
} from 'lucide-react';
import { buildSuperAdminUpgradeWaUrl } from '@/lib/supabase';

interface DemoUpgradeModalProps {
  open: boolean;
  onClose: () => void;
  studioName?: string;
  lockedActionLabel?: string;
}

export default function DemoUpgradeModal({
  open,
  onClose,
  studioName,
  lockedActionLabel = 'Pengiriman Link Klien & Ekspor Teks Foto',
}: DemoUpgradeModalProps) {
  if (!open) return null;

  const waUpgradeUrl = buildSuperAdminUpgradeWaUrl(studioName);

  return (
    <div
      className="fixed inset-0 z-[120] bg-[#02050A]/85 backdrop-blur-xl flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg glass-panel border border-cyan-400/35 rounded-2xl overflow-hidden shadow-[0_28px_80px_rgba(0,0,0,0.85)] animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-amber-400/15 via-cyan-400/10 to-transparent border-b border-white/10 px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-amber-300">
            <Lock className="w-4 h-4 shrink-0" />
            <span className="font-jakarta font-bold text-[11px] uppercase tracking-[0.2em]">
              Mode Demo Testing — Fitur Dikunci
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 md:p-7 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/25 text-[11px] font-jakarta font-semibold text-cyan-300">
              <Sparkles className="w-3 h-3" />
              <span>{lockedActionLabel}</span>
            </div>
            <h3 className="font-fraunces font-bold text-2xl text-white leading-snug mt-1">
              Berlangganan untuk Membuka Full Akses Studio
            </h3>
            <p className="font-jakarta text-xs md:text-sm text-slate-300 leading-relaxed">
              Di <strong className="text-white">Mode Demo</strong>, Anda bebas
              mengetes tampilan galeri &amp; album 3D menggunakan foto dari
              Google Drive Anda sendiri. Untuk mengirim link ke klien dan
              mengekspor daftar teks foto terpilih, silakan aktifkan lisensi
              resmi.
            </p>
          </div>

          {/* Full Features Checklist */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 flex flex-col gap-2.5">
            <span className="font-jakarta font-bold text-[11px] uppercase tracking-[0.18em] text-cyan-300">
              Keuntungan Member Berlangganan:
            </span>
            <div className="flex items-start gap-2.5 text-xs text-slate-200 font-jakarta">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Kirim Link Klien Aktif</strong> — Bagikan link pilih
                foto &amp; album digital 3D langsung ke WhatsApp klien Anda.
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-200 font-jakarta">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Teks Nama Foto Tersusun Rapi ke WA</strong> — Pilihan
                foto klien otomatis diurutkan &amp; dikirim langsung ke nomor WA
                Anda.
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-200 font-jakarta">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>1-Klik Salin Filter Lightroom</strong> — Salin daftar
                kode file terpilih untuk filter instan di Adobe Lightroom.
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-200 font-jakarta">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Nama Brand Studio Anda Sendiri</strong> — Seluruh judul
                halaman klien otomatis mengikuti nama brand fotografi Anda.
              </span>
            </div>
          </div>

          {/* Super Admin Contact CTA */}
          <div className="flex flex-col gap-2.5">
            <a
              href={waUpgradeUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="WHATSAPP"
              className="btn-futuristic w-full py-3.5 px-5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-jakarta font-extrabold text-xs md:text-sm uppercase tracking-[0.14em] shadow-[0_0_28px_rgba(34,211,238,0.4)] transition-all flex items-center justify-center gap-2 text-center"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>Hubungi Super Admin • WA 089614114644</span>
            </a>

            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-jakarta text-amber-300/90">
                <Crown className="w-3.5 h-3.5" />
                <span>Super Admin Zeevisual: 0896-1411-4644</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="font-jakarta font-semibold text-xs text-slate-400 hover:text-white transition-colors"
              >
                Lanjut Testing Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
