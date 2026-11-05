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

  // Lightbox & Favorites
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
      return true;
    });
  }, [photos, gallery.hidden_photo_ids, isOwnerMode]);

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
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-espresso">
      {/* Clean Minimal Editorial Header */}
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-espresso/15">
        <div className="max-w-7xl mx-auto px-4 md:px-10 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="font-anton text-2xl text-espresso tracking-wider uppercase hover:text-crimson transition-colors"
            >
              DIFOTOIN
            </Link>
            <span className="text-espresso/25">|</span>
            <span className="font-jakarta font-semibold text-xs text-espresso-muted uppercase tracking-wider">
              {gallery.studio_name || 'Zeevisual'}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-espresso">
            <span className="font-fraunces font-bold text-base">
              {gallery.client_name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {hasValidOwnerToken && previewAsVisitor && (
              <button
                type="button"
                onClick={() => setPreviewAsVisitor(false)}
                className="inline-flex items-center gap-1.5 bg-mustard text-espresso font-jakarta font-semibold text-xs px-3.5 py-1.5 border border-espresso/30"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Mode Pemilik</span>
              </button>
            )}

            <Link
              href={`/${gallery.studio_slug}/${gallery.slug}`}
              className="inline-flex items-center gap-1.5 bg-espresso text-cream font-jakarta font-semibold text-xs px-4 py-2 hover:bg-crimson transition-colors"
            >
              <span>Halaman Pilih Foto</span>
            </Link>
          </div>
        </div>
      </header>

      {/* STICKY "MODE PEMILIK ALBUM" BAR (Only when ?t === gallery.owner_token) */}
      {isOwnerMode && (
        <aside className="sticky top-16 z-40 w-full bg-espresso text-cream border-b border-espresso/20 px-4 md:px-10 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-mustard inline-block" />
                <span className="font-jakarta font-bold text-xs uppercase tracking-wider text-cream">
                  Mode Pemilik Album
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* 1. Ganti Sampul */}
                <button
                  type="button"
                  onClick={() =>
                    setActiveOwnerTool(
                      activeOwnerTool === 'cover' ? 'none' : 'cover'
                    )
                  }
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-jakarta font-semibold text-xs transition-all ${
                    activeOwnerTool === 'cover'
                      ? 'bg-mustard text-espresso'
                      : 'bg-white/10 text-cream hover:bg-white/20'
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
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-jakarta font-semibold text-xs transition-all ${
                    activeOwnerTool === 'pin'
                      ? 'bg-mustard text-espresso'
                      : 'bg-white/10 text-cream hover:bg-white/20'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>
                    PIN {gallery.album_pin ? `(${gallery.album_pin})` : ''}
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
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-jakarta font-semibold text-xs transition-all ${
                    activeOwnerTool === 'visibility'
                      ? 'bg-mustard text-espresso'
                      : 'bg-white/10 text-cream hover:bg-white/20'
                  }`}
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>
                    Sembunyikan Foto ({gallery.hidden_photo_ids?.length || 0})
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
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-mustard text-espresso font-jakarta font-bold text-xs hover:bg-mustard-light transition-all"
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-espresso font-jakarta font-semibold text-xs hover:bg-cream transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Tampilan Tamu</span>
                </button>
              </div>
            </div>

            {/* Expandable Interactive Owner Control Drawer */}
            {activeOwnerTool !== 'none' && (
              <div className="bg-white text-espresso p-4 border border-espresso/20 flex flex-col gap-3">
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
                        className="p-1 bg-cream hover:bg-mustard"
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
                            className={`relative shrink-0 w-20 h-20 overflow-hidden border-2 transition-all ${
                              isCurrentCover
                                ? 'border-mustard'
                                : 'border-transparent opacity-75 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={p.thumbnailUrl}
                              alt={p.name}
                              onError={(e) => handleImageError(p.id, e)}
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
                        className="w-28 bg-[#FAF8F5] text-espresso px-3 py-2 border border-espresso/30 font-mono font-bold text-base tracking-[0.25em] text-center focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={isSavingOwnerSetting}
                        onClick={() => handleSaveAlbumPin(pinDraft)}
                        className="px-4 py-2 bg-espresso text-cream font-jakarta font-bold text-xs hover:bg-crimson"
                      >
                        Simpan PIN
                      </button>
                      {gallery.album_pin && (
                        <button
                          type="button"
                          disabled={isSavingOwnerSetting}
                          onClick={() => handleSaveAlbumPin(null)}
                          className="px-3 py-2 bg-[#FAF8F5] text-espresso font-jakarta font-bold text-xs border border-espresso/30"
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
                        Atur Visibilitas Foto (
                        {gallery.hidden_photo_ids?.length || 0} Disembunyikan)
                      </span>
                      <p className="font-jakarta text-xs text-espresso-muted">
                        Klik ikon mata pada foto di bawah untuk menyembunyikan
                        atau menampilkan foto bagi pengunjung tamu.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveOwnerTool('none')}
                      className="shrink-0 px-3.5 py-1.5 bg-espresso text-cream font-jakarta font-bold text-xs"
                    >
                      Selesai
                    </button>
                  </div>
                )}

                {activeOwnerTool === 'share' && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="font-jakarta font-bold text-xs uppercase text-espresso">
                        Link Publik Keluarga &amp; Sahabat (Tanpa Token Edit)
                      </span>
                      <code className="font-mono text-xs font-bold bg-[#FAF8F5] px-3 py-1.5 border border-espresso/20 text-espresso select-all">
                        {cleanVisitorUrl}
                      </code>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleCopyCleanLink}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-mustard text-espresso font-jakarta font-bold text-xs"
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
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-espresso text-cream font-jakarta font-bold text-xs"
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
        <div className="fixed bottom-6 right-4 md:right-8 z-50 bg-espresso text-cream px-4 py-2.5 shadow-lg flex items-center gap-2 font-jakarta text-xs md:text-sm font-semibold">
          <CheckCircle2 className="w-4 h-4 text-mustard shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* PIN GATE */}
      {requiresPinGate ? (
        <main className="flex-1 w-full flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full bg-white border border-espresso/20 shadow-sm flex flex-col items-center text-center p-8">
            <div className="w-12 h-12 bg-[#FAF8F5] text-espresso border border-espresso/20 flex items-center justify-center mb-4">
              <KeyRound className="w-5 h-5 text-crimson" />
            </div>

            <h1 className="font-fraunces font-bold text-2xl text-espresso">
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
                className="w-48 bg-[#FAF8F5] text-espresso px-4 py-3 border border-espresso/30 font-mono font-bold text-center text-2xl tracking-[0.4em] focus:outline-none focus:bg-white"
              />

              {pinError && (
                <p className="font-jakarta text-xs font-semibold text-crimson">
                  {pinError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3 px-6 bg-espresso hover:bg-crimson text-cream font-jakarta font-bold text-xs uppercase tracking-widest transition-all"
              >
                Buka Album
              </button>
            </form>
          </div>
        </main>
      ) : (
        /* UNLOCKED DIGITAL ALBUM CONTENT — CLEAN EDITORIAL GALLERY */
        <main className="flex-1 w-full">
          {/* 1. CLEAN MINIMAL EDITORIAL HERO COVER (SHARP CORNERS) */}
          <section className="w-full bg-white px-4 md:px-10 py-10 md:py-16 border-b border-espresso/10">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* Left: Sharp, Unrounded Editorial Cover Image */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="w-full max-w-md bg-[#FAF8F5] p-3 border border-espresso/15">
                  <div className="relative w-full overflow-hidden bg-cream">
                    <img
                      src={coverPhoto.fullResUrl}
                      alt={coverPhoto.caption}
                      onError={(e) => handleImageError(coverPhoto.id, e)}
                      className="w-full h-auto max-h-[520px] object-cover block rounded-none"
                    />
                  </div>
                </div>
              </div>

              {/* Right: Clean Editorial Typography */}
              <div className="lg:col-span-7 flex flex-col justify-center">
                <span className="font-jakarta font-semibold text-xs uppercase tracking-[0.2em] text-espresso-muted mb-3">
                  {gallery.studio_name} • {gallery.session_type}
                </span>

                <h1 className="font-fraunces font-bold text-4xl sm:text-5xl md:text-6xl text-espresso tracking-tight leading-[1.08]">
                  {gallery.client_name}
                </h1>

                <p className="font-jakarta text-sm md:text-base text-espresso-muted mt-4 max-w-xl leading-relaxed">
                  Koleksi dokumentasi foto bersama{' '}
                  <strong className="text-espresso">
                    {gallery.studio_name}
                  </strong>
                  . Klik pada foto untuk melihat ukuran penuh atau mengunduh
                  file resolusi tinggi.
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(0)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-espresso hover:bg-crimson text-cream font-jakarta font-bold text-xs uppercase tracking-wider transition-all"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Buka Galeri Layar Penuh</span>
                  </button>

                  <a
                    href={coverPhoto.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#FAF8F5] hover:bg-cream text-espresso font-jakarta font-bold text-xs uppercase tracking-wider border border-espresso/20 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh Sampul</span>
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* 2. SHARP, CLEAN MASONRY PHOTO GRID (ZERO ROUNDED CORNERS) */}
          <section className="w-full px-4 md:px-10 py-10 md:py-14">
            <div className="max-w-7xl mx-auto">
              {/* Subheader */}
              <div className="flex items-center justify-between gap-4 pb-5 mb-8 border-b border-espresso/15">
                <div>
                  <h2 className="font-fraunces font-bold text-2xl text-espresso">
                    Koleksi Foto ({visiblePhotos.length})
                  </h2>
                </div>
                <span className="font-jakarta text-xs text-espresso-muted">
                  Klik foto untuk memperbesar
                </span>
              </div>

              {/* True Natural Masonry Columns — Sharp Corners (rounded-none), No Cropping */}
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="aspect-[4/5] bg-white border border-espresso/10 animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                  {visiblePhotos.map((photo, index) => {
                    const isHidden = (gallery.hidden_photo_ids || []).includes(
                      photo.id
                    );
                    const isCover = photo.id === coverPhoto.id;
                    const isFav = guestFavorites.includes(photo.id);

                    return (
                      <article
                        key={photo.id}
                        className={`break-inside-avoid rounded-none bg-white border transition-all flex flex-col group ${
                          isCover
                            ? 'border-espresso ring-1 ring-espresso'
                            : 'border-espresso/15 hover:border-espresso/40'
                        }`}
                      >
                        {/* Sharp 90-degree Photo Container — Natural Aspect Ratio */}
                        <div className="relative w-full overflow-hidden rounded-none bg-[#F3EFE6]">
                          <img
                            src={photo.thumbnailUrl}
                            alt={photo.caption}
                            loading="lazy"
                            onError={(e) => handleImageError(photo.id, e)}
                            onClick={() => setLightboxIndex(index)}
                            className={`w-full h-auto block rounded-none cursor-pointer transition-opacity duration-300 group-hover:opacity-95 ${
                              isHidden ? 'opacity-35 grayscale' : ''
                            }`}
                          />

                          {isCover && (
                            <div className="absolute top-3 left-3 bg-espresso/90 text-cream font-jakarta font-semibold text-[10px] px-2.5 py-1 tracking-wider uppercase z-10">
                              Sampul Album
                            </div>
                          )}

                          {/* Hidden Notice Overlay in Owner Mode */}
                          {isOwnerMode && isHidden && (
                            <div className="absolute inset-0 bg-espresso/75 flex flex-col items-center justify-center text-center p-4 text-cream z-20">
                              <EyeOff className="w-6 h-6 text-mustard mb-1" />
                              <span className="font-jakarta font-semibold text-xs uppercase tracking-wider">
                                Disembunyikan dari Tamu
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleHidePhoto(photo.id)}
                                className="mt-2 px-3 py-1 bg-white text-espresso font-jakarta font-bold text-xs"
                              >
                                Tampilkan Kembali
                              </button>
                            </div>
                          )}

                          {/* Subtle Hover Actions Overlay */}
                          {!isHidden && (
                            <div className="absolute inset-0 bg-espresso/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5 z-10 pointer-events-none">
                              <button
                                type="button"
                                onClick={() => setLightboxIndex(index)}
                                title="Perbesar"
                                className="pointer-events-auto w-9 h-9 bg-white text-espresso flex items-center justify-center hover:bg-mustard transition-colors shadow-sm"
                              >
                                <Maximize2 className="w-4 h-4" />
                              </button>

                              <a
                                href={photo.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={photo.name}
                                title="Unduh HD"
                                className="pointer-events-auto w-9 h-9 bg-white text-espresso flex items-center justify-center hover:bg-mustard transition-colors shadow-sm"
                              >
                                <Download className="w-4 h-4" />
                              </a>

                              <button
                                type="button"
                                onClick={() => toggleGuestFavorite(photo.id)}
                                title="Favorit"
                                className="pointer-events-auto w-9 h-9 bg-white text-espresso flex items-center justify-center hover:bg-mustard transition-colors shadow-sm"
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

                        {/* Minimal Single-Line Bar Under Photo */}
                        <div className="px-3 py-2.5 bg-white flex items-center justify-between gap-2 border-t border-espresso/10">
                          <span className="font-mono text-[11px] text-espresso-muted truncate">
                            {photo.name}
                          </span>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isOwnerMode && (
                              <>
                                <button
                                  type="button"
                                  disabled={isCover || isSavingOwnerSetting}
                                  onClick={() => handleSetCoverPhoto(photo.id)}
                                  title={
                                    isCover ? 'Sampul Aktif' : 'Jadikan Sampul'
                                  }
                                  className={`px-2 py-1 font-jakarta font-semibold text-[11px] border transition-colors ${
                                    isCover
                                      ? 'bg-espresso text-cream border-espresso'
                                      : 'bg-[#FAF8F5] hover:bg-mustard text-espresso border-espresso/20'
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
                                      ? 'bg-espresso text-cream border-espresso'
                                      : 'bg-[#FAF8F5] hover:bg-espresso hover:text-cream text-espresso border-espresso/20'
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
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FAF8F5] hover:bg-espresso hover:text-cream text-espresso border border-espresso/20 font-jakarta font-semibold text-[11px] transition-colors"
                            >
                              <Download className="w-3 h-3" />
                              <span>Unduh</span>
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

      {/* LIGHTBOX ZOOM MODAL WITH SHARP CORNERS */}
      {lightboxIndex !== null && visiblePhotos[lightboxIndex] && (
        <div
          onClick={() => setLightboxIndex(null)}
          className="fixed inset-0 z-50 bg-espresso/95 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white max-w-4xl w-full border border-espresso/20 overflow-hidden flex flex-col"
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
                className="w-8 h-8 bg-white/10 text-cream flex items-center justify-center hover:bg-white hover:text-espresso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative bg-espresso max-h-[76vh] flex items-center justify-center overflow-hidden">
              <img
                src={visiblePhotos[lightboxIndex].fullResUrl}
                alt={visiblePhotos[lightboxIndex].caption}
                onError={(e) =>
                  handleImageError(visiblePhotos[lightboxIndex].id, e)
                }
                className="max-h-[76vh] w-auto object-contain rounded-none"
              />
            </div>

            <div className="p-4 bg-white flex flex-wrap items-center justify-between gap-3 border-t border-espresso/15">
              <span className="font-jakarta text-xs text-espresso-muted">
                {visiblePhotos[lightboxIndex].name}
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
                  className="px-3.5 py-2 bg-[#FAF8F5] text-espresso border border-espresso/20 font-jakarta font-semibold text-xs hover:bg-cream"
                >
                  ← Sebelumnya
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((lightboxIndex + 1) % visiblePhotos.length)
                  }
                  className="px-3.5 py-2 bg-[#FAF8F5] text-espresso border border-espresso/20 font-jakarta font-semibold text-xs hover:bg-cream"
                >
                  Berikutnya →
                </button>
                <a
                  href={visiblePhotos[lightboxIndex].downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={visiblePhotos[lightboxIndex].name}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-espresso text-cream font-jakarta font-semibold text-xs hover:bg-crimson"
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
        <div className="min-h-screen bg-[#FAF8F5] text-espresso flex items-center justify-center font-jakarta text-sm uppercase tracking-widest">
          Memuat Album Digital Difotoin...
        </div>
      }
    >
      <DigitalAlbumContent slug={params.studio_slug} />
    </Suspense>
  );
}
