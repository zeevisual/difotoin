import React from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  CheckCircle2,
  Crown,
  FolderOpen,
  Heart,
  KeyRound,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import GiantFooter from '@/components/GiantFooter';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-espresso">
      {/* Clean Minimal Top Header */}
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-espresso/15">
        <div className="max-w-7xl mx-auto px-4 md:px-10 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-anton text-2xl text-espresso tracking-wider uppercase">
              DIFOTOIN
            </span>
            <span className="text-espresso/25">|</span>
            <span className="font-jakarta font-semibold text-xs text-espresso-muted uppercase tracking-wider">
              by Zeevisual
            </span>
          </div>

          <nav className="flex items-center gap-2">
            <Link
              href="/studio/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-espresso text-cream font-jakarta font-semibold text-xs hover:bg-crimson transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Login Studio</span>
            </Link>
            <Link
              href="/zeevisual/aida-fitri-harahab"
              className="px-4 py-2 bg-[#FAF8F5] text-espresso font-jakarta font-semibold text-xs border border-espresso/20 hover:bg-cream transition-colors"
            >
              Demo Klien
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full">
        {/* Clean Editorial Hero Section */}
        <section className="w-full px-4 md:px-10 py-14 md:py-20 border-b border-espresso/10 bg-white">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 flex flex-col gap-5">
              <div className="inline-flex items-center gap-2 self-start px-3 py-1 bg-[#FAF8F5] border border-espresso/15 font-jakarta font-semibold text-xs text-espresso-muted uppercase tracking-wider">
                <Crown className="w-3.5 h-3.5 text-crimson" />
                <span>Platform Eksklusif Studio Berlangganan</span>
              </div>

              <h1 className="font-fraunces font-bold text-4xl sm:text-5xl md:text-6xl text-espresso tracking-tight leading-[1.08]">
                Pilih Foto Favorit &amp; Album Digital{' '}
                <span className="italic font-normal text-crimson">
                  Lebih Bersih &amp; Praktis
                </span>
              </h1>

              <p className="font-jakarta text-base text-espresso-muted max-w-xl leading-relaxed">
                Cukup tempelkan link folder Google Drive. Foto portrait maupun
                landscape langsung tersusun rapi tanpa terpotong, siap dipilih
                klien dan dikirim otomatis ke WhatsApp fotografer.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/studio/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-espresso hover:bg-crimson text-cream font-jakarta font-bold text-xs uppercase tracking-wider transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Login Dashboard Studio</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/zeevisual/aida-fitri-harahab"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#FAF8F5] hover:bg-cream text-espresso font-jakarta font-bold text-xs uppercase tracking-wider border border-espresso/20 transition-all"
                >
                  <Heart className="w-4 h-4 text-crimson" />
                  <span>Lihat Contoh Halaman Klien</span>
                </Link>
              </div>
            </div>

            {/* Right Clean Sharp-Edged Preview Frame */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm bg-[#FAF8F5] p-3 border border-espresso/15">
                <div className="aspect-[4/5] overflow-hidden bg-white relative">
                  <img
                    src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85"
                    alt="Zeevisual Editorial Portrait"
                    className="w-full h-full object-cover rounded-none"
                  />
                  <div className="absolute bottom-3 left-3 right-3 bg-white/95 text-espresso p-3 border border-espresso/15">
                    <div className="font-jakarta font-semibold text-[10px] text-espresso-muted uppercase tracking-widest">
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
        <section className="w-full px-4 md:px-10 py-14">
          <div className="max-w-7xl mx-auto flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <span className="font-jakarta font-semibold text-xs uppercase tracking-widest text-espresso-muted">
                Ekosistem Difotoin
              </span>
              <h2 className="font-fraunces font-bold text-2xl md:text-3xl text-espresso">
                Akses Studio &amp; Halaman Klien
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Link
                href="/studio/dashboard"
                className="group bg-white p-6 border border-espresso/15 hover:border-espresso/40 transition-all flex flex-col justify-between gap-4"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-[#FAF8F5] text-espresso font-mono font-semibold text-xs border border-espresso/15">
                      /studio/dashboard
                    </span>
                    <FolderOpen className="w-5 h-5 text-espresso-muted" />
                  </div>
                  <h3 className="font-fraunces font-bold text-xl text-espresso group-hover:text-crimson transition-colors">
                    1. Dashboard Studio &amp; Member Langganan
                  </h3>
                  <p className="font-jakarta text-sm text-espresso-muted">
                    Khusus fotografer terdaftar. Buat galeri dari link Google
                    Drive, salin pesan WA klien, dan kelola lisensi member.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 font-jakarta font-bold text-xs uppercase text-espresso group-hover:text-crimson">
                  <span>Buka Dashboard Studio</span>
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </Link>

              <Link
                href="/zeevisual/aida-fitri-harahab"
                className="group bg-white p-6 border border-espresso/15 hover:border-espresso/40 transition-all flex flex-col justify-between gap-4"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-[#FAF8F5] text-espresso font-mono font-semibold text-xs border border-espresso/15">
                      /zeevisual/aida-fitri-harahab
                    </span>
                    <CheckCircle2 className="w-5 h-5 text-espresso-muted" />
                  </div>
                  <h3 className="font-fraunces font-bold text-xl text-espresso group-hover:text-crimson transition-colors">
                    2. Halaman Pilih Foto Klien (Proofing)
                  </h3>
                  <p className="font-jakarta text-sm text-espresso-muted">
                    Tampilan foto utuh tanpa lekukan sudut, susunan portrait &amp;
                    landscape rapi, dan kirim daftar file terurut ke WA
                    fotografer.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 font-jakarta font-bold text-xs uppercase text-espresso group-hover:text-crimson">
                  <span>Buka Halaman Pilih Foto</span>
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </Link>

              <Link
                href="/aida-fitri-harahab?t=mhttesqg7rjx"
                className="group bg-white p-6 border border-espresso/15 hover:border-espresso/40 transition-all flex flex-col justify-between gap-4"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-[#FAF8F5] text-espresso font-mono font-semibold text-xs border border-espresso/15">
                      /aida-fitri-harahab?t=mhttesqg7rjx
                    </span>
                    <KeyRound className="w-5 h-5 text-espresso-muted" />
                  </div>
                  <h3 className="font-fraunces font-bold text-xl text-espresso group-hover:text-crimson transition-colors">
                    3. Album Digital — Mode Pemilik (`?t=`)
                  </h3>
                  <p className="font-jakarta text-sm text-espresso-muted">
                    Dilengkapi bar Mode Pemilik Album: Ganti Sampul, Bikin PIN 4
                    Digit, Sembunyikan Foto Privat, dan Bagikan Link.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 font-jakarta font-bold text-xs uppercase text-espresso group-hover:text-crimson">
                  <span>Buka Mode Pemilik</span>
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </Link>

              <Link
                href="/aida-fitri-harahab"
                className="group bg-white p-6 border border-espresso/15 hover:border-espresso/40 transition-all flex flex-col justify-between gap-4"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-[#FAF8F5] text-espresso font-mono font-semibold text-xs border border-espresso/15">
                      /aida-fitri-harahab
                    </span>
                    <Lock className="w-5 h-5 text-espresso-muted" />
                  </div>
                  <h3 className="font-fraunces font-bold text-xl text-espresso group-hover:text-crimson transition-colors">
                    4. Album Digital — Mode Tamu &amp; Keluarga
                  </h3>
                  <p className="font-jakarta text-sm text-espresso-muted">
                    Tampilan galeri bersih untuk keluarga &amp; teman tanpa
                    tombol edit. Mendukung proteksi PIN 4 digit dan unduh HD.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 font-jakarta font-bold text-xs uppercase text-espresso group-hover:text-crimson">
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
