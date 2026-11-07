'use client';

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Eye,
  Heart,
  KeyRound,
  Lock,
  Maximize2,
  Move,
  Pause,
  Play,
  PlayCircle,
  Plus,
  Share2,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import GiantFooter from '@/components/GiantFooter';
import {
  decodeGuestAlbumPhotoIds,
  encodeGuestAlbumPhotoIds,
  fetchGalleryBySlug,
  fetchSelectionsForGallery,
  SEED_GALLERIES,
  updateGallerySettings,
} from '@/lib/supabase';
import { DEMO_EDITORIAL_PHOTOS } from '@/lib/drive-utils';
import { DrivePhoto, GalleryRecord, SelectionRecord } from '@/types/difotoin';

interface AlbumPageProps {
  params: {
    studio_slug: string;
  };
}

function DigitalAlbumContent({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get('t');

  // IMPORTANT: Initialized as null / empty so NO wrong demo cover ever flashes while loading!
  const [gallery, setGallery] = useState<GalleryRecord | null>(null);
  const [photos, setPhotos] = useState<DrivePhoto[]>([]);
  const [proofingSelections, setProofingSelections] = useState<
    SelectionRecord[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHeroImgLoaded, setIsHeroImgLoaded] = useState(false);

  // Visitor / Owner simulation states
  const [previewAsVisitor, setPreviewAsVisitor] = useState(false);
  const [ownerGridFilter, setOwnerGridFilter] = useState<
    'all' | 'guest' | 'private'
  >('all');
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
  const [coverPosX, setCoverPosX] = useState<number>(50);
  const [coverPosY, setCoverPosY] = useState<number>(22);
  const [coverFitMode, setCoverFitMode] = useState<'cover' | 'contain'>('cover');
  const [isAdjustingCover, setIsAdjustingCover] = useState(false);
  const isDraggingCoverRef = useRef(false);
  const dragStartRef = useRef<{
    x: number;
    y: number;
    posX: number;
    posY: number;
  }>({
    x: 0,
    y: 0,
    posX: 50,
    posY: 22,
  });

  // 3D Fluid Coverflow Showcase Carousel State ("REVIEW PHOTO")
  const [featuredCenterIdx, setFeaturedCenterIdx] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isHoveringCarousel, setIsHoveringCarousel] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  // Progressive Photo Grid Batching (prevents mounting 100+ heavy cards simultaneously)
  const [gridLimit, setGridLimit] = useState(24);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Lightbox & Favorites (stored by photoId so Owner & Guest views never mismatch indices)
  const [lightboxPhotoId, setLightboxPhotoId] = useState<string | null>(null);
  const [guestFavorites, setGuestFavorites] = useState<string[]>([]);

  const [baseUrl, setBaseUrl] = useState(
    process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  );

  // Load saved cover focal position + fetch real gallery & Google Drive photos BEFORE rendering cover
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
      setIsHeroImgLoaded(false);

      const found = await fetchGalleryBySlug(slug);
      const activeGal = found || { ...SEED_GALLERIES[0], slug };
      if (!isMounted) return;

      const [driveRes, loadedSelections] = await Promise.allSettled([
        fetch(`/api/drive/${encodeURIComponent(activeGal.gdrive_folder_id)}`),
        fetchSelectionsForGallery(activeGal.id),
      ]);

      let loadedPhotos: DrivePhoto[] = [];
      if (driveRes.status === 'fulfilled' && driveRes.value.ok) {
        try {
          const data = await driveRes.value.json();
          if (Array.isArray(data.photos) && data.photos.length > 0) {
            loadedPhotos = data.photos;
          }
        } catch {
          // Fallback if JSON parse error
        }
      }

      if (!isMounted) return;

      if (loadedPhotos.length === 0) {
        loadedPhotos = DEMO_EDITORIAL_PHOTOS;
      }

      setGallery(activeGal);
      setPinDraft(activeGal.album_pin || '');
      setPhotos(loadedPhotos);
      if (loadedSelections.status === 'fulfilled') {
        setProofingSelections(loadedSelections.value);
      }
      setIsLoading(false);
    }

    loadAlbum();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const hasValidOwnerToken = Boolean(
    gallery && tokenParam && tokenParam === gallery.owner_token
  );
  const isOwnerMode = hasValidOwnerToken && !previewAsVisitor;

  // Curated Guest Album State — Guests ONLY see photos explicitly chosen by the Client!
  const guestAlbumState = useMemo(
    () => decodeGuestAlbumPhotoIds(gallery?.hidden_photo_ids),
    [gallery?.hidden_photo_ids]
  );

  const guestSelectedSet = useMemo(
    () => new Set(guestAlbumState.photoIds),
    [guestAlbumState.photoIds]
  );

  const guestVisiblePhotos = useMemo(
    () => photos.filter((photo) => guestSelectedSet.has(photo.id)),
    [photos, guestSelectedSet]
  );

  // Proofing selections that match loaded Google Drive photo IDs (for 1-click import)
  const matchingProofingIds = useMemo(() => {
    const idSet = new Set(photos.map((p) => p.id));
    return proofingSelections
      .map((s) => s.photo_id)
      .filter((id) => idSet.has(id));
  }, [photos, proofingSelections]);

  // 3D Carousel photos: Guests strictly see guestVisiblePhotos; Owner previews curated set (if >= 3) or all photos
  const carouselPhotos = useMemo(() => {
    if (!isOwnerMode) return guestVisiblePhotos;
    return guestVisiblePhotos.length >= 3 ? guestVisiblePhotos : photos;
  }, [isOwnerMode, guestVisiblePhotos, photos]);

  // Main Grid photos: Guests strictly see guestVisiblePhotos; Owner sees all/guest/private per filter
  const gridPhotos = useMemo(() => {
    if (!isOwnerMode) return guestVisiblePhotos;
    if (ownerGridFilter === 'guest') return guestVisiblePhotos;
    if (ownerGridFilter === 'private') {
      return photos.filter((p) => !guestSelectedSet.has(p.id));
    }
    return photos;
  }, [isOwnerMode, guestVisiblePhotos, ownerGridFilter, photos, guestSelectedSet]);

  // Lightbox pool: Guests strictly navigate guestVisiblePhotos; Owner navigates full archive
  const lightboxPhotos = isOwnerMode ? photos : guestVisiblePhotos;
  const activeLightboxIndex = useMemo(() => {
    if (!lightboxPhotoId) return -1;
    return lightboxPhotos.findIndex((p) => p.id === lightboxPhotoId);
  }, [lightboxPhotoId, lightboxPhotos]);

  const coverPhoto = useMemo(() => {
    if (photos.length === 0) return null;
    if (gallery?.cover_photo_id) {
      const matched = photos.find((p) => p.id === gallery.cover_photo_id);
      if (matched) return matched;
    }
    if (guestVisiblePhotos.length > 0) return guestVisiblePhotos[0];
    return photos[0];
  }, [photos, gallery?.cover_photo_id, guestVisiblePhotos]);

  // Keep carousel center index safely within bounds when switching filters/modes
  useEffect(() => {
    if (carouselPhotos.length === 0) {
      setFeaturedCenterIdx(0);
    } else if (featuredCenterIdx >= carouselPhotos.length) {
      setFeaturedCenterIdx(0);
    }
  }, [carouselPhotos.length, featuredCenterIdx]);

  // Reset hero fade when cover photo changes, with safety fallback timer
  useEffect(() => {
    if (!coverPhoto) return;
    setIsHeroImgLoaded(false);
    const timer = setTimeout(() => setIsHeroImgLoaded(true), 600);
    return () => clearTimeout(timer);
  }, [coverPhoto?.id]);

  // Optional Auto-Orbit Carousel Timer
  useEffect(() => {
    if (!isAutoPlaying || isHoveringCarousel || carouselPhotos.length < 3) {
      return;
    }
    const id = setInterval(() => {
      setFeaturedCenterIdx((prev) => (prev + 1) % carouselPhotos.length);
    }, 3400);
    return () => clearInterval(id);
  }, [isAutoPlaying, isHoveringCarousel, carouselPhotos.length]);

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

  // Smooth 3D Carousel Navigation Helpers
  function handlePrevCarousel() {
    if (carouselPhotos.length === 0) return;
    setFeaturedCenterIdx(
      (prev) => (prev - 1 + carouselPhotos.length) % carouselPhotos.length
    );
  }

  function handleNextCarousel() {
    if (carouselPhotos.length === 0) return;
    setFeaturedCenterIdx((prev) => (prev + 1) % carouselPhotos.length);
  }

  // Progressive Infinite Scroll Observer for Large Photo Albums
  useEffect(() => {
    if (gridLimit >= gridPhotos.length) return;
    const el = loadMoreRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setGridLimit((prev) => Math.min(prev + 24, gridPhotos.length));
        }
      },
      { rootMargin: '600px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [gridLimit, gridPhotos.length]);

  // Compute shortest circular signed offset in [-N/2, +N/2] so every card glides smoothly!
  function getCircularOffset(index: number, center: number, total: number) {
    if (total === 0) return 0;
    let diff = index - center;
    const half = total / 2;
    if (diff > half) diff -= total;
    if (diff < -half) diff += total;
    return diff;
  }

  // ============================================================================
  // FUTURISTIC ORBITAL SCANNER LOADER (Prevents Wrong Cover Photo Flash!)
  // ============================================================================
  if (isLoading || !gallery || !coverPhoto) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center select-none">
        <div className="relative w-24 h-24 flex items-center justify-center mb-6">
          <span className="absolute inset-0 rounded-full border border-cyan-400/30 animate-ping" />
          <span className="absolute inset-1 rounded-full border border-dashed border-cyan-300/60 animate-spin-slow" />
          <span className="absolute inset-4 rounded-full border border-sky-400/40 animate-pulse" />
          <Sparkles className="w-6 h-6 text-cyan-300 animate-pulse" />
        </div>
        <div className="font-mono text-xs uppercase tracking-[0.32em] text-cyan-300">
          SYNCHRONIZING DIGITAL ARCHIVE
        </div>
        <p className="font-jakarta text-xs text-slate-400 mt-2">
          Memuat foto resolusi tinggi langsung dari folder galeri...
        </p>
      </div>
    );
  }

  const cleanVisitorUrl = `${baseUrl}/${gallery.slug}`;
  const whatsappVisitorShareText = `Halo keluarga & sahabat! Berikut link album digital momen spesial ${gallery.client_name} dari ${gallery.studio_name}:\n${cleanVisitorUrl}${
    gallery.album_pin ? `\n(PIN Akses Album: ${gallery.album_pin})` : ''
  }`;

  // Owner Action 1: Set Cover Photo (Ganti Sampul)
  async function handleSetCoverPhoto(photoId: string) {
    if (!gallery) return;
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
        setGallery((prev) =>
          prev ? { ...prev, cover_photo_id: photoId } : prev
        );
      }
      showToast('Foto sampul album berhasil diperbarui.');
    } finally {
      setIsSavingOwnerSetting(false);
    }
  }

  // Owner Action 2: Save or Clear 4-Digit PIN (Bikin PIN)
  async function handleSaveAlbumPin(newPin: string | null) {
    if (!gallery) return;
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
        setGallery((prev) => (prev ? { ...prev, album_pin: newPin } : prev));
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

  // Owner Action 3: Save Curated Guest Album Photo Whitelist (Optimistic Instant UI!)
  async function handleSaveGuestAlbumIds(
    nextGuestIds: string[],
    toastMessage?: string
  ) {
    if (!gallery) return;
    const encoded = encodeGuestAlbumPhotoIds(nextGuestIds);

    // Optimistic update so clicking photos feels 0ms instant
    setGallery((prev) =>
      prev ? { ...prev, hidden_photo_ids: encoded } : prev
    );
    if (toastMessage) {
      showToast(toastMessage);
    }

    setIsSavingOwnerSetting(true);
    try {
      const updated = await updateGallerySettings(
        gallery.id,
        gallery.owner_token,
        {
          hidden_photo_ids: encoded,
        }
      );
      if (updated) {
        setGallery(updated);
      }
    } finally {
      setIsSavingOwnerSetting(false);
    }
  }

  async function handleToggleGuestPhoto(photoId: string) {
    const isCurrentlySelected = guestSelectedSet.has(photoId);
    const nextGuestIds = isCurrentlySelected
      ? guestAlbumState.photoIds.filter((id) => id !== photoId)
      : [...guestAlbumState.photoIds, photoId];

    await handleSaveGuestAlbumIds(
      nextGuestIds,
      isCurrentlySelected
        ? 'Foto dihapus dari Album Tamu.'
        : `Foto ditambahkan ke Album Tamu (${nextGuestIds.length} foto tampil).`
    );
  }

  async function handleUseProofingSelectionsForGuest() {
    if (matchingProofingIds.length === 0) {
      showToast('Belum ada foto pilihan edit di halaman Pilih Foto.');
      return;
    }
    await handleSaveGuestAlbumIds(
      matchingProofingIds,
      `${matchingProofingIds.length} foto pilihan edit diterapkan ke Album Tamu!`
    );
  }

  async function handleSelectAllForGuest() {
    const allIds = photos.map((p) => p.id);
    await handleSaveGuestAlbumIds(
      allIds,
      `Semua ${allIds.length} foto ditampilkan ke Album Tamu.`
    );
  }

  async function handleClearGuestPhotos() {
    await handleSaveGuestAlbumIds(
      [],
      'Pilihan foto Album Tamu dikosongkan.'
    );
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
    if (pinInput.trim() === gallery?.album_pin) {
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
      {/* Futuristic Glassmorphic Top Header — Dynamically Displays Photographer Brand */}
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
            {gallery.studio_slug.toLowerCase() !== 'zeevisual' && (
              <span className="hidden lg:inline-block font-mono text-[9px] tracking-[0.18em] text-slate-400 uppercase border-l border-white/15 pl-2.5">
                by Zeevisual
              </span>
            )}
          </div>

          <nav className="hidden md:flex items-center gap-7 text-[11px] font-jakarta font-semibold uppercase tracking-[0.2em] text-slate-400">
            <a
              href="#hero-album"
              className="text-white border-b-2 border-cyan-400 pb-1"
            >
              EXPLORE
            </a>
            {carouselPhotos.length >= 3 && (
              <a
                href="#review-strip"
                className="hover:text-white transition-colors"
              >
                REVIEW
              </a>
            )}
            <a
              href="#photo-grid"
              className="hover:text-white transition-colors"
            >
              {isOwnerMode
                ? `ALBUM TAMU (${guestVisiblePhotos.length}/${photos.length})`
                : `PHOTO (${guestVisiblePhotos.length})`}
            </a>
            {isOwnerMode && (
              <Link
                href={`/${gallery.studio_slug}/${gallery.slug}`}
                className="hover:text-cyan-400 transition-colors"
              >
                PROOFING
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {hasValidOwnerToken && previewAsVisitor && (
              <button
                type="button"
                onClick={() => {
                  setPreviewAsVisitor(false);
                  setLightboxPhotoId(null);
                }}
                className="inline-flex items-center gap-1.5 bg-cyan-400 text-slate-950 font-jakarta font-bold text-[11px] sm:text-xs px-2.5 sm:px-3.5 py-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Kembali ke Mode Pemilik</span>
              </button>
            )}

            {isOwnerMode && (
              <>
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
                  <span>Pilih Foto Edit</span>
                </Link>
              </>
            )}

            {!isOwnerMode && guestVisiblePhotos.length > 0 && (
              <button
                type="button"
                onClick={() => setLightboxPhotoId(guestVisiblePhotos[0].id)}
                className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-jakarta font-semibold text-[11px] sm:text-xs px-3 sm:px-4 py-1.5 sm:py-2 border border-white/15 transition-colors"
              >
                <PlayCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>Slideshow</span>
              </button>
            )}
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
                <span className="hidden sm:inline font-mono text-[10px] text-slate-400">
                  • {guestVisiblePhotos.length} dari {photos.length} foto tampil di Album Tamu
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setActiveOwnerTool(
                      activeOwnerTool === 'visibility' ? 'none' : 'visibility'
                    )
                  }
                  className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 font-jakarta font-semibold text-[11px] sm:text-xs border transition-all ${
                    activeOwnerTool === 'visibility'
                      ? 'bg-cyan-400 text-slate-950 border-cyan-400 font-bold'
                      : 'bg-cyan-400/15 text-cyan-200 border-cyan-400/40 hover:bg-cyan-400/25'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    Pilih Foto Tamu ({guestVisiblePhotos.length}/{photos.length})
                  </span>
                </button>

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
                      activeOwnerTool === 'share' ? 'none' : 'share'
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-400 text-slate-950 font-jakarta font-bold text-[11px] sm:text-xs hover:bg-cyan-300 transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Bagikan Link Tamu</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPreviewAsVisitor(true);
                    setIsPinUnlocked(false);
                    setLightboxPhotoId(null);
                    setIsAdjustingCover(false);
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
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div>
                        <span className="font-jakarta font-bold text-xs uppercase text-white">
                          Pilih Foto untuk Album Tamu ({guestVisiblePhotos.length}{' '}
                          dari {photos.length} Foto Dipilih)
                        </span>
                        <p className="font-jakarta text-xs text-slate-400 mt-0.5">
                          Album Tamu tidak menampilkan semua foto otomatis — hanya
                          foto yang kamu pilih di bawah yang akan terlihat oleh tamu.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {matchingProofingIds.length > 0 && (
                          <button
                            type="button"
                            disabled={isSavingOwnerSetting}
                            onClick={handleUseProofingSelectionsForGuest}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-400/20 hover:bg-cyan-400 hover:text-slate-950 text-cyan-200 border border-cyan-400/50 font-jakarta font-bold text-xs transition-colors"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>
                              Pakai Pilihan Edit ({matchingProofingIds.length} Foto)
                            </span>
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={isSavingOwnerSetting}
                          onClick={handleSelectAllForGuest}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/15 text-slate-200 border border-white/15 font-jakarta font-semibold text-xs transition-colors"
                        >
                          Pilih Semua ({photos.length})
                        </button>

                        {guestVisiblePhotos.length > 0 && (
                          <button
                            type="button"
                            disabled={isSavingOwnerSetting}
                            onClick={handleClearGuestPhotos}
                            className="px-3 py-1.5 bg-white/5 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-jakarta font-semibold text-xs transition-colors"
                          >
                            Kosongkan
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setActiveOwnerTool('none')}
                          className="px-3.5 py-1.5 bg-cyan-400 text-slate-950 font-jakarta font-bold text-xs"
                        >
                          Selesai
                        </button>
                      </div>
                    </div>
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
        <div className="fixed bottom-14 sm:bottom-6 right-4 md:right-8 z-50 glass-panel-strong text-white px-4 py-2.5 shadow-2xl flex items-center gap-2 font-jakarta text-xs md:text-sm font-semibold">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* GLASSMORPHIC PIN GATE */}
      {requiresPinGate ? (
        <main className="flex-1 w-full flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full glass-panel-strong flex flex-col items-center text-center p-8 animate-fade-up">
            <div className="w-12 h-12 bg-white/5 text-cyan-400 border border-white/15 flex items-center justify-center mb-4">
              <KeyRound className="w-5 h-5" />
            </div>

            <h1 className="font-jakarta font-bold text-2xl text-white uppercase tracking-wider">
              Album Terlindungi PIN
            </h1>
            <p className="font-jakarta text-sm text-slate-400 mt-1.5">
              Masukkan 4 digit PIN untuk membuka album{' '}
              <strong className="text-white">{gallery.client_name}</strong> dari{' '}
              <strong className="text-cyan-300">{gallery.studio_name}</strong>.
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
                className="w-full py-3 px-6 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-jakarta font-bold text-xs uppercase tracking-[0.2em] btn-futuristic"
              >
                Buka Album
              </button>
            </form>
          </div>
        </main>
      ) : (
        /* UNLOCKED DIGITAL ALBUM — FUTURISTIC GLASSMORPHISM THEME */
        <main className="flex-1 w-full">
          {/* 1. OPAQUE HERO COVER (Zero Flash, Blocks Background Earth, Interactive Pan) */}
          <section
            id="hero-album"
            data-cursor={isAdjustingCover ? 'GESER' : undefined}
            onPointerDown={handleCoverPointerDown}
            onPointerMove={handleCoverPointerMove}
            onPointerUp={handleCoverPointerUp}
            onPointerCancel={handleCoverPointerUp}
            className={`relative w-full min-h-[44vh] sm:min-h-[58vh] lg:min-h-[76vh] flex items-end overflow-hidden bg-[#02050A] ${
              isAdjustingCover ? 'cursor-grab active:cursor-grabbing' : ''
            }`}
          >
            {/* Opaque Base + Smooth Fade-In Real Cover Image */}
            <div className="absolute inset-0 z-0 bg-[#02050A]">
              <img
                key={coverPhoto.id}
                src={coverPhoto.fullResUrl}
                alt={coverPhoto.caption}
                onLoad={() => setIsHeroImgLoaded(true)}
                onError={(e) => {
                  handleImageError(coverPhoto.id, e);
                  setIsHeroImgLoaded(true);
                }}
                draggable={false}
                style={{
                  objectPosition: `${coverPosX}% ${coverPosY}%`,
                }}
                className={`w-full h-full ${
                  coverFitMode === 'contain' ? 'object-contain' : 'object-cover'
                } transition-opacity duration-700 ease-out ${
                  isHeroImgLoaded ? 'opacity-90' : 'opacity-0'
                }`}
              />
              {/* Bottom & Left dark vignette for crisp text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#02050A] via-[#02050A]/25 to-[#02050A]/30" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#02050A]/75 via-transparent to-[#02050A]/30" />
            </div>

            {/* Interactive Floating Cover Position Control Bar ("Geser Sampul") */}
            {isAdjustingCover && (
              <div
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute top-3 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-xl glass-panel-strong p-3.5 sm:p-4 shadow-2xl border border-cyan-400/50 flex flex-col gap-3 animate-fade-up"
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

            <div className="relative z-10 max-w-7xl w-full mx-auto px-4 md:px-10 py-8 sm:py-14 md:py-20 flex flex-col md:flex-row items-start md:items-end justify-between gap-5 md:gap-8 animate-fade-up">
              <div className="flex flex-col gap-2 sm:gap-3 max-w-2xl">
                <span className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.25em] text-cyan-400">
                  {gallery.studio_name.toUpperCase()} //{' '}
                  {gallery.session_type.toUpperCase()}
                </span>

                <h1 className="font-jakarta font-extrabold text-2xl sm:text-4xl md:text-6xl text-white uppercase tracking-[0.06em] leading-tight sm:leading-none">
                  {gallery.client_name}
                </h1>

                <p className="font-jakarta text-xs sm:text-sm md:text-base text-slate-300 tracking-wider uppercase">
                  {isOwnerMode
                    ? `${gallery.session_date} • ${guestVisiblePhotos.length} DARI ${photos.length} FOTO TAMPIL DI ALBUM TAMU`
                    : `${gallery.session_date} • ${guestVisiblePhotos.length} SELECTED FRAMES`}
                </p>

                <div className="w-16 sm:w-24 h-1 bg-cyan-400 shadow-[0_0_12px_#22d3ee] mt-0.5" />
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {lightboxPhotos.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setLightboxPhotoId(lightboxPhotos[0].id)}
                    className="btn-futuristic inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-jakarta font-bold text-[11px] sm:text-xs uppercase tracking-[0.16em] shadow-[0_0_20px_rgba(34,211,238,0.25)]"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Buka Layar Penuh</span>
                  </button>
                )}

                {isOwnerMode && (
                  <button
                    type="button"
                    onClick={() => setIsAdjustingCover((prev) => !prev)}
                    className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 glass-panel hover:bg-white/15 text-white font-jakarta font-semibold text-[11px] sm:text-xs uppercase tracking-[0.14em]"
                  >
                    <Move className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Geser Sampul</span>
                  </button>
                )}

                <a
                  href={coverPhoto.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3 glass-panel hover:bg-white/10 text-white font-jakarta font-semibold text-[11px] sm:text-xs uppercase tracking-[0.16em]"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>Unduh Sampul</span>
                </a>
              </div>
            </div>
          </section>

          {/* 2. FLUID 3D PERSPECTIVE COVERFLOW "REVIEW PHOTO" STAGE (Zero Stiffness!) */}
          {carouselPhotos.length >= 3 && (
            <section
              id="review-strip"
              onMouseEnter={() => setIsHoveringCarousel(true)}
              onMouseLeave={() => {
                setIsHoveringCarousel(false);
              }}
              onTouchStart={(e) => {
                touchStartXRef.current = e.touches[0]?.clientX ?? null;
              }}
              onTouchEnd={(e) => {
                if (touchStartXRef.current === null) return;
                const diff =
                  (e.changedTouches[0]?.clientX ?? 0) - touchStartXRef.current;
                if (diff > 36) handlePrevCarousel();
                else if (diff < -36) handleNextCarousel();
                touchStartXRef.current = null;
              }}
              className="w-full py-12 md:py-16 px-3 sm:px-6 md:px-10 border-b border-white/10 overflow-hidden select-none"
            >
              <div className="max-w-6xl mx-auto flex flex-col items-center gap-6 md:gap-8">
                {/* Section Header + Auto-Slide Toggle */}
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="inline-flex items-center gap-3">
                    <h2 className="font-jakarta font-bold text-xs sm:text-sm md:text-base uppercase tracking-[0.28em] text-white">
                      REVIEW PHOTO
                    </h2>
                    <button
                      type="button"
                      onClick={() => setIsAutoPlaying((p) => !p)}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border transition-all ${
                        isAutoPlaying
                          ? 'bg-cyan-400/20 text-cyan-300 border-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                          : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                      }`}
                    >
                      {isAutoPlaying ? (
                        <>
                          <Pause className="w-2.5 h-2.5" />
                          <span>Auto On</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-2.5 h-2.5" />
                          <span>Auto Slide</span>
                        </>
                      )}
                    </button>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">
                    Geser atau klik foto samping untuk memutar orbit 3D • Klik
                    foto tengah untuk layar penuh
                  </span>
                </div>

                {/* Continuous 3D Perspective Stage */}
                <div className="relative w-full flex items-center justify-center">
                  <button
                    type="button"
                    onClick={handlePrevCarousel}
                    className="w-9 h-9 sm:w-11 sm:h-11 glass-panel hover:border-cyan-400 hover:bg-cyan-400/15 text-white flex items-center justify-center shrink-0 transition-all active:scale-90 z-30"
                    aria-label="Sebelumnya"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {/* 3D Track Container — Cards stay mounted by photo.id and glide via GPU translate3d + rotateY */}
                  <div
                    className="relative flex-1 h-[250px] sm:h-[340px] md:h-[400px]"
                    style={{
                      perspective: '1400px',
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    {carouselPhotos.map((item, idx) => {
                      const offset = getCircularOffset(
                        idx,
                        featuredCenterIdx,
                        carouselPhotos.length
                      );
                      const absOffset = Math.abs(offset);

                      // Only render cards near the visible 3D arc (-3..+3) for silky 60fps performance
                      if (absOffset > 3) return null;

                      const isCenter = offset === 0;
                      // Smooth orbital arc geometry
                      const translateXPercent =
                        offset === 0
                          ? 0
                          : offset * (absOffset === 1 ? 82 : absOffset === 2 ? 74 : 68);
                      const translateZPx =
                        isCenter ? 40 : absOffset === 1 ? -55 : absOffset === 2 ? -140 : -220;
                      const rotateYDeg = isCenter
                        ? 0
                        : offset < 0
                          ? Math.min(32, absOffset * 17)
                          : -Math.min(32, absOffset * 17);
                      const scaleVal =
                        isCenter
                          ? 1.04
                          : absOffset === 1
                            ? 0.88
                            : absOffset === 2
                              ? 0.76
                              : 0.64;
                      const opacityVal =
                        isCenter
                          ? 1
                          : absOffset === 1
                            ? 0.78
                            : absOffset === 2
                              ? 0.46
                              : 0;
                      const zIndexVal = 20 - absOffset * 4;

                      return (
                        <div
                          key={item.id}
                          data-cursor={isCenter ? 'VIEW' : 'SLIDE'}
                          onClick={() => {
                            if (isCenter) {
                              setLightboxPhotoId(item.id);
                            } else {
                              setFeaturedCenterIdx(idx);
                            }
                          }}
                          style={{
                            zIndex: zIndexVal,
                            opacity: opacityVal,
                            pointerEvents: absOffset > 2 ? 'none' : 'auto',
                            transform: `translate3d(calc(-50% + ${translateXPercent}%), -50%, ${translateZPx}px) rotateY(${rotateYDeg}deg) scale(${scaleVal})`,
                            transition:
                              'transform 680ms cubic-bezier(0.16, 1, 0.3, 1), opacity 520ms ease',
                          }}
                          className={`absolute top-1/2 left-1/2 w-[150px] sm:w-[215px] md:w-[248px] aspect-[3/4] cursor-pointer will-change-transform ${
                            absOffset === 2 ? 'hidden sm:block' : ''
                          }`}
                        >
                          <div
                            onMouseMove={(e) => {
                              if (!isCenter) return;
                              const rect =
                                e.currentTarget.getBoundingClientRect();
                              const nx =
                                (e.clientX - rect.left) / rect.width - 0.5;
                              const ny =
                                (e.clientY - rect.top) / rect.height - 0.5;
                              e.currentTarget.style.transform = `perspective(900px) rotateX(${(-ny * 8).toFixed(2)}deg) rotateY(${(nx * 10).toFixed(2)}deg)`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = '';
                            }}
                            className={`relative w-full h-full overflow-hidden bg-[#080C14] transition-transform duration-150 ease-out ${
                              isCenter
                                ? 'border border-cyan-400/90 shadow-[0_16px_42px_rgba(34,211,238,0.24)]'
                                : 'border border-white/15 shadow-[0_10px_24px_rgba(0,0,0,0.6)] opacity-90'
                            }`}
                          >
                            <img
                              src={item.thumbnailUrl}
                              alt={item.name}
                              decoding="async"
                              onError={(e) => handleImageError(item.id, e)}
                              draggable={false}
                              style={{ objectPosition: '50% 22%' }}
                              className="w-full h-full object-cover"
                            />

                            <div className="absolute top-2 sm:top-3 inset-x-2 sm:inset-x-3 bg-[#070B14]/88 border border-white/15 py-0.5 sm:py-1 px-1.5 sm:px-2 text-center">
                              <span className="font-mono text-[8px] sm:text-[10px] font-bold text-white uppercase tracking-wider truncate block">
                                {isCenter ? gallery.client_name : item.name}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={handleNextCarousel}
                    className="w-9 h-9 sm:w-11 sm:h-11 glass-panel hover:border-cyan-400 hover:bg-cyan-400/15 text-white flex items-center justify-center shrink-0 transition-all active:scale-90 z-30"
                    aria-label="Berikutnya"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Interactive Carousel Progress Dots */}
                <div className="flex items-center justify-center gap-1.5 flex-wrap max-w-md">
                  {carouselPhotos.slice(0, 15).map((p, dotIdx) => {
                    const isActive =
                      featuredCenterIdx % Math.min(carouselPhotos.length, 15) ===
                      dotIdx;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setFeaturedCenterIdx(dotIdx);
                        }}
                        aria-label={`Foto ${dotIdx + 1}`}
                        className={`h-1.5 transition-all duration-500 ${
                          isActive
                            ? 'w-7 bg-cyan-400 shadow-[0_0_10px_#22d3ee]'
                            : 'w-1.5 bg-white/20 hover:bg-white/45'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* 3. SHARP, EDGE-TO-EDGE PHOTO GRID (CURATED GUEST ALBUM vs FULL CLIENT OWNER ARCHIVE) */}
          <section id="photo-grid" className="w-full px-4 md:px-10 py-10 md:py-12">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 mb-6 md:mb-8 border-b border-white/10">
                <div>
                  <span className="font-mono text-[11px] text-cyan-400 uppercase tracking-widest">
                    {isOwnerMode
                      ? `KURASI ALBUM TAMU // ${gallery.studio_name.toUpperCase()}`
                      : `CURATED GUEST ALBUM // ${gallery.studio_name.toUpperCase()}`}
                  </span>
                  <h2 className="font-jakarta font-bold text-xl md:text-2xl text-white uppercase tracking-wider mt-0.5">
                    {isOwnerMode
                      ? `Pilih Foto Album Tamu (${guestVisiblePhotos.length} / ${photos.length} Tampil)`
                      : `Koleksi Foto Pilihan (${guestVisiblePhotos.length})`}
                  </h2>
                  {isOwnerMode && (
                    <p className="font-jakarta text-xs text-slate-400 mt-1">
                      Klik tombol <strong className="text-cyan-300">+ Tampilkan ke Tamu</strong> pada foto yang ingin kamu perlihatkan di link Album Tamu. Foto lainnya tetap privat.
                    </p>
                  )}
                </div>

                {isOwnerMode ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setOwnerGridFilter('all');
                        setGridLimit(24);
                      }}
                      className={`px-3 py-1.5 font-jakarta font-semibold text-xs border transition-colors ${
                        ownerGridFilter === 'all'
                          ? 'bg-cyan-400 text-slate-950 border-cyan-400 font-bold'
                          : 'bg-white/5 text-slate-300 border-white/15 hover:bg-white/10'
                      }`}
                    >
                      Semua Foto ({photos.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOwnerGridFilter('guest');
                        setGridLimit(24);
                      }}
                      className={`px-3 py-1.5 font-jakarta font-semibold text-xs border transition-colors ${
                        ownerGridFilter === 'guest'
                          ? 'bg-cyan-400 text-slate-950 border-cyan-400 font-bold'
                          : 'bg-white/5 text-slate-300 border-white/15 hover:bg-white/10'
                      }`}
                    >
                      ✓ Tampil di Tamu ({guestVisiblePhotos.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOwnerGridFilter('private');
                        setGridLimit(24);
                      }}
                      className={`px-3 py-1.5 font-jakarta font-semibold text-xs border transition-colors ${
                        ownerGridFilter === 'private'
                          ? 'bg-cyan-400 text-slate-950 border-cyan-400 font-bold'
                          : 'bg-white/5 text-slate-300 border-white/15 hover:bg-white/10'
                      }`}
                    >
                      Privat ({photos.length - guestVisiblePhotos.length})
                    </button>

                    {matchingProofingIds.length > 0 && (
                      <button
                        type="button"
                        disabled={isSavingOwnerSetting}
                        onClick={handleUseProofingSelectionsForGuest}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-400/15 hover:bg-cyan-400 hover:text-slate-950 text-cyan-300 border border-cyan-400/40 font-jakarta font-bold text-xs transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Pakai Pilihan Edit ({matchingProofingIds.length})</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <span className="font-jakarta text-xs text-slate-400">
                    Klik foto untuk memperbesar atau mengunduh HD
                  </span>
                )}
              </div>

              {/* Empty State when Guest opens Album before Client has selected any photos */}
              {!isOwnerMode && guestVisiblePhotos.length === 0 ? (
                <div className="glass-panel p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-3 max-w-xl mx-auto my-6">
                  <div className="w-12 h-12 bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="font-jakarta font-bold text-lg sm:text-xl text-white uppercase tracking-wider">
                    Koleksi Foto Sedang Dipilih
                  </h3>
                  <p className="font-jakarta text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Pemilik album (<strong className="text-white">{gallery.client_name}</strong>) sedang memilih foto-foto terbaik yang akan ditampilkan untuk tamu &amp; keluarga di halaman ini.
                  </p>
                  {hasValidOwnerToken && previewAsVisitor && (
                    <button
                      type="button"
                      onClick={() => setPreviewAsVisitor(false)}
                      className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-400 text-slate-950 font-jakarta font-bold text-xs uppercase tracking-wider"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Kembali ke Mode Pemilik untuk Memilih Foto</span>
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="columns-2 lg:columns-3 gap-3 sm:gap-6 space-y-3 sm:space-y-6">
                    {gridPhotos.slice(0, gridLimit).map((photo) => {
                      const isShownToGuest = guestSelectedSet.has(photo.id);
                      const isCover = photo.id === coverPhoto.id;
                      const isFav = guestFavorites.includes(photo.id);

                      return (
                        <article
                          key={photo.id}
                          className={`break-inside-avoid rounded-none photo-card-surface hover:-translate-y-0.5 flex flex-col group ${
                            isOwnerMode && isShownToGuest
                              ? 'border-cyan-400/75 ring-1 ring-cyan-400/35'
                              : isCover
                                ? 'border-cyan-400/50'
                                : ''
                          }`}
                        >
                          {/* Sharp 90-degree Photo Container — Natural Aspect Ratio */}
                          <div
                            data-cursor={
                              isOwnerMode && activeOwnerTool === 'visibility'
                                ? 'PILIH'
                                : 'VIEW'
                            }
                            className="relative w-full overflow-hidden rounded-none bg-[#0D1117]"
                          >
                            <img
                              src={photo.thumbnailUrl}
                              alt={photo.caption}
                              loading="lazy"
                              decoding="async"
                              onError={(e) => handleImageError(photo.id, e)}
                              onClick={() => {
                                if (
                                  isOwnerMode &&
                                  activeOwnerTool === 'visibility'
                                ) {
                                  handleToggleGuestPhoto(photo.id);
                                } else {
                                  setLightboxPhotoId(photo.id);
                                }
                              }}
                              className={`w-full h-auto block rounded-none cursor-pointer transition-transform duration-500 ease-out group-hover:scale-[1.02] ${
                                isOwnerMode && !isShownToGuest
                                  ? 'opacity-70'
                                  : ''
                              }`}
                            />

                            {gallery.watermark_enabled && (
                              <span className="pointer-events-none absolute bottom-2 right-2 font-mono text-[9px] uppercase tracking-[0.22em] text-white/30 select-none">
                                {gallery.studio_name}
                              </span>
                            )}

                            {isCover && (
                              <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-cyan-400 text-slate-950 font-jakarta font-bold text-[9px] sm:text-[10px] px-2 py-0.5 tracking-wider uppercase z-10">
                                Sampul Album
                              </div>
                            )}

                            {/* Owner Status Badge: Shown in Guest Album vs Private */}
                            {isOwnerMode && (
                              <button
                                type="button"
                                onClick={() => handleToggleGuestPhoto(photo.id)}
                                className={`absolute top-2 right-2 sm:top-3 sm:right-3 font-jakarta font-bold text-[9px] sm:text-[10px] px-2 py-0.5 tracking-wider uppercase z-20 inline-flex items-center gap-1 transition-colors ${
                                  isShownToGuest
                                    ? 'bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.45)]'
                                    : 'bg-[#070B14]/90 text-slate-300 border border-white/20 hover:border-cyan-400 hover:text-cyan-300'
                                }`}
                              >
                                {isShownToGuest ? (
                                  <>
                                    <Check className="w-3 h-3 stroke-[3]" />
                                    <span>Tampil di Tamu</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3 h-3" />
                                    <span>Privat</span>
                                  </>
                                )}
                              </button>
                            )}

                            {/* Lightweight Hover Quick Actions Overlay (Zero backdrop-filter per card!) */}
                            <div className="absolute inset-0 bg-[#090C10]/35 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2.5 z-10 pointer-events-none">
                              <button
                                type="button"
                                onClick={() => setLightboxPhotoId(photo.id)}
                                title="Perbesar"
                                className="pointer-events-auto w-9 h-9 bg-[#070B14]/92 border border-white/20 text-white flex items-center justify-center hover:border-cyan-400 hover:text-cyan-400 transition-colors"
                              >
                                <Maximize2 className="w-4 h-4" />
                              </button>

                              <a
                                href={photo.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={photo.name}
                                title="Unduh HD"
                                className="pointer-events-auto w-9 h-9 bg-[#070B14]/92 border border-white/20 text-white flex items-center justify-center hover:border-cyan-400 hover:text-cyan-400 transition-colors"
                              >
                                <Download className="w-4 h-4" />
                              </a>

                              {!isOwnerMode && (
                                <button
                                  type="button"
                                  onClick={() => toggleGuestFavorite(photo.id)}
                                  title="Favorit"
                                  className="pointer-events-auto w-9 h-9 bg-[#070B14]/92 border border-white/20 text-white flex items-center justify-center hover:border-cyan-400 transition-colors"
                                >
                                  <Heart
                                    className={`w-4 h-4 transition-transform active:scale-125 ${
                                      isFav
                                        ? 'fill-rose-500 text-rose-500'
                                        : 'text-white'
                                    }`}
                                  />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Sleek Single-Line Card Footer */}
                          <div className="px-2.5 sm:px-3.5 py-2 sm:py-2.5 flex items-center justify-between gap-1.5 border-t border-white/10">
                            <span className="font-mono text-[10px] sm:text-[11px] text-slate-300 truncate">
                              {photo.name}
                            </span>

                            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                              {isOwnerMode ? (
                                <>
                                  <button
                                    type="button"
                                    disabled={isCover || isSavingOwnerSetting}
                                    onClick={() => handleSetCoverPhoto(photo.id)}
                                    className={`px-2 py-1 font-jakarta font-semibold text-[10px] sm:text-[11px] border transition-colors ${
                                      isCover
                                        ? 'bg-white/20 text-white border-white/30'
                                        : 'bg-white/5 hover:bg-white/15 text-slate-300 border-white/15'
                                    }`}
                                  >
                                    {isCover ? 'Sampul' : 'Set Sampul'}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleToggleGuestPhoto(photo.id)
                                    }
                                    className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 font-jakarta font-bold text-[10px] sm:text-[11px] border transition-colors ${
                                      isShownToGuest
                                        ? 'bg-cyan-400 text-slate-950 border-cyan-400'
                                        : 'bg-white/5 hover:bg-cyan-400 hover:text-slate-950 text-cyan-300 border-cyan-400/40'
                                    }`}
                                  >
                                    {isShownToGuest ? (
                                      <>
                                        <Check className="w-3 h-3 stroke-[3]" />
                                        <span>Tampil</span>
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="w-3 h-3" />
                                        <span>Ke Tamu</span>
                                      </>
                                    )}
                                  </button>
                                </>
                              ) : (
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
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {gridLimit < gridPhotos.length && (
                    <div
                      ref={loadMoreRef}
                      className="w-full py-8 flex flex-col items-center justify-center gap-2"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setGridLimit((prev) =>
                            Math.min(prev + 36, gridPhotos.length)
                          )
                        }
                        className="px-5 py-2.5 bg-[#080D17] hover:bg-cyan-400 hover:text-slate-950 text-cyan-300 border border-cyan-400/40 font-jakarta font-bold text-xs uppercase tracking-wider transition-colors"
                      >
                        Tampilkan Foto Lainnya ({gridLimit} / {gridPhotos.length})
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </main>
      )}

      {/* FUTURISTIC GLASS LIGHTBOX MODAL WITH SMOOTH PHOTO TRANSITION */}
      {activeLightboxIndex !== -1 && lightboxPhotos[activeLightboxIndex] && (
        <div
          onClick={() => setLightboxPhotoId(null)}
          className="fixed inset-0 z-50 bg-[#05070A]/92 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-panel-strong max-w-4xl w-full overflow-hidden flex flex-col"
          >
            <div className="px-4 sm:px-5 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-bold text-xs sm:text-sm text-white truncate max-w-[200px] sm:max-w-none">
                  {lightboxPhotos[activeLightboxIndex].name}
                </span>
                <span className="font-mono text-xs text-cyan-400">
                  [{activeLightboxIndex + 1} / {lightboxPhotos.length}]
                </span>
              </div>

              <button
                type="button"
                onClick={() => setLightboxPhotoId(null)}
                className="w-8 h-8 bg-white/10 text-white flex items-center justify-center hover:bg-cyan-400 hover:text-slate-950"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative bg-[#05070A] max-h-[72vh] sm:max-h-[76vh] flex items-center justify-center overflow-hidden">
              <img
                key={lightboxPhotos[activeLightboxIndex].id}
                src={lightboxPhotos[activeLightboxIndex].fullResUrl}
                alt={lightboxPhotos[activeLightboxIndex].caption}
                onError={(e) =>
                  handleImageError(lightboxPhotos[activeLightboxIndex].id, e)
                }
                className="max-h-[72vh] sm:max-h-[76vh] w-auto object-contain rounded-none animate-lightbox-photo"
              />
            </div>

            <div className="p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2.5 border-t border-white/10">
              <span className="font-mono text-xs text-slate-400 hidden sm:inline">
                {gallery.studio_name} •{' '}
                {lightboxPhotos[activeLightboxIndex].name}
              </span>

              <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const prevIdx =
                        (activeLightboxIndex - 1 + lightboxPhotos.length) %
                        lightboxPhotos.length;
                      setLightboxPhotoId(lightboxPhotos[prevIdx].id);
                    }}
                    className="px-3 sm:px-3.5 py-2 bg-white/5 text-white border border-white/15 font-jakarta font-semibold text-xs hover:bg-white/15 transition-colors"
                  >
                    ← Sebelumnya
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nextIdx =
                        (activeLightboxIndex + 1) % lightboxPhotos.length;
                      setLightboxPhotoId(lightboxPhotos[nextIdx].id);
                    }}
                    className="px-3 sm:px-3.5 py-2 bg-white/5 text-white border border-white/15 font-jakarta font-semibold text-xs hover:bg-white/15 transition-colors"
                  >
                    Berikutnya →
                  </button>
                </div>

                {isOwnerMode && (
                  <button
                    type="button"
                    onClick={() =>
                      handleToggleGuestPhoto(
                        lightboxPhotos[activeLightboxIndex].id
                      )
                    }
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 font-jakarta font-bold text-xs border transition-colors ${
                      guestSelectedSet.has(
                        lightboxPhotos[activeLightboxIndex].id
                      )
                        ? 'bg-cyan-400 text-slate-950 border-cyan-400'
                        : 'bg-white/10 text-cyan-300 border-cyan-400/50 hover:bg-cyan-400 hover:text-slate-950'
                    }`}
                  >
                    {guestSelectedSet.has(
                      lightboxPhotos[activeLightboxIndex].id
                    ) ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Tampil di Tamu</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tampilkan ke Tamu</span>
                      </>
                    )}
                  </button>
                )}

                <a
                  href={lightboxPhotos[activeLightboxIndex].downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={lightboxPhotos[activeLightboxIndex].name}
                  className="btn-futuristic inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-cyan-400 text-slate-950 font-jakarta font-bold text-xs hover:bg-cyan-300"
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
        <div className="min-h-screen bg-transparent text-cyan-300 flex items-center justify-center font-mono text-xs uppercase tracking-[0.28em]">
          SYNCHRONIZING DIGITAL ARCHIVE...
        </div>
      }
    >
      <DigitalAlbumContent slug={params.studio_slug} />
    </Suspense>
  );
}
