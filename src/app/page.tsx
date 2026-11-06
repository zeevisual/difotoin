import React from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  CheckCircle2,
  FolderOpen,
  Heart,
  KeyRound,
  Lock,
  Sparkles,
} from 'lucide-react';
import GiantFooter from '@/components/GiantFooter';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#090C10] text-slate-100">
      {/* FULL-BLEED CINEMATIC HERO WITH GLASSMORPHISM NAVIGATION (Inspired by Ref Images 2 & 3) */}
      <section className="relative w-full min-h-[82vh] flex flex-col justify-between overflow-hidden">
        {/* Background Hero Image + Dark Gradient Fade */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=85"
            alt="Zeevisual Futuristic Hero"
            className="w-full h-full object-cover object-center scale-105 opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#090C10]/80 via-[#090C10]/55 to-[#090C10]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#090C10]/90 via-transparent to-[#090C10]/70" />
        </div>

        {/* Top Glassmorphic Navigation Bar */}
        <header className="relative z-20 w-full glass-header">
          <div className="max-w-7xl mx-auto px-4 md:px-10 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
              <span className="font-jakarta font-extrabold text-sm md:text-base tracking-[0.25em] text-white uppercase">
                DIFOTOIN
              </span>
              <span className="hidden sm:inline-block text-xs text-slate-400 tracking-widest uppercase border-l border-white/15 pl-3">
                ZEEVISUAL
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-8 text-[11px] font-jakarta font-semibold uppercase tracking-[0.22em] text-slate-300">
              <span className="text-white border-b-2 border-cyan-400 pb-1">
                EXPLORE
              </span>
              <Link
                href="/zeevisual/aida-fitri-harahab"
                className="hover:text-cyan-400 transition-colors"
              >
                PROOFING
              </Link>
              <Link
                href="/aida-fitri-harahab?t=mhttesqg7rjx"
                className="hover:text-cyan-400 transition-colors"
              >
                ALBUM
              </Link>
              <Link
                href="/studio/dashboard"
                className="hover:text-cyan-400 transition-colors"
              >
                STUDIO
              </Link>
            </nav>

            <div className="flex items-center gap-2.5">
              <Link
                href="/studio/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-jakarta font-semibold text-xs border border-white/15 transition-all"
              >
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                <span>Login Studio</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Center Hero Typography + Right Vertical Index Indicator */}
        <div className="relative z-10 max-w-7xl w-full mx-auto px-4 md:px-10 py-16 md:py-24 flex items-center justify-between gap-8">
          <div className="max-w-2xl flex flex-col gap-5">
            <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 glass-panel text-[11px] font-jakarta font-semibold uppercase tracking-[0.2em] text-cyan-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Private Studio Proofing Platform</span>
            </div>

            <h1 className="font-jakarta font-extrabold text-4xl sm:text-6xl md:text-7xl text-white uppercase tracking-[0.06em] leading-[1.02]">
              DIFOTOIN
              <span className="block font-light text-slate-300 text-2xl sm:text-3xl md:text-4xl tracking-[0.18em] mt-2">
                ZEEVISUAL ARCHIVE
              </span>
            </h1>

            <div className="w-20 h-1 bg-cyan-400 shadow-[0_0_12px_#22d3ee]" />

            <p className="font-jakarta text-sm md:text-base text-slate-300 max-w-xl leading-relaxed">
              Platform seleksi foto klien &amp; album digital bergaya futuristik
              minimalis. Tempelkan link Google Drive, foto portrait dan
              landscape tampil utuh tanpa lekukan, dan daftar file terpilih
              otomatis terkirim rapi ke WhatsApp fotografer.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/studio/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-jakarta font-bold text-xs uppercase tracking-[0.16em] transition-all shadow-[0_0_25px_rgba(34,211,238,0.3)]"
              >
                <span>Buka Dashboard Studio</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>

              <Link
                href="/zeevisual/aida-fitri-harahab"
                className="inline-flex items-center gap-2 px-6 py-3.5 glass-panel hover:bg-white/10 text-white font-jakarta font-semibold text-xs uppercase tracking-[0.16em] transition-all"
              >
                <Heart className="w-4 h-4 text-cyan-400" />
                <span>Lihat Demo Pilih Foto</span>
              </Link>
            </div>
          </div>

          {/* Right Vertical Index Counter (Inspired by Reference Image 3) */}
          <div className="hidden lg:flex flex-col items-end gap-2 font-mono text-xs text-slate-500 select-none">
            <span>01</span>
            <span>02</span>
            <div className="flex items-center gap-3 text-white font-bold text-xl my-1">
              <span>03</span>
              <span className="w-12 h-px bg-cyan-400" />
            </div>
            <span>04</span>
            <span>05</span>
          </div>
        </div>

        {/* Bottom 3-Column Feature Strip with Progress Line */}
        <div className="relative z-10 max-w-7xl w-full mx-auto px-4 md:px-10 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6">
            <div className="glass-panel p-5">
              <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest mb-1">
                01 // GOOGLE DRIVE SYNC
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tempelkan link folder Google Drive klien. Foto portrait &amp;
                landscape langsung dimuat otomatis dengan sudut siku tajam tanpa
                terpotong.
              </p>
            </div>
            <div className="glass-panel p-5">
              <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest mb-1">
                02 // AUTO-SORTED WHATSAPP
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Saat klien selesai memilih foto, daftar nama file otomatis
                diurutkan rapi dari nomor terkecil dan dikirim langsung ke
                WhatsApp Anda.
              </p>
            </div>
            <div className="glass-panel p-5">
              <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest mb-1">
                03 // PRIVATE SUBSCRIPTION
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Dilengkapi sistem kode lisensi eksklusif untuk fotografer
                berlangganan, lengkap dengan kontrol kuota dan masa aktif.
              </p>
            </div>
          </div>

          <div className="w-full h-px bg-white/15 relative">
            <div className="w-1/3 h-0.5 bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
          </div>
        </div>
      </section>

      {/* 4 GLASSMORPHIC NAVIGATION CARDS */}
      <main className="flex-1 w-full px-4 md:px-10 py-14">
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col items-center text-center gap-1">
            <span className="font-jakarta text-xs text-slate-400 tracking-[0.2em] uppercase">
              System Modules
            </span>
            <h2 className="font-jakarta font-bold text-2xl md:text-3xl text-white tracking-wide">
              Akses Cepat Ekosistem Difotoin
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Link
              href="/studio/dashboard"
              className="group glass-panel hover:border-cyan-400/50 transition-all flex flex-col justify-between p-6 gap-6"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-cyan-400">
                    01 / STUDIO
                  </span>
                  <FolderOpen className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                </div>
                <h3 className="font-jakarta font-bold text-lg text-white group-hover:text-cyan-300 transition-colors">
                  Dashboard Studio
                </h3>
                <p className="font-jakarta text-xs text-slate-400 leading-relaxed">
                  Panel khusus fotografer berlangganan untuk membuat galeri,
                  menyalin filter Lightroom, &amp; kelola lisensi.
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 font-jakarta font-semibold text-xs text-cyan-400 uppercase tracking-wider">
                <span>Buka Panel</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            <Link
              href="/zeevisual/aida-fitri-harahab"
              className="group glass-panel hover:border-cyan-400/50 transition-all flex flex-col justify-between p-6 gap-6"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-cyan-400">
                    02 / PROOFING
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                </div>
                <h3 className="font-jakarta font-bold text-lg text-white group-hover:text-cyan-300 transition-colors">
                  Pilih Foto Klien
                </h3>
                <p className="font-jakarta text-xs text-slate-400 leading-relaxed">
                  Ruang seleksi foto portrait &amp; landscape tanpa lekukan
                  sudut, dengan pengiriman daftar file otomatis ke WA.
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 font-jakarta font-semibold text-xs text-cyan-400 uppercase tracking-wider">
                <span>Buka Proofing</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            <Link
              href="/aida-fitri-harahab?t=mhttesqg7rjx"
              className="group glass-panel hover:border-cyan-400/50 transition-all flex flex-col justify-between p-6 gap-6"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-cyan-400">
                    03 / OWNER ALBUM
                  </span>
                  <KeyRound className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                </div>
                <h3 className="font-jakarta font-bold text-lg text-white group-hover:text-cyan-300 transition-colors">
                  Album Mode Pemilik
                </h3>
                <p className="font-jakarta text-xs text-slate-400 leading-relaxed">
                  Kontrol pemilik album (`?t=`): ganti sampul, atur PIN 4 digit,
                  dan sembunyikan foto privat dari tamu.
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 font-jakarta font-semibold text-xs text-cyan-400 uppercase tracking-wider">
                <span>Mode Pemilik</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            <Link
              href="/aida-fitri-harahab"
              className="group glass-panel hover:border-cyan-400/50 transition-all flex flex-col justify-between p-6 gap-6"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-cyan-400">
                    04 / PUBLIC ALBUM
                  </span>
                  <Lock className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                </div>
                <h3 className="font-jakarta font-bold text-lg text-white group-hover:text-cyan-300 transition-colors">
                  Album Mode Tamu
                </h3>
                <p className="font-jakarta text-xs text-slate-400 leading-relaxed">
                  Galeri digital bersih untuk keluarga &amp; sahabat dengan
                  dukungan PIN 4 digit, layar penuh, dan unduh HD.
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 font-jakarta font-semibold text-xs text-cyan-400 uppercase tracking-wider">
                <span>Mode Tamu</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          </div>
        </div>
      </main>

      <GiantFooter />
    </div>
  );
}
