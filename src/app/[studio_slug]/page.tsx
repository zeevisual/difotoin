'use client';

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Heart,
  KeyRound,
  Lock,
  Maximize2,
  Move,
  PlayCircle,
  Share2,
  X,
} from 'lucide-react';
import GiantFooter from '@/components/GiantFooter';
import {
  fetchGalleryBySlug,
  SEED_GALLERIES,
  updateGallerySettings,
} from '@/lib/supabase';
import { DEMO_EDITORIAL_PHOTOS } from '@/lib/drive-utils';
import { DrivePhoto, GalleryRecord } from '@/types/difotoin';

interface AlbumPageProps {
  params: {
    studio_slug: string;
  };
}

function DigitalAlbumContent({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get('t');

  const [gallery, setGallery] = useState<GalleryRecord>(SEED_GALLERIES[0]);
  const [photos, setPhotos] = useState<DrivePhoto[]>(DEMO_EDITORIAL_PHOTOS);
  const [isLoading, setIsLoading] = useState(true);

  // Visitor / Owner simulation states
  const [previewAsVisitor, setPreviewAsVisitor] = useState(false);
  const [isPinUnlocked, setIsPinUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Interactive Owner Control Modes
  const [activeOwnerTool, setActiveOwnerTool] = useState<
    'none' | 'cover' | 'pin' | 'visibility' | 'share'
  >('none');
  const [pinDraft, setPinDraft] = useState('');
  const [isSavingOwnerSetting, setIsSavingOwnerSetting] = useState(false);
  const [copiedCleanLink, setCopiedCleanLink] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Cover Photo Focal Position & Repositioning State ("Geser Sampul")
  // Default posY = 22% so faces in portrait/group photos are framed nicely right away
  const [coverPosX, setCoverPosX] = useState<number>(50);
  const [coverPosY, setCoverPosY] = useState<number>(22);
  const [coverFitMode, setCoverFitMode] = useState<'cover' | 'contain'>('cover');
  const [isAdjustingCover, setIsAdjustingCover] = useState(false);
  const isDraggingCoverRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number }>({
    x: 0,
    y: 0,
    posX: 50,
    posY: 22,
  });

  // Featured Showcase Carousel State ("REVIEW PHOTO") + Smooth Animation Direction
  const [featuredCenterIdx, setFeaturedCenterIdx] = useState(0);
  const [carouselDirection, setCarouselDirection] = useState<'next' | 'prev'>(
    'next'
  );
  const [carouselAnimKey, setCarouselAnimKey] = useState(0);
  const touchStartXRef = useRef<number | null>(null);

  // Lightbox & Favorites
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [guestFavorites, setGuestFavorites] = useState<string[]>(['photo-01']);

  const [baseUrl, setBaseUrl] = useState(
    process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  );

  // Load saved cover focal position from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.location.origin) {
        setBaseUrl(window.location.origin);
      }
      try {
        const savedPos = window.localStorage.getItem(
          `difotoin_cover_pos_${slug}`
        );
        if (savedPos) {
          const parsed = JSON.parse(savedPos);
          if (typeof parsed.x === 'number') setCoverPosX(parsed.x);
          if (typeof parsed.y === 'number') setCoverPosY(parsed.y);
          if (parsed.fit === 'cover' || parsed.fit === 'contain') {
            setCoverFitMode(parsed.fit);
          }
        }
      } catch {
        // Ignore storage errors
      }
    }

    let isMounted = true;
    async function loadAlbum() {
      setIsLoading(true);
      const found = await fetchGalleryBySlug(slug);
      const activeGal = found || { ...SEED_GALLERIES[0], slug };
      if (!isMounted) return;

      setGallery(activeGal);
      setPinDraft(activeGal.album_pin || '');

      try {
        const res = await fetch(
          `/api/drive/${encodeURIComponent(activeGal.gdrive_folder_id)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.photos) && data.photos.length > 0) {
            setPhotos(data.photos);
          }
        }
      } catch {
        // Fallback photos already present
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadAlbum();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  function saveCoverPosition(
    nextX: number,
    nextY: number,
    nextFit: 'cover' | 'contain' = coverFitMode
  ) {
    const clampedX = Math.max(0, Math.min(100, Math.round(nextX)));
    const clampedY = Math.max(0, Math.min(100, Math.round(nextY)));
    setCoverPosX(clampedX);
    setCoverPosY(clampedY);
    setCoverFitMode(nextFit);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(
          `difotoin_cover_pos_${slug}`,
          JSON.stringify({ x: clampedX, y: clampedY, fit: nextFit })
        );
      } catch {
        // Ignore storage errors
      }
    }
  }

  // Pointer drag handlers for interactive cover repositioning
  function handleCoverPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!isAdjustingCover) return;
    isDraggingCoverRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: coverPosX,
      posY: coverPosY,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handleCoverPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isAdjustingCover || !isDraggingCoverRef.current) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    // Dragging down moves the image down (decreases object-position Y%)
    const nextX = dragStartRef.current.posX - deltaX * 0.18;
    const nextY = dragStartRef.current.posY - deltaY * 0.18;
    saveCoverPosition(nextX, nextY);
  }

  function handleCoverPointerUp() {
    isDraggingCoverRef.current = false;
  }

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2800);
  }

  function handleImageError(
    photoId: string,
    e: React.SyntheticEvent<HTMLImageElement>
  ) {
    const target = e.currentTarget;
    if (!target.dataset.fallback) {
      target.dataset.fallback = '1';
      target.src = `https://lh3.googleusercontent.com/d/${photoId}=w1200`;
    }
  }

  const hasValidOwnerToken = Boolean(
    tokenParam && tokenParam === gallery.owner_token
  );
  const isOwnerMode = hasValidOwnerToken && !previewAsVisitor;

  const cleanVisitorUrl = `${baseUrl}/${gallery.slug}`;
  const whatsappVisitorShareText = `Halo keluarga & sahabat! Berikut link album digital momen spesial ${gallery.client_name} di Difotoin:\n${cleanVisitorUrl}${
    gallery.album_pin ? `\n(PIN Akses Album: ${gallery.album_pin})` : ''
  }`;

  const coverPhoto = useMemo(() => {
    return (
      photos.find((p) => p.id === gallery.cover_photo_id) ||
      photos[0] ||
      DEMO_EDITORIAL_PHOTOS[0]
    );
  }, [photos, gallery.cover_photo_id]);

  const visiblePhotos = useMemo(() => {
    const hiddenSet = new Set(gallery.hidden_photo_ids || []);
    return photos.filter((photo) => {
      if (!isOwnerMode && hiddenSet.has(photo.id)) {
        return false;
      }
      return true;
    });
  }, [photos, gallery.hidden_photo_ids, isOwnerMode]);

  // Smooth Carousel Navigation Helpers
  function handlePrevCarousel() {
    if (visiblePhotos.length === 0) return;
    setCarouselDirection('prev');
    setCarouselAnimKey((k) => k + 1);
    setFeaturedCenterIdx(
      (prev) => (prev - 1 + visiblePhotos.length) % visiblePhotos.length
    );
  }

  function handleNextCarousel() {
    if (visiblePhotos.length === 0) return;
    setCarouselDirection('next');
    setCarouselAnimKey((k) => k + 1);
    setFeaturedCenterIdx((prev) => (prev + 1) % visiblePhotos.length);
  }

  function handleSelectCarouselOffset(offset: number, idx: number) {
    if (offset === 0) {
      setLightboxIndex(idx);
      return;
    }
    setCarouselDirection(offset > 0 ? 'next' : 'prev');
    setCarouselAnimKey((k) => k + 1);
    setFeaturedCenterIdx(idx);
  }

  // Owner Action 1: Set Cover Photo (Ganti Sampul)
  async function handleSetCoverPhoto(photoId: string) {
    setIsSavingOwnerSetting(true);
    try {
      const updated = await updateGallerySettings(
        gallery.id,
        gallery.owner_token,
        {
          cover_photo_id: photoId,
        }
      );
      if (updated) {
        setGallery(updated);
      } else {
        setGallery((prev) => ({ ...prev, cover_photo_id: photoId }));
      }
      showToast('Foto sampul album berhasil diperbarui.');
    } finally {
      setIsSavingOwnerSetting(false);
    }
  }

  // Owner Action 2: Save or Clear 4-Digit PIN (Bikin PIN)
  async function handleSaveAlbumPin(newPin: string | null) {
    if (newPin !== null && newPin.length !== 4) {
      showToast('PIN harus terdiri dari tepat 4 angka.');
      return;
    }
    setIsSavingOwnerSetting(true);
    try {
      const updated = await updateGallerySettings(
        gallery.id,
        gallery.owner_token,
        {
          album_pin: newPin,
        }
      );
      if (updated) {
        setGallery(updated);
      } else {
        setGallery((prev) => ({ ...prev, album_pin: newPin }));
      }
      setPinDraft(newPin || '');
      showToast(
        newPin
          ? `PIN Album (${newPin}) diaktifkan.`
          : 'PIN Album dinonaktifkan.'
      );
      setActiveOwnerTool('none');
    } finally {
      setIsSavingOwnerSetting(false);
    }
  }

  // Owner Action 3: Toggle Photo Visibility
  async function handleToggleHidePhoto(photoId: string) {
    const currentHidden = gallery.hidden_photo_ids || [];
    const isHidden = currentHidden.includes(photoId);
    const nextHidden = isHidden
      ? currentHidden.filter((id) => id !== photoId)
      : [...currentHidden, photoId];

    setIsSavingOwnerSetting(true);
    try {
      const updated = await updateGallerySettings(
        gallery.id,
        gallery.owner_token,
        {
          hidden_photo_ids: nextHidden,
        }
      );
      if (updated) {
        setGallery(updated);
      } else {
        setGallery((prev) => ({ ...prev, hidden_photo_ids: nextHidden }));
      }
      showToast(
        isHidden
          ? 'Foto ditampilkan kembali untuk pengunjung.'
          : 'Foto disembunyikan dari pengunjung.'
      );
    } finally {
      setIsSavingOwnerSetting(false);
    }
  }

  // Owner Action 4: Copy Clean Visitor Link
  async function handleCopyCleanLink() {
    await navigator.clipboard.writeText(cleanVisitorUrl);
    setCopiedCleanLink(true);
    showToast(`Link tamu disalin: ${cleanVisitorUrl}`);
    setTimeout(() => setCopiedCleanLink(false), 2500);
  }

  function handleVerifyVisitorPin(e: React.FormEvent) {
    e.preventDefault();
    if (pinInput.trim() === gallery.album_pin) {
      setIsPinUnlocked(true);
      setPinError(null);
      showToast('Akses album dibuka.');
    } else {
      setPinError('PIN tidak sesuai. Silakan coba lagi.');
    }
  }

  function toggleGuestFavorite(photoId: string) {
    setGuestFavorites((prev) =>
      prev.includes(photoId)
        ? prev.filter((id) => id !== photoId)
        : [...prev, photoId]
    );
  }

  const requiresPinGate =
    !isOwnerMode && Boolean(gallery.album_pin) && !isPinUnlocked;

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-slate-100">
      {/* Futuristic Glassmorphic Top Header */}
      <header className="sticky top-0 z-50 w-full glass-header">
        <div className="max-w-7xl mx-auto px-4 md:px-10 h-14 md:h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] shrink-0" />
            <Link
              href="/"
              className="font-jakarta font-extrabold text-xs sm:text-sm md:text-base text-white tracking-[0.22em] uppercase hover:text-cyan-400 transition-colors truncate"
            >
              {gallery.studio_name || 'ZEEVISUAL'}
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-[11px] font-jakarta font-semibold uppercase tracking-[0.2em] text-slate-400">
            <a
              href="#hero-album"
              className="text-white border-b-2 border-cyan-400 pb-1"
            >
              EXPLORE
            </a>
            <a
              href="#review-strip"
              className="hover:text-white transition-colors"
            >
              REVIEW
            </a>
            <a
              href="#photo-grid"
              className="hover:text-white transition-colors"
            >
              PHOTO ({visiblePhotos.length})
            </a>
            <Link
              href={`/${gallery.studio_slug}/${gallery.slug}`}
              className="hover:text-cyan-400 transition-colors"
            >
              PROOFING
            </Link>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {hasValidOwnerToken && previewAsVisitor && (
              <button
                type="button"
                onClick={() => setPreviewAsVisitor(false)}
                className="inline-flex items-center gap-1.5 bg-cyan-400 text-slate-950 font-jakarta font-bold text-[11px] sm:text-xs px-2.5 sm:px-3.5 py-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Mode Pemilik</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsAdjustingCover((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 font-jakarta font-semibold text-[11px] sm:text-xs px-2.5 sm:px-3.5 py-1.5 border transition-colors ${
                isAdjustingCover
                  ? 'bg-cyan-400 text-slate-950 border-cyan-400 font-bold'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
              }`}
              title="Geser posisi foto sampul agar wajah/objek pas"
            >
              <Move className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isAdjustingCover ? 'Selesai Geser' : 'Geser Sampul'}
              </span>
            </button>

            <Link
              href={`/${gallery.studio_slug}/${gallery.slug}`}
              className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-jakarta font-semibold text-[11px] sm:text-xs px-3 sm:px-4 py-1.5 sm:py-2 border border-white/15 transition-colors"
            >
              <span>Pilih Foto</span>
            </Link>
          </div>
        </div>
      </header>

      {/* STICKY GLASSMORPHIC "MODE PEMILIK ALBUM" BAR */}
      {isOwnerMode && (
        <aside className="sticky top-14 md:top-16 z-40 w-full glass-panel-strong border-x-0 border-t-0 px-4 md:px-10 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                <span className="font-jakarta font-bold text-[11px] sm:text-xs uppercase tracking-[0.18em] text-cyan-300">
                  Mode Pemilik Album
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setActiveOwnerTool(
                      activeOwnerTool === 'cover' ? 'none' : 'cover'
                    )
                  }
                  className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 font-jakarta font-semibold text-[11px] sm:text-xs border transition-all ${
                    activeOwnerTool === 'cover'
                      ? 'bg-cyan-400 text-slate-950 border-cyan-400'
                      : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Ganti &amp; Geser Sampul</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setActiveOwnerTool(
                      activeOwnerTool === 'pin' ? 'none' : 'pin'
                    )
                  }
                  className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 font-jakarta font-semibold text-[11px] sm:text-xs border transition-all ${
                    activeOwnerTool === 'pin'
                      ? 'bg-cyan-400 text-slate-950 border-cyan-400'
                      : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>
                    PIN {gallery.album_pin ? `(${gallery.album_pin})` : ''}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setActiveOwnerTool(
                      activeOwnerTool === 'visibility' ? 'none' : 'visibility'
                    )
                  }
                  className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 font-jakarta font-semibold text-[11px] sm:text-xs border transition-all ${
                    activeOwnerTool === 'visibility'
                      ? 'bg-cyan-400 text-slate-950 border-cyan-400'
                      : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>
                    Sembunyikan ({gallery.hidden_photo_ids?.length || 0})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setActiveOwnerTool(
                      activeOwnerTool === 'share' ? 'none' : 'share'
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-400 text-slate-950 font-jakarta font-bold text-[11px] sm:text-xs hover:bg-cyan-300 transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Bagikan Link</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPreviewAsVisitor(true);
                    setIsPinUnlocked(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white/10 text-white font-jakarta font-semibold text-[11px] sm:text-xs border border-white/15 hover:bg-white/20 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Tampilan Tamu</span>
                </button>
              </div>
            </div>

            {/* Expandable Glassmorphic Owner Control Drawer */}
            {activeOwnerTool !== 'none' && (
              <div className="glass-panel p-4 flex flex-col gap-3">
                {activeOwnerTool === 'cover' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-jakarta font-bold text-xs uppercase text-white">
                          Pilih Foto &amp; Geser Posisi Sampul
                        </span>
                        <p className="font-jakarta text-xs text-slate-400">
                          Klik foto untuk mengganti sampul, lalu geser slider
                          agar wajah atau bagian terbaik foto tampil pas:
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveOwnerTool('none')}
                        className="p-1 bg-white/10 hover:bg-white/20 text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Cover Position Sliders inside Owner Drawer */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-white/[0.03] border border-white/10">
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[11px] font-jakarta text-slate-300">
                          <span>Geser Atas ↔ Bawah</span>
                          <span className="font-mono text-cyan-300">
                            {coverPosY}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={coverPosY}
                          onChange={(e) =>
                            saveCoverPosition(coverPosX, Number(e.target.value))
                          }
                          className="w-full accent-cyan-400 cursor-pointer"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[11px] font-jakarta text-slate-300">
                          <span>Geser Kiri ↔ Kanan</span>
                          <span className="font-mono text-cyan-300">
                            {coverPosX}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={coverPosX}
                          onChange={(e) =>
                            saveCoverPosition(Number(e.target.value), coverPosY)
                          }
                          className="w-full accent-cyan-400 cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => saveCoverPosition(50, 15, 'cover')}
                          className="px-2.5 py-1 bg-white/10 hover:bg-cyan-400 hover:text-slate-950 text-white font-jakarta text-[11px] font-semibold"
                        >
                          Fokus Atas (Wajah)
                        </button>
                        <button
                          type="button"
                          onClick={() => saveCoverPosition(50, 50, 'cover')}
                          className="px-2.5 py-1 bg-white/10 hover:bg-cyan-400 hover:text-slate-950 text-white font-jakarta text-[11px] font-semibold"
                        >
                          Tengah
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            saveCoverPosition(
                              coverPosX,
                              coverPosY,
                              coverFitMode === 'cover' ? 'contain' : 'cover'
                            )
                          }
                          className={`px-2.5 py-1 font-jakarta text-[11px] font-semibold border ${
                            coverFitMode === 'contain'
                              ? 'bg-cyan-400 text-slate-950 border-cyan-400'
                              : 'bg-white/5 text-slate-200 border-white/15'
                          }`}
                        >
                          {coverFitMode === 'contain'
                            ? 'Mode: Utuh (Fit)'
                            : 'Mode: Penuh (Cover)'}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto py-1">
                      {photos.map((p) => {
                        const isCurrentCover = p.id === coverPhoto.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            disabled={isSavingOwnerSetting}
                            onClick={() => handleSetCoverPhoto(p.id)}
                            className={`relative shrink-0 w-20 h-20 overflow-hidden border-2 transition-all ${
                              isCurrentCover
                                ? 'border-cyan-400'
                                : 'border-transparent opacity-65 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={p.thumbnailUrl}
                              alt={p.name}
                              onError={(e) => handleImageError(p.id, e)}
                              className="w-full h-full object-cover"
                            />
                            {isCurrentCover && (
                              <span className="absolute bottom-0 inset-x-0 bg-cyan-400 text-slate-950 font-mono font-bold text-[9px] py-0.5 text-center">
                                SAMPUL
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeOwnerTool === 'pin' && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="font-jakarta font-bold text-xs uppercase text-white">
                        Atur PIN 4 Digit Album
                      </span>
                      <p className="font-jakarta text-xs text-slate-400">
                        Lindungi album dengan PIN 4 angka, atau hapus PIN agar
                        terbuka langsung.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="text"
                        maxLength={4}
                        value={pinDraft}
                        onChange={(e) =>
                          setPinDraft(
                            e.target.value.replace(/\D/g, '').slice(0, 4)
                          )
                        }
                        placeholder="2408"
                        className="w-28 bg-white/5 text-white px-3 py-2 border border-white/20 font-mono font-bold text-base tracking-[0.25em] text-center focus:outline-none focus:border-cyan-400"
                      />
                      <button
                        type="button"
                        disabled={isSavingOwnerSetting}
                        onClick={() => handleSaveAlbumPin(pinDraft)}
                        className="px-4 py-2 bg-cyan-400 text-slate-950 font-jakarta font-bold text-xs hover:bg-cyan-300"
                      >
                        Simpan PIN
                      </button>
                      {gallery.album_pin && (
                        <button
                          type="button"
                          disabled={isSavingOwnerSetting}
                          onClick={() => handleSaveAlbumPin(null)}
                          className="px-3 py-2 bg-white/10 text-white font-jakarta font-semibold text-xs border border-white/15"
                        >
                          Hapus PIN
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {activeOwnerTool === 'visibility' && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="font-jakarta font-bold text-xs uppercase text-white">
                        Atur Visibilitas Foto (
                        {gallery.hidden_photo_ids?.length || 0} Disembunyikan)
                      </span>
                      <p className="font-jakarta text-xs text-slate-400">
                        Klik ikon mata pada masing-masing foto di bawah untuk
                        menyembunyikan atau menampilkan foto bagi tamu.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveOwnerTool('none')}
                      className="shrink-0 px-3.5 py-1.5 bg-cyan-400 text-slate-950 font-jakarta font-bold text-xs"
                    >
                      Selesai
                    </button>
                  </div>
                )}

                {activeOwnerTool === 'share' && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="font-jakarta font-bold text-xs uppercase text-white">
                        Link Publik Keluarga &amp; Sahabat (Tanpa Token Edit)
                      </span>
                      <code className="font-mono text-xs font-bold bg-white/5 px-3 py-1.5 border border-white/15 text-cyan-300 select-all">
                        {cleanVisitorUrl}
                      </code>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleCopyCleanLink}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-400 text-slate-950 font-jakarta font-bold text-xs"
                      >
                        {copiedCleanLink ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Salin Link</span>
                          </>
                        )}
                      </button>
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          whatsappVisitorShareText
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 text-white border border-white/15 font-jakarta font-semibold text-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Share WA</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Clean Glass Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-4 md:right-8 z-50 glass-panel-strong text-white px-4 py-2.5 shadow-2xl flex items-center gap-2 font-jakarta text-xs md:text-sm font-semibold">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* GLASSMORPHIC PIN GATE */}
      {requiresPinGate ? (
        <main className="flex-1 w-full flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full glass-panel-strong flex flex-col items-center text-center p-8">
            <div className="w-12 h-12 bg-white/5 text-cyan-400 border border-white/15 flex items-center justify-center mb-4">
              <KeyRound className="w-5 h-5" />
            </div>

            <h1 className="font-jakarta font-bold text-2xl text-white uppercase tracking-wider">
              Album Terlindungi PIN
            </h1>
            <p className="font-jakarta text-sm text-slate-400 mt-1.5">
              Masukkan 4 digit PIN untuk membuka album{' '}
              <strong className="text-white">{gallery.client_name}</strong>.
            </p>

            <form
              onSubmit={handleVerifyVisitorPin}
              className="w-full mt-6 flex flex-col items-center gap-4"
            >
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={pinInput}
                onChange={(e) => {
                  setPinError(null);
                  setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4));
                }}
                placeholder="••••"
                autoFocus
                className="w-48 bg-white/5 text-white px-4 py-3 border border-white/20 font-mono font-bold text-center text-2xl tracking-[0.4em] focus:outline-none focus:border-cyan-400"
              />

              {pinError && (
                <p className="font-jakarta text-xs font-semibold text-rose-400">
                  {pinError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3 px-6 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-jakarta font-bold text-xs uppercase tracking-[0.2em] transition-all"
              >
                Buka Album
              </button>
            </form>
          </div>
        </main>
      ) : (
        /* UNLOCKED DIGITAL ALBUM — FUTURISTIC GLASSMORPHISM THEME */
        <main className="flex-1 w-full">
          {/* 1. OPAQUE HERO COVER (Blocks background Earth completely + Interactive Pan/Reposition + Mobile-Friendly Proportion) */}
          <section
            id="hero-album"
            onPointerDown={handleCoverPointerDown}
            onPointerMove={handleCoverPointerMove}
            onPointerUp={handleCoverPointerUp}
            onPointerCancel={handleCoverPointerUp}
            className={`relative w-full min-h-[44vh] sm:min-h-[58vh] lg:min-h-[76vh] flex items-end overflow-hidden bg-[#02050A] ${
              isAdjustingCover ? 'cursor-grab active:cursor-grabbing' : ''
            }`}
          >
            {/* Opaque Base + High-Opacity Cover Image so Space Earth NEVER bleeds through */}
            <div className="absolute inset-0 z-0 bg-[#02050A]">
              <img
                src={coverPhoto.fullResUrl}
                alt={coverPhoto.caption}
                onError={(e) => handleImageError(coverPhoto.id, e)}
                draggable={false}
                style={{
                  objectPosition: `${coverPosX}% ${coverPosY}%`,
                }}
                className={`w-full h-full ${
                  coverFitMode === 'contain' ? 'object-contain' : 'object-cover'
                } opacity-90 transition-[object-position] duration-75`}
              />
              {/* Bottom & Left dark vignette for crisp text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#02050A] via-[#02050A]/25 to-[#02050A]/30" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#02050A]/75 via-transparent to-[#02050A]/30" />
            </div>

            {/* Interactive Floating Cover Position Control Bar ("Geser Sampul") */}
            {isAdjustingCover && (
              <div
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute top-3 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-xl glass-panel-strong p-3.5 sm:p-4 shadow-2xl border border-cyan-400/50 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-cyan-300 font-jakarta font-bold text-xs uppercase tracking-wider">
                    <Move className="w-4 h-4 text-cyan-400" />
                    <span>Atur &amp; Geser Posisi Sampul</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAdjustingCover(false)}
                    className="px-2.5 py-1 bg-cyan-400 text-slate-950 font-jakarta font-bold text-[11px]"
                  >
                    Selesai
                  </button>
                </div>

                <p className="font-jakarta text-[11px] text-slate-300">
                  Geser foto langsung dengan jari/mouse atau gunakan pengatur
                  di bawah agar wajah terlihat pas di HP maupun Laptop:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[11px] font-jakarta text-slate-300">
                      <span>Posisi Atas ↔ Bawah</span>
                      <span className="font-mono text-cyan-300">
                        {coverPosY}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={coverPosY}
                      onChange={(e) =>
                        saveCoverPosition(coverPosX, Number(e.target.value))
                      }
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[11px] font-jakarta text-slate-300">
                      <span>Posisi Kiri ↔ Kanan</span>
                      <span className="font-mono text-cyan-300">
                        {coverPosX}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={coverPosX}
                      onChange={(e) =>
                        saveCoverPosition(Number(e.target.value), coverPosY)
                      }
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/10">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => saveCoverPosition(50, 15, 'cover')}
                      className="px-2.5 py-1 bg-white/10 hover:bg-cyan-400 hover:text-slate-950 text-white font-jakarta text-[11px] font-semibold"
                    >
                      Atas (Wajah)
                    </button>
                    <button
                      type="button"
                      onClick={() => saveCoverPosition(50, 50, 'cover')}
                      className="px-2.5 py-1 bg-white/10 hover:bg-cyan-400 hover:text-slate-950 text-white font-jakarta text-[11px] font-semibold"
                    >
                      Tengah
                    </button>
                    <button
                      type="button"
                      onClick={() => saveCoverPosition(50, 85, 'cover')}
                      className="px-2.5 py-1 bg-white/10 hover:bg-cyan-400 hover:text-slate-950 text-white font-jakarta text-[11px] font-semibold"
                    >
                      Bawah
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      saveCoverPosition(
                        coverPosX,
                        coverPosY,
                        coverFitMode === 'cover' ? 'contain' : 'cover'
                      )
                    }
                    className={`px-3 py-1 font-jakarta text-[11px] font-bold border ${
                      coverFitMode === 'contain'
                        ? 'bg-cyan-400 text-slate-950 border-cyan-400'
                        : 'bg-white/10 text-white border-white/20'
                    }`}
                  >
                    {coverFitMode === 'contain'
                      ? 'Tampilan: Utuh (Anti-Zoom)'
                      : 'Tampilan: Layar Penuh'}
                  </button>
                </div>
              </div>
            )}

            <div className="relative z-10 max-w-7xl w-full mx-auto px-4 md:px-10 py-8 sm:py-14 md:py-20 flex flex-col md:flex-row items-start md:items-end justify-between gap-5 md:gap-8">
              <div className="flex flex-col gap-2 sm:gap-3 max-w-2xl">
                <span className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.25em] text-cyan-400">
                  {gallery.studio_name.toUpperCase()} //{' '}
                  {gallery.session_type.toUpperCase()}
                </span>

                <h1 className="font-jakarta font-extrabold text-2xl sm:text-4xl md:text-6xl text-white uppercase tracking-[0.06em] leading-tight sm:leading-none">
                  {gallery.client_name}
                </h1>

                <p className="font-jakarta text-xs sm:text-sm md:text-base text-slate-300 tracking-wider uppercase">
                  {gallery.session_date} • {visiblePhotos.length} HIGH-RES FRAMES
                </p>

                <div className="w-16 sm:w-24 h-1 bg-cyan-400 shadow-[0_0_12px_#22d3ee] mt-0.5" />
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setLightboxIndex(0)}
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-jakarta font-bold text-[11px] sm:text-xs uppercase tracking-[0.16em] transition-all shadow-[0_0_20px_rgba(34,211,238,0.25)]"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Buka Layar Penuh</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAdjustingCover((prev) => !prev)}
                  className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 glass-panel hover:bg-white/15 text-white font-jakarta font-semibold text-[11px] sm:text-xs uppercase tracking-[0.14em] transition-all"
                >
                  <Move className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Geser Sampul</span>
                </button>

                <a
                  href={coverPhoto.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3 glass-panel hover:bg-white/10 text-white font-jakarta font-semibold text-[11px] sm:text-xs uppercase tracking-[0.16em] transition-all"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>Unduh Sampul</span>
                </a>
              </div>
            </div>
          </section>

          {/* 2. INTERACTIVE "REVIEW PHOTO" SHOWCASE CAROUSEL WITH SMOOTH GLIDE ANIMATION & SWIPE */}
          {visiblePhotos.length >= 3 && (
            <section
              id="review-strip"
              onTouchStart={(e) => {
                touchStartXRef.current = e.touches[0]?.clientX ?? null;
              }}
              onTouchEnd={(e) => {
                if (touchStartXRef.current === null) return;
                const diff =
                  (e.changedTouches[0]?.clientX ?? 0) - touchStartXRef.current;
                if (diff > 40) handlePrevCarousel();
                else if (diff < -40) handleNextCarousel();
                touchStartXRef.current = null;
              }}
              className="w-full py-10 md:py-14 px-3 sm:px-6 md:px-10 border-b border-white/10 overflow-hidden"
            >
              <div className="max-w-6xl mx-auto flex flex-col items-center gap-6 md:gap-8">
                <div className="flex flex-col items-center gap-1.5 text-center">
                  <h2 className="font-jakarta font-bold text-xs sm:text-sm md:text-base uppercase tracking-[0.28em] text-white">
                    REVIEW PHOTO
                  </h2>
                  <span className="font-mono text-[10px] text-slate-400">
                    Geser atau klik kartu samping untuk berpindah • Klik foto
                    tengah untuk memperbesar
                  </span>
                </div>

                <div className="relative w-full flex items-center justify-center gap-2 sm:gap-4 md:gap-5">
                  <button
                    type="button"
                    onClick={handlePrevCarousel}
                    className="w-9 h-9 sm:w-11 sm:h-11 glass-panel hover:border-cyan-400 hover:bg-cyan-400/15 text-white flex items-center justify-center shrink-0 transition-all active:scale-90 z-20"
                    aria-label="Sebelumnya"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {/* 3 Cards on Mobile (No Over-Zoom!), 5 Cards on Desktop with Smooth Animation */}
                  <div
                    key={carouselAnimKey}
                    className={`grid grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3.5 md:gap-4 items-center w-full ${
                      carouselDirection === 'next'
                        ? 'animate-carousel-next'
                        : 'animate-carousel-prev'
                    }`}
                  >
                    {[-2, -1, 0, 1, 2].map((offset) => {
                      const idx =
                        (featuredCenterIdx + offset + visiblePhotos.length) %
                        visiblePhotos.length;
                      const item = visiblePhotos[idx];
                      const isCenter = offset === 0;
                      const positionClass =
                        Math.abs(offset) === 2
                          ? 'hidden md:block opacity-45 scale-90 hover:opacity-75'
                          : Math.abs(offset) === 1
                            ? 'block opacity-65 sm:opacity-75 scale-90 sm:scale-95 hover:opacity-95'
                            : 'block opacity-100 scale-100 ring-1 ring-cyan-400/70 shadow-[0_0_35px_rgba(34,211,238,0.22)] z-10';

                      return (
                        <div
                          key={`${item.id}-${offset}`}
                          onClick={() => handleSelectCarouselOffset(offset, idx)}
                          className={`relative aspect-[3/4] overflow-hidden bg-[#080C14] border border-white/15 cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${positionClass}`}
                        >
                          <img
                            src={item.thumbnailUrl}
                            alt={item.name}
                            onError={(e) => handleImageError(item.id, e)}
                            style={{ objectPosition: '50% 22%' }}
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                          />
                          <div className="absolute top-2 sm:top-3 inset-x-1.5 sm:inset-x-3 glass-panel-strong py-0.5 sm:py-1 px-1.5 sm:px-2 text-center">
                            <span className="font-mono text-[8px] sm:text-[10px] font-bold text-white uppercase tracking-wider truncate block">
                              {isCenter ? gallery.client_name : item.name}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={handleNextCarousel}
                    className="w-9 h-9 sm:w-11 sm:h-11 glass-panel hover:border-cyan-400 hover:bg-cyan-400/15 text-white flex items-center justify-center shrink-0 transition-all active:scale-90 z-20"
                    aria-label="Berikutnya"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Interactive Carousel Progress Dots */}
                <div className="flex items-center justify-center gap-1.5 flex-wrap max-w-md">
                  {visiblePhotos.slice(0, 15).map((p, dotIdx) => {
                    const isActive =
                      featuredCenterIdx % Math.min(visiblePhotos.length, 15) ===
                      dotIdx;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setCarouselDirection(
                            dotIdx > featuredCenterIdx ? 'next' : 'prev'
                          );
                          setCarouselAnimKey((k) => k + 1);
                          setFeaturedCenterIdx(dotIdx);
                        }}
                        aria-label={`Foto ${dotIdx + 1}`}
                        className={`h-1.5 transition-all duration-300 ${
                          isActive
                            ? 'w-6 bg-cyan-400 shadow-[0_0_8px_#22d3ee]'
                            : 'w-1.5 bg-white/20 hover:bg-white/40'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* 3. SHARP, EDGE-TO-EDGE PHOTO GRID (ZERO ROUNDED CORNERS + GLASSMORPHISM) */}
          <section id="photo-grid" className="w-full px-4 md:px-10 py-10 md:py-12">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 mb-6 md:mb-8 border-b border-white/10">
                <div>
                  <span className="font-mono text-[11px] text-cyan-400 uppercase tracking-widest">
                    FULL ARCHIVE
                  </span>
                  <h2 className="font-jakarta font-bold text-xl md:text-2xl text-white uppercase tracking-wider mt-0.5">
                    Koleksi Foto ({visiblePhotos.length})
                  </h2>
                </div>
                <span className="font-jakarta text-xs text-slate-400">
                  Klik foto untuk memperbesar atau mengunduh HD
                </span>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="aspect-[4/5] glass-panel animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="columns-2 lg:columns-3 gap-3 sm:gap-6 space-y-3 sm:space-y-6">
                  {visiblePhotos.map((photo, index) => {
                    const isHidden = (gallery.hidden_photo_ids || []).includes(
                      photo.id
                    );
                    const isCover = photo.id === coverPhoto.id;
                    const isFav = guestFavorites.includes(photo.id);

                    return (
                      <article
                        key={photo.id}
                        className={`break-inside-avoid rounded-none glass-panel transition-all flex flex-col group ${
                          isCover
                            ? 'border-cyan-400/70 ring-1 ring-cyan-400/40'
                            : 'hover:border-white/25'
                        }`}
                      >
                        {/* Sharp 90-degree Photo Container — Natural Aspect Ratio (No Rounded Corners) */}
                        <div className="relative w-full overflow-hidden rounded-none bg-[#0D1117]">
                          <img
                            src={photo.thumbnailUrl}
                            alt={photo.caption}
                            loading="lazy"
                            onError={(e) => handleImageError(photo.id, e)}
                            onClick={() => setLightboxIndex(index)}
                            className={`w-full h-auto block rounded-none cursor-pointer transition-transform duration-500 group-hover:scale-[1.02] ${
                              isHidden ? 'opacity-30 grayscale' : ''
                            }`}
                          />

                          {isCover && (
                            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-cyan-400 text-slate-950 font-jakarta font-bold text-[9px] sm:text-[10px] px-2 py-0.5 tracking-wider uppercase z-10">
                              Sampul Album
                            </div>
                          )}

                          {/* Hidden Notice Overlay in Owner Mode */}
                          {isOwnerMode && isHidden && (
                            <div className="absolute inset-0 bg-[#090C10]/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 text-white z-20">
                              <EyeOff className="w-6 h-6 text-cyan-400 mb-1" />
                              <span className="font-jakarta font-semibold text-xs uppercase tracking-wider">
                                Disembunyikan dari Tamu
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleHidePhoto(photo.id)}
                                className="mt-2 px-3 py-1 bg-cyan-400 text-slate-950 font-jakarta font-bold text-xs"
                              >
                                Tampilkan Kembali
                              </button>
                            </div>
                          )}

                          {/* Glassmorphic Hover Quick Actions Overlay */}
                          {!isHidden && (
                            <div className="absolute inset-0 bg-[#090C10]/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5 z-10 pointer-events-none">
                              <button
                                type="button"
                                onClick={() => setLightboxIndex(index)}
                                title="Perbesar"
                                className="pointer-events-auto w-9 h-9 glass-panel-strong text-white flex items-center justify-center hover:border-cyan-400 hover:text-cyan-400 transition-colors"
                              >
                                <Maximize2 className="w-4 h-4" />
                              </button>

                              <a
                                href={photo.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={photo.name}
                                title="Unduh HD"
                                className="pointer-events-auto w-9 h-9 glass-panel-strong text-white flex items-center justify-center hover:border-cyan-400 hover:text-cyan-400 transition-colors"
                              >
                                <Download className="w-4 h-4" />
                              </a>

                              <button
                                type="button"
                                onClick={() => toggleGuestFavorite(photo.id)}
                                title="Favorit"
                                className="pointer-events-auto w-9 h-9 glass-panel-strong text-white flex items-center justify-center hover:border-cyan-400 transition-colors"
                              >
                                <Heart
                                  className={`w-4 h-4 ${
                                    isFav
                                      ? 'fill-rose-500 text-rose-500'
                                      : 'text-white'
                                  }`}
                                />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Sleek Glassmorphic Single-Line Footer */}
                        <div className="px-2.5 sm:px-3.5 py-2 sm:py-2.5 flex items-center justify-between gap-1.5 border-t border-white/10">
                          <span className="font-mono text-[10px] sm:text-[11px] text-slate-300 truncate">
                            {photo.name}
                          </span>

                          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                            {isOwnerMode && (
                              <>
                                <button
                                  type="button"
                                  disabled={isCover || isSavingOwnerSetting}
                                  onClick={() => handleSetCoverPhoto(photo.id)}
                                  className={`px-2 py-1 font-jakarta font-semibold text-[10px] sm:text-[11px] border transition-colors ${
                                    isCover
                                      ? 'bg-cyan-400 text-slate-950 border-cyan-400'
                                      : 'bg-white/5 hover:bg-white/15 text-slate-200 border-white/15'
                                  }`}
                                >
                                  {isCover ? 'Sampul' : 'Set Sampul'}
                                </button>

                                <button
                                  type="button"
                                  disabled={isSavingOwnerSetting}
                                  onClick={() =>
                                    handleToggleHidePhoto(photo.id)
                                  }
                                  title={
                                    isHidden
                                      ? 'Tampilkan ke Tamu'
                                      : 'Sembunyikan dari Tamu'
                                  }
                                  className={`p-1 border transition-colors ${
                                    isHidden
                                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                      : 'bg-white/5 hover:bg-white/15 text-slate-300 border-white/15'
                                  }`}
                                >
                                  {isHidden ? (
                                    <Eye className="w-3.5 h-3.5" />
                                  ) : (
                                    <EyeOff className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </>
                            )}

                            <a
                              href={photo.downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={photo.name}
                              className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 bg-white/5 hover:bg-cyan-400 hover:text-slate-950 text-slate-200 border border-white/15 font-jakarta font-semibold text-[10px] sm:text-[11px] transition-colors"
                            >
                              <Download className="w-3 h-3" />
                              <span className="hidden sm:inline">Unduh</span>
                            </a>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </main>
      )}

      {/* FUTURISTIC GLASS LIGHTBOX MODAL WITH SMOOTH PHOTO TRANSITION */}
      {lightboxIndex !== null && visiblePhotos[lightboxIndex] && (
        <div
          onClick={() => setLightboxIndex(null)}
          className="fixed inset-0 z-50 bg-[#05070A]/92 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-panel-strong max-w-4xl w-full overflow-hidden flex flex-col"
          >
            <div className="px-4 sm:px-5 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-bold text-xs sm:text-sm text-white truncate max-w-[200px] sm:max-w-none">
                  {visiblePhotos[lightboxIndex].name}
                </span>
                <span className="font-mono text-xs text-cyan-400">
                  [{lightboxIndex + 1} / {visiblePhotos.length}]
                </span>
              </div>

              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                className="w-8 h-8 bg-white/10 text-white flex items-center justify-center hover:bg-cyan-400 hover:text-slate-950"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative bg-[#05070A] max-h-[72vh] sm:max-h-[76vh] flex items-center justify-center overflow-hidden">
              <img
                key={visiblePhotos[lightboxIndex].id}
                src={visiblePhotos[lightboxIndex].fullResUrl}
                alt={visiblePhotos[lightboxIndex].caption}
                onError={(e) =>
                  handleImageError(visiblePhotos[lightboxIndex].id, e)
                }
                className="max-h-[72vh] sm:max-h-[76vh] w-auto object-contain rounded-none animate-lightbox-photo"
              />
            </div>

            <div className="p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2.5 border-t border-white/10">
              <span className="font-mono text-xs text-slate-400 hidden sm:inline">
                {visiblePhotos[lightboxIndex].name}
              </span>

              <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxIndex(
                        (lightboxIndex - 1 + visiblePhotos.length) %
                          visiblePhotos.length
                      )
                    }
                    className="px-3 sm:px-3.5 py-2 bg-white/5 text-white border border-white/15 font-jakarta font-semibold text-xs hover:bg-white/15 transition-colors"
                  >
                    ← Sebelumnya
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxIndex(
                        (lightboxIndex + 1) % visiblePhotos.length
                      )
                    }
                    className="px-3 sm:px-3.5 py-2 bg-white/5 text-white border border-white/15 font-jakarta font-semibold text-xs hover:bg-white/15 transition-colors"
                  >
                    Berikutnya →
                  </button>
                </div>

                <a
                  href={visiblePhotos[lightboxIndex].downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={visiblePhotos[lightboxIndex].name}
                  className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-cyan-400 text-slate-950 font-jakarta font-bold text-xs hover:bg-cyan-300"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh HD</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <GiantFooter
        studioName={gallery.studio_name}
        studioSlug={gallery.studio_slug}
      />
    </div>
  );
}

export default function DigitalAlbumPage({ params }: AlbumPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090C10] text-slate-300 flex items-center justify-center font-mono text-xs uppercase tracking-[0.25em]">
          LOADING DIGITAL ARCHIVE...
        </div>
      }
    >
      <DigitalAlbumContent slug={params.studio_slug} />
    </Suspense>
  );
}
