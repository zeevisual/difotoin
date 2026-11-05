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
import GiantFooter from '@/components/GiantFooter';
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

  // Layout mode: 'masonry' (natural aspect ratio, portrait & landscape) or 'uniform'
  const [layoutMode, setLayoutMode] = useState<'masonry' | 'uniform'>(
    'masonry'
  );

  // Filter & Search States
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'selected' | 'unselected'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Note Modal State
  const [editingPhoto, setEditingPhoto] = useState<DrivePhoto | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Lightbox Modal State
  const [lightboxPhoto, setLightboxPhoto] = useState<DrivePhoto | null>(null);

  // Submit & Lock Confirmation Modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [copiedClientList, setCopiedClientList] = useState(false);
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

  // Neatly sorted selections by filename (natural numeric order)
  const sortedSelections = useMemo(() => {
    return selections
      .slice()
      .sort((a, b) =>
        a.filename.localeCompare(b.filename, undefined, {
          numeric: true,
          sensitivity: 'base',
        })
      );
  }, [selections]);

  // Neatly formatted Lightroom comma-separated string (without extension)
  const sortedLightroomNames = useMemo(() => {
    return sortedSelections
      .map((s) => s.filename.replace(/\.[a-zA-Z0-9]+$/, ''))
      .join(', ');
  }, [sortedSelections]);

  // Complete structured WhatsApp message from Client -> Photographer
  const clientToStudioWaMessage = useMemo(() => {
    const numberedFiles = sortedSelections
      .map(
        (s, idx) =>
          `${idx + 1}. ${s.filename}${s.note?.trim() ? ` — (${s.note.trim()})` : ''}`
      )
      .join('\n');

    return `Halo *${gallery.studio_name || 'Zeevisual'}*!
Saya *${gallery.client_name}* sudah selesai memilih *${selectedCount} / ${quota} foto* di Difotoin.

*DAFTAR FILE TERPILIH (TERSUSUN RAPI):*
${numberedFiles || '-'}

*FORMAT FILTER LIGHTROOM:*
${sortedLightroomNames || '-'}

Terima kasih!`;
  }, [
    gallery.studio_name,
    gallery.client_name,
    selectedCount,
    quota,
    sortedSelections,
    sortedLightroomNames,
  ]);

  const studioWaUrl = useMemo(() => {
    const cleanPhone = (gallery.studio_whatsapp || '')
      .replace(/\D/g, '')
      .replace(/^0/, '62');
    const encoded = encodeURIComponent(clientToStudioWaMessage);
    return cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
  }, [gallery.studio_whatsapp, clientToStudioWaMessage]);

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
        'Pilihan galeri sudah dikunci. Klik "Ubah" jika ingin membuka kunci.'
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

  async function handleConfirmLockSelections(sendToWhatsapp = true) {
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
      setIsSubmitModalOpen(false);
      showToast(
        `Pilihan (${selectedCount} foto) berhasil dikunci & siap dikirim ke WhatsApp ${gallery.studio_name}!`
      );
      if (sendToWhatsapp && typeof window !== 'undefined') {
        window.open(studioWaUrl, '_blank', 'noopener,noreferrer');
      }
    } finally {
      setIsLocking(false);
    }
  }

  async function handleCopySortedFilenames() {
    await navigator.clipboard.writeText(clientToStudioWaMessage);
    setCopiedClientList(true);
    setTimeout(() => setCopiedClientList(false), 2400);
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
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-espresso">
      {/* CLEAN STICKY TOP HEADER */}
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-espresso/15">
        <div className="max-w-7xl mx-auto px-4 md:px-10 h-16 flex items-center justify-between gap-3">
          {/* Left: DIFOTOIN Logo & Studio Name */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="font-anton text-2xl text-espresso tracking-wider uppercase hover:text-crimson transition-colors shrink-0"
            >
              DIFOTOIN
            </Link>
            <span className="text-espresso/25">|</span>
            <span className="font-jakarta font-semibold text-xs text-espresso-muted uppercase tracking-wider truncate">
              {gallery.studio_name || 'Zeevisual'}
            </span>
          </div>

          {/* Center: Client Name */}
          <div className="hidden lg:flex items-center gap-2 text-espresso">
            <span className="font-fraunces font-bold text-base">
              {gallery.client_name}
            </span>
            <span className="text-espresso/30">•</span>
            <span className="font-jakarta text-xs text-espresso-muted">
              {gallery.session_type}
            </span>
          </div>

          {/* Right: Live Selection Counter & Send Button */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="inline-flex items-center gap-2 bg-[#FAF8F5] text-espresso font-jakarta font-bold text-xs px-3.5 py-2 border border-espresso/20">
              <Heart className="w-3.5 h-3.5 text-crimson fill-crimson" />
              <span>
                {selectedCount} / {quota}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(true)}
              className="inline-flex items-center gap-2 bg-espresso hover:bg-crimson text-cream font-jakarta font-bold text-xs uppercase tracking-wider px-4 py-2 transition-all"
            >
              <span>Kirim Pilihan</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Clean Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 right-4 md:right-8 z-50 bg-espresso text-cream px-4 py-2.5 shadow-lg flex items-center gap-2 font-jakarta text-xs md:text-sm font-semibold">
          <CheckCircle2 className="w-4 h-4 text-mustard shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MAIN WORKSPACE */}
      <main className="flex-1 w-full">
        {/* Clean Minimal Client Header */}
        <section className="w-full px-4 md:px-10 pt-8 pb-6 bg-white border-b border-espresso/10">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex flex-col gap-1.5 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 text-xs font-jakarta text-espresso-muted">
                <span className="font-mono font-bold text-espresso">
                  {gallery.order_code}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Batas Seleksi: {gallery.deadline_date}
                </span>
              </div>

              <h1 className="font-fraunces font-bold text-3xl md:text-4xl text-espresso tracking-tight leading-tight mt-0.5">
                {gallery.client_name}
              </h1>

              <p className="font-jakarta text-sm text-espresso-muted leading-relaxed">
                Silakan pilih{' '}
                <strong className="text-espresso">
                  {quota} foto favorit
                </strong>{' '}
                untuk diedit oleh{' '}
                <strong className="text-espresso">
                  {gallery.studio_name}
                </strong>
                . Setelah selesai, klik tombol{' '}
                <strong className="text-espresso">Kirim Pilihan</strong> untuk
                mengirim daftar nama file ke WhatsApp fotografer.
              </p>
            </div>

            {/* Clean Quota Progress Box */}
            <div className="bg-[#FAF8F5] p-4 md:p-5 border border-espresso/15 min-w-[270px] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-jakarta font-semibold text-xs uppercase tracking-wider text-espresso-muted">
                  Progres Pilihan
                </span>
                <span className="font-jakarta font-bold text-sm text-espresso">
                  {selectedCount} / {quota} Foto
                </span>
              </div>

              <div className="w-full bg-white h-2 overflow-hidden border border-espresso/15">
                <div
                  className="bg-espresso h-full transition-all duration-300"
                  style={{ width: `${quotaPercentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between font-jakarta text-xs text-espresso-muted">
                <span>Terpilih {quotaPercentage}%</span>
                <span>
                  {remainingQuota > 0
                    ? `Sisa ${remainingQuota} foto`
                    : 'Kuota penuh'}
                </span>
              </div>

              {gallery.is_locked ? (
                <div className="mt-1 flex items-center justify-between gap-2 bg-espresso text-cream px-3 py-2">
                  <div className="flex items-center gap-1.5 font-jakarta font-semibold text-xs">
                    <Lock className="w-3.5 h-3.5 text-mustard" />
                    <span>Terkunci</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={studioWaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-mustard text-espresso px-2 py-0.5 font-jakarta font-bold text-[11px]"
                    >
                      Kirim WA
                    </a>
                    <button
                      type="button"
                      onClick={handleUnlockGallery}
                      className="inline-flex items-center gap-1 bg-white/15 text-cream px-2 py-0.5 font-jakarta font-semibold text-[11px] hover:bg-white/25"
                    >
                      <Unlock className="w-3 h-3" />
                      Ubah
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="mt-1 w-full inline-flex items-center justify-center gap-2 bg-mustard hover:bg-mustard-light text-espresso font-jakarta font-bold text-xs uppercase tracking-wider py-2.5 px-4 border border-espresso/20 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Selesai &amp; Kirim ke WA</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* CLEAN FILTER, SEARCH & LAYOUT BAR */}
        <section className="sticky top-16 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-espresso/15 py-3 px-4 md:px-10">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Left Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`shrink-0 font-jakarta font-semibold text-xs px-3.5 py-1.5 border transition-all ${
                  statusFilter === 'all'
                    ? 'bg-espresso text-cream border-espresso'
                    : 'bg-white text-espresso border-espresso/15 hover:border-espresso/40'
                }`}
              >
                Semua ({photos.length})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('selected')}
                className={`shrink-0 font-jakarta font-semibold text-xs px-3.5 py-1.5 border transition-all inline-flex items-center gap-1.5 ${
                  statusFilter === 'selected'
                    ? 'bg-mustard text-espresso border-espresso'
                    : 'bg-white text-espresso border-espresso/15 hover:border-espresso/40'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Dipilih ({selectedCount})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('unselected')}
                className={`shrink-0 font-jakarta font-semibold text-xs px-3.5 py-1.5 border transition-all ${
                  statusFilter === 'unselected'
                    ? 'bg-espresso text-cream border-espresso'
                    : 'bg-white text-espresso border-espresso/15 hover:border-espresso/40'
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
                  className="w-full bg-white border border-espresso/20 pl-9 pr-7 py-1.5 font-jakarta text-xs text-espresso placeholder:text-espresso-muted/60 focus:outline-none focus:border-espresso"
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

              <div className="flex items-center bg-white border border-espresso/20 overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={() => setLayoutMode('masonry')}
                  title="Proporsi Asli (Portrait & Landscape)"
                  className={`px-2.5 py-1.5 flex items-center gap-1 font-jakarta font-semibold text-xs transition-colors ${
                    layoutMode === 'masonry'
                      ? 'bg-espresso text-cream'
                      : 'text-espresso hover:bg-cream'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Proporsi Asli</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('uniform')}
                  title="Grid Seragam"
                  className={`px-2.5 py-1.5 flex items-center gap-1 font-jakarta font-semibold text-xs transition-colors ${
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
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-cream text-espresso border border-espresso/20 font-jakarta font-semibold text-xs transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Album</span>
              </Link>
            </div>
          </div>
        </section>

        {/* SHARP, CLEAN PHOTO GRID (ZERO ROUNDED CORNERS) */}
        <section className="w-full px-4 md:px-10 py-8">
          <div className="max-w-7xl mx-auto">
            {isLoadingDrive ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="aspect-[4/5] bg-white border border-espresso/10 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredPhotos.length === 0 ? (
              <div className="bg-white p-12 border border-espresso/15 text-center flex flex-col items-center gap-3">
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
                  className="mt-1 px-4 py-2 bg-espresso text-cream font-jakarta font-semibold text-xs"
                >
                  Tampilkan Semua Foto
                </button>
              </div>
            ) : (
              <div
                className={
                  layoutMode === 'masonry'
                    ? 'columns-2 md:columns-3 xl:columns-4 gap-5 space-y-5'
                    : 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 items-start'
                }
              >
                {filteredPhotos.map((photo) => {
                  const sel = selectionByPhotoId.get(photo.id);
                  const isSelected = Boolean(sel);

                  return (
                    <article
                      key={photo.id}
                      className={`break-inside-avoid flex flex-col rounded-none bg-white transition-all duration-150 ${
                        isSelected
                          ? 'ring-2 ring-mustard border-2 border-mustard shadow-sm'
                          : 'border border-espresso/15 hover:border-espresso/40'
                      }`}
                    >
                      {/* Sharp 90-degree Photo Container — No Rounded Corners */}
                      <div
                        className={`relative w-full overflow-hidden rounded-none bg-[#F3EFE6] group ${
                          layoutMode === 'uniform' ? 'aspect-[4/5]' : ''
                        }`}
                      >
                        <img
                          src={photo.thumbnailUrl}
                          alt={photo.caption}
                          loading="lazy"
                          onError={(e) => handleImageError(photo.id, e)}
                          onClick={() => handleToggleSelect(photo)}
                          className={`w-full rounded-none cursor-pointer transition-opacity duration-300 group-hover:opacity-95 ${
                            layoutMode === 'uniform'
                              ? 'h-full object-cover'
                              : 'h-auto block'
                          }`}
                        />

                        {/* Optional Subtle Watermark */}
                        {gallery.watermark_enabled && (
                          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-15 select-none">
                            <span className="font-anton text-sm uppercase tracking-[0.25em] text-cream -rotate-12">
                              {gallery.studio_name}
                            </span>
                          </div>
                        )}

                        {/* Top-Left Clean Selection Badge when Selected */}
                        {isSelected && (
                          <div className="absolute top-2.5 left-2.5 z-10 bg-mustard text-espresso font-jakarta font-bold text-[11px] px-2 py-0.5 flex items-center gap-1 shadow-sm">
                            <Check className="w-3 h-3 stroke-[2.5]" />
                            <span>#{sel?.selected_order}</span>
                          </div>
                        )}

                        {/* Top-Right Zoom & Select Buttons */}
                        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setLightboxPhoto(photo)}
                            title="Perbesar Foto"
                            className="w-8 h-8 bg-white/90 text-espresso flex items-center justify-center hover:bg-white transition-colors shadow-sm"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleSelect(photo)}
                            title={
                              isSelected ? 'Batalkan Pilihan' : 'Pilih Foto Ini'
                            }
                            className={`w-8 h-8 flex items-center justify-center transition-colors shadow-sm ${
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

                      {/* Clean Minimal Card Footer */}
                      <div className="px-3 py-2 bg-white flex flex-col gap-1.5 border-t border-espresso/10">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11px] text-espresso truncate">
                            {photo.name}
                          </span>

                          {isSelected ? (
                            <button
                              type="button"
                              onClick={() => handleOpenNoteModal(photo)}
                              className="shrink-0 inline-flex items-center gap-1 font-jakarta font-semibold text-[11px] text-crimson hover:underline"
                            >
                              <MessageSquarePlus className="w-3 h-3" />
                              <span>
                                {sel?.note ? 'Edit Catatan' : '+ Catatan'}
                              </span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleSelect(photo)}
                              className="shrink-0 font-jakarta font-semibold text-[11px] text-espresso-muted hover:text-espresso"
                            >
                              + Pilih
                            </button>
                          )}
                        </div>

                        {isSelected && sel?.note && (
                          <div
                            onClick={() => handleOpenNoteModal(photo)}
                            className="bg-[#FAF8F5] px-2 py-1 border border-espresso/10 flex items-start gap-1.5 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3 text-espresso-muted mt-0.5 shrink-0" />
                            <p className="font-jakarta text-[11px] text-espresso italic line-clamp-2 leading-snug">
                              “{sel.note}”
                            </p>
                          </div>
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
          <div className="pointer-events-auto bg-espresso text-cream p-3.5 px-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-mustard text-espresso flex items-center justify-center shrink-0 font-anton text-base">
                {selectedCount}
              </div>
              <div>
                <div className="font-jakarta font-bold text-xs md:text-sm text-cream uppercase tracking-wider leading-tight">
                  {selectedCount} dari {quota} Foto Dipilih
                </div>
                <div className="font-jakarta text-xs text-cream/70">
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
                className="flex-1 sm:flex-none font-jakarta font-semibold text-xs px-3.5 py-2 bg-white/10 text-cream hover:bg-white/20 transition-colors"
              >
                {statusFilter === 'selected'
                  ? 'Lihat Semua'
                  : `Lihat Terpilih (${selectedCount})`}
              </button>

              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(true)}
                className="flex-1 sm:flex-none font-jakarta font-bold text-xs uppercase tracking-wider px-4 py-2 bg-mustard text-espresso hover:bg-mustard-light transition-all inline-flex items-center justify-center gap-1.5"
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
          <div className="bg-white w-full max-w-lg border border-espresso/20 shadow-xl overflow-hidden">
            <div className="bg-espresso text-cream px-5 py-3.5 flex items-center justify-between">
              <span className="font-jakarta font-bold text-xs uppercase tracking-wider">
                Catatan Revisi • {editingPhoto.name}
              </span>
              <button
                type="button"
                onClick={() => setEditingPhoto(null)}
                className="w-7 h-7 bg-white/10 text-cream flex items-center justify-center hover:bg-white hover:text-espresso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="p-5 flex flex-col gap-4">
              <div className="flex items-center gap-3.5 bg-[#FAF8F5] p-3 border border-espresso/15">
                <img
                  src={editingPhoto.thumbnailUrl}
                  alt={editingPhoto.name}
                  className="w-16 h-16 object-cover rounded-none border border-espresso/20 shrink-0"
                />
                <div className="flex flex-col">
                  <span className="font-mono font-bold text-sm text-espresso">
                    {editingPhoto.name}
                  </span>
                  <span className="font-jakarta text-xs text-espresso-muted">
                    Tambahkan instruksi edit untuk fotografer
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-jakarta font-bold text-xs uppercase text-espresso">
                  Catatan untuk {gallery.studio_name}
                </label>
                <textarea
                  rows={4}
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Tulis catatan edit (misal: cerahkan sedikit, jadikan hitam putih, atau kandidat foto sampul)..."
                  className="w-full bg-white text-espresso p-3.5 border border-espresso/25 font-jakarta text-sm focus:outline-none focus:border-espresso"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingPhoto(null)}
                  className="px-4 py-2 bg-[#FAF8F5] text-espresso border border-espresso/20 font-jakarta font-semibold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingNote}
                  className="px-5 py-2 bg-espresso text-cream font-jakarta font-semibold text-xs hover:bg-crimson"
                >
                  {isSavingNote ? 'Menyimpan...' : 'Simpan Catatan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: LIGHTBOX PREVIEW (SHARP CORNERS) */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-50 bg-espresso/95 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white max-w-4xl w-full border border-espresso/20 overflow-hidden flex flex-col"
          >
            <div className="bg-espresso text-cream px-5 py-3 flex items-center justify-between">
              <span className="font-mono font-bold text-sm text-cream">
                {lightboxPhoto.name}
              </span>
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                className="w-8 h-8 bg-white/10 text-cream flex items-center justify-center hover:bg-white hover:text-espresso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative bg-espresso max-h-[75vh] flex items-center justify-center overflow-hidden">
              <img
                src={lightboxPhoto.fullResUrl}
                alt={lightboxPhoto.caption}
                onError={(e) => handleImageError(lightboxPhoto.id, e)}
                className="max-h-[75vh] w-auto object-contain rounded-none"
              />
            </div>

            <div className="p-4 bg-white flex flex-wrap items-center justify-between gap-3 border-t border-espresso/15">
              <span className="font-mono text-xs text-espresso-muted">
                {lightboxPhoto.name}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = lightboxPhoto;
                    setLightboxPhoto(null);
                    handleOpenNoteModal(target);
                  }}
                  className="px-3.5 py-2 bg-[#FAF8F5] text-espresso border border-espresso/20 font-jakarta font-semibold text-xs"
                >
                  + Catatan
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleSelect(lightboxPhoto)}
                  className={`px-4 py-2 font-jakarta font-semibold text-xs ${
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

      {/* MODAL 3: FINAL SUBMIT, NEATLY SORTED FILENAMES & SEND TO WHATSAPP */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 bg-espresso/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg border border-espresso/20 shadow-xl overflow-hidden">
            <div className="bg-espresso text-cream px-5 py-3.5 flex items-center justify-between">
              <span className="font-jakarta font-bold text-xs uppercase tracking-wider">
                Kirim Pilihan Foto ke WhatsApp {gallery.studio_name}
              </span>
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="w-7 h-7 bg-white/10 text-cream flex items-center justify-center hover:bg-white hover:text-espresso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between bg-[#FAF8F5] p-4 border border-espresso/15">
                <div>
                  <span className="font-jakarta font-semibold text-xs uppercase text-espresso-muted">
                    Total Foto Dipilih (Tersusun Rapi)
                  </span>
                  <h3 className="font-fraunces font-bold text-lg text-espresso">
                    {gallery.client_name}
                  </h3>
                </div>
                <div className="bg-mustard text-espresso px-3.5 py-1 font-anton text-base">
                  {selectedCount} / {quota}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-jakarta font-bold text-xs uppercase tracking-wider text-espresso">
                    Daftar Nama File Terpilih (Urut Otomatis):
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySortedFilenames}
                    className="font-jakarta font-bold text-xs text-crimson hover:underline"
                  >
                    {copiedClientList ? '✓ Tersalin!' : 'Salin Daftar File'}
                  </button>
                </div>

                <div className="bg-[#FAF8F5] p-3.5 border border-espresso/20 font-mono text-xs text-espresso max-h-44 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {sortedSelections.length > 0
                    ? sortedSelections
                        .map(
                          (s, idx) =>
                            `${idx + 1}. ${s.filename}${
                              s.note?.trim() ? ` (${s.note.trim()})` : ''
                            }`
                        )
                        .join('\n')
                    : 'Belum ada foto yang dipilih.'}
                </div>
              </div>

              {sortedSelections.length > 0 && (
                <div className="bg-[#FAF8F5] p-3 border border-espresso/15 flex flex-col gap-1">
                  <span className="font-jakarta font-bold text-[10px] uppercase tracking-wider text-espresso-muted">
                    Format Filter Lightroom (Otomatis Disertakan di WA):
                  </span>
                  <div className="font-mono text-[11px] text-espresso break-words">
                    {sortedLightroomNames}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleConfirmLockSelections(false)}
                  disabled={isLocking || selectedCount === 0}
                  className="w-full sm:w-auto text-center px-4 py-2.5 bg-[#FAF8F5] hover:bg-cream text-espresso border border-espresso/20 font-jakarta font-semibold text-xs disabled:opacity-50"
                >
                  Simpan Saja
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmLockSelections(true)}
                  disabled={isLocking || selectedCount === 0}
                  className="w-full sm:flex-1 py-3 px-5 bg-espresso hover:bg-crimson text-cream font-jakarta font-bold text-xs uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isLocking
                      ? 'Mengirim...'
                      : `Kunci & Kirim ke WA ${gallery.studio_name}`}
                  </span>
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
