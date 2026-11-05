'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Bolt,
  Calendar,
  Camera,
  CheckCircle2,
  Copy,
  Crown,
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  KeyRound,
  Lock,
  LogOut,
  MessageSquare,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  User,
  Users,
} from 'lucide-react';
import RetroTicker from '@/components/RetroTicker';
import GiantFooter from '@/components/GiantFooter';
import {
  authenticateStudio,
  createGallery,
  createStudioSubscription,
  deleteGallery,
  deleteStudioSubscription,
  extendStudioSubscription,
  fetchAllGalleries,
  fetchAllStudioSubscriptions,
  fetchSelectionsForGallery,
  generateLicenseCode,
  isSupabaseConfigured,
  SEED_GALLERIES,
  SEED_STUDIO_SUBSCRIPTIONS,
  toggleStudioSubscriptionActive,
} from '@/lib/supabase';
import {
  generateOwnerToken,
  parseGoogleDriveFolderId,
  slugifyClientName,
} from '@/lib/drive-utils';
import {
  DrivePhoto,
  GalleryRecord,
  SelectionRecord,
  StudioSubscription,
} from '@/types/difotoin';

const STUDIO_SESSION_KEY = 'difotoin_active_studio_session_v1';

export default function StudioDashboardPage() {
  // Authentication & Subscription State
  const [loggedStudio, setLoggedStudio] = useState<StudioSubscription | null>(
    null
  );
  const [authChecking, setAuthChecking] = useState(true);
  const [loginSlug, setLoginSlug] = useState('');
  const [loginCode, setLoginCode] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard Tab ('galleries' | 'subscriptions')
  const [activeTab, setActiveTab] = useState<'galleries' | 'subscriptions'>(
    'galleries'
  );

  // Galleries State
  const [allGalleries, setAllGalleries] =
    useState<GalleryRecord[]>(SEED_GALLERIES);
  const [activeGallery, setActiveGallery] = useState<GalleryRecord>(
    SEED_GALLERIES[0]
  );
  const [selectionsMap, setSelectionsMap] = useState<
    Record<string, SelectionRecord[]>
  >({});

  // Studio Subscriptions State (Super Admin)
  const [studioList, setStudioList] = useState<StudioSubscription[]>(
    SEED_STUDIO_SUBSCRIPTIONS
  );
  const [newSubStudioName, setNewSubStudioName] = useState('');
  const [newSubStudioSlug, setNewSubStudioSlug] = useState('');
  const [newSubOwnerName, setNewSubOwnerName] = useState('');
  const [newSubWhatsapp, setNewSubWhatsapp] = useState('');
  const [newSubAccessCode, setNewSubAccessCode] = useState(() =>
    generateLicenseCode('DFTN')
  );
  const [newSubPlan, setNewSubPlan] =
    useState<StudioSubscription['plan_name']>('Bulanan (30 Hari)');
  const [newSubMaxGalleries, setNewSubMaxGalleries] = useState<number>(50);
  const [copiedSubId, setCopiedSubId] = useState<string | null>(null);
  const [subSuccessMsg, setSubSuccessMsg] = useState<string | null>(null);

  // Create Gallery Form states
  const [studioSlug, setStudioSlug] = useState('zeevisual');
  const [clientName, setClientName] = useState('Aida Fitri Harahab');
  const [slug, setSlug] = useState('aida-fitri-harahab');
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [sessionType, setSessionType] = useState('Editorial Pre-Wedding');
  const [gdriveFolderUrl, setGdriveFolderUrl] = useState(
    'https://drive.google.com/drive/folders/1x9BAidaFauziRAW74Editorial'
  );
  const [selectionQuota, setSelectionQuota] = useState<number>(50);
  const [ownerToken, setOwnerToken] = useState('mhttesqg7rjx');
  const [deadlineDate, setDeadlineDate] = useState('28 Oktober 2024');
  const [albumPin, setAlbumPin] = useState('2408');
  const [enablePin, setEnablePin] = useState(true);
  const [enableWatermark, setEnableWatermark] = useState(false);

  // Live Drive Folder Preview state
  const [drivePreviewPhotos, setDrivePreviewPhotos] = useState<DrivePhoto[]>(
    []
  );
  const [isTestingDrive, setIsTestingDrive] = useState(false);
  const [driveSourceLabel, setDriveSourceLabel] = useState<string | null>(null);

  // UI states
  const [baseUrl, setBaseUrl] = useState(
    process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  );
  const [includeExtension, setIncludeExtension] = useState(false);
  const [lrSeparator, setLrSeparator] = useState<'comma' | 'space' | 'newline'>(
    'comma'
  );
  const [copiedWa, setCopiedWa] = useState(false);
  const [copiedLr, setCopiedLr] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccessMsg, setPublishSuccessMsg] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.origin) {
      setBaseUrl(window.location.origin);
    }
    restoreSessionAndLoadData();
  }, []);

  async function restoreSessionAndLoadData() {
    setAuthChecking(true);
    try {
      const subs = await fetchAllStudioSubscriptions();
      setStudioList(subs);

      if (typeof window !== 'undefined') {
        const savedRaw = window.localStorage.getItem(STUDIO_SESSION_KEY);
        if (savedRaw) {
          const parsed = JSON.parse(savedRaw) as {
            studio_slug: string;
            access_code: string;
          };
          const authRes = await authenticateStudio(
            parsed.studio_slug,
            parsed.access_code
          );
          if (authRes.ok && authRes.studio) {
            setLoggedStudio(authRes.studio);
            setStudioSlug(authRes.studio.studio_slug);
            await loadDashboardData(authRes.studio);
          } else {
            window.localStorage.removeItem(STUDIO_SESSION_KEY);
          }
        }
      }
    } finally {
      setAuthChecking(false);
    }
  }

  async function loadDashboardData(studioOverride?: StudioSubscription | null) {
    const currentStudio = studioOverride ?? loggedStudio;
    const all = await fetchAllGalleries();
    const subs = await fetchAllStudioSubscriptions();
    setStudioList(subs);
    setAllGalleries(all);

    const filtered =
      currentStudio && !currentStudio.is_super_admin
        ? all.filter(
            (g) =>
              g.studio_slug.toLowerCase() ===
              currentStudio.studio_slug.toLowerCase()
          )
        : all;

    if (filtered.length > 0) {
      setActiveGallery(filtered[0]);
    }
    const map: Record<string, SelectionRecord[]> = {};
    for (const gal of all) {
      map[gal.id] = await fetchSelectionsForGallery(gal.id);
    }
    setSelectionsMap(map);
  }

  // Galleries visible to the currently logged-in studio
  const visibleGalleries = useMemo(() => {
    if (!loggedStudio) return [];
    if (loggedStudio.is_super_admin) return allGalleries;
    return allGalleries.filter(
      (g) =>
        g.studio_slug.toLowerCase() === loggedStudio.studio_slug.toLowerCase()
    );
  }, [allGalleries, loggedStudio]);

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await authenticateStudio(loginSlug, loginCode);
      if (!res.ok || !res.studio) {
        setLoginError(res.error || 'Gagal masuk ke dashboard studio.');
        return;
      }

      setLoggedStudio(res.studio);
      setStudioSlug(res.studio.studio_slug);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          STUDIO_SESSION_KEY,
          JSON.stringify({
            studio_slug: res.studio.studio_slug,
            access_code: res.studio.access_code,
          })
        );
      }
      await loadDashboardData(res.studio);
    } finally {
      setIsLoggingIn(false);
    }
  }

  function handleLogout() {
    setLoggedStudio(null);
    setLoginSlug('');
    setLoginCode('');
    setLoginError(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STUDIO_SESSION_KEY);
    }
  }

  function handleClientNameChange(value: string) {
    setClientName(value);
    if (!isSlugManual) {
      setSlug(slugifyClientName(value));
    }
  }

  function handleResetNewForm() {
    setStudioSlug(loggedStudio?.studio_slug || 'zeevisual');
    setClientName('');
    setSlug('');
    setIsSlugManual(false);
    setSessionType('Editorial Pre-Wedding');
    setGdriveFolderUrl('');
    setSelectionQuota(50);
    setOwnerToken(generateOwnerToken(12));
    setAlbumPin('');
    setEnablePin(false);
    setDrivePreviewPhotos([]);
    setPublishSuccessMsg(null);
  }

  const parsedFolderId = useMemo(
    () => parseGoogleDriveFolderId(gdriveFolderUrl),
    [gdriveFolderUrl]
  );

  async function handleTestDriveFolder() {
    setIsTestingDrive(true);
    try {
      const res = await fetch(
        `/api/drive/${encodeURIComponent(parsedFolderId)}`
      );
      if (res.ok) {
        const data = await res.json();
        setDrivePreviewPhotos(data.photos || []);
        setDriveSourceLabel(
          data.source === 'google-drive-v3'
            ? `Google Drive API (${data.count} foto ditemukan)`
            : data.source === 'google-drive-public'
              ? `Folder Publik Google Drive (${data.count} foto ditemukan)`
              : `Mode Pratinjau (${data.count} foto portrait & landscape)`
        );
      }
    } finally {
      setIsTestingDrive(false);
    }
  }

  // Exact Indonesian WhatsApp message required by specification
  const whatsappMessage = useMemo(() => {
    const cleanStudio =
      (loggedStudio && !loggedStudio.is_super_admin
        ? loggedStudio.studio_slug
        : studioSlug.trim()) || 'zeevisual';
    const cleanClient = clientName.trim() || 'Klien';
    const cleanSlug = slug.trim() || slugifyClientName(cleanClient);
    const cleanToken = ownerToken.trim() || 'mhttesqg7rjx';

    return `Halo ${cleanClient}
Galeri foto kamu dari ${cleanStudio} sudah siap di Difotoin.

Pilih foto favorit kamu :
${baseUrl}/${cleanStudio}/${cleanSlug}

Bagikan album ini ke teman dan keluarga kamu :
${baseUrl}/${cleanSlug}?t=${cleanToken}
(bisa atur siapa yang lihat, ganti sampul, bikin pin)

Selamat menikmati momennya`;
  }, [baseUrl, studioSlug, clientName, slug, ownerToken, loggedStudio]);

  const activeSelections = useMemo(() => {
    return selectionsMap[activeGallery.id] || [];
  }, [selectionsMap, activeGallery.id]);

  // Formatted filenames for Lightroom Filter Exporter
  const lightroomFilterString = useMemo(() => {
    const defaultDemoFiles = [
      'ZV_0488.JPG',
      'ZV_0489.JPG',
      'ZV_0501.JPG',
      'ZV_0514.JPG',
      'ZV_0520.JPG',
      'ZV_0525.JPG',
    ];
    const rawNames =
      activeSelections.length > 0
        ? activeSelections.map((s) => s.filename)
        : defaultDemoFiles;

    const processed = rawNames.map((name) => {
      if (includeExtension) {
        return /\.[a-zA-Z0-9]+$/.test(name) ? name : `${name}.JPG`;
      }
      return name.replace(/\.[a-zA-Z0-9]+$/, '');
    });

    const sep =
      lrSeparator === 'comma' ? ', ' : lrSeparator === 'space' ? ' ' : '\n';
    return processed.join(sep);
  }, [activeSelections, includeExtension, lrSeparator]);

  async function handlePublishGallery(e: React.FormEvent) {
    e.preventDefault();
    if (!loggedStudio) return;

    // Enforce gallery quota for subscriber studios
    if (
      !loggedStudio.is_super_admin &&
      visibleGalleries.length >= loggedStudio.max_galleries
    ) {
      setPublishSuccessMsg(
        `Kuota galeri paket langganan Anda (${loggedStudio.max_galleries} galeri) telah penuh. Hubungi Admin Zeevisual untuk upgrade.`
      );
      return;
    }

    setIsPublishing(true);
    setPublishSuccessMsg(null);

    try {
      const effectiveStudioSlug = loggedStudio.is_super_admin
        ? studioSlug.trim() || 'zeevisual'
        : loggedStudio.studio_slug;

      const created = await createGallery({
        studio_slug: effectiveStudioSlug,
        studio_name: loggedStudio.is_super_admin
          ? effectiveStudioSlug === 'zeevisual'
            ? 'Zeevisual'
            : effectiveStudioSlug
          : loggedStudio.studio_name,
        client_name: clientName.trim() || 'Klien Baru',
        slug: slug.trim() || slugifyClientName(clientName),
        session_type: sessionType,
        deadline_date: deadlineDate,
        gdrive_folder_url: gdriveFolderUrl,
        selection_quota: selectionQuota,
        owner_token: ownerToken.trim() || generateOwnerToken(12),
        album_pin: enablePin && albumPin.trim() ? albumPin.trim() : null,
        watermark_enabled: enableWatermark,
      });

      const updatedList = await fetchAllGalleries();
      setAllGalleries(updatedList);
      setActiveGallery(created);
      const sels = await fetchSelectionsForGallery(created.id);
      setSelectionsMap((prev) => ({ ...prev, [created.id]: sels }));

      setPublishSuccessMsg(
        `Galeri "${created.client_name}" berhasil disimpan & siap dibagikan!`
      );
    } finally {
      setIsPublishing(false);
    }
  }

  function handleSelectGalleryFromRow(gal: GalleryRecord) {
    setActiveGallery(gal);
    setStudioSlug(gal.studio_slug);
    setClientName(gal.client_name);
    setSlug(gal.slug);
    setIsSlugManual(true);
    setSessionType(gal.session_type);
    setGdriveFolderUrl(gal.gdrive_folder_url);
    setSelectionQuota(gal.selection_quota);
    setOwnerToken(gal.owner_token);
    setDeadlineDate(gal.deadline_date);
    setAlbumPin(gal.album_pin || '');
    setEnablePin(Boolean(gal.album_pin));
  }

  async function handleDeleteGallery(gal: GalleryRecord) {
    if (visibleGalleries.length <= 1) return;
    const remaining = await deleteGallery(gal.id);
    setAllGalleries(remaining);
    if (activeGallery.id === gal.id && remaining.length > 0) {
      handleSelectGalleryFromRow(remaining[0]);
    }
  }

  // Super Admin: Create New Subscriber Studio
  async function handleCreateSubscriber(e: React.FormEvent) {
    e.preventDefault();
    setSubSuccessMsg(null);

    const durationMap: Record<StudioSubscription['plan_name'], number | null> =
      {
        'Bulanan (30 Hari)': 30,
        '3 Bulan (90 Hari)': 90,
        'Tahunan (365 Hari)': 365,
        'Lifetime Partner': null,
        'Super Admin': null,
      };

    const created = await createStudioSubscription({
      studio_name: newSubStudioName,
      studio_slug: newSubStudioSlug || slugifyClientName(newSubStudioName),
      owner_name: newSubOwnerName || newSubStudioName,
      whatsapp_number: newSubWhatsapp,
      access_code: newSubAccessCode,
      plan_name: newSubPlan,
      max_galleries: newSubMaxGalleries,
      duration_days: durationMap[newSubPlan],
    });

    const updated = await fetchAllStudioSubscriptions();
    setStudioList(updated);
    setNewSubStudioName('');
    setNewSubStudioSlug('');
    setNewSubOwnerName('');
    setNewSubWhatsapp('');
    setNewSubAccessCode(generateLicenseCode('DFTN'));
    setSubSuccessMsg(
      `Member Studio "${created.studio_name}" (${created.studio_slug}) berhasil diaktifkan dengan kode lisensi ${created.access_code}!`
    );
  }

  function buildSubscriberActivationWaMessage(sub: StudioSubscription): string {
    const expiryText = sub.expires_at
      ? new Date(sub.expires_at).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'Selamanya (Lifetime)';

    return `Halo *${sub.owner_name}* (${sub.studio_name})!
Akun langganan *Difotoin Studio* kamu sudah aktif.

*Link Login Dashboard Studio:*
${baseUrl}/studio/dashboard

*Data Login Studio Kamu:*
• Slug Studio : \`${sub.studio_slug}\`
• Kode Lisensi : \`${sub.access_code}\`
• Paket : ${sub.plan_name} (Aktif s/d ${expiryText})
• Kuota Galeri : ${sub.max_galleries} Galeri Klien

Sekarang kamu bisa langsung paste link folder Google Drive klien dan bagikan halaman pilih foto berlabel */${sub.studio_slug}/nama-klien*!`;
  }

  async function handleCopySubscriberWa(sub: StudioSubscription) {
    const msg = buildSubscriberActivationWaMessage(sub);
    await navigator.clipboard.writeText(msg);
    setCopiedSubId(sub.id);
    setTimeout(() => setCopiedSubId(null), 2400);
  }

  async function handleCopyWa() {
    await navigator.clipboard.writeText(whatsappMessage);
    setCopiedWa(true);
    setTimeout(() => setCopiedWa(false), 2400);
  }

  async function handleCopyLightroom() {
    await navigator.clipboard.writeText(lightroomFilterString);
    setCopiedLr(true);
    setTimeout(() => setCopiedLr(false), 2400);
  }

  function handleDownloadLightroomTxt() {
    const blob = new Blob([lightroomFilterString], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `difotoin-${activeGallery.slug}-lightroom.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ============================================================================
  // EXCLUSIVE PHOTOGRAPHER SUBSCRIPTION LOGIN GATE
  // ============================================================================
  if (!authChecking && !loggedStudio) {
    return (
      <div className="min-h-screen flex flex-col bg-cream text-espresso">
        <header className="w-full bg-crimson border-b-[1.5px] border-espresso">
          <RetroTicker
            text="DIFOTOIN ★ AKSES KHUSUS STUDIO BERLANGGANAN ★ CLIENT PHOTO PROOFING & DIGITAL ALBUM ★"
            variant="cream"
          />
          <div className="max-w-7xl mx-auto px-4 md:px-10 h-16 flex items-center justify-between">
            <Link
              href="/"
              className="font-anton text-2xl md:text-3xl text-cream uppercase tracking-wider"
            >
              DIFOTOIN
            </Link>
            <span className="inline-flex items-center gap-1.5 bg-cream text-espresso font-jakarta font-bold text-xs px-3 py-1 rounded-full border border-espresso">
              <Lock className="w-3.5 h-3.5 text-crimson" />
              Khusus Studio Terdaftar
            </span>
          </div>
        </header>

        <main className="flex-1 w-full flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md bg-white rounded-2xl border-[1.5px] border-espresso shadow-retro overflow-hidden">
            <div className="bg-espresso text-cream px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-mustard" />
                <span className="font-anton text-sm uppercase tracking-wider">
                  Login Lisensi Studio Fotografer
                </span>
              </div>
              <span className="font-jakarta text-[11px] text-mustard font-semibold">
                Member Only
              </span>
            </div>

            <form
              onSubmit={handleLoginSubmit}
              className="p-6 md:p-8 flex flex-col gap-5"
            >
              <div className="flex flex-col gap-1">
                <h1 className="font-fraunces font-bold text-2xl text-espresso">
                  Masuk ke Dashboard Studio
                </h1>
                <p className="font-jakarta text-xs text-espresso-muted leading-relaxed">
                  Dashboard ini hanya dapat diakses oleh fotografer &amp; studio
                  yang memiliki lisensi berlangganan aktif di Difotoin.
                </p>
              </div>

              {loginError && (
                <div className="p-3.5 rounded-xl bg-crimson/10 border border-crimson text-crimson font-jakarta text-xs font-semibold leading-relaxed">
                  {loginError}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="login-studio-slug"
                  className="font-jakarta font-bold text-xs uppercase tracking-wider text-espresso"
                >
                  Slug Studio Anda
                </label>
                <input
                  id="login-studio-slug"
                  type="text"
                  value={loginSlug}
                  onChange={(e) =>
                    setLoginSlug(slugifyClientName(e.target.value))
                  }
                  placeholder="Contoh: zeevisual atau kalasenja"
                  required
                  className="w-full bg-cream/50 text-espresso px-3.5 py-2.5 rounded-xl border-[1.5px] border-espresso font-jakarta font-semibold text-sm focus:outline-none focus:bg-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="login-access-code"
                  className="font-jakarta font-bold text-xs uppercase tracking-wider text-espresso"
                >
                  Kode Lisensi / Password Akses
                </label>
                <input
                  id="login-access-code"
                  type="password"
                  value={loginCode}
                  onChange={(e) => setLoginCode(e.target.value)}
                  placeholder="Masukkan kode lisensi..."
                  required
                  className="w-full bg-cream/50 text-espresso px-3.5 py-2.5 rounded-xl border-[1.5px] border-espresso font-mono font-bold text-sm tracking-wider focus:outline-none focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-mustard hover:bg-mustard-light text-espresso py-3.5 px-5 rounded-xl border-[1.5px] border-espresso font-anton text-base uppercase tracking-wider shadow-retro-sm transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {isLoggingIn ? 'Memverifikasi Lisensi...' : 'Buka Dashboard Studio'}
                </span>
              </button>

              {/* Quick Demo Fillers for Owner Testing */}
              <div className="pt-3 border-t border-espresso/15 flex flex-col gap-2">
                <span className="font-jakarta font-bold text-[11px] uppercase tracking-wider text-espresso-muted">
                  Akses Cepat (Untuk Testing Owner):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginSlug('zeevisual');
                      setLoginCode('ZV2025');
                    }}
                    className="px-3 py-2 rounded-lg bg-cream hover:bg-mustard/50 text-espresso border border-espresso/40 font-jakarta font-bold text-xs text-left transition-colors"
                  >
                    <div>👑 Super Admin</div>
                    <div className="font-mono text-[10px] text-espresso-muted">
                      zeevisual / ZV2025
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginSlug('kalasenja');
                      setLoginCode('DFTN-KALA25');
                    }}
                    className="px-3 py-2 rounded-lg bg-cream hover:bg-mustard/50 text-espresso border border-espresso/40 font-jakarta font-bold text-xs text-left transition-colors"
                  >
                    <div>📸 Contoh Member</div>
                    <div className="font-mono text-[10px] text-espresso-muted">
                      kalasenja / DFTN-KALA25
                    </div>
                  </button>
                </div>
              </div>

              <div className="bg-cream/60 p-3.5 rounded-xl border border-espresso/20 flex flex-col gap-2 text-center">
                <span className="font-jakarta text-xs text-espresso-muted">
                  Belum berlangganan akses studio Difotoin?
                </span>
                <a
                  href="https://wa.me/6281234567890?text=Halo%20Admin%20Zeevisual%2C%20saya%20ingin%20berlangganan%20akses%20Studio%20di%20Difotoin."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 font-jakarta font-bold text-xs text-crimson hover:underline"
                >
                  <span>Hubungi Zeevisual untuk Berlangganan Lisensi →</span>
                </a>
              </div>
            </form>
          </div>
        </main>

        <GiantFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream text-espresso">
      {/* Clean Sticky Header */}
      <header className="sticky top-0 z-50 w-full">
        <RetroTicker
          text="DIFOTOIN ★ PILIH FOTO FAVORITMU ★ ABADIKAN SETIAP MOMEN ★ STUDIO ZEEVISUAL ★"
          variant="cream"
        />
        <div className="w-full bg-crimson border-b-[1.5px] border-espresso px-4 md:px-10 h-16 flex items-center justify-between">
          <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="font-anton text-2xl md:text-3xl text-cream uppercase tracking-wider hover:text-mustard transition-colors"
              >
                DIFOTOIN
              </Link>
              <span className="hidden sm:inline-flex items-center gap-1.5 bg-cream text-espresso font-jakarta font-bold text-xs px-2.5 py-1 rounded border border-espresso">
                <Camera className="w-3.5 h-3.5 text-crimson" />
                {loggedStudio?.studio_slug || studioSlug}
              </span>
              {loggedStudio?.is_super_admin && (
                <span className="hidden md:inline-flex items-center gap-1 bg-mustard text-espresso font-jakarta font-bold text-[11px] px-2.5 py-0.5 rounded-full border border-espresso">
                  <Crown className="w-3 h-3" />
                  Super Admin
                </span>
              )}
            </div>

            <nav className="hidden lg:flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('galleries')}
                className={`font-jakarta font-bold text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-lg border transition-colors ${
                  activeTab === 'galleries'
                    ? 'bg-cream text-espresso border-espresso'
                    : 'text-cream border-transparent hover:bg-cream/15'
                }`}
              >
                Kelola Galeri Klien
              </button>

              {loggedStudio?.is_super_admin && (
                <button
                  type="button"
                  onClick={() => setActiveTab('subscriptions')}
                  className={`inline-flex items-center gap-1.5 font-jakarta font-bold text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-lg border transition-colors ${
                    activeTab === 'subscriptions'
                      ? 'bg-mustard text-espresso border-espresso'
                      : 'text-cream border-transparent hover:bg-cream/15'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Member Langganan ({studioList.length})</span>
                </button>
              )}

              <Link
                href={`/${studioSlug || 'zeevisual'}/${slug || 'aida-fitri-harahab'}`}
                className="font-jakarta font-semibold text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-lg text-cream hover:bg-cream/15 transition-colors"
              >
                Lihat Pilih Foto
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col text-right">
                <span className="font-jakarta font-bold text-xs text-cream">
                  {loggedStudio?.studio_name || 'Zeevisual'}
                </span>
                <span className="font-jakarta text-[11px] text-cream/75">
                  {loggedStudio?.plan_name} •{' '}
                  {isSupabaseConfigured ? 'Supabase Aktif' : 'Mode Lokal'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Keluar dari Dashboard Studio"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cream hover:bg-mustard text-espresso border border-espresso font-jakarta font-bold text-xs transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-10 py-8 flex flex-col gap-8">
        {/* Clean Top Header Card + Tab Switcher */}
        <section className="w-full bg-white p-6 md:p-8 rounded-2xl border-[1.5px] border-espresso shadow-retro flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex flex-col gap-1.5 max-w-2xl">
              <span className="font-jakarta font-bold text-xs uppercase tracking-widest text-crimson">
                STUDIO PARTNER • {loggedStudio?.studio_name.toUpperCase()} (
                {loggedStudio?.plan_name})
              </span>
              <h1 className="font-anton text-3xl md:text-4xl text-espresso uppercase tracking-wide leading-none">
                {activeTab === 'subscriptions'
                  ? 'Kelola Member & Lisensi Langganan Fotografer'
                  : 'Dashboard Galeri & Seleksi Foto'}
              </h1>
              <p className="font-jakarta text-sm text-espresso-muted leading-relaxed">
                {activeTab === 'subscriptions'
                  ? 'Daftarkan fotografer yang membeli paket langganan, atur masa aktif lisensi, dan salin pesan aktivasi WhatsApp dalam satu klik.'
                  : 'Tempelkan link folder Google Drive, bagikan link pilih foto ke klien via WhatsApp, dan salin daftar foto terpilih untuk filter Adobe Lightroom.'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full lg:w-auto shrink-0">
              <div className="bg-cream p-3.5 px-4 rounded-xl border border-espresso flex flex-col justify-center">
                <span className="font-jakarta font-semibold text-[11px] text-espresso-muted uppercase">
                  Galeri Studio
                </span>
                <span className="font-anton text-2xl text-espresso leading-tight mt-0.5">
                  {visibleGalleries.length} /{' '}
                  {loggedStudio?.is_super_admin
                    ? '∞'
                    : loggedStudio?.max_galleries}
                </span>
              </div>
              <div className="bg-cream p-3.5 px-4 rounded-xl border border-espresso flex flex-col justify-center">
                <span className="font-jakarta font-semibold text-[11px] text-espresso-muted uppercase">
                  Foto Terpilih
                </span>
                <span className="font-anton text-2xl text-crimson leading-tight mt-0.5">
                  {activeSelections.length} File
                </span>
              </div>
              <div className="bg-cream p-3.5 px-4 rounded-xl border border-espresso flex flex-col justify-center">
                <span className="font-jakarta font-semibold text-[11px] text-espresso-muted uppercase">
                  Member Studio
                </span>
                <span className="font-anton text-2xl text-espresso leading-tight mt-0.5">
                  {studioList.length} Akun
                </span>
              </div>
            </div>
          </div>

          {/* Mobile & Desktop Quick Mode Switcher for Super Admin */}
          {loggedStudio?.is_super_admin && (
            <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-espresso/15">
              <button
                type="button"
                onClick={() => setActiveTab('galleries')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-jakarta font-bold text-xs border-[1.5px] border-espresso transition-all ${
                  activeTab === 'galleries'
                    ? 'bg-espresso text-cream shadow-retro-sm'
                    : 'bg-cream text-espresso hover:bg-mustard/40'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>1. Kelola Galeri Klien</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('subscriptions')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-jakarta font-bold text-xs border-[1.5px] border-espresso transition-all ${
                  activeTab === 'subscriptions'
                    ? 'bg-mustard text-espresso shadow-retro-sm'
                    : 'bg-cream text-espresso hover:bg-mustard/40'
                }`}
              >
                <Crown className="w-4 h-4 text-crimson" />
                <span>
                  2. Kelola Langganan Fotografer ({studioList.length} Studio)
                </span>
              </button>
            </div>
          )}
        </section>

        {/* ==================================================================== */}
        {/* TAB 2: SUPER ADMIN — KELOLA MEMBER & LANGGANAN FOTOGRAFER            */}
        {/* ==================================================================== */}
        {activeTab === 'subscriptions' && loggedStudio?.is_super_admin && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT: ADD SUBSCRIBER STUDIO FORM */}
            <div className="lg:col-span-5 bg-white rounded-2xl border-[1.5px] border-espresso shadow-retro overflow-hidden flex flex-col">
              <div className="bg-espresso text-cream px-6 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-mustard" />
                  <span className="font-anton text-sm uppercase tracking-wider">
                    Tambah Member Fotografer Baru
                  </span>
                </div>
              </div>

              <form
                onSubmit={handleCreateSubscriber}
                className="p-6 flex flex-col gap-4"
              >
                <div className="flex flex-col gap-1.5">
                  <label className="font-jakarta font-bold text-xs uppercase tracking-wider text-espresso">
                    Nama Studio Fotografer
                  </label>
                  <input
                    type="text"
                    value={newSubStudioName}
                    onChange={(e) => {
                      setNewSubStudioName(e.target.value);
                      setNewSubStudioSlug(slugifyClientName(e.target.value));
                    }}
                    placeholder="Contoh: Lumina Portrait Studio"
                    required
                    className="w-full bg-white text-espresso px-3.5 py-2.5 rounded-lg border-[1.5px] border-espresso font-jakarta font-semibold text-sm focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-jakarta font-bold text-xs uppercase tracking-wider text-espresso">
                      Slug URL Studio
                    </label>
                    <input
                      type="text"
                      value={newSubStudioSlug}
                      onChange={(e) =>
                        setNewSubStudioSlug(slugifyClientName(e.target.value))
                      }
                      placeholder="lumina-portrait"
                      required
                      className="w-full bg-cream/60 text-espresso px-3.5 py-2.5 rounded-lg border-[1.5px] border-espresso font-mono font-bold text-xs focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-jakarta font-bold text-xs uppercase tracking-wider text-espresso">
                      Nama Pemilik
                    </label>
                    <input
                      type="text"
                      value={newSubOwnerName}
                      onChange={(e) => setNewSubOwnerName(e.target.value)}
                      placeholder="Contoh: Andi Wijaya"
                      required
                      className="w-full bg-white text-espresso px-3.5 py-2.5 rounded-lg border-[1.5px] border-espresso font-jakarta text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-jakarta font-bold text-xs uppercase tracking-wider text-espresso">
                      Paket Langganan
                    </label>
                    <select
                      value={newSubPlan}
                      onChange={(e) =>
                        setNewSubPlan(
                          e.target.value as StudioSubscription['plan_name']
                        )
                      }
                      className="w-full bg-white text-espresso px-3 py-2.5 rounded-lg border-[1.5px] border-espresso font-jakarta font-semibold text-xs focus:outline-none"
                    >
                      <option value="Bulanan (30 Hari)">
                        Bulanan (30 Hari)
                      </option>
                      <option value="3 Bulan (90 Hari)">
                        3 Bulan (90 Hari)
                      </option>
                      <option value="Tahunan (365 Hari)">
                        Tahunan (365 Hari)
                      </option>
                      <option value="Lifetime Partner">Lifetime Partner</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-jakarta font-bold text-xs uppercase tracking-wider text-espresso">
                      Kuota Maks Galeri
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={9999}
                      value={newSubMaxGalleries}
                      onChange={(e) =>
                        setNewSubMaxGalleries(
                          Math.max(1, Number(e.target.value))
                        )
                      }
                      className="w-full bg-white text-espresso px-3.5 py-2 rounded-lg border-[1.5px] border-espresso font-jakarta font-bold text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-jakarta font-bold text-xs uppercase tracking-wider text-espresso flex items-center justify-between">
                    <span>Kode Lisensi Login</span>
                    <button
                      type="button"
                      onClick={() =>
                        setNewSubAccessCode(generateLicenseCode('DFTN'))
                      }
                      className="inline-flex items-center gap-1 text-[11px] text-crimson font-semibold hover:underline"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Generate Baru
                    </button>
                  </label>
                  <input
                    type="text"
                    value={newSubAccessCode}
                    onChange={(e) => setNewSubAccessCode(e.target.value)}
                    required
                    className="w-full bg-cream/60 text-espresso px-3.5 py-2.5 rounded-lg border-[1.5px] border-espresso font-mono font-bold text-sm tracking-wider focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-1 w-full bg-mustard hover:bg-mustard-light text-espresso py-3 px-5 rounded-xl border-[1.5px] border-espresso font-anton text-base uppercase tracking-wider shadow-retro-sm transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Aktifkan Lisensi Member</span>
                </button>

                {subSuccessMsg && (
                  <div className="p-3 rounded-xl bg-cream border border-espresso font-jakarta text-xs font-bold text-espresso">
                    ✓ {subSuccessMsg}
                  </div>
                )}
              </form>
            </div>

            {/* RIGHT: LIST OF SUBSCRIBED STUDIOS */}
            <div className="lg:col-span-7 bg-white rounded-2xl border-[1.5px] border-espresso shadow-retro overflow-hidden flex flex-col">
              <div className="bg-espresso text-cream px-6 py-3.5 flex items-center justify-between">
                <span className="font-anton text-sm uppercase tracking-wider">
                  Daftar Studio Berlangganan ({studioList.length})
                </span>
                <span className="font-jakarta text-xs text-cream/80">
                  Salin Lisensi WA atau Bekukan Akses
                </span>
              </div>

              <div className="divide-y divide-espresso/15">
                {studioList.map((sub) => {
                  const isExpired =
                    sub.expires_at &&
                    new Date(sub.expires_at).getTime() < Date.now();
                  const studioGalleryCount = allGalleries.filter(
                    (g) =>
                      g.studio_slug.toLowerCase() ===
                      sub.studio_slug.toLowerCase()
                  ).length;

                  return (
                    <div
                      key={sub.id}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-cream/30 transition-colors"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-fraunces font-bold text-lg text-espresso">
                            {sub.studio_name}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-cream border border-espresso/40 font-mono font-bold text-xs text-espresso">
                            /{sub.studio_slug}
                          </span>
                          {sub.is_super_admin ? (
                            <span className="px-2 py-0.5 rounded-full bg-mustard text-espresso border border-espresso font-jakarta font-bold text-[10px] uppercase">
                              Owner Utama
                            </span>
                          ) : !sub.is_active || isExpired ? (
                            <span className="px-2 py-0.5 rounded-full bg-crimson text-cream font-jakarta font-bold text-[10px] uppercase">
                              {isExpired ? 'Expired' : 'Nonaktif'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-teal text-cream font-jakarta font-bold text-[10px] uppercase">
                              Aktif
                            </span>
                          )}
                        </div>

                        <div className="font-jakarta text-xs text-espresso-muted flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>Pemilik: {sub.owner_name}</span>
                          <span>•</span>
                          <span>
                            Kode Lisensi:{' '}
                            <strong className="font-mono text-espresso">
                              {sub.access_code}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>
                            Galeri: {studioGalleryCount} /{' '}
                            {sub.is_super_admin ? '∞' : sub.max_galleries}
                          </span>
                        </div>

                        <div className="font-jakarta text-[11px] text-espresso-muted">
                          Paket: <strong>{sub.plan_name}</strong>{' '}
                          {sub.expires_at
                            ? `• Berlaku s/d ${new Date(
                                sub.expires_at
                              ).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}`
                            : '• Berlaku Selamanya'}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopySubscriberWa(sub)}
                          className="px-3 py-1.5 rounded-lg bg-mustard hover:bg-mustard-light text-espresso border border-espresso font-jakarta font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>
                            {copiedSubId === sub.id
                              ? 'Tersalin!'
                              : 'Salin WA Aktivasi'}
                          </span>
                        </button>

                        {!sub.is_super_admin && (
                          <>
                            <button
                              type="button"
                              onClick={async () => {
                                const next = await extendStudioSubscription(
                                  sub.id,
                                  30
                                );
                                setStudioList(next);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-cream hover:bg-white text-espresso border border-espresso font-jakarta font-bold text-xs transition-colors"
                              title="Perpanjang 30 Hari"
                            >
                              +30 Hari
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                const next =
                                  await toggleStudioSubscriptionActive(
                                    sub.id,
                                    !sub.is_active
                                  );
                                setStudioList(next);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-cream text-espresso border border-espresso font-jakarta font-bold text-xs transition-colors"
                            >
                              {sub.is_active ? 'Bekukan' : 'Aktifkan'}
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                const next = await deleteStudioSubscription(
                                  sub.id
                                );
                                setStudioList(next);
                              }}
                              title="Hapus Member Studio"
                              className="p-1.5 rounded-lg bg-white hover:bg-crimson hover:text-cream text-espresso-muted border border-espresso/30 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 1: KELOLA GALERI KLIEN & FILTER LIGHTROOM                        */}
        {/* ==================================================================== */}
        {activeTab === 'galleries' && (
          <>
            {/* Main 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT COLUMN: CREATE GALLERY FORM (Cols 1-7) */}
              <div className="lg:col-span-7 bg-white rounded-2xl border-[1.5px] border-espresso shadow-retro overflow-hidden flex flex-col">
                <div className="bg-espresso text-cream px-6 py-3.5 flex items-center justify-between">
                  <span className="font-anton text-sm uppercase tracking-wider">
                    Konfigurasi Galeri Klien
                  </span>
                  <button
                    type="button"
                    onClick={handleResetNewForm}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-cream text-espresso font-jakarta font-bold text-xs hover:bg-mustard transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Reset Form Baru</span>
                  </button>
                </div>

                <form
                  onSubmit={handlePublishGallery}
                  className="p-6 md:p-8 flex flex-col gap-5"
                >
                  {/* Row 1: Studio Slug & Client Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <div className="sm:col-span-4 flex flex-col gap-1.5">
                      <label
                        htmlFor="studio-slug-input"
                        className="font-jakarta font-bold text-xs uppercase tracking-wider text-espresso"
                      >
                        Nama Studio (`studio_slug`)
                      </label>
                      <input
                        id="studio-slug-input"
                        type="text"
                        value={
                          loggedStudio && !loggedStudio.is_super_admin
                            ? loggedStudio.studio_slug
                            : studioSlug
                        }
                        readOnly={Boolean(
                          loggedStudio && !loggedStudio.is_super_admin
                        )}
                        onChange={(e) =>
                          setStudioSlug(slugifyClientName(e.target.value))
                        }
                        placeholder="zeevisual"
                        required
                        className="w-full bg-cream/60 text-espresso px-3.5 py-2.5 rounded-lg border-[1.5px] border-espresso font-jakarta font-semibold text-sm focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-8 flex flex-col gap-1.5">
                      <label
                        htmlFor="client-name-input"
                        className="font-jakarta font-bold text-xs uppercase tracking-wider text-espresso flex items-center justify-between"
                      >
                        <span>Nama Klien / Pasangan</span>
                        <span className="text-[11px] text-crimson font-semibold">
                          *wajib diisi
                        </span>
                      </label>
                      <input
                        id="client-name-input"
                        type="text"
                        value={clientName}
                        onChange={(e) => handleClientNameChange(e.target.value)}
                        placeholder="Contoh: Aida Fitri Harahab"
                        required
                        className="w-full bg-white text-espresso px-3.5 py-2.5 rounded-lg border-[1.5px] border-espresso font-fraunces font-bold text-base focus:outline-none focus:ring-2 focus:ring-mustard"
                      />
                    </div>
                  </div>

                  {/* Row 2: Auto-generated Slug & Owner Token */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <div className="sm:col-span-6 flex flex-col gap-1.5">
                      <label
                        htmlFor="client-slug-input"
                        className="font-jakarta font-bold text-xs uppercase tracking-wider text-espresso flex items-center justify-between"
                      >
                        <span>Slug URL Klien</span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsSlugManual(false);
                            setSlug(slugifyClientName(clientName));
                          }}
                          className="text-[11px] text-crimson hover:underline font-semibold"
                        >
                          Otomatis
                        </button>
                      </label>
                      <input
                        id="client-slug-input"
                        type="text"
                        value={slug}
                        onChange={(e) => {
                          setIsSlugManual(true);
                          setSlug(slugifyClientName(e.target.value));
                        }}
                        required
                        className="w-full bg-cream/60 text-espresso px-3.5 py-2.5 rounded-lg border-[1.5px] border-espresso font-mono text-xs font-bold focus:outline-none focus:bg-white"
                      />
                    </div>

                    <div className="sm:col-span-6 flex flex-col gap-1.5">
                      <label
                        htmlFor="owner-token-input"
                        className="font-jakarta font-bold text-xs uppercase tracking-wider text-espresso flex items-center justify-between"
                      >
                        <span>Token Pemilik (`owner_token`)</span>
                        <button
                          type="button"
                          onClick={() => setOwnerToken(generateOwnerToken(12))}
                          className="inline-flex items-center gap-1 text-[11px] text-crimson font-semibold hover:underline"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Acak Baru
                        </button>
                      </label>
                      <div className="flex items-center gap-2 bg-cream/60 px-3.5 py-2 rounded-lg border-[1.5px] border-espresso">
                        <KeyRound className="w-4 h-4 text-espresso-muted shrink-0" />
                        <input
                          id="owner-token-input"
                          type="text"
                          value={ownerToken}
                          onChange={(e) => setOwnerToken(e.target.value)}
                          maxLength={24}
                          required
                          className="w-full bg-transparent text-espresso font-mono font-bold text-sm tracking-wider focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Google Drive Folder URL + Live Preview Button */}
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="gdrive-url-input"
                      className="font-jakarta font-bold text-xs uppercase tracking-wider text-espresso flex flex-wrap items-center justify-between gap-1"
                    >
                      <span>Link Folder Google Drive</span>
                      <span className="font-mono text-[11px] text-espresso-muted bg-cream px-2 py-0.5 rounded border border-espresso/30">
                        ID: {parsedFolderId}
                      </span>
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="flex-1 flex items-center gap-2.5 bg-white px-3.5 py-2.5 rounded-lg border-[1.5px] border-espresso focus-within:ring-2 focus-within:ring-mustard">
                        <FolderOpen className="w-4 h-4 text-espresso-muted shrink-0" />
                        <input
                          id="gdrive-url-input"
                          type="text"
                          value={gdriveFolderUrl}
                          onChange={(e) => setGdriveFolderUrl(e.target.value)}
                          placeholder="Tempel link folder Google Drive di sini..."
                          required
                          className="w-full bg-transparent text-espresso font-jakarta text-sm focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleTestDriveFolder}
                        disabled={isTestingDrive}
                        className="shrink-0 px-4 py-2.5 rounded-lg bg-cream hover:bg-mustard text-espresso border-[1.5px] border-espresso font-jakarta font-bold text-xs transition-colors"
                      >
                        {isTestingDrive ? 'Memuat...' : 'Cek Isi Folder'}
                      </button>
                    </div>

                    {drivePreviewPhotos.length > 0 && (
                      <div className="mt-1 p-3 rounded-xl bg-cream/70 border border-espresso/30 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs font-jakarta">
                          <span className="font-bold text-espresso">
                            ✓ {driveSourceLabel}
                          </span>
                          <button
                            type="button"
                            onClick={() => setDrivePreviewPhotos([])}
                            className="text-espresso-muted hover:text-espresso underline text-[11px]"
                          >
                            Tutup Pratinjau
                          </button>
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto py-1">
                          {drivePreviewPhotos.slice(0, 8).map((p) => (
                            <div
                              key={p.id}
                              className={`shrink-0 h-16 rounded border border-espresso overflow-hidden bg-white ${
                                p.aspectRatio === 'landscape' ? 'w-24' : 'w-12'
                              }`}
                            >
                              <img
                                src={p.thumbnailUrl}
                                alt={p.name}
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  if (!target.dataset.fallback) {
                                    target.dataset.fallback = '1';
                                    target.src = `https://lh3.googleusercontent.com/d/${p.id}=w800`;
                                  }
                                }}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Row 4: Selection Quota Presets + Custom Input */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="font-jakarta font-bold text-xs uppercase tracking-wider text-espresso">
                        Kuota Pilih Foto (`selection_quota`)
                      </label>
                      <span className="font-jakarta font-bold text-xs text-espresso-muted">
                        Maksimal {selectionQuota} Foto
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {[20, 40, 50, 80].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setSelectionQuota(preset)}
                          className={`py-2 rounded-lg font-jakarta font-bold text-xs border-[1.5px] border-espresso transition-all ${
                            selectionQuota === preset
                              ? 'bg-mustard text-espresso shadow-retro-sm'
                              : 'bg-cream/60 text-espresso hover:bg-cream'
                          }`}
                        >
                          {preset} Foto
                        </button>
                      ))}
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={selectionQuota}
                        onChange={(e) =>
                          setSelectionQuota(Math.max(1, Number(e.target.value)))
                        }
                        aria-label="Kuota Kustom"
                        className="w-full bg-white text-center font-jakarta font-bold text-sm text-espresso rounded-lg border-[1.5px] border-espresso focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Row 5: Session Type, Deadline & Optional PIN */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="font-jakarta font-bold text-xs uppercase tracking-wider text-espresso">
                        Kategori Sesi
                      </label>
                      <select
                        value={sessionType}
                        onChange={(e) => setSessionType(e.target.value)}
                        className="w-full bg-white text-espresso px-3 py-2.5 rounded-lg border-[1.5px] border-espresso font-jakarta text-xs font-semibold focus:outline-none"
                      >
                        <option>Editorial Pre-Wedding</option>
                        <option>Wedding Documentation</option>
                        <option>Studio Portrait Session</option>
                        <option>Family &amp; Engagement</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-jakarta font-bold text-xs uppercase tracking-wider text-espresso">
                        Batas Waktu
                      </label>
                      <div className="flex items-center bg-white px-3 py-2 rounded-lg border-[1.5px] border-espresso">
                        <Calendar className="w-4 h-4 text-espresso-muted mr-2 shrink-0" />
                        <input
                          type="text"
                          value={deadlineDate}
                          onChange={(e) => setDeadlineDate(e.target.value)}
                          className="w-full bg-transparent text-espresso font-jakarta text-xs font-semibold focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-jakarta font-bold text-xs uppercase tracking-wider text-espresso">
                        PIN Album (Opsional)
                      </label>
                      <div className="flex items-center bg-white px-3 py-2 rounded-lg border-[1.5px] border-espresso">
                        <Lock className="w-4 h-4 text-espresso-muted mr-2 shrink-0" />
                        <input
                          type="text"
                          maxLength={4}
                          value={albumPin}
                          onChange={(e) =>
                            setAlbumPin(
                              e.target.value.replace(/\D/g, '').slice(0, 4)
                            )
                          }
                          placeholder="2408"
                          className="w-full bg-transparent text-espresso font-mono font-bold text-sm tracking-widest focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Clean Checkboxes */}
                  <div className="flex flex-col gap-2 pt-1">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={enablePin}
                        onChange={(e) => setEnablePin(e.target.checked)}
                        className="w-4 h-4 accent-espresso rounded cursor-pointer"
                      />
                      <span className="font-jakarta text-xs md:text-sm text-espresso">
                        Aktifkan PIN 4 digit untuk pengunjung publik
                      </span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={enableWatermark}
                        onChange={(e) => setEnableWatermark(e.target.checked)}
                        className="w-4 h-4 accent-espresso rounded cursor-pointer"
                      />
                      <span className="font-jakarta text-xs md:text-sm text-espresso">
                        Tampilkan watermark tipis pada foto preview
                      </span>
                    </label>
                  </div>

                  {/* Submit CTA Button */}
                  <button
                    type="submit"
                    disabled={isPublishing}
                    className="mt-1 w-full bg-mustard hover:bg-mustard-light text-espresso py-3.5 px-6 rounded-xl border-[1.5px] border-espresso font-anton text-base md:text-lg uppercase tracking-wider shadow-retro transition-all flex items-center justify-center gap-2"
                  >
                    <Bolt className="w-4 h-4 fill-espresso" />
                    <span>
                      {isPublishing
                        ? 'Menyimpan Galeri...'
                        : 'Simpan & Buat Link Galeri'}
                    </span>
                  </button>

                  {publishSuccessMsg && (
                    <div className="p-3.5 rounded-xl bg-cream border-[1.5px] border-espresso flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-jakarta text-xs font-bold text-espresso">
                        <CheckCircle2 className="w-4 h-4 text-crimson shrink-0" />
                        <span>{publishSuccessMsg}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/${loggedStudio && !loggedStudio.is_super_admin ? loggedStudio.studio_slug : studioSlug}/${slug}`}
                          className="px-3 py-1 rounded-lg bg-mustard text-espresso font-jakarta font-bold text-xs border border-espresso"
                        >
                          Buka Pilih Foto →
                        </Link>
                        <Link
                          href={`/${slug}?t=${ownerToken}`}
                          className="px-3 py-1 rounded-lg bg-white text-espresso font-jakarta font-bold text-xs border border-espresso"
                        >
                          Buka Album →
                        </Link>
                      </div>
                    </div>
                  )}
                </form>
              </div>

              {/* RIGHT COLUMN: AUTO-WHATSAPP COPY BOX & LIGHTROOM FILTER EXPORTER (Cols 8-12) */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                {/* CARD 1: AUTO-WHATSAPP COPY BOX */}
                <div className="bg-white rounded-2xl border-[1.5px] border-espresso shadow-retro overflow-hidden flex flex-col">
                  <div className="bg-espresso text-cream px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-mustard" />
                      <span className="font-anton text-sm uppercase tracking-wider">
                        Pesan WhatsApp Otomatis
                      </span>
                    </div>
                    <span className="font-jakarta text-[11px] text-cream/80">
                      Siap Salin
                    </span>
                  </div>

                  <div className="p-5 flex flex-col gap-3.5">
                    <div className="bg-cream/60 p-4 rounded-xl border border-espresso/30">
                      <pre className="font-jakarta text-xs md:text-[13px] text-espresso whitespace-pre-wrap leading-relaxed select-all overflow-x-auto">
                        {whatsappMessage}
                      </pre>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2.5">
                      <button
                        type="button"
                        onClick={handleCopyWa}
                        className="w-full sm:flex-1 bg-mustard hover:bg-mustard-light text-espresso py-2.5 px-4 rounded-xl border-[1.5px] border-espresso font-anton text-sm uppercase tracking-wider shadow-retro-sm transition-all flex items-center justify-center gap-2"
                      >
                        {copiedWa ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-crimson" />
                            <span>Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Salin Pesan WA</span>
                          </>
                        )}
                      </button>

                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto bg-white hover:bg-cream text-espresso py-2.5 px-4 rounded-xl border-[1.5px] border-espresso font-jakarta font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Kirim WA</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* CARD 2: LIGHTROOM FILTER EXPORTER */}
                <div className="bg-white rounded-2xl border-[1.5px] border-espresso shadow-retro overflow-hidden flex flex-col">
                  <div className="bg-espresso text-cream px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-mustard" />
                      <span className="font-anton text-sm uppercase tracking-wider">
                        Export Filter Lightroom
                      </span>
                    </div>
                    <span className="font-jakarta text-[11px] text-cream/80">
                      {activeSelections.length} /{' '}
                      {activeGallery.selection_quota} Dipilih
                    </span>
                  </div>

                  <div className="p-5 flex flex-col gap-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-fraunces font-bold text-sm text-espresso">
                        {activeGallery.client_name}
                      </span>

                      <div className="flex items-center gap-3">
                        <select
                          value={lrSeparator}
                          onChange={(e) =>
                            setLrSeparator(
                              e.target.value as 'comma' | 'space' | 'newline'
                            )
                          }
                          aria-label="Pemisah Filename"
                          className="bg-cream text-espresso px-2 py-1 rounded border border-espresso/40 font-jakarta text-xs font-semibold focus:outline-none"
                        >
                          <option value="comma">Pemisah: Koma (,)</option>
                          <option value="space">Pemisah: Spasi</option>
                          <option value="newline">Pemisah: Baris Baru</option>
                        </select>

                        <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={includeExtension}
                            onChange={(e) =>
                              setIncludeExtension(e.target.checked)
                            }
                            className="w-4 h-4 accent-espresso rounded cursor-pointer"
                          />
                          <span className="font-jakarta text-xs font-semibold text-espresso">
                            .JPG
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="bg-cream/70 text-espresso p-3.5 rounded-xl border border-espresso/40 font-mono text-xs leading-relaxed select-all overflow-x-auto max-h-36">
                      <pre className="whitespace-pre-wrap">
                        {lightroomFilterString}
                      </pre>
                    </div>

                    {activeSelections.some(
                      (s) => s.note.trim().length > 0
                    ) && (
                      <div className="bg-cream/40 p-3 rounded-xl border border-espresso/20 flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                        <span className="font-jakarta font-bold text-[11px] uppercase tracking-wider text-espresso-muted">
                          Catatan Revisi Klien:
                        </span>
                        {activeSelections
                          .filter((s) => s.note.trim().length > 0)
                          .map((s) => (
                            <div
                              key={s.photo_id}
                              className="font-jakarta text-xs text-espresso leading-snug"
                            >
                              <strong className="font-mono">
                                {s.filename}:
                              </strong>{' '}
                              “{s.note}”
                            </div>
                          ))}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center gap-2.5">
                      <button
                        type="button"
                        onClick={handleCopyLightroom}
                        className="w-full sm:flex-1 bg-mustard hover:bg-mustard-light text-espresso py-2.5 px-4 rounded-xl border-[1.5px] border-espresso font-anton text-sm uppercase tracking-wider shadow-retro-sm transition-all flex items-center justify-center gap-2"
                      >
                        {copiedLr ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-crimson" />
                            <span>Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy untuk Lightroom</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadLightroomTxt}
                        className="w-full sm:w-auto bg-white hover:bg-cream text-espresso py-2.5 px-4 rounded-xl border-[1.5px] border-espresso font-jakarta font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>.TXT</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM TABLE: RECENT CLIENT GALLERIES */}
            <section className="w-full bg-white rounded-2xl border-[1.5px] border-espresso shadow-retro overflow-hidden flex flex-col">
              <div className="bg-espresso text-cream px-6 py-3.5 flex flex-wrap items-center justify-between gap-2">
                <span className="font-anton text-base uppercase tracking-wider">
                  Daftar Galeri Klien ({loggedStudio?.studio_name})
                </span>
                <span className="font-jakarta text-xs text-cream/80">
                  Klik baris untuk memuat link WA &amp; Lightroom
                </span>
              </div>

              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-cream text-espresso font-jakarta font-bold text-xs uppercase border-b-[1.5px] border-espresso">
                      <th className="p-3.5 pl-6">Kode</th>
                      <th className="p-3.5">Klien &amp; Link</th>
                      <th className="p-3.5">Progres Pilihan</th>
                      <th className="p-3.5">Token Pemilik</th>
                      <th className="p-3.5">PIN</th>
                      <th className="p-3.5 pr-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-espresso/15 font-jakarta text-sm">
                    {visibleGalleries.map((gal) => {
                      const galSels = selectionsMap[gal.id] || [];
                      const isRowActive = activeGallery.id === gal.id;

                      return (
                        <tr
                          key={gal.id}
                          onClick={() => handleSelectGalleryFromRow(gal)}
                          className={`cursor-pointer transition-colors ${
                            isRowActive
                              ? 'bg-cream/80'
                              : 'bg-white hover:bg-cream/40'
                          }`}
                        >
                          <td className="p-3.5 pl-6 font-mono font-bold text-xs text-espresso">
                            {gal.order_code}
                          </td>
                          <td className="p-3.5">
                            <div className="flex flex-col">
                              <span className="font-fraunces font-bold text-espresso">
                                {gal.client_name}
                              </span>
                              <span className="font-mono text-xs text-espresso-muted">
                                /{gal.studio_slug}/{gal.slug}
                              </span>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 font-jakarta font-bold text-xs px-2.5 py-1 rounded-full border border-espresso ${
                                gal.is_locked
                                  ? 'bg-espresso text-cream'
                                  : galSels.length > 0
                                    ? 'bg-mustard text-espresso'
                                    : 'bg-cream text-espresso'
                              }`}
                            >
                              {galSels.length} / {gal.selection_quota} Foto{' '}
                              {gal.is_locked ? '(Terkunci)' : ''}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono text-xs text-espresso-muted">
                            {gal.owner_token}
                          </td>
                          <td className="p-3.5 font-mono text-xs font-bold text-espresso">
                            {gal.album_pin || '—'}
                          </td>
                          <td
                            className="p-3.5 pr-6 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="inline-flex items-center gap-2">
                              <Link
                                href={`/${gal.studio_slug}/${gal.slug}`}
                                className="px-3 py-1 rounded-lg bg-cream hover:bg-mustard border border-espresso font-jakarta font-bold text-xs transition-colors"
                              >
                                Pilih Foto
                              </Link>
                              <Link
                                href={`/${gal.slug}?t=${gal.owner_token}`}
                                className="px-3 py-1 rounded-lg bg-espresso text-cream hover:bg-crimson border border-espresso font-jakarta font-bold text-xs transition-colors"
                              >
                                Album
                              </Link>
                              {visibleGalleries.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteGallery(gal)}
                                  title="Hapus Galeri"
                                  className="p-1.5 rounded-lg bg-white hover:bg-crimson hover:text-cream text-espresso-muted border border-espresso/30 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>

      <GiantFooter
        studioName={
          loggedStudio?.studio_name ||
          (studioSlug === 'zeevisual' ? 'Zeevisual' : studioSlug)
        }
        studioSlug={loggedStudio?.studio_slug || studioSlug}
      />
    </div>
  );
}
