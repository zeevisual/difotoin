import React from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  CheckCircle2,
  FolderOpen,
  KeyRound,
  Lock,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import GiantFooter from '@/components/GiantFooter';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-transparent text-slate-100">
      {/* FULL-BLEED COSMIC EARTH-FROM-SPACE HERO WITH GLASSMORPHISM NAVIGATION */}
      <section className="relative w-full min-h-[82vh] flex flex-col justify-between overflow-hidden">
        {/* Subtle Cosmic Atmospheric Overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-[#02050A]/50 via-transparent to-transparent" />
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
                href="/studio/demo"
                className="text-cyan-300 hover:text-cyan-200 transition-colors"
              >
                DEMO FOTOGRAFER
              </Link>
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
                href="/studio/demo"
                data-cursor="DEMO"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-cyan-400/15 hover:bg-cyan-400/25 text-cyan-300 font-jakarta font-semibold text-xs border border-cyan-400/30 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Coba Demo</span>
              </Link>
              <Link
                href="/studio/dashboard"
                data-cursor="STUDIO"
                className="btn-futuristic inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-jakarta font-semibold text-xs border border-white/15 transition-all"
              >
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                <span>Login Studio</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Center Hero Typography + Right Vertical Index Indicator */}
        <div className="relative z-10 max-w-7xl w-full mx-auto px-4 md:px-10 py-16 md:py-24 flex items-center justify-between gap-8">
          <div className="max-w-2xl flex flex-col gap-5 animate-fade-up">
            <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 glass-panel text-[11px] font-jakarta font-semibold uppercase tracking-[0.2em] text-cyan-300">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
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
                data-cursor="LOGIN"
                className="btn-futuristic inline-flex items-center gap-2 px-6 py-3.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-jakarta font-bold text-xs uppercase tracking-[0.16em] transition-all shadow-[0_0_25px_rgba(34,211,238,0.3)] hover:-translate-y-0.5"
              >
                <span>Buka Dashboard Studio</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>

              <Link
                href="/studio/demo"
                data-cursor="DEMO"
                className="btn-futuristic inline-flex items-center gap-2 px-6 py-3.5 glass-panel hover:bg-white/10 text-white font-jakarta font-semibold text-xs uppercase tracking-[0.16em] transition-all hover:-translate-y-0.5 border border-cyan-400/35"
              >
                <FolderOpen className="w-4 h-4 text-cyan-400" />
                <span>Demo Pakai Google Drive Anda</span>
              </Link>
            </div>
          </div>

          {/* Right Vertical Index Counter (Inspired by Reference Image 3) */}
          <div className="hidden lg:flex flex-col items-end gap-2 font-mono text-xs text-slate-500 select-none">
            <span className="hover:text-cyan-400 transition-colors">01</span>
            <span className="hover:text-cyan-400 transition-colors">02</span>
            <div className="flex items-center gap-3 text-white font-bold text-xl my-1">
              <span>03</span>
              <span className="w-12 h-px bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
            </div>
            <span className="hover:text-cyan-400 transition-colors">04</span>
            <span className="hover:text-cyan-400 transition-colors">05</span>
          </div>
        </div>

        {/* Bottom 3-Column Feature Strip with Progress Line */}
        <div className="relative z-10 max-w-7xl w-full mx-auto px-4 md:px-10 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6">
            <div className="glass-panel p-5 transition-transform duration-500 hover:-translate-y-1">
              <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest mb-1">
                01 // GOOGLE DRIVE SYNC
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tempelkan link folder Google Drive klien. Foto portrait &amp;
                landscape langsung dimuat otomatis dengan sudut siku tajam tanpa
                terpotong.
              </p>
            </div>
            <div className="glass-panel p-5 transition-transform duration-500 hover:-translate-y-1">
              <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest mb-1">
                02 // AUTO-SORTED WHATSAPP
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Saat klien selesai memilih foto, daftar nama file otomatis
                diurutkan rapi dari nomor terkecil dan dikirim langsung ke
                WhatsApp Anda.
              </p>
            </div>
            <div className="glass-panel p-5 transition-transform duration-500 hover:-translate-y-1">
              <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest mb-1">
                03 // DEMO &amp; LISENSI STUDIO
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Fotografer dapat mengetes tampilan gratis memakai link Google
                Drive sendiri. Untuk membuka pengiriman link &amp; teks foto,
                berlangganan via WA Super Admin{' '}
                <a
                  href="https://wa.me/6289614114644?text=Halo%20Super%20Admin%20Zeevisual%2C%20saya%20ingin%20berlangganan%20Full%20Akses%20Studio%20Difotoin."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 font-semibold hover:underline"
                >
                  089614114644
                </a>
                .
              </p>
            </div>
          </div>

          <div className="w-full h-px bg-white/15 relative overflow-hidden">
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
              data-cursor="OPEN"
              className="group glass-panel hover:border-cyan-400/50 transition-all duration-500 hover:-translate-y-1.5 flex flex-col justify-between p-6 gap-6"
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
                  Panel khusus fotografer terdaftar &amp; Super Admin untuk
                  membuat galeri, menyalin filter Lightroom, &amp; kelola lisensi.
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 font-jakarta font-semibold text-xs text-cyan-400 uppercase tracking-wider">
                <span>Buka Panel</span>
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </Link>

            <Link
              href="/zeevisual/aida-fitri-harahab"
              data-cursor="PROOFING"
              className="group glass-panel hover:border-cyan-400/50 transition-all duration-500 hover:-translate-y-1.5 flex flex-col justify-between p-6 gap-6"
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
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </Link>

            <Link
              href="/aida-fitri-harahab?t=mhttesqg7rjx"
              data-cursor="ALBUM"
              className="group glass-panel hover:border-cyan-400/50 transition-all duration-500 hover:-translate-y-1.5 flex flex-col justify-between p-6 gap-6"
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
                  Kontrol pemilik album (`?t=`): ganti &amp; geser sampul, atur
                  PIN 4 digit, dan sembunyikan foto privat dari tamu.
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 font-jakarta font-semibold text-xs text-cyan-400 uppercase tracking-wider">
                <span>Mode Pemilik</span>
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </Link>

            <Link
              href="/aida-fitri-harahab"
              data-cursor="ALBUM"
              className="group glass-panel hover:border-cyan-400/50 transition-all duration-500 hover:-translate-y-1.5 flex flex-col justify-between p-6 gap-6"
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
                  Galeri digital bersih dengan 3D Review Photo interaktif, PIN 4
                  digit, layar penuh, dan unduh HD.
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 font-jakarta font-semibold text-xs text-cyan-400 uppercase tracking-wider">
                <span>Mode Tamu</span>
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </Link>
          </div>

          {/* PHOTOGRAPHER FREE SANDBOX DEMO & SUBSCRIPTION BANNER */}
          <div className="glass-panel border border-cyan-400/30 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex flex-col gap-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 text-cyan-300 font-jakarta font-bold text-xs uppercase tracking-[0.2em]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Mode Demo Fotografer • Tes Pakai Google Drive Sendiri</span>
              </div>
              <h3 className="font-jakarta font-bold text-xl md:text-2xl text-white">
                Ingin Coba Pakai Foto Jepretan Anda Sendiri Sebelum Berlangganan?
              </h3>
              <p className="font-jakarta text-xs md:text-sm text-slate-300 leading-relaxed">
                Tempelkan link folder Google Drive Anda di halaman Mode Demo
                untuk mengetes tampilan Pilih Foto &amp; Album Digital 3D secara
                langsung. Untuk membuka pengiriman link ke klien &amp; ekspor
                teks nama file foto, silakan berlangganan melalui Super Admin.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
              <Link
                href="/studio/demo"
                data-cursor="DEMO"
                className="btn-futuristic px-5 py-3 bg-white/10 hover:bg-white/20 text-white border border-cyan-400/40 font-jakarta font-bold text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2"
              >
                <FolderOpen className="w-4 h-4 text-cyan-400" />
                <span>Coba Mode Demo</span>
              </Link>
              <a
                href="https://wa.me/6289614114644?text=Halo%20Super%20Admin%20Zeevisual%2C%20saya%20ingin%20berlangganan%20Full%20Akses%20Studio%20Difotoin."
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="WHATSAPP"
                className="btn-futuristic px-5 py-3 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-jakarta font-extrabold text-xs uppercase tracking-wider shadow-[0_0_24px_rgba(34,211,238,0.35)] inline-flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WA Super Admin • 089614114644</span>
              </a>
            </div>
          </div>
        </div>
      </main>

      <GiantFooter />
    </div>
  );
}
