'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Check,
  CheckCircle2,
  Edit3,
  Eye,
  Grid,
  Heart,
  LayoutGrid,
  Lock,
  MessageSquarePlus,
  Search,
  Send,
  Unlock,
  X,
  ZoomIn,
} from 'lucide-react';
import RetroTicker from '@/components/RetroTicker';
import StepPills from '@/components/StepPills';
import GiantFooter from '@/components/GiantFooter';
import { VintageCheckmarkStamp } from '@/components/RetroBadges';
import {
  fetchGalleryBySlug,
  fetchSelectionsForGallery,
  SEED_GALLERIES,
  togglePhotoSelection,
  updateGallerySettings,
  updateSelectionNote,
} from '@/lib/supabase';
import { DEMO_EDITORIAL_PHOTOS } from '@/lib/drive-utils';
import {
  DrivePhoto,
  GalleryRecord,
  SelectionRecord,
} from '@/types/difotoin';

interface ProofingPageProps {
  params: {
    studio_slug: string;
    slug: string;
  };
}

export default function ClientProofingWorkspacePage({
  params,
}: ProofingPageProps) {
  const { studio_slug, slug } = params;

  const [gallery, setGallery] = useState<GalleryRecord>(SEED_GALLERIES[0]);
  const [photos, setPhotos] = useState<DrivePhoto[]>(DEMO_EDITORIAL_PHOTOS);
  const [selections, setSelections] = useState<SelectionRecord[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(true);

  // Track detected natural orientation per photo ID ('portrait' | 'landscape' | 'square')
  const [detectedRatios, setDetectedRatios] = useState<
    Record<string, 'portrait' | 'landscape' | 'square'>
  >({});

  // Layout mode: 'masonry' (auto-arranges mixed portrait & landscape cleanly) or 'uniform'
  const [layoutMode, setLayoutMode] = useState<'masonry' | 'uniform'>(
    'masonry'
  );

  // Filter & Search States
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'selected' | 'unselected'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  // Note Modal State
  const [editingPhoto, setEditingPhoto] = useState<DrivePhoto | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Lightbox Modal State
  const [lightboxPhoto, setLightboxPhoto] = useState<DrivePhoto | null>(null);

  // Submit & Lock Confirmation Modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProofingSession() {
      setIsLoadingDrive(true);
      const foundGallery = await fetchGalleryBySlug(slug, studio_slug);
      const activeGal = foundGallery || {
        ...SEED_GALLERIES[0],
        studio_slug,
        slug,
      };

      if (!isMounted) return;
      setGallery(activeGal);

      const initialSelections = await fetchSelectionsForGallery(activeGal.id);
      if (isMounted) {
        setSelections(initialSelections);
      }

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
        // Fallback already initialized
      } finally {
        if (isMounted) setIsLoadingDrive(false);
      }
    }

    loadProofingSession();
    return () => {
      isMounted = false;
    };
  }, [slug, studio_slug]);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
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

  const selectionByPhotoId = useMemo(() => {
    const map = new Map<string, SelectionRecord>();
    selections.forEach((s) => map.set(s.photo_id, s));
    return map;
  }, [selections]);

  const selectedCount = selections.length;
  const quota = gallery.selection_quota || 50;
  const quotaPercentage = Math.min(
    100,
    Math.round((selectedCount / quota) * 100)
  );
  const remainingQuota = Math.max(0, quota - selectedCount);

  const filteredPhotos = useMemo(() => {
    return photos.filter((photo) => {
      const isSelected = selectionByPhotoId.has(photo.id);
      if (statusFilter === 'selected' && !isSelected) return false;
      if (statusFilter === 'unselected' && isSelected) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = photo.name.toLowerCase().includes(q);
        const matchCaption = photo.caption.toLowerCase().includes(q);
        return matchName || matchCaption;
      }
      return true;
    });
  }, [photos, selectionByPhotoId, statusFilter, searchQuery]);

  async function handleToggleSelect(photo: DrivePhoto) {
    if (gallery.is_locked) {
      showToast(
        'Pilihan galeri sudah dikunci. Klik "Buka Kunci" jika ingin mengubah.'
      );
      return;
    }

    const currentlySelected = selectionByPhotoId.has(photo.id);
    if (!currentlySelected && selectedCount >= quota) {
      showToast(`Kuota maksimal ${quota} foto telah tercapai!`);
      return;
    }

    const result = await togglePhotoSelection({
      galleryId: gallery.id,
      photoId: photo.id,
      filename: photo.name,
    });
    setSelections(result.selections);
    showToast(
      result.selected
        ? `${photo.name} dipilih (${result.selections.length}/${quota})`
        : `${photo.name} batal dipilih`
    );
  }

  function handleOpenNoteModal(photo: DrivePhoto) {
    const existing = selectionByPhotoId.get(photo.id);
    setEditingPhoto(photo);
    setNoteDraft(existing?.note || '');
    setActiveStep(2);
  }

  async function handleSaveNote(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPhoto) return;
    setIsSavingNote(true);
    try {
      const updated = await updateSelectionNote({
        galleryId: gallery.id,
        photoId: editingPhoto.id,
        filename: editingPhoto.name,
        note: noteDraft.trim(),
      });
      setSelections(updated);
      showToast(`Catatan untuk ${editingPhoto.name} disimpan.`);
      setEditingPhoto(null);
    } finally {
      setIsSavingNote(false);
    }
  }

  async function handleConfirmLockSelections() {
    setIsLocking(true);
    try {
      const updatedGal = await updateGallerySettings(
        gallery.id,
        gallery.owner_token,
        {
          is_locked: true,
        }
      );
      if (updatedGal) {
        setGallery(updatedGal);
      } else {
        setGallery((prev) => ({ ...prev, is_locked: true }));
      }
      setActiveStep(3);
      setIsSubmitModalOpen(false);
      showToast(
        `Pilihan (${selectedCount} foto) berhasil dikirim ke ${gallery.studio_name}!`
      );
    } finally {
      setIsLocking(false);
    }
  }

  async function handleUnlockGallery() {
    const updatedGal = await updateGallerySettings(
      gallery.id,
      gallery.owner_token,
      {
        is_locked: false,
      }
    );
    if (updatedGal) {
      setGallery(updatedGal);
    } else {
      setGallery((prev) => ({ ...prev, is_locked: false }));
    }
    showToast('Kunci dibuka kembali.');
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream text-espresso">
      {/* STICKY TOP BAR IN DEEP CRIMSON (#871F1B) */}
      <header className="sticky top-0 z-50 w-full bg-crimson border-b-[1.5px] border-espresso">
        <RetroTicker
          text="DIFOTOIN ★ PILIH FOTO FAVORITMU ★ ABADIKAN SETIAP MOMEN ★"
          variant="cream"
        />

        <div className="max-w-7xl mx-auto px-4 md:px-10 h-16 flex items-center justify-between gap-3">
          {/* Left: DIFOTOIN Logo & Studio Name */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="font-anton text-2xl md:text-3xl text-cream tracking-wider uppercase hover:text-mustard transition-colors shrink-0"
            >
              DIFOTOIN
            </Link>
            <span className="hidden sm:inline-block bg-cream/15 text-cream font-jakarta font-semibold text-xs px-2.5 py-1 rounded border border-cream/25">
              {gallery.studio_name || 'Zeevisual'}
            </span>
          </div>

          {/* Center: Client Name */}
          <div className="hidden lg:flex items-center gap-2 text-cream">
            <span className="font-fraunces font-bold text-base">
              {gallery.client_name}
            </span>
            <span className="text-cream/50">•</span>
            <span className="font-jakarta text-xs text-cream/80">
              {gallery.session_type}
            </span>
          </div>

          {/* Right: Live Selection Counter Pill & Mustard "Kirim Pilihan" Button */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="inline-flex items-center gap-2 bg-white text-espresso font-anton text-xs md:text-sm px-3.5 py-1.5 rounded-full border-[1.5px] border-espresso">
              <Heart className="w-3.5 h-3.5 text-crimson fill-crimson" />
              <span>
                {selectedCount} / {quota}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveStep(3);
                setIsSubmitModalOpen(true);
              }}
              className="inline-flex items-center gap-2 bg-mustard hover:bg-mustard-light text-espresso font-anton text-xs md:text-sm uppercase tracking-wider px-4 py-1.5 rounded-lg border-[1.5px] border-espresso shadow-retro-sm transition-all"
            >
              <span>Kirim Pilihan</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Clean Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 right-4 md:right-8 z-50 bg-espresso text-cream px-4 py-2.5 rounded-xl border border-cream/20 shadow-retro flex items-center gap-2 font-jakarta text-xs md:text-sm font-semibold">
          <CheckCircle2 className="w-4 h-4 text-mustard shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MAIN WORKSPACE */}
      <main className="flex-1 w-full">
        {/* Clean Editorial Client Header & StepPills */}
        <section className="w-full px-4 md:px-10 pt-6 pb-4">
          <div className="max-w-7xl mx-auto flex flex-col gap-5">
            <div className="bg-white rounded-2xl p-6 md:p-8 border-[1.5px] border-espresso shadow-retro">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex flex-col gap-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-jakarta font-semibold text-espresso-muted">
                    <span className="bg-cream text-espresso px-2.5 py-0.5 rounded border border-espresso font-bold">
                      {gallery.order_code}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Batas Seleksi: {gallery.deadline_date}
                    </span>
                  </div>

                  <h1 className="font-fraunces font-black text-3xl md:text-4xl text-espresso tracking-tight leading-none mt-1">
                    {gallery.client_name}
                  </h1>

                  <p className="font-jakarta text-sm text-espresso-muted leading-relaxed">
                    Silakan pilih{' '}
                    <strong className="text-espresso">
                      {quota} foto favorit
                    </strong>{' '}
                    dari sesi bersama{' '}
                    <strong className="text-espresso">
                      {gallery.studio_name}
                    </strong>
                    . Foto portrait maupun landscape otomatis tersusun rapi
                    sesuai ukuran aslinya.
                  </p>
                </div>

                {/* Clean Quota Progress Box */}
                <div className="bg-cream/60 rounded-xl p-4 md:p-5 border-[1.5px] border-espresso min-w-[280px] flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-jakarta font-bold text-xs uppercase text-espresso-muted">
                      Kuota Pilihan
                    </span>
                    <span className="font-anton text-base text-espresso">
                      {selectedCount} / {quota} Foto
                    </span>
                  </div>

                  <div className="w-full bg-white h-3 rounded-full overflow-hidden border border-espresso">
                    <div
                      className="bg-mustard h-full transition-all duration-300"
                      style={{ width: `${quotaPercentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between font-jakarta text-xs text-espresso-muted">
                    <span>Terpilih {quotaPercentage}%</span>
                    <span className="font-semibold text-espresso">
                      {remainingQuota > 0
                        ? `Sisa ${remainingQuota} foto`
                        : 'Kuota penuh'}
                    </span>
                  </div>

                  {gallery.is_locked ? (
                    <div className="mt-1 flex items-center justify-between gap-2 bg-espresso text-cream px-3 py-2 rounded-lg">
                      <div className="flex items-center gap-1.5 font-jakarta font-bold text-xs">
                        <Lock className="w-3.5 h-3.5 text-mustard" />
                        <span>Pilihan Terkunci</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleUnlockGallery}
                        className="inline-flex items-center gap-1 bg-cream text-espresso px-2.5 py-0.5 rounded font-jakarta font-bold text-[11px] hover:bg-mustard"
                      >
                        <Unlock className="w-3 h-3" />
                        Ubah
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsSubmitModalOpen(true)}
                      className="mt-1 w-full inline-flex items-center justify-center gap-2 bg-espresso hover:bg-crimson text-cream font-anton text-xs uppercase tracking-wider py-2.5 px-4 rounded-lg transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4 text-mustard" />
                      <span>Kirim &amp; Kunci Pilihan</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Clean <StepPills /> */}
            <StepPills
              activeStep={activeStep}
              showCards={false}
              onSelectStep={(s) => {
                setActiveStep(s);
                if (s === 3) setIsSubmitModalOpen(true);
              }}
            />
          </div>
        </section>

        {/* CLEAN FILTER PILLS, SEARCH & LAYOUT SWITCHER BAR */}
        <section className="sticky top-[94px] z-40 bg-cream/95 backdrop-blur-md border-y-[1.5px] border-espresso py-3 px-4 md:px-10">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Left Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`shrink-0 font-jakarta font-bold text-xs px-4 py-1.5 rounded-full border-[1.5px] border-espresso transition-all ${
                  statusFilter === 'all'
                    ? 'bg-espresso text-cream'
                    : 'bg-white text-espresso hover:bg-cream-light'
                }`}
              >
                Semua Foto ({photos.length})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('selected')}
                className={`shrink-0 font-jakarta font-bold text-xs px-4 py-1.5 rounded-full border-[1.5px] border-espresso transition-all inline-flex items-center gap-1.5 ${
                  statusFilter === 'selected'
                    ? 'bg-mustard text-espresso shadow-retro-sm'
                    : 'bg-white text-espresso hover:bg-cream-light'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Sudah Dipilih ({selectedCount})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('unselected')}
                className={`shrink-0 font-jakarta font-bold text-xs px-4 py-1.5 rounded-full border-[1.5px] border-espresso transition-all ${
                  statusFilter === 'unselected'
                    ? 'bg-espresso text-cream'
                    : 'bg-white text-espresso hover:bg-cream-light'
                }`}
              >
                Belum Dipilih ({Math.max(0, photos.length - selectedCount)})
              </button>
            </div>

            {/* Right: Search Input, Masonry/Grid Switcher & Album Link */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-4 h-4 text-espresso-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama file..."
                  className="w-full bg-white border-[1.5px] border-espresso rounded-lg pl-9 pr-7 py-1.5 font-jakarta text-xs font-medium text-espresso placeholder:text-espresso-muted/60 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-espresso-muted hover:text-espresso"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Layout Switcher: Auto-Masonry (Portrait + Landscape) vs Uniform */}
              <div className="flex items-center bg-white rounded-lg border-[1.5px] border-espresso overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={() => setLayoutMode('masonry')}
                  title="Susunan Proporsi Asli (Portrait & Landscape Rapi)"
                  className={`px-2.5 py-1.5 flex items-center gap-1 font-jakarta font-bold text-xs transition-colors ${
                    layoutMode === 'masonry'
                      ? 'bg-espresso text-cream'
                      : 'text-espresso hover:bg-cream'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Auto Rapi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('uniform')}
                  title="Grid Seragam"
                  className={`px-2.5 py-1.5 flex items-center gap-1 font-jakarta font-bold text-xs transition-colors ${
                    layoutMode === 'uniform'
                      ? 'bg-espresso text-cream'
                      : 'text-espresso hover:bg-cream'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Grid</span>
                </button>
              </div>

              <Link
                href={`/${gallery.slug}?t=${gallery.owner_token}`}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-mustard text-espresso border-[1.5px] border-espresso font-jakarta font-bold text-xs transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Album</span>
              </Link>
            </div>
          </div>
        </section>

        {/* MIXED PORTRAIT & LANDSCAPE PHOTO GRID */}
        <section className="w-full px-4 md:px-10 py-8">
          <div className="max-w-7xl mx-auto">
            {isLoadingDrive ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="aspect-[4/5] rounded-xl bg-white border-[1.5px] border-espresso animate-pulse"
                  />
                ))}
              </div>
            ) : filteredPhotos.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border-[1.5px] border-espresso text-center flex flex-col items-center gap-3">
                <h3 className="font-fraunces font-bold text-xl text-espresso">
                  Tidak Ada Foto yang Ditemukan
                </h3>
                <p className="font-jakarta text-sm text-espresso-muted max-w-md">
                  Coba ubah filter atau hapus kata kunci pencarian nama file.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('all');
                    setSearchQuery('');
                  }}
                  className="mt-1 px-4 py-2 rounded-lg bg-mustard text-espresso border-[1.5px] border-espresso font-jakarta font-bold text-xs"
                >
                  Tampilkan Semua Foto
                </button>
              </div>
            ) : (
              <div
                className={
                  layoutMode === 'masonry'
                    ? 'columns-2 md:columns-3 xl:columns-4 gap-4 md:gap-5 space-y-4 md:space-y-5'
                    : 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 items-start'
                }
              >
                {filteredPhotos.map((photo) => {
                  const sel = selectionByPhotoId.get(photo.id);
                  const isSelected = Boolean(sel);
                  const orientation =
                    detectedRatios[photo.id] ||
                    photo.aspectRatio ||
                    'portrait';

                  const aspectClass =
                    layoutMode === 'uniform'
                      ? 'aspect-[4/5]'
                      : orientation === 'landscape'
                        ? 'aspect-[4/3]'
                        : orientation === 'square'
                          ? 'aspect-square'
                          : 'aspect-[3/4]';

                  return (
                    <article
                      key={photo.id}
                      className={`break-inside-avoid flex flex-col rounded-xl overflow-hidden bg-white transition-all duration-200 ${
                        isSelected
                          ? 'border-4 border-mustard shadow-retro ring-[1.5px] ring-espresso'
                          : 'border-[1.5px] border-espresso hover:shadow-retro-sm'
                      }`}
                    >
                      {/* Photo Container adapting to Portrait or Landscape */}
                      <div
                        className={`relative w-full ${aspectClass} bg-cream overflow-hidden group`}
                      >
                        <img
                          src={photo.thumbnailUrl}
                          alt={photo.caption}
                          loading="lazy"
                          onLoad={(e) => handleImageLoad(photo.id, e)}
                          onClick={() => handleToggleSelect(photo)}
                          className="w-full h-full object-cover cursor-pointer transition-transform duration-500 group-hover:scale-[1.03]"
                        />

                        {/* Optional Subtle Watermark */}
                        {gallery.watermark_enabled && (
                          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-15 select-none">
                            <span className="font-anton text-base uppercase tracking-[0.25em] text-cream -rotate-12">
                              ZEEVISUAL
                            </span>
                          </div>
                        )}

                        {/* Top-Left Vintage Circular Checkmark Stamp when Selected */}
                        {isSelected && (
                          <div className="absolute top-2.5 left-2.5 z-10">
                            <VintageCheckmarkStamp
                              orderNumber={sel?.selected_order}
                            />
                          </div>
                        )}

                        {/* Top-Right Heart / Select Button & Zoom Button */}
                        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setLightboxPhoto(photo)}
                            title="Perbesar Foto"
                            className="w-8 h-8 rounded-full bg-white/90 text-espresso border border-espresso flex items-center justify-center hover:bg-mustard transition-colors"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleSelect(photo)}
                            title={
                              isSelected ? 'Batalkan Pilihan' : 'Pilih Foto Ini'
                            }
                            className={`w-8 h-8 rounded-full border border-espresso flex items-center justify-center transition-transform hover:scale-105 ${
                              isSelected
                                ? 'bg-mustard text-espresso'
                                : 'bg-white/90 text-espresso hover:bg-mustard'
                            }`}
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                isSelected
                                  ? 'fill-crimson text-crimson'
                                  : 'text-espresso'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Clean Card Footer */}
                      <div className="p-2.5 bg-white flex flex-col gap-2 border-t border-espresso/15">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono font-bold text-xs text-espresso truncate">
                            {photo.name}
                          </span>
                          <span className="font-jakarta text-[10px] text-espresso-muted uppercase px-1.5 py-0.5 rounded bg-cream">
                            {orientation === 'landscape'
                              ? 'Landscape'
                              : 'Portrait'}
                          </span>
                        </div>

                        {isSelected ? (
                          <>
                            {sel?.note ? (
                              <div
                                onClick={() => handleOpenNoteModal(photo)}
                                className="bg-cream/60 border border-espresso/20 rounded-lg p-2 flex items-start gap-1.5 cursor-pointer hover:border-espresso"
                              >
                                <Edit3 className="w-3 h-3 text-espresso mt-0.5 shrink-0" />
                                <p className="font-jakarta text-[11px] text-espresso italic line-clamp-2 leading-snug">
                                  “{sel.note}”
                                </p>
                              </div>
                            ) : null}

                            <button
                              type="button"
                              onClick={() => handleOpenNoteModal(photo)}
                              className="w-full flex items-center justify-center gap-1.5 font-jakarta font-bold text-xs py-1.5 px-2 rounded-lg bg-cream hover:bg-mustard text-espresso border border-espresso transition-colors"
                            >
                              <MessageSquarePlus className="w-3.5 h-3.5" />
                              <span>
                                {sel?.note ? 'Ubah Catatan' : '+ Catatan'}
                              </span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleSelect(photo)}
                            className="w-full flex items-center justify-center gap-1 font-jakarta font-bold text-xs py-1.5 rounded-lg bg-cream/60 hover:bg-mustard text-espresso border border-espresso/40 hover:border-espresso transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Pilih Foto</span>
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* STICKY FLOATING BOTTOM PROOFING SUMMARY BAR */}
        <div className="sticky bottom-4 z-40 px-4 md:px-10 max-w-3xl mx-auto w-full pointer-events-none">
          <div className="pointer-events-auto bg-espresso text-cream rounded-2xl p-3.5 px-5 border-[1.5px] border-espresso shadow-retro-lg flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-mustard text-espresso flex items-center justify-center shrink-0 font-anton text-base">
                {selectedCount}
              </div>
              <div>
                <div className="font-anton text-sm md:text-base text-cream tracking-wider uppercase leading-tight">
                  {selectedCount} DARI {quota} FOTO DIPILIH
                </div>
                <div className="font-jakarta text-xs text-cream/75">
                  {gallery.is_locked
                    ? 'Pilihan telah dikunci.'
                    : `Tersisa kuota ${remainingQuota} foto lagi.`}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() =>
                  setStatusFilter(
                    statusFilter === 'selected' ? 'all' : 'selected'
                  )
                }
                className="flex-1 sm:flex-none font-jakarta font-bold text-xs px-3.5 py-2 rounded-xl bg-white text-espresso hover:bg-cream transition-colors"
              >
                {statusFilter === 'selected'
                  ? 'Lihat Semua'
                  : `Lihat Terpilih (${selectedCount})`}
              </button>

              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(true)}
                className="flex-1 sm:flex-none font-anton text-xs uppercase tracking-wider px-4 py-2 rounded-xl bg-mustard text-espresso hover:bg-mustard-light transition-all inline-flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Pilihan</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL 1: COMMENT / REVISION NOTE MODAL */}
      {editingPhoto && (
        <div className="fixed inset-0 z-50 bg-espresso/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border-[1.5px] border-espresso shadow-retro-xl overflow-hidden">
            <div className="bg-espresso text-cream px-5 py-3.5 flex items-center justify-between">
              <span className="font-anton text-sm uppercase tracking-wider">
                Catatan Revisi • {editingPhoto.name}
              </span>
              <button
                type="button"
                onClick={() => setEditingPhoto(null)}
                className="w-7 h-7 rounded-full bg-white text-espresso flex items-center justify-center hover:bg-mustard"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="p-5 flex flex-col gap-4">
              <div className="flex items-center gap-3.5 bg-cream/60 p-3 rounded-xl border border-espresso/20">
                <img
                  src={editingPhoto.thumbnailUrl}
                  alt={editingPhoto.name}
                  className="w-16 h-16 object-cover rounded-lg border border-espresso shrink-0"
                />
                <div className="flex flex-col">
                  <span className="font-mono font-bold text-sm text-espresso">
                    {editingPhoto.name}
                  </span>
                  <span className="font-jakarta text-xs text-espresso-muted">
                    {editingPhoto.caption}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-jakarta font-bold text-xs uppercase text-espresso">
                  Catatan untuk Fotografer ({gallery.studio_name})
                </label>
                <textarea
                  rows={4}
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Tulis catatan edit (misal: cerahkan sedikit, jadikan hitam putih, atau kandidat foto sampul)..."
                  className="w-full bg-white text-espresso p-3.5 rounded-xl border-[1.5px] border-espresso font-jakarta text-sm focus:outline-none focus:ring-2 focus:ring-mustard"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingPhoto(null)}
                  className="px-4 py-2 rounded-xl bg-cream text-espresso border border-espresso font-jakarta font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingNote}
                  className="px-5 py-2 rounded-xl bg-mustard text-espresso border-[1.5px] border-espresso font-jakarta font-bold text-xs hover:bg-mustard-light"
                >
                  {isSavingNote ? 'Menyimpan...' : 'Simpan Catatan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: LIGHTBOX PREVIEW */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-50 bg-espresso/90 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white max-w-3xl w-full rounded-2xl border-[1.5px] border-espresso shadow-retro-xl overflow-hidden flex flex-col"
          >
            <div className="bg-espresso text-cream px-5 py-3 flex items-center justify-between">
              <span className="font-mono font-bold text-sm text-cream">
                {lightboxPhoto.name}
              </span>
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                className="w-8 h-8 rounded-full bg-white text-espresso flex items-center justify-center hover:bg-mustard"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative bg-espresso max-h-[72vh] flex items-center justify-center overflow-hidden">
              <img
                src={lightboxPhoto.fullResUrl}
                alt={lightboxPhoto.caption}
                className="max-h-[72vh] w-auto object-contain"
              />
            </div>

            <div className="p-4 bg-white flex flex-wrap items-center justify-between gap-3 border-t border-espresso/20">
              <span className="font-jakarta text-xs text-espresso-muted">
                {lightboxPhoto.caption}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = lightboxPhoto;
                    setLightboxPhoto(null);
                    handleOpenNoteModal(target);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-cream text-espresso border border-espresso font-jakarta font-bold text-xs"
                >
                  + Catatan
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleSelect(lightboxPhoto)}
                  className={`px-4 py-2 rounded-xl border border-espresso font-jakarta font-bold text-xs ${
                    selectionByPhotoId.has(lightboxPhoto.id)
                      ? 'bg-espresso text-cream'
                      : 'bg-mustard text-espresso'
                  }`}
                >
                  {selectionByPhotoId.has(lightboxPhoto.id)
                    ? '✓ Terpilih (Klik Batal)'
                    : '+ Pilih Foto Ini'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: FINAL SUBMIT & LOCK SELECTIONS */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 bg-espresso/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border-[1.5px] border-espresso shadow-retro-xl overflow-hidden">
            <div className="bg-espresso text-cream px-5 py-3.5 flex items-center justify-between">
              <span className="font-anton text-sm uppercase tracking-wider">
                Kirim &amp; Kunci Pilihan Foto
              </span>
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white text-espresso flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between bg-cream p-4 rounded-xl border border-espresso">
                <div>
                  <span className="font-jakarta font-bold text-xs uppercase text-espresso-muted">
                    Total Foto Dipilih
                  </span>
                  <h3 className="font-fraunces font-bold text-lg text-espresso">
                    {gallery.client_name}
                  </h3>
                </div>
                <div className="bg-mustard text-espresso px-3.5 py-1 rounded-full border border-espresso font-anton text-base">
                  {selectedCount} / {quota}
                </div>
              </div>

              <p className="font-jakarta text-sm text-espresso-muted leading-relaxed">
                Daftar{' '}
                <strong className="text-espresso">
                  {selectedCount} foto terpilih
                </strong>{' '}
                akan dikunci dan dikirim ke{' '}
                <strong className="text-espresso">{gallery.studio_name}</strong>{' '}
                untuk proses editing.
              </p>

              <div className="bg-cream/50 p-3 rounded-xl border border-espresso/20 font-mono text-xs text-espresso max-h-28 overflow-y-auto">
                {selections.length > 0
                  ? selections.map((s) => s.filename).join(', ')
                  : 'Belum ada foto yang dipilih.'}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
                <Link
                  href={`/${gallery.slug}?t=${gallery.owner_token}`}
                  className="w-full sm:w-auto text-center px-4 py-2.5 rounded-xl bg-cream text-espresso border border-espresso font-jakarta font-bold text-xs"
                >
                  Lihat Album Digital
                </Link>
                <button
                  type="button"
                  onClick={handleConfirmLockSelections}
                  disabled={isLocking || selectedCount === 0}
                  className="w-full sm:flex-1 py-2.5 px-5 rounded-xl bg-mustard hover:bg-mustard-light text-espresso border-[1.5px] border-espresso font-anton text-sm uppercase tracking-wider disabled:opacity-50"
                >
                  {isLocking
                    ? 'Mengirim...'
                    : 'Konfirmasi & Kunci Pilihan'}
                </button>
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
