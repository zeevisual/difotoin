'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Expand,
  Eye,
  FolderOpen,
  Heart,
  KeyRound,
  Lock,
  MessageCircle,
  Move,
  RefreshCw,
  Send,
  Share2,
  Sparkles,
  X,
} from 'lucide-react';
import { DrivePhoto } from '@/types/difotoin';
import { parseGoogleDriveFolderId } from '@/lib/drive-utils';
import { buildSuperAdminUpgradeWaUrl } from '@/lib/supabase';
import GiantFooter from '@/components/GiantFooter';
import DemoUpgradeModal from '@/components/DemoUpgradeModal';

const DEMO_SESSION_STORAGE_KEY = 'difotoin_fg_demo_session_v1';

interface DemoSessionState {
  studioName: string;
  clientName: string;
  gdriveUrl: string;
  quota: number;
  viewMode: 'proofing' | 'album';
}

export default function PhotographerDemoPage() {
  // Form & Demo Session State (Tab-isolated sessionStorage ONLY — never shareable via URL!)
  const [studioName, setStudioName] = useState('Zeevisual');
  const [clientName, setClientName] = useState('');
  const [gdriveUrl, setGdriveUrl] = useState('');
  const [quota, setQuota] = useState(30);
  const [viewMode, setViewMode] = useState<'proofing' | 'album'>('proofing');

  // Drive Photos State
  const [photos, setPhotos] = useState<DrivePhoto[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [driveWarning, setDriveWarning] = useState<string | null>(null);
  const [loadedFolderId, setLoadedFolderId] = useState<string | null>(null);

  // Interactive Proofing Simulation State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'selected' | 'unselected'
  >('all');

  // Interactive 3D Album Simulation State
  const [coverPhotoId, setCoverPhotoId] = useState<string | null>(null);
  const [coverPos, setCoverPos] = useState<{ x: number; y: number }>({
    x: 50,
    y: 35,
  });
  const [isAdjustingCover, setIsAdjustingCover] = useState(false);
  const [isDraggingCover, setIsDraggingCover] = useState(false);
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    startX: number;
    startY: number;
  } | null>(null);

  const [reviewIndex, setReviewIndex] = useState(0);
  const [autoPlayReview, setAutoPlayReview] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  // Lightbox State
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Subscription Upgrade Lock Modal State
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [lockedReason, setLockedReason] = useState(
    'Pengiriman Link Klien & Ekspor Teks Foto'
  );

  function triggerLock(reason: string) {
    setLockedReason(reason);
    setUpgradeModalOpen(true);
  }

  // Restore tab-only sessionStorage if photographer navigated from /studio/dashboard Demo Mode
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const requestedView = params.get('view');

    try {
      const saved = window.sessionStorage.getItem(DEMO_SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<DemoSessionState>;
        if (parsed.studioName) setStudioName(parsed.studioName);
        if (parsed.clientName) setClientName(parsed.clientName);
        if (parsed.quota) setQuota(parsed.quota);
        if (requestedView === 'album' || requestedView === 'proofing') {
          setViewMode(requestedView);
        } else if (parsed.viewMode) {
          setViewMode(parsed.viewMode);
        }
        if (parsed.gdriveUrl) {
          setGdriveUrl(parsed.gdriveUrl);
          void fetchPhotographerDrivePhotos(parsed.gdriveUrl);
        }
      } else if (requestedView === 'album' || requestedView === 'proofing') {
        setViewMode(requestedView);
      }
    } catch {
      // ignore storage parse error
    }
  }, []);

  // Persist current demo inputs in tab-only sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const payload: DemoSessionState = {
        studioName,
        clientName,
        gdriveUrl,
        quota,
        viewMode,
      };
      window.sessionStorage.setItem(
        DEMO_SESSION_STORAGE_KEY,
        JSON.stringify(payload)
      );
    } catch {
      // ignore
    }
  }, [studioName, clientName, gdriveUrl, quota, viewMode]);

  async function fetchPhotographerDrivePhotos(urlToLoad: string) {
    const trimmed = urlToLoad.trim();
    if (!trimmed) {
      setPhotos([]);
      setDriveWarning(
        'Tempelkan link folder Google Drive foto Anda terlebih dahulu untuk memulai simulasi.'
      );
      return;
    }

    const folderId = parseGoogleDriveFolderId(trimmed);
    if (!folderId || folderId.startsWith('demo-')) {
      setPhotos([]);
      setDriveWarning(
        'Format link folder Google Drive tidak valid. Contoh: https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOp'
      );
      return;
    }

    setIsLoadingPhotos(true);
    setDriveWarning(null);

    try {
      const res = await fetch(
        `/api/drive/${encodeURIComponent(folderId)}?strict=1`
      );
      if (res.ok) {
        const data = await res.json();
        const loaded: DrivePhoto[] = data.photos || [];
        setPhotos(loaded);
        setLoadedFolderId(folderId);
        setSelectedIds([]);
        setReviewIndex(0);
        if (loaded.length > 0) {
          setCoverPhotoId(loaded[0].id);
          setDriveWarning(null);
        } else {
          setDriveWarning(
            data.warning ||
              'Folder Google Drive belum disetel ke Publik ("Siapa saja yang memiliki link / Anyone with the link") atau tidak berisi file foto.'
          );
        }
      } else {
        setDriveWarning('Gagal menghubungi Google Drive. Silakan coba lagi.');
      }
    } catch {
      setDriveWarning('Terjadi kendala jaringan saat memuat folder Google Drive.');
    } finally {
      setIsLoadingPhotos(false);
    }
  }

  function handleLoadSubmit(e: React.FormEvent) {
    e.preventDefault();
    void fetchPhotographerDrivePhotos(gdriveUrl);
  }

  function handleToggleSelect(photoId: string) {
    setSelectedIds((prev) => {
      if (prev.includes(photoId)) {
        return prev.filter((id) => id !== photoId);
      }
      if (prev.length >= quota) return prev;
      return [...prev, photoId];
    });
  }

  const filteredPhotos = useMemo(() => {
    return photos.filter((p) => {
      const isSel = selectedIds.includes(p.id);
      if (statusFilter === 'selected') return isSel;
      if (statusFilter === 'unselected') return !isSel;
      return true;
    });
  }, [photos, selectedIds, statusFilter]);

  const coverPhoto = useMemo(() => {
    if (photos.length === 0) return null;
    return photos.find((p) => p.id === coverPhotoId) || photos[0];
  }, [photos, coverPhotoId]);

  const totalReview = photos.length;

  useEffect(() => {
    if (!autoPlayReview || viewMode !== 'album' || totalReview <= 1) return;
    const id = window.setInterval(() => {
      setReviewIndex((prev) => (prev + 1) % totalReview);
    }, 3200);
    return () => window.clearInterval(id);
  }, [autoPlayReview, viewMode, totalReview]);

  function getCircularOffset(idx: number, active: number, length: number) {
    if (length <= 0) return 0;
    let diff = idx - active;
    const half = Math.floor(length / 2);
    if (diff > half) diff -= length;
    if (diff < -half) diff += length;
    return diff;
  }

  function handleCoverPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!isAdjustingCover) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDraggingCover(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startX: coverPos.x,
      startY: coverPos.y,
    };
  }

  function handleCoverPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isAdjustingCover || !isDraggingCover || !dragStartRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = ((e.clientX - dragStartRef.current.clientX) / rect.width) * 100;
    const dy = ((e.clientY - dragStartRef.current.clientY) / rect.height) * 100;
    setCoverPos({
      x: Math.max(0, Math.min(100, Math.round(dragStartRef.current.startX - dx))),
      y: Math.max(0, Math.min(100, Math.round(dragStartRef.current.startY - dy))),
    });
  }

  function handleCoverPointerUp() {
    setIsDraggingCover(false);
    dragStartRef.current = null;
  }

  const displayBrand = studioName.trim() || 'Zeevisual';
  const displayClient = clientName.trim() || 'Zeevisual';
  const upgradeWaUrl = buildSuperAdminUpgradeWaUrl(displayBrand);

  return (
    <div
      className="min-h-screen flex flex-col bg-transparent text-slate-100 select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* STICKY DEMO SANDBOX WARNING & CONTROL HEADER */}
      <header className="sticky top-0 z-50 w-full glass-header border-b border-amber-400/25">
        {/* Top Demo Notice Strip */}
        <div className="w-full bg-amber-400/10 border-b border-amber-400/20 px-4 py-2">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs font-jakarta">
            <div className="flex items-center gap-2 text-amber-200">
              <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider">
                MODE DEMO TESTING
              </span>
              <span className="text-[11px] sm:text-xs text-slate-200">
                Tes pakai Google Drive Anda sendiri •{' '}
                <strong className="text-amber-300">
                  Link klien &amp; pengiriman teks foto dikunci
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={upgradeWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="WHATSAPP"
                className="btn-futuristic inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-[11px] uppercase tracking-wider shadow-[0_0_16px_rgba(34,211,238,0.35)] transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Langganan Full • WA 089614114644</span>
              </a>
              <Link
                href="/studio/dashboard"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-200 border border-white/10 font-semibold text-[11px] transition-colors"
              >
                <KeyRound className="w-3 h-3 text-cyan-400" />
                <span>Login Member</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Simulated Studio Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 md:px-10 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] shrink-0" />
            <span className="font-jakarta font-extrabold text-xs sm:text-sm md:text-base tracking-[0.2em] text-white uppercase truncate">
              {displayBrand}
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono text-cyan-400/80 tracking-widest uppercase border-l border-white/15 pl-2.5">
              by Zeevisual
            </span>
          </div>

          {/* Live View Switcher: Proofing vs 3D Album */}
          <div className="flex items-center gap-1.5 bg-white/[0.04] p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setViewMode('proofing')}
              className={`px-3 py-1.5 rounded-lg font-jakarta font-bold text-[11px] uppercase tracking-wider transition-all ${
                viewMode === 'proofing'
                  ? 'bg-cyan-400 text-slate-950 shadow-[0_0_14px_rgba(34,211,238,0.3)]'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              1. Simulasi Pilih Foto
            </button>
            <button
              type="button"
              onClick={() => setViewMode('album')}
              className={`px-3 py-1.5 rounded-lg font-jakarta font-bold text-[11px] uppercase tracking-wider transition-all ${
                viewMode === 'album'
                  ? 'bg-cyan-400 text-slate-950 shadow-[0_0_14px_rgba(34,211,238,0.3)]'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              2. Simulasi Album 3D
            </button>
          </div>

          <button
            type="button"
            onClick={() => triggerLock('Bagikan Link Galeri ke Klien')}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-amber-400/20 text-amber-200 border border-amber-400/30 font-jakarta font-bold text-[11px] transition-all"
          >
            <Lock className="w-3.5 h-3.5 text-amber-300" />
            <span>Kirim Link Klien (Terkunci)</span>
          </button>
        </div>
      </header>

      {/* PHOTOGRAPHER GOOGLE DRIVE INPUT SANDBOX PANEL */}
      <section className="w-full px-4 md:px-10 pt-6 pb-4">
        <div className="max-w-7xl mx-auto glass-panel rounded-2xl p-5 md:p-6 border border-cyan-400/25">
          <form onSubmit={handleLoadSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-cyan-300 font-jakarta font-bold text-xs uppercase tracking-[0.18em]">
                <Sparkles className="w-4 h-4" />
                <span>Panel Uji Coba Google Drive Fotografer</span>
              </div>
              <span className="font-jakarta text-[11px] text-slate-400">
                Pastikan folder Google Drive Anda disetel ke{' '}
                <strong className="text-slate-200">
                  &ldquo;Siapa saja yang memiliki link (Anyone with the link)&rdquo;
                </strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-3 flex flex-col gap-1">
                <label className="font-jakarta font-bold text-[11px] uppercase tracking-wider text-slate-300">
                  Nama Studio Anda
                </label>
                <input
                  type="text"
                  value={studioName}
                  onChange={(e) => setStudioName(e.target.value)}
                  placeholder="Contoh: Zeevisual"
                  className="w-full bg-white/[0.04] text-white placeholder:text-slate-500 px-3.5 py-2.5 rounded-xl border border-white/15 font-jakarta font-bold text-xs focus:outline-none focus:border-cyan-400 select-text"
                />
              </div>

              <div className="md:col-span-3 flex flex-col gap-1">
                <label className="font-jakarta font-bold text-[11px] uppercase tracking-wider text-slate-300">
                  Nama Klien Simulasi
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Masukkan nama client"
                  className="w-full bg-white/[0.04] text-white placeholder:text-slate-500 px-3.5 py-2.5 rounded-xl border border-white/15 font-jakarta font-semibold text-xs focus:outline-none focus:border-cyan-400 select-text"
                />
              </div>

              <div className="md:col-span-6 flex flex-col gap-1">
                <label className="font-jakarta font-bold text-[11px] uppercase tracking-wider text-slate-300">
                  Link Folder Google Drive Foto Anda
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 flex items-center gap-2 bg-white/[0.04] px-3.5 py-2 rounded-xl border border-white/15 focus-within:border-cyan-400">
                    <FolderOpen className="w-4 h-4 text-cyan-400 shrink-0" />
                    <input
                      type="text"
                      value={gdriveUrl}
                      onChange={(e) => setGdriveUrl(e.target.value)}
                      placeholder="Paste link Google Drive"
                      className="w-full bg-transparent text-white placeholder:text-slate-500 font-jakarta text-xs focus:outline-none select-text"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoadingPhotos}
                    className="btn-futuristic shrink-0 px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-jakarta font-extrabold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isLoadingPhotos ? 'animate-spin' : ''}`}
                    />
                    <span>
                      {isLoadingPhotos ? 'Memuat...' : 'Muat Foto Drive Saya'}
                    </span>
                  </button>
                </div>
                <span className="font-jakarta text-[11px] text-amber-300/90 mt-0.5">
                  *Pastikan link diberi akses Publik (&ldquo;Siapa saja yang memiliki link / Anyone with the link&rdquo;).
                </span>
              </div>
            </div>

            {loadedFolderId && photos.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-xs font-jakarta">
                <span className="text-cyan-300 font-semibold">
                  ✓ {photos.length} foto berhasil dimuat langsung dari Google
                  Drive Anda untuk simulasi lokal di perangkat ini.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      triggerLock('Salin Link Klien & Kirim ke WhatsApp')
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 text-amber-200 border border-amber-400/30 font-semibold text-[11px] transition-colors"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Salin Link Klien (Khusus Member)</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </section>

      {/* LOADING OR EMPTY STATE */}
      {isLoadingPhotos ? (
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center gap-4">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20" />
            <div className="absolute inset-0 rounded-full border-t-2 border-cyan-400 animate-spin" />
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_14px_#22d3ee]" />
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-cyan-300">
            Menyinkronkan Foto dari Google Drive Anda...
          </p>
        </main>
      ) : photos.length === 0 ? (
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-xl w-full glass-panel p-8 rounded-2xl text-center flex flex-col items-center gap-4 border border-white/10">
            <div className="w-14 h-14 rounded-2xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
              <FolderOpen className="w-7 h-7" />
            </div>
            <h2 className="font-fraunces font-bold text-2xl text-white">
              Tempel Link Google Drive Anda untuk Mulai Demo
            </h2>
            <p className="font-jakarta text-xs md:text-sm text-slate-300 leading-relaxed">
              {driveWarning ||
                'Masukkan link folder Google Drive berisi foto-foto hasil jepretan Anda di kolom atas, lalu klik "Muat Foto Drive Saya" untuk melihat simulasi Pilih Foto Klien & Album 3D secara langsung.'}
            </p>
            <div className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-left text-xs font-jakarta text-slate-300 flex flex-col gap-1.5">
              <span className="font-bold text-cyan-300 uppercase tracking-wider text-[11px]">
                Cara Cepat Mengetes:
              </span>
              <span>
                1. Buka Google Drive → klik kanan folder foto →{' '}
                <strong>Bagikan (Share)</strong>.
              </span>
              <span>
                2. Ubah akses umum menjadi{' '}
                <strong>Siapa saja yang memiliki link (Anyone with the link)</strong>.
              </span>
              <span>
                3. Tempel linknya di kotak atas lalu klik{' '}
                <strong>Muat Foto Drive Saya</strong>.
              </span>
            </div>
            <a
              href={upgradeWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-jakarta font-bold text-cyan-400 hover:text-cyan-300 pt-1"
            >
              <MessageCircle className="w-4 h-4" />
              <span>
                Ingin langsung aktifkan akun resmi studio Anda? Chat Super Admin
                WA 089614114644 →
              </span>
            </a>
          </div>
        </main>
      ) : viewMode === 'proofing' ? (
        /* ================================================================== */
        /* MODE 1: INTERACTIVE CLIENT PHOTO PROOFING SIMULATION               */
        /* ================================================================== */
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-10 py-6 flex flex-col gap-6">
          {/* Proofing Header Info + Filter Pills */}
          <div className="glass-panel p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[11px] text-cyan-400 uppercase tracking-[0.22em]">
                {displayBrand} // SIMULASI PILIH FOTO KLIEN
              </span>
              <h1 className="font-jakarta font-extrabold text-2xl md:text-3xl text-white uppercase tracking-wide">
                {displayClient}
              </h1>
              <p className="font-jakarta text-xs text-slate-400">
                Klik foto untuk mencoba memilih seperti klien Anda. Pengiriman
                daftar teks foto ke WA &amp; salin nama file dikunci pada Mode
                Demo.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: 'all', label: `Semua (${photos.length})` },
                  { id: 'selected', label: `Terpilih (${selectedIds.length})` },
                  {
                    id: 'unselected',
                    label: `Belum (${photos.length - selectedIds.length})`,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3.5 py-1.5 font-jakarta font-semibold text-xs border transition-all ${
                    statusFilter === tab.id
                      ? 'bg-cyan-400 text-slate-950 border-cyan-400 font-bold'
                      : 'bg-white/5 text-slate-300 border-white/10 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sharp-Edged (rounded-none) Responsive Photo Proofing Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 items-start">
            {filteredPhotos.map((photo, idx) => {
              const isSelected = selectedIds.includes(photo.id);
              const selectedOrder = selectedIds.indexOf(photo.id) + 1;

              return (
                <article
                  key={photo.id}
                  className={`group photo-card-surface rounded-none overflow-hidden flex flex-col hover:-translate-y-0.5 ${
                    isSelected
                      ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.22)]'
                      : ''
                  }`}
                >
                  <div
                    onClick={() => handleToggleSelect(photo.id)}
                    data-cursor={isSelected ? 'BATAL' : 'PILIH'}
                    className="relative w-full bg-[#05080F] overflow-hidden cursor-pointer flex items-center justify-center rounded-none"
                  >
                    <img
                      src={photo.thumbnailUrl}
                      alt="Demo Preview"
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.fallback) {
                          target.dataset.fallback = '1';
                          target.src = `https://lh3.googleusercontent.com/d/${photo.id}=w1200`;
                        }
                      }}
                      className="w-full h-auto max-h-[380px] object-contain block rounded-none transition-transform duration-500 group-hover:scale-[1.03]"
                    />

                    {/* Subtle Demo Watermark */}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
                      <span className="font-jakarta font-bold text-xs tracking-[0.28em] text-white uppercase -rotate-12">
                        DEMO • {displayBrand}
                      </span>
                    </div>

                    {isSelected && (
                      <div className="absolute top-2.5 left-2.5 bg-cyan-400 text-slate-950 font-mono font-bold text-[11px] px-2 py-0.5">
                        #{String(selectedOrder).padStart(2, '0')}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxIndex(idx);
                      }}
                      className="absolute top-2.5 right-2.5 p-1.5 bg-slate-950/75 text-white border border-white/15 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Perbesar Foto"
                    >
                      <Expand className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Card Footer: Masked Filename in Demo Mode + Select Button */}
                  <div className="p-3 flex items-center justify-between gap-2 border-t border-white/10 bg-[#080D17]/90">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Lock className="w-3 h-3 text-amber-300/80 shrink-0" />
                      <span className="font-mono text-[11px] text-slate-400 truncate">
                        FRAME_{String(idx + 1).padStart(3, '0')} ••••
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleSelect(photo.id)}
                      className={`px-3 py-1 font-jakarta font-bold text-[11px] uppercase tracking-wider border transition-all ${
                        isSelected
                          ? 'bg-cyan-400 text-slate-950 border-cyan-400'
                          : 'bg-white/5 text-white border-white/15 hover:border-cyan-400'
                      }`}
                    >
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1">
                          <Check className="w-3 h-3" /> Dipilih
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <Heart className="w-3 h-3 text-cyan-400" /> Pilih
                        </span>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Sticky Bottom Demo Proofing Action Bar (Locked WA & Text Export) */}
          <div className="sticky bottom-4 z-40 glass-panel border border-cyan-400/35 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 bg-cyan-400/15 border border-cyan-400/30 font-mono font-bold text-sm text-cyan-300">
                {selectedIds.length} / {quota} Foto Dipilih
              </div>
              <span className="font-jakarta text-xs text-slate-300">
                Tes klik tombol kirim di kanan untuk melihat alur akhir klien:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() =>
                  triggerLock('Salin Teks Filter Lightroom & Nama File Foto')
                }
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 border border-white/15 font-jakarta font-bold text-xs transition-all"
              >
                <Copy className="w-3.5 h-3.5 text-amber-300" />
                <span>Salin Teks Foto (Terkunci)</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  triggerLock('Kirim Daftar Teks Foto Terpilih ke WhatsApp')
                }
                className="btn-futuristic inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-jakarta font-extrabold text-xs uppercase tracking-wider shadow-[0_0_24px_rgba(34,211,238,0.35)] transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Pilihan ke WA (Mode Demo)</span>
              </button>
            </div>
          </div>
        </main>
      ) : (
        /* ================================================================== */
        /* MODE 2: INTERACTIVE 3D DIGITAL ALBUM SIMULATION                    */
        /* ================================================================== */
        <main className="flex-1 flex flex-col">
          {/* HERO COVER WITH SOLID BACKING & DRAG-TO-REPOSITION */}
          <section className="relative w-full min-h-[68vh] md:min-h-[82vh] flex flex-col justify-end overflow-hidden bg-[#02050A]">
            <div
              onPointerDown={handleCoverPointerDown}
              onPointerMove={handleCoverPointerMove}
              onPointerUp={handleCoverPointerUp}
              onPointerCancel={handleCoverPointerUp}
              className={`absolute inset-0 z-0 bg-[#02050A] ${
                isAdjustingCover
                  ? isDraggingCover
                    ? 'cursor-grabbing touch-none'
                    : 'cursor-grab touch-none'
                  : ''
              }`}
            >
              {coverPhoto && (
                <img
                  src={coverPhoto.fullResUrl}
                  alt={displayClient}
                  draggable={false}
                  style={{ objectPosition: `${coverPos.x}% ${coverPos.y}%` }}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.fallback) {
                      target.dataset.fallback = '1';
                      target.src = `https://lh3.googleusercontent.com/d/${coverPhoto.id}=w2000`;
                    }
                  }}
                  className="w-full h-full object-cover opacity-90 select-none transition-[object-position] duration-75"
                />
              )}
              <div
                className={`absolute inset-0 pointer-events-none bg-gradient-to-t from-[#02050A] via-[#02050A]/35 to-[#02050A]/25 transition-opacity ${
                  isAdjustingCover ? 'opacity-35' : 'opacity-100'
                }`}
              />
            </div>

            {isAdjustingCover && (
              <div className="relative z-20 max-w-md mx-auto mb-auto mt-6 px-4 w-full">
                <div className="glass-panel p-4 border border-cyan-400/50 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs font-jakarta font-bold text-cyan-300">
                    <span className="inline-flex items-center gap-1.5">
                      <Move className="w-3.5 h-3.5" /> Geser Foto Sampul
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAdjustingCover(false)}
                      className="px-2.5 py-1 bg-cyan-400 text-slate-950 font-bold text-[11px]"
                    >
                      Selesai
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[11px] font-mono text-slate-300">
                    <label className="flex flex-col gap-1">
                      <span>Horizontal ({coverPos.x}%)</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={coverPos.x}
                        onChange={(e) =>
                          setCoverPos((p) => ({
                            ...p,
                            x: Number(e.target.value),
                          }))
                        }
                        className="accent-cyan-400"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span>Vertikal ({coverPos.y}%)</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={coverPos.y}
                        onChange={(e) =>
                          setCoverPos((p) => ({
                            ...p,
                            y: Number(e.target.value),
                          }))
                        }
                        className="accent-cyan-400"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="relative z-10 max-w-7xl w-full mx-auto px-4 md:px-10 pb-10 md:pb-16 pt-20 flex flex-col md:flex-row md:items-end justify-between gap-6 pointer-events-none">
              <div className="flex flex-col gap-2.5 max-w-2xl pointer-events-auto">
                <span className="font-mono text-[11px] text-cyan-400 uppercase tracking-[0.25em]">
                  {displayBrand} // DIGITAL ALBUM PREVIEW
                </span>
                <h1 className="font-jakarta font-extrabold text-3xl sm:text-5xl md:text-6xl text-white uppercase tracking-[0.06em] leading-[1.05]">
                  {displayClient}
                </h1>
                <p className="font-jakarta text-xs sm:text-sm text-slate-300 tracking-[0.14em] uppercase">
                  {photos.length} HIGH-RES FRAMES • MODE SIMULASI DEMO
                </p>
                <div className="w-16 h-1 bg-cyan-400 shadow-[0_0_12px_#22d3ee] mt-1" />
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => setIsAdjustingCover((v) => !v)}
                  className="px-4 py-2.5 glass-panel hover:border-cyan-400/50 text-white font-jakarta font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2"
                >
                  <Move className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isAdjustingCover ? 'Tutup Geser' : 'Geser Sampul'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerLock('Bagikan Link Album 3D ke Klien')}
                  className="btn-futuristic px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-jakarta font-extrabold text-xs uppercase tracking-wider inline-flex items-center gap-2 shadow-[0_0_22px_rgba(34,211,238,0.35)]"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Bagikan Album (Terkunci)</span>
                </button>
              </div>
            </div>
          </section>

          {/* 3D FLUID ORBIT COVERFLOW REVIEW PHOTO */}
          <section className="w-full py-14 md:py-20 px-4 md:px-10 border-t border-white/10 overflow-hidden">
            <div className="max-w-7xl mx-auto flex flex-col items-center gap-8">
              <div className="flex flex-col items-center gap-2 text-center">
                <h2 className="font-jakarta font-bold text-lg md:text-2xl uppercase tracking-[0.28em] text-white">
                  REVIEW PHOTO
                </h2>
                <div className="flex items-center gap-3">
                  <p className="font-jakarta text-xs text-slate-400">
                    Tes animasi 3D menggunakan foto dari Google Drive Anda
                  </p>
                  {totalReview > 1 && (
                    <button
                      type="button"
                      onClick={() => setAutoPlayReview((v) => !v)}
                      className={`px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-widest border transition-all ${
                        autoPlayReview
                          ? 'bg-cyan-400/20 text-cyan-300 border-cyan-400/50'
                          : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                      }`}
                    >
                      {autoPlayReview ? '● Auto On' : '○ Auto Slide'}
                    </button>
                  )}
                </div>
              </div>

              <div
                className="relative w-full flex items-center justify-center"
                onTouchStart={(e) => {
                  touchStartXRef.current = e.touches[0]?.clientX ?? null;
                }}
                onTouchEnd={(e) => {
                  if (touchStartXRef.current === null || totalReview <= 1)
                    return;
                  const diff =
                    touchStartXRef.current -
                    (e.changedTouches[0]?.clientX ?? touchStartXRef.current);
                  touchStartXRef.current = null;
                  if (Math.abs(diff) > 40) {
                    setReviewIndex((prev) =>
                      diff > 0
                        ? (prev + 1) % totalReview
                        : (prev - 1 + totalReview) % totalReview
                    );
                  }
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setReviewIndex((p) => (p - 1 + totalReview) % totalReview)
                  }
                  aria-label="Sebelumnya"
                  className="z-30 p-2 sm:p-3 glass-panel hover:bg-white/15 text-white transition-all mr-1 sm:mr-4 shrink-0"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>

                <div
                  className="relative flex-1 max-w-5xl h-[320px] sm:h-[400px] md:h-[450px] flex items-center justify-center select-none"
                  style={{ perspective: '1400px' }}
                >
                  {photos.map((item, idx) => {
                    const offset = getCircularOffset(
                      idx,
                      reviewIndex,
                      totalReview
                    );
                    const absOffset = Math.abs(offset);
                    if (absOffset > 3) return null;

                    const isCenter = offset === 0;
                    const translateXPercent =
                      offset * (absOffset === 1 ? 74 : absOffset === 2 ? 64 : 58);
                    const translateZPx = isCenter
                      ? 40
                      : absOffset === 1
                        ? -70
                        : -170;
                    const rotateYDeg = isCenter
                      ? 0
                      : offset < 0
                        ? Math.min(32, absOffset * 18)
                        : -Math.min(32, absOffset * 18);
                    const scaleVal = isCenter
                      ? 1
                      : absOffset === 1
                        ? 0.86
                        : absOffset === 2
                          ? 0.74
                          : 0.6;
                    const opacityVal =
                      absOffset > 2
                        ? 0
                        : isCenter
                          ? 1
                          : absOffset === 1
                            ? 0.75
                            : 0.42;

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (isCenter) {
                            setLightboxIndex(idx);
                          } else {
                            setReviewIndex(idx);
                          }
                        }}
                        data-cursor={isCenter ? 'VIEW' : 'SLIDE'}
                        style={{
                          zIndex: 20 - absOffset * 4,
                          opacity: opacityVal,
                          transform: `translate3d(${translateXPercent}%, 0, ${translateZPx}px) rotateY(${rotateYDeg}deg) scale(${scaleVal})`,
                          transition:
                            'transform 680ms cubic-bezier(0.16, 1, 0.3, 1), opacity 520ms ease',
                        }}
                        className="absolute w-[200px] sm:w-[235px] md:w-[270px] aspect-[3/4] cursor-pointer rounded-none will-change-transform"
                      >
                        <div
                          onMouseMove={(e) => {
                            if (!isCenter) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            const nx =
                              (e.clientX - rect.left) / rect.width - 0.5;
                            const ny =
                              (e.clientY - rect.top) / rect.height - 0.5;
                            e.currentTarget.style.transform = `perspective(900px) rotateX(${(-ny * 8).toFixed(2)}deg) rotateY(${(nx * 10).toFixed(2)}deg)`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = '';
                          }}
                          className={`relative w-full h-full overflow-hidden rounded-none border transition-transform duration-150 ease-out ${
                            isCenter
                              ? 'border-cyan-400/70 shadow-[0_22px_60px_rgba(0,0,0,0.85),0_0_24px_rgba(34,211,238,0.2)]'
                              : 'border-white/15'
                          }`}
                        >
                          <img
                            src={item.thumbnailUrl}
                            alt={displayClient}
                            decoding="async"
                            draggable={false}
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (!target.dataset.fallback) {
                                target.dataset.fallback = '1';
                                target.src = `https://lh3.googleusercontent.com/d/${item.id}=w1200`;
                              }
                            }}
                            className="w-full h-full object-cover rounded-none"
                          />
                          <div className="absolute top-3 inset-x-3 py-1 px-2 bg-[#070B14]/90 border border-white/15 text-center">
                            <span className="font-jakarta font-bold text-[10px] uppercase tracking-[0.18em] text-white truncate block">
                              {isCenter ? displayClient : displayBrand}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setReviewIndex((p) => (p + 1) % totalReview)}
                  aria-label="Berikutnya"
                  className="z-30 p-2 sm:p-3 glass-panel hover:bg-white/15 text-white transition-all ml-1 sm:ml-4 shrink-0"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>
          </section>

          {/* SHARP-EDGED ARCHIVE PHOTO GRID */}
          <section className="w-full py-10 px-4 md:px-10 border-t border-white/10">
            <div className="max-w-7xl mx-auto flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h3 className="font-jakarta font-bold text-lg text-white uppercase tracking-wider">
                  Arsip Foto ({photos.length} Frame)
                </h3>
                <span className="font-jakarta text-xs text-slate-400">
                  Klik &ldquo;Jadikan Sampul&rdquo; pada kartu foto untuk mengetes pergantian sampul
                </span>
              </div>

              <div className="columns-2 sm:columns-2 lg:columns-3 gap-3 sm:gap-5">
                {photos.map((photo, idx) => {
                  const isCurrentCover = coverPhoto?.id === photo.id;
                  return (
                    <article
                      key={photo.id}
                      className="break-inside-avoid mb-3 sm:mb-5 photo-card-surface rounded-none overflow-hidden group"
                    >
                      <div
                        onClick={() => setLightboxIndex(idx)}
                        data-cursor="VIEW"
                        className="relative w-full overflow-hidden cursor-pointer bg-[#05080F] rounded-none"
                      >
                        <img
                          src={photo.thumbnailUrl}
                          alt={displayClient}
                          loading="lazy"
                          decoding="async"
                          draggable={false}
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.dataset.fallback) {
                              target.dataset.fallback = '1';
                              target.src = `https://lh3.googleusercontent.com/d/${photo.id}=w1200`;
                            }
                          }}
                          className="w-full h-auto object-cover block rounded-none transition-transform duration-500 group-hover:scale-[1.02]"
                        />
                      </div>

                      <div className="p-2.5 flex items-center justify-between gap-2 border-t border-white/10 bg-[#080D17]/90">
                        <button
                          type="button"
                          onClick={() => setCoverPhotoId(photo.id)}
                          className={`px-2.5 py-1 text-[11px] font-jakarta font-semibold border transition-colors ${
                            isCurrentCover
                              ? 'bg-cyan-400 text-slate-950 border-cyan-400 font-bold'
                              : 'bg-white/5 text-slate-300 border-white/10 hover:text-white'
                          }`}
                        >
                          {isCurrentCover ? 'Sampul Aktif' : 'Jadikan Sampul'}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            triggerLock('Unduh File HD & Bagikan ke Klien')
                          }
                          className="px-2.5 py-1 text-[11px] font-jakarta font-semibold bg-white/5 hover:bg-amber-400/20 text-amber-200 border border-amber-400/25 inline-flex items-center gap-1"
                        >
                          <Lock className="w-3 h-3" />
                          <span>Unduh</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        </main>
      )}

      {/* LIGHTBOX MODAL (DEMO MODE — PROTECTED) */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[110] bg-[#02050A]/95 backdrop-blur-xl flex flex-col justify-between p-4 md:p-8"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="max-w-7xl w-full mx-auto flex items-center justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
              <Eye className="w-4 h-4" />
              <span>
                PREVIEW DEMO • {lightboxIndex + 1} / {photos.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="p-2 glass-panel text-white hover:text-cyan-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div
            className="flex-1 flex items-center justify-center my-4 overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photos[lightboxIndex].fullResUrl}
              alt="Preview"
              draggable={false}
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.fallback) {
                  target.dataset.fallback = '1';
                  target.src = `https://lh3.googleusercontent.com/d/${photos[lightboxIndex].id}=w2000`;
                }
              }}
              className="max-h-[78vh] max-w-full object-contain rounded-none border border-white/15"
            />
          </div>

          <div
            className="max-w-xl w-full mx-auto flex items-center justify-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() =>
                setLightboxIndex(
                  (lightboxIndex - 1 + photos.length) % photos.length
                )
              }
              className="px-4 py-2 glass-panel text-xs font-jakarta font-semibold text-white"
            >
              ← Sebelumnya
            </button>
            <button
              type="button"
              onClick={() =>
                triggerLock('Kirim Link & Ekspor Teks Foto Terpilih')
              }
              className="px-4 py-2 bg-cyan-400 text-slate-950 text-xs font-jakarta font-extrabold uppercase tracking-wider"
            >
              Aktifkan Full Akses (WA 089614114644)
            </button>
            <button
              type="button"
              onClick={() =>
                setLightboxIndex((lightboxIndex + 1) % photos.length)
              }
              className="px-4 py-2 glass-panel text-xs font-jakarta font-semibold text-white"
            >
              Berikutnya →
            </button>
          </div>
        </div>
      )}

      {/* SUBSCRIPTION UPGRADE MODAL */}
      <DemoUpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        studioName={displayBrand}
        lockedActionLabel={lockedReason}
      />

      <GiantFooter studioName={displayBrand} studioSlug="zeevisual" />
    </div>
  );
}
