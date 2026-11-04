'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Camera,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Heart,
  Image as ImageIcon,
  KeyRound,
  Lock,
  Maximize2,
  PlayCircle,
  Share2,
  X,
} from 'lucide-react';
import RetroTicker from '@/components/RetroTicker';
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

  // Track natural orientation for mixed Portrait & Landscape layout
  const [detectedRatios, setDetectedRatios] = useState<
    Record<string, 'portrait' | 'landscape' | 'square'>
  >({});

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

  // Gallery Filter, Lightbox & Favorites
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [guestFavorites, setGuestFavorites] = useState<string[]>(['photo-01']);

  const [baseUrl, setBaseUrl] = useState(
    process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  );

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.origin) {
      setBaseUrl(window.location.origin);
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

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2800);
  }

  function handleImageLoad(
    photoId: string,
    e: React.SyntheticEvent<HTMLImageElement>
  ) {
    const img = e.currentTarget;
    if (!img.naturalWidth || !img.naturalHeight) return;
    const ratio: 'portrait' | 'landscape' | 'square' =
      img.naturalWidth > img.naturalHeight * 1.08
        ? 'landscape'
        : Math.abs(img.naturalWidth - img.naturalHeight) <=
            img.naturalWidth * 0.1
          ? 'square'
          : 'portrait';

    setDetectedRatios((prev) =>
      prev[photoId] === ratio ? prev : { ...prev, [photoId]: ratio }
    );
  }

  // Determine if current user has valid Owner Token (?t=...)
  const hasValidOwnerToken = Boolean(
    tokenParam && tokenParam === gallery.owner_token
  );
  const isOwnerMode = hasValidOwnerToken && !previewAsVisitor;

  // Clean public visitor link (stripping ?t=)
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

  // Visible photos depending on Owner vs Visitor mode
  const visiblePhotos = useMemo(() => {
    const hiddenSet = new Set(gallery.hidden_photo_ids || []);
    return photos.filter((photo) => {
      if (!isOwnerMode && hiddenSet.has(photo.id)) {
        return false;
      }
      if (categoryFilter !== 'ALL' && photo.category !== categoryFilter) {
        return false;
      }
      return true;
    });
  }, [photos, gallery.hidden_photo_ids, isOwnerMode, categoryFilter]);

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
      setActiveOwnerTool('none');
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

  // Owner Action 3: Toggle Photo Visibility (Atur Siapa yang Lihat)
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

  // Owner Action 4: Copy Clean Visitor Link (Bagikan Link)
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
    <div className="min-h-screen flex flex-col bg-cream text-espresso">
      {/* Clean Crimson Editorial Header */}
      <header className="sticky top-0 z-50 w-full bg-crimson border-b-[1.5px] border-espresso">
        <RetroTicker
          text="DIFOTOIN ★ PILIH FOTO FAVORITMU ★ ABADIKAN SETIAP MOMEN ★"
          variant="cream"
        />

        <div className="max-w-7xl mx-auto px-4 md:px-10 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="font-anton text-2xl md:text-3xl text-cream tracking-wider uppercase hover:text-mustard transition-colors"
            >
              DIFOTOIN
            </Link>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded bg-cream/15 text-cream font-jakarta font-semibold text-xs border border-cream/25">
              {gallery.studio_name || 'Zeevisual'}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-cream">
            <span className="font-fraunces font-bold text-base">
              {gallery.client_name}
            </span>
            <span className="text-cream/50">•</span>
            <span className="font-jakarta text-xs text-cream/80">
              Digital Album
            </span>
          </div>

          <div className="flex items-center gap-2">
            {hasValidOwnerToken && previewAsVisitor && (
              <button
                type="button"
                onClick={() => setPreviewAsVisitor(false)}
                className="inline-flex items-center gap-1.5 bg-mustard text-espresso font-jakarta font-bold text-xs px-3.5 py-1.5 rounded-lg border border-espresso"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Kembali ke Mode Pemilik</span>
              </button>
            )}

            <Link
              href={`/${gallery.studio_slug}/${gallery.slug}`}
              className="inline-flex items-center gap-1.5 bg-white text-espresso font-jakarta font-bold text-xs px-3.5 py-1.5 rounded-lg border border-espresso hover:bg-mustard transition-colors"
            >
              <span>Pilih Foto</span>
            </Link>
          </div>
        </div>
      </header>

      {/* STICKY FLOATING "MODE PEMILIK ALBUM" BAR (Only when ?t === gallery.owner_token) */}
      {isOwnerMode && (
        <aside className="sticky top-[94px] z-40 w-full bg-espresso text-cream border-b border-espresso px-4 md:px-10 py-2.5 shadow-retro">
          <div className="max-w-7xl mx-auto flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-mustard inline-block" />
                <span className="font-anton text-xs md:text-sm uppercase tracking-wider text-cream">
                  Mode Pemilik Album
                </span>
              </div>

              {/* 4 Required Interactive Owner Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* 1. Ganti Sampul */}
                <button
                  type="button"
                  onClick={() =>
                    setActiveOwnerTool(
                      activeOwnerTool === 'cover' ? 'none' : 'cover'
                    )
                  }
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-jakarta font-bold text-xs transition-all ${
                    activeOwnerTool === 'cover'
                      ? 'bg-mustard text-espresso'
                      : 'bg-cream/10 text-cream hover:bg-cream/20'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Ganti Sampul</span>
                </button>

                {/* 2. Bikin PIN */}
                <button
                  type="button"
                  onClick={() =>
                    setActiveOwnerTool(
                      activeOwnerTool === 'pin' ? 'none' : 'pin'
                    )
                  }
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-jakarta font-bold text-xs transition-all ${
                    activeOwnerTool === 'pin'
                      ? 'bg-mustard text-espresso'
                      : 'bg-cream/10 text-cream hover:bg-cream/20'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>
                    Bikin PIN {gallery.album_pin ? `(${gallery.album_pin})` : ''}
                  </span>
                </button>

                {/* 3. Atur Siapa yang Lihat */}
                <button
                  type="button"
                  onClick={() =>
                    setActiveOwnerTool(
                      activeOwnerTool === 'visibility' ? 'none' : 'visibility'
                    )
                  }
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-jakarta font-bold text-xs transition-all ${
                    activeOwnerTool === 'visibility'
                      ? 'bg-mustard text-espresso'
                      : 'bg-cream/10 text-cream hover:bg-cream/20'
                  }`}
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>
                    Atur Siapa yang Lihat ({gallery.hidden_photo_ids?.length || 0})
                  </span>
                </button>

                {/* 4. Bagikan Link */}
                <button
                  type="button"
                  onClick={() =>
                    setActiveOwnerTool(
                      activeOwnerTool === 'share' ? 'none' : 'share'
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-mustard text-espresso font-jakarta font-bold text-xs hover:bg-mustard-light transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Bagikan Link</span>
                </button>

                {/* Preview as Visitor Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setPreviewAsVisitor(true);
                    setIsPinUnlocked(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-espresso font-jakarta font-bold text-xs hover:bg-cream transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Lihat Sebagai Tamu</span>
                </button>
              </div>
            </div>

            {/* Expandable Interactive Owner Control Drawer */}
            {activeOwnerTool !== 'none' && (
              <div className="bg-white text-espresso p-4 rounded-xl border border-espresso flex flex-col gap-3">
                {activeOwnerTool === 'cover' && (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-jakarta font-bold text-xs uppercase text-espresso">
                          Pilih Foto Sampul Album
                        </span>
                        <p className="font-jakarta text-xs text-espresso-muted">
                          Klik salah satu foto di bawah ini untuk dijadikan foto
                          sampul utama:
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveOwnerTool('none')}
                        className="p-1 rounded bg-cream hover:bg-mustard"
                      >
                        <X className="w-4 h-4" />
                      </button>
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
                            className={`relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                              isCurrentCover
                                ? 'border-mustard ring-2 ring-espresso'
                                : 'border-espresso/40 opacity-80 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={p.thumbnailUrl}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                            {isCurrentCover && (
                              <span className="absolute bottom-0 inset-x-0 bg-espresso text-cream font-mono text-[9px] py-0.5 text-center">
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
                      <span className="font-jakarta font-bold text-xs uppercase text-espresso">
                        Atur PIN 4 Digit Album
                      </span>
                      <p className="font-jakarta text-xs text-espresso-muted">
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
                        className="w-28 bg-cream text-espresso px-3 py-2 rounded-lg border border-espresso font-mono font-bold text-base tracking-[0.25em] text-center focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={isSavingOwnerSetting}
                        onClick={() => handleSaveAlbumPin(pinDraft)}
                        className="px-4 py-2 rounded-lg bg-espresso text-cream font-jakarta font-bold text-xs hover:bg-crimson"
                      >
                        Simpan PIN
                      </button>
                      {gallery.album_pin && (
                        <button
                          type="button"
                          disabled={isSavingOwnerSetting}
                          onClick={() => handleSaveAlbumPin(null)}
                          className="px-3 py-2 rounded-lg bg-cream text-espresso font-jakarta font-bold text-xs border border-espresso"
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
                      <span className="font-jakarta font-bold text-xs uppercase text-espresso">
                        Atur Siapa yang Lihat ({gallery.hidden_photo_ids?.length || 0} Foto Disembunyikan)
                      </span>
                      <p className="font-jakarta text-xs text-espresso-muted">
                        Klik tombol &ldquo;Sembunyikan / Tampilkan&rdquo; di bawah
                        masing-masing foto untuk menyembunyikannya dari
                        pengunjung publik.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveOwnerTool('none')}
                      className="shrink-0 px-3.5 py-1.5 rounded-lg bg-mustard text-espresso border border-espresso font-jakarta font-bold text-xs"
                    >
                      Tutup
                    </button>
                  </div>
                )}

                {activeOwnerTool === 'share' && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="font-jakarta font-bold text-xs uppercase text-espresso">
                        Bagikan Link Album ke Keluarga &amp; Sahabat
                      </span>
                      <code className="font-mono text-xs font-bold bg-cream px-3 py-1.5 rounded border border-espresso/30 text-espresso select-all">
                        {cleanVisitorUrl}
                      </code>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleCopyCleanLink}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-mustard text-espresso border border-espresso font-jakarta font-bold text-xs"
                      >
                        {copiedCleanLink ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-crimson" />
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
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-espresso text-cream font-jakarta font-bold text-xs"
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

      {/* Clean Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-4 md:right-8 z-50 bg-espresso text-cream px-4 py-2.5 rounded-xl border border-cream/20 shadow-retro flex items-center gap-2 font-jakarta text-xs md:text-sm font-semibold">
          <CheckCircle2 className="w-4 h-4 text-mustard shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* IF VISITOR MODE AND ALBUM_PIN IS ACTIVE: SHOW CLEAN RETRO PIN ENTRY SCREEN */}
      {requiresPinGate ? (
        <main className="flex-1 w-full flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full bg-white rounded-2xl border-[1.5px] border-espresso shadow-retro-lg overflow-hidden flex flex-col items-center text-center p-8">
            <div className="w-14 h-14 rounded-full bg-cream text-espresso border-[1.5px] border-espresso flex items-center justify-center mb-4">
              <KeyRound className="w-6 h-6 text-crimson" />
            </div>

            <h1 className="font-anton text-2xl md:text-3xl text-espresso uppercase tracking-wide">
              Album Terlindungi PIN
            </h1>
            <p className="font-jakarta text-sm text-espresso-muted mt-1.5">
              Masukkan 4 digit PIN untuk membuka album{' '}
              <strong className="text-espresso">{gallery.client_name}</strong>.
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
                className="w-48 bg-cream/60 text-espresso px-4 py-3 rounded-xl border-[1.5px] border-espresso font-mono font-bold text-center text-2xl tracking-[0.4em] focus:outline-none focus:bg-white"
              />

              {pinError && (
                <p className="font-jakarta text-xs font-semibold text-crimson">
                  {pinError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3 px-6 rounded-xl bg-mustard hover:bg-mustard-light text-espresso font-anton text-sm uppercase tracking-wider border-[1.5px] border-espresso shadow-retro-sm transition-all"
              >
                Buka Album
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-espresso/15 w-full flex items-center justify-between text-xs text-espresso-muted font-jakarta">
              <span>
                PIN Demo: <strong className="font-mono">{gallery.album_pin}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setPinInput(gallery.album_pin || '2408');
                  setIsPinUnlocked(true);
                }}
                className="font-bold text-espresso underline hover:text-crimson"
              >
                Buka Langsung →
              </button>
            </div>
          </div>
        </main>
      ) : (
        /* UNLOCKED DIGITAL ALBUM CONTENT */
        <main className="flex-1 w-full">
          {/* 1. CLEAN EDITORIAL HERO COVER (FRAMED IN MUSTARD #F2B705) */}
          <section className="w-full bg-white px-4 md:px-10 py-10 md:py-14 border-b-[1.5px] border-espresso">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-14">
              {/* Left: Featured Cover Frame in Mustard (#F2B705) */}
              <div className="w-full lg:w-5/12 flex flex-col items-center">
                <div className="relative w-full max-w-md bg-mustard p-3.5 rounded-2xl border-[1.5px] border-espresso shadow-retro-lg">
                  <div className="relative w-full aspect-[4/5] overflow-hidden rounded-xl border border-espresso bg-cream">
                    <img
                      src={coverPhoto.fullResUrl}
                      alt={coverPhoto.caption}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-espresso font-jakarta font-bold text-xs px-1">
                    <span>{gallery.studio_name.toUpperCase()} ARCHIVE</span>
                    <span>{coverPhoto.name}</span>
                  </div>
                </div>
              </div>

              {/* Right: Clean Editorial Typography */}
              <div className="w-full lg:w-7/12 flex flex-col justify-center">
                <span className="font-jakarta font-bold text-xs uppercase tracking-widest text-crimson mb-2">
                  DIGITAL PHOTO ALBUM • {gallery.session_type.toUpperCase()}
                </span>

                <h1 className="font-fraunces font-black text-4xl sm:text-5xl md:text-6xl text-espresso tracking-tight leading-[1.05]">
                  {gallery.client_name}
                </h1>

                <p className="font-jakarta text-base text-espresso-muted mt-3 max-w-xl leading-relaxed">
                  Koleksi foto momen spesial yang diabadikan oleh{' '}
                  <strong className="text-espresso">
                    {gallery.studio_name}
                  </strong>{' '}
                  ({gallery.session_date}). Tersedia untuk dilihat dan diunduh
                  dalam resolusi tinggi.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(0)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-mustard hover:bg-mustard-light text-espresso font-anton text-sm uppercase tracking-wider border-[1.5px] border-espresso shadow-retro-sm transition-all"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Buka Layar Penuh</span>
                  </button>

                  <a
                    href={coverPhoto.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-cream hover:bg-cream-dark text-espresso font-jakarta font-bold text-xs uppercase tracking-wider border-[1.5px] border-espresso transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh Foto Sampul</span>
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* 2. TERRACOTTA (#B85D19) QUOTE DIVIDER SECTION WITH CLEAN FLOATING PILLS */}
          <section className="w-full bg-terracotta text-cream py-10 px-4 md:px-10 border-b-[1.5px] border-espresso">
            <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
              <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                <span className="px-3.5 py-1 rounded-full bg-cream text-espresso font-jakarta font-bold text-xs border border-espresso -rotate-1">
                  ★ Momen Spesial
                </span>
                <span className="px-3.5 py-1 rounded-full bg-mustard text-espresso font-jakarta font-bold text-xs border border-espresso rotate-1">
                  ✿ Keluarga &amp; Sahabat
                </span>
                <span className="px-3.5 py-1 rounded-full bg-cream text-espresso font-jakarta font-bold text-xs border border-espresso -rotate-1">
                  ✦ {gallery.studio_name}
                </span>
              </div>

              <blockquote className="font-fraunces italic font-bold text-xl sm:text-2xl text-cream leading-relaxed">
                “Setiap jepretan adalah mesin waktu kecil; menyimpan tawa,
                kehangatan, dan cerita yang tak lekang oleh masa.”
              </blockquote>
            </div>
          </section>

          {/* 3. AUTO-MASONRY PHOTO GRID (PORTRAIT & LANDSCAPE TERSUSUN RAPI OTOMATIS) */}
          <section className="w-full bg-cream px-4 md:px-10 py-10">
            <div className="max-w-7xl mx-auto">
              {/* Subheader & Filter Pills */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-espresso/20">
                <div>
                  <h2 className="font-anton text-2xl md:text-3xl text-espresso uppercase tracking-wide">
                    Galeri Foto ({visiblePhotos.length})
                  </h2>
                  <p className="font-jakarta text-xs text-espresso-muted">
                    Foto portrait dan landscape otomatis menyesuaikan ukuran
                    aslinya. Klik foto untuk memperbesar atau mengunduh.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(
                    ['ALL', 'Outdoor', 'Studio', 'Detail & Cincin'] as const
                  ).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3.5 py-1.5 rounded-full font-jakarta font-bold text-xs border-[1.5px] border-espresso transition-all ${
                        categoryFilter === cat
                          ? 'bg-espresso text-cream'
                          : 'bg-white text-espresso hover:bg-mustard'
                      }`}
                    >
                      {cat === 'ALL' ? 'Semua Foto' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mixed Portrait & Landscape Masonry Columns */}
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="aspect-[4/5] rounded-2xl bg-white border-[1.5px] border-espresso animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
                  {visiblePhotos.map((photo, index) => {
                    const isHidden = (gallery.hidden_photo_ids || []).includes(
                      photo.id
                    );
                    const isCover = photo.id === coverPhoto.id;
                    const isFav = guestFavorites.includes(photo.id);
                    const orientation =
                      detectedRatios[photo.id] ||
                      photo.aspectRatio ||
                      'portrait';

                    const aspectClass =
                      orientation === 'landscape'
                        ? 'aspect-[4/3]'
                        : orientation === 'square'
                          ? 'aspect-square'
                          : 'aspect-[3/4]';

                    return (
                      <article
                        key={photo.id}
                        className={`break-inside-avoid rounded-2xl p-2.5 bg-white border-[1.5px] border-espresso transition-all flex flex-col group ${
                          isCover
                            ? 'ring-2 ring-mustard shadow-retro'
                            : 'hover:shadow-retro-sm'
                        }`}
                      >
                        <div
                          className={`relative w-full ${aspectClass} overflow-hidden rounded-xl bg-cream`}
                        >
                          <img
                            src={photo.thumbnailUrl}
                            alt={photo.caption}
                            loading="lazy"
                            onLoad={(e) => handleImageLoad(photo.id, e)}
                            onClick={() => setLightboxIndex(index)}
                            className={`w-full h-full object-cover cursor-pointer transition-transform duration-500 group-hover:scale-[1.03] ${
                              isHidden ? 'opacity-40 blur-[1px]' : ''
                            }`}
                          />

                          {isCover && (
                            <div className="absolute top-2.5 left-2.5 bg-mustard text-espresso font-jakarta font-bold text-[10px] px-2.5 py-0.5 rounded border border-espresso uppercase z-10">
                              Sampul Album
                            </div>
                          )}

                          {/* Hidden Notice Overlay in Owner Mode */}
                          {isOwnerMode && isHidden && (
                            <div className="absolute inset-0 bg-espresso/80 flex flex-col items-center justify-center text-center p-4 text-cream z-20">
                              <EyeOff className="w-7 h-7 text-mustard mb-1" />
                              <span className="font-jakarta font-bold text-xs uppercase text-mustard">
                                Foto Disembunyikan dari Tamu
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleHidePhoto(photo.id)}
                                className="mt-2.5 px-3 py-1 bg-white text-espresso rounded-lg font-jakarta font-bold text-xs"
                              >
                                Tampilkan Kembali
                              </button>
                            </div>
                          )}

                          {/* Hover Quick Actions Overlay */}
                          {!isHidden && (
                            <div className="absolute inset-0 bg-espresso/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                              <button
                                type="button"
                                onClick={() => setLightboxIndex(index)}
                                title="Perbesar"
                                className="w-9 h-9 rounded-full bg-white text-espresso border border-espresso flex items-center justify-center hover:bg-mustard transition-colors"
                              >
                                <Maximize2 className="w-4 h-4" />
                              </button>

                              <a
                                href={photo.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={photo.name}
                                title="Unduh HD"
                                className="w-9 h-9 rounded-full bg-mustard text-espresso border border-espresso flex items-center justify-center hover:bg-white transition-colors"
                              >
                                <Download className="w-4 h-4" />
                              </a>

                              <button
                                type="button"
                                onClick={() => toggleGuestFavorite(photo.id)}
                                title="Favorit"
                                className="w-9 h-9 rounded-full bg-white text-espresso border border-espresso flex items-center justify-center hover:bg-mustard transition-colors"
                              >
                                <Heart
                                  className={`w-4 h-4 ${
                                    isFav
                                      ? 'fill-crimson text-crimson'
                                      : 'text-espresso'
                                  }`}
                                />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Clean Bottom Row */}
                        <div className="pt-2.5 px-0.5 flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-semibold text-espresso truncate">
                            {photo.name}
                          </span>

                          <a
                            href={photo.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={photo.name}
                            className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cream hover:bg-mustard text-espresso border border-espresso/40 font-jakarta font-bold text-[11px] transition-colors"
                          >
                            <Download className="w-3 h-3" />
                            <span>Unduh</span>
                          </a>
                        </div>

                        {/* Owner Mode Direct Controls */}
                        {isOwnerMode && (
                          <div className="mt-2 pt-2 border-t border-espresso/15 flex items-center gap-2">
                            <button
                              type="button"
                              disabled={isCover || isSavingOwnerSetting}
                              onClick={() => handleSetCoverPhoto(photo.id)}
                              className={`flex-1 py-1.5 px-2 rounded-lg font-jakarta font-bold text-[11px] border border-espresso/40 flex items-center justify-center gap-1 transition-colors ${
                                isCover
                                  ? 'bg-mustard text-espresso border-espresso'
                                  : 'bg-cream/60 hover:bg-mustard text-espresso'
                              }`}
                            >
                              <ImageIcon className="w-3 h-3" />
                              <span>
                                {isCover ? 'Sampul Aktif' : 'Jadikan Sampul'}
                              </span>
                            </button>

                            <button
                              type="button"
                              disabled={isSavingOwnerSetting}
                              onClick={() => handleToggleHidePhoto(photo.id)}
                              className={`flex-1 py-1.5 px-2 rounded-lg font-jakarta font-bold text-[11px] border border-espresso/40 flex items-center justify-center gap-1 transition-colors ${
                                isHidden
                                  ? 'bg-espresso text-cream'
                                  : 'bg-cream/60 hover:bg-espresso hover:text-cream text-espresso'
                              }`}
                            >
                              {isHidden ? (
                                <>
                                  <Eye className="w-3 h-3" />
                                  <span>Tampilkan</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3 h-3" />
                                  <span>Sembunyikan</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </main>
      )}

      {/* LIGHTBOX ZOOM MODAL WITH HIGH-RES DOWNLOAD */}
      {lightboxIndex !== null && visiblePhotos[lightboxIndex] && (
        <div
          onClick={() => setLightboxIndex(null)}
          className="fixed inset-0 z-50 bg-espresso/95 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white max-w-4xl w-full rounded-2xl border-[1.5px] border-espresso shadow-retro-xl overflow-hidden flex flex-col"
          >
            <div className="bg-espresso text-cream px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-bold text-sm text-cream">
                  {visiblePhotos[lightboxIndex].name}
                </span>
                <span className="font-jakarta text-xs text-cream/70">
                  ({lightboxIndex + 1} / {visiblePhotos.length})
                </span>
              </div>

              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                className="w-8 h-8 rounded-full bg-white text-espresso flex items-center justify-center hover:bg-mustard"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative bg-espresso max-h-[74vh] flex items-center justify-center overflow-hidden">
              <img
                src={visiblePhotos[lightboxIndex].fullResUrl}
                alt={visiblePhotos[lightboxIndex].caption}
                className="max-h-[74vh] w-auto object-contain"
              />
            </div>

            <div className="p-4 bg-white flex flex-wrap items-center justify-between gap-3 border-t border-espresso/20">
              <span className="font-jakarta text-xs text-espresso-muted">
                {visiblePhotos[lightboxIndex].caption}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex(
                      (lightboxIndex - 1 + visiblePhotos.length) %
                        visiblePhotos.length
                    )
                  }
                  className="px-3.5 py-2 rounded-xl bg-cream text-espresso border border-espresso font-jakarta font-bold text-xs hover:bg-mustard"
                >
                  ← Sebelumnya
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((lightboxIndex + 1) % visiblePhotos.length)
                  }
                  className="px-3.5 py-2 rounded-xl bg-cream text-espresso border border-espresso font-jakarta font-bold text-xs hover:bg-mustard"
                >
                  Berikutnya →
                </button>
                <a
                  href={visiblePhotos[lightboxIndex].downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={visiblePhotos[lightboxIndex].name}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-mustard text-espresso border border-espresso font-jakarta font-bold text-xs hover:bg-mustard-light"
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
        <div className="min-h-screen bg-cream text-espresso flex items-center justify-center font-anton text-2xl uppercase tracking-wider">
          Memuat Album Digital Difotoin...
        </div>
      }
    >
      <DigitalAlbumContent slug={params.studio_slug} />
    </Suspense>
  );
}
