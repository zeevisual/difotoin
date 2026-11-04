import React from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Camera,
  CheckCircle2,
  FolderOpen,
  Heart,
  KeyRound,
  Lock,
} from 'lucide-react';
import RetroTicker from '@/components/RetroTicker';
import StepPills from '@/components/StepPills';
import GiantFooter from '@/components/GiantFooter';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-cream text-espresso">
      {/* Clean Top Marquee & Header */}
      <header className="sticky top-0 z-50 w-full bg-crimson border-b-[1.5px] border-espresso">
        <RetroTicker
          text="DIFOTOIN ★ PILIH FOTO FAVORITMU ★ ABADIKAN SETIAP MOMEN ★ STUDIO ZEEVISUAL ★"
          variant="cream"
        />

        <div className="max-w-7xl mx-auto px-4 md:px-10 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-anton text-2xl md:text-3xl text-cream tracking-wider uppercase">
              DIFOTOIN
            </span>
            <span className="hidden sm:inline-block bg-cream/15 text-cream font-jakarta font-semibold text-xs px-2.5 py-0.5 rounded border border-cream/25">
              Zeevisual
            </span>
          </div>

          <nav className="flex items-center gap-2">
            <Link
              href="/studio/dashboard"
              className="px-3.5 py-1.5 rounded-lg bg-white text-espresso font-jakarta font-bold text-xs border border-espresso hover:bg-cream transition-colors"
            >
              Dashboard Studio
            </Link>
            <Link
              href="/zeevisual/aida-fitri-harahab"
              className="px-3.5 py-1.5 rounded-lg bg-mustard text-espresso font-jakarta font-bold text-xs border border-espresso hover:bg-mustard-light transition-colors"
            >
              Coba Pilih Foto
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full">
        {/* Clean Editorial Hero Section */}
        <section className="w-full px-4 md:px-10 py-12 md:py-16 border-b-[1.5px] border-espresso bg-white">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 flex flex-col gap-5">
              <span className="font-jakarta font-bold text-xs uppercase tracking-widest text-crimson">
                DIFOTOIN × ZEEVISUAL • CLIENT PHOTO PROOFING
              </span>

              <h1 className="font-anton text-4xl sm:text-5xl md:text-6xl text-espresso uppercase tracking-wide leading-[0.98]">
                Pilih Foto Favorit &amp; Album Digital{' '}
                <span className="font-fraunces italic font-black text-crimson normal-case">
                  Lebih Rapi &amp; Praktis
                </span>
              </h1>

              <p className="font-jakarta text-base text-espresso-muted max-w-2xl leading-relaxed">
                Cukup tempelkan link folder Google Drive di dashboard. Foto
                portrait maupun landscape langsung tersusun rapi secara
                otomatis, siap dipilih oleh klien dan diekspor ke Adobe
                Lightroom.
              </p>

              <div className="pt-1">
                <StepPills activeStep={1} showCards={false} />
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/studio/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-mustard hover:bg-mustard-light text-espresso font-anton text-sm md:text-base uppercase tracking-wider border-[1.5px] border-espresso shadow-retro-sm transition-all"
                >
                  <Camera className="w-4 h-4" />
                  <span>Buka Dashboard Zeevisual</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/zeevisual/aida-fitri-harahab"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-espresso hover:bg-crimson text-cream font-anton text-sm md:text-base uppercase tracking-wider border-[1.5px] border-espresso transition-all"
                >
                  <Heart className="w-4 h-4 text-mustard fill-mustard" />
                  <span>Halaman Pilih Foto Klien</span>
                </Link>
              </div>
            </div>

            {/* Right Clean Preview Frame */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm bg-cream p-3.5 rounded-2xl border-[1.5px] border-espresso shadow-retro">
                <div className="aspect-[4/5] rounded-xl overflow-hidden border border-espresso bg-white relative">
                  <img
                    src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85"
                    alt="Zeevisual Editorial Portrait"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 left-3 right-3 bg-white/95 text-espresso p-3 rounded-xl border border-espresso">
                    <div className="font-jakarta font-bold text-[10px] text-crimson uppercase tracking-wider">
                      ZEEVISUAL ARCHIVE
                    </div>
                    <div className="font-fraunces font-bold text-base text-espresso">
                      Aida Fitri Harahab
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Clean Route Cards */}
        <section className="w-full px-4 md:px-10 py-12">
          <div className="max-w-7xl mx-auto flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <span className="font-jakarta font-bold text-xs uppercase tracking-widest text-espresso-muted">
                Navigasi Cepat
              </span>
              <h2 className="font-anton text-2xl md:text-3xl text-espresso uppercase tracking-wide">
                Semua Halaman Aplikasi Difotoin
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Link
                href="/studio/dashboard"
                className="group bg-white p-6 rounded-2xl border-[1.5px] border-espresso shadow-retro-sm hover:shadow-retro transition-all flex flex-col justify-between gap-4"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded bg-cream text-espresso font-mono font-bold text-xs border border-espresso">
                      /studio/dashboard
                    </span>
                    <FolderOpen className="w-5 h-5 text-espresso" />
                  </div>
                  <h3 className="font-fraunces font-bold text-xl text-espresso group-hover:text-crimson transition-colors">
                    1. Dashboard Fotografer (Zeevisual)
                  </h3>
                  <p className="font-jakarta text-sm text-espresso-muted">
                    Input nama klien, tempel link folder Google Drive, salin
                    pesan WhatsApp otomatis, dan copy filter filename untuk
                    Adobe Lightroom.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 font-jakarta font-bold text-xs uppercase text-crimson">
                  <span>Buka Dashboard</span>
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </Link>

              <Link
                href="/zeevisual/aida-fitri-harahab"
                className="group bg-white p-6 rounded-2xl border-[1.5px] border-espresso shadow-retro-sm hover:shadow-retro transition-all flex flex-col justify-between gap-4"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded bg-mustard text-espresso font-mono font-bold text-xs border border-espresso">
                      /zeevisual/aida-fitri-harahab
                    </span>
                    <CheckCircle2 className="w-5 h-5 text-espresso" />
                  </div>
                  <h3 className="font-fraunces font-bold text-xl text-espresso group-hover:text-crimson transition-colors">
                    2. Halaman Pilih Foto Klien (Proofing)
                  </h3>
                  <p className="font-jakarta text-sm text-espresso-muted">
                    Susunan foto Portrait &amp; Landscape otomatis rapi,
                    indikator kuota live, bingkai Mustard 4px saat dipilih, dan
                    catatan revisi per foto.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 font-jakarta font-bold text-xs uppercase text-crimson">
                  <span>Buka Halaman Pilih Foto</span>
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </Link>

              <Link
                href="/aida-fitri-harahab?t=mhttesqg7rjx"
                className="group bg-white p-6 rounded-2xl border-[1.5px] border-espresso shadow-retro-sm hover:shadow-retro transition-all flex flex-col justify-between gap-4"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded bg-cream text-espresso font-mono font-bold text-xs border border-espresso">
                      /aida-fitri-harahab?t=mhttesqg7rjx
                    </span>
                    <KeyRound className="w-5 h-5 text-espresso" />
                  </div>
                  <h3 className="font-fraunces font-bold text-xl text-espresso group-hover:text-crimson transition-colors">
                    3. Album Digital — Mode Pemilik (`?t=`)
                  </h3>
                  <p className="font-jakarta text-sm text-espresso-muted">
                    Dilengkapi bar Mode Pemilik Album: Ganti Sampul, Bikin PIN 4
                    Digit, Atur Siapa yang Lihat (Sembunyikan Foto), dan Bagikan
                    Link.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 font-jakarta font-bold text-xs uppercase text-crimson">
                  <span>Buka Mode Pemilik</span>
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </Link>

              <Link
                href="/aida-fitri-harahab"
                className="group bg-white p-6 rounded-2xl border-[1.5px] border-espresso shadow-retro-sm hover:shadow-retro transition-all flex flex-col justify-between gap-4"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded bg-cream text-espresso font-mono font-bold text-xs border border-espresso">
                      /aida-fitri-harahab
                    </span>
                    <Lock className="w-5 h-5 text-espresso" />
                  </div>
                  <h3 className="font-fraunces font-bold text-xl text-espresso group-hover:text-crimson transition-colors">
                    4. Album Digital — Mode Tamu &amp; Keluarga
                  </h3>
                  <p className="font-jakarta text-sm text-espresso-muted">
                    Tampilan bersih untuk keluarga &amp; teman tanpa `?t=`.
                    Mendukung proteksi PIN 4 digit (demo: 2408), Lightbox layar
                    penuh, dan unduh HD.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 font-jakarta font-bold text-xs uppercase text-crimson">
                  <span>Buka Mode Tamu</span>
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <GiantFooter />
    </div>
  );
}
