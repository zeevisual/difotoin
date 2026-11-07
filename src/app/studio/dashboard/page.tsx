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
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
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
  updateStudioSubscriptionInfo,
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
  const [studioBrandName, setStudioBrandName] = useState('Zeevisual');
  const [studioWhatsapp, setStudioWhatsapp] = useState('');
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
            setStudioBrandName(authRes.studio.studio_name);
            setStudioWhatsapp(authRes.studio.whatsapp_number || '');
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
      setStudioBrandName(res.studio.studio_name);
      setStudioWhatsapp(res.studio.whatsapp_number || '');
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
    setStudioBrandName(loggedStudio?.studio_name || 'Zeevisual');
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

  // Exact Indonesian WhatsApp message dynamically branded to the Photographer's Studio Name
  const whatsappMessage = useMemo(() => {
    const cleanStudio =
      (loggedStudio && !loggedStudio.is_super_admin
        ? loggedStudio.studio_slug
        : studioSlug.trim()) || 'zeevisual';
    const displayBrand =
      studioBrandName.trim() || loggedStudio?.studio_name || cleanStudio;
    const cleanClient = clientName.trim() || 'Klien';
    const cleanSlug = slug.trim() || slugifyClientName(cleanClient);
    const cleanToken = ownerToken.trim() || 'mhttesqg7rjx';

    return `Halo ${cleanClient}
Galeri foto kamu dari ${displayBrand} sudah siap di Difotoin.

Pilih foto favorit kamu :
${baseUrl}/${cleanStudio}/${cleanSlug}

Bagikan album ini ke teman dan keluarga kamu :
${baseUrl}/${cleanSlug}?t=${cleanToken}
(bisa atur siapa yang lihat, ganti sampul, bikin pin)

Selamat menikmati momennya`;
  }, [
    baseUrl,
    studioSlug,
    studioBrandName,
    clientName,
    slug,
    ownerToken,
    loggedStudio,
  ]);

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
    const rawNames = (
      activeSelections.length > 0
        ? activeSelections.map((s) => s.filename)
        : defaultDemoFiles
    )
      .slice()
      .sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
      );

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

      const resolvedBrandName =
        studioBrandName.trim() ||
        (loggedStudio.is_super_admin
          ? effectiveStudioSlug === 'zeevisual'
            ? 'Zeevisual'
            : effectiveStudioSlug
          : loggedStudio.studio_name);

      // Persist Studio Admin's custom brand name & WhatsApp to their subscription profile
      if (
        !loggedStudio.is_super_admin &&
        (resolvedBrandName !== loggedStudio.studio_name ||
          studioWhatsapp.trim() !== loggedStudio.whatsapp_number)
      ) {
        const updatedProfile = await updateStudioSubscriptionInfo(
          loggedStudio.id,
          {
            studio_name: resolvedBrandName,
            whatsapp_number: studioWhatsapp.trim(),
          }
        );
        if (updatedProfile) {
          setLoggedStudio(updatedProfile);
        }
      }

      const created = await createGallery({
        studio_slug: effectiveStudioSlug,
        studio_name: resolvedBrandName,
        studio_whatsapp:
          studioWhatsapp.trim() || loggedStudio.whatsapp_number || '',
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
    setStudioBrandName(gal.studio_name || gal.studio_slug);
    setStudioWhatsapp(gal.studio_whatsapp || '');
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
  // EXCLUSIVE PHOTOGRAPHER SUBSCRIPTION LOGIN GATE (FUTURISTIC GLASSMORPHISM)
  // ============================================================================
  if (!authChecking && !loggedStudio) {
    return (
      <div className="min-h-screen flex flex-col futuristic-canvas text-slate-100">
        <header className="w-full glass-header sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 md:px-10 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-1 h-5 bg-cyan-400 rounded-full shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
              <span className="font-anton text-2xl text-white uppercase tracking-widest group-hover:text-cyan-400 transition-colors">
                DIFOTOIN
              </span>
            </Link>
            <span className="inline-flex items-center gap-1.5 glass-pill text-cyan-300 font-jakarta font-bold text-xs px-3.5 py-1.5 rounded-full">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              Khusus Studio Terdaftar
            </span>
          </div>
        </header>

        <main className="flex-1 w-full flex items-center justify-center px-4 py-12 relative overflow-hidden">
          {/* Ambient Futuristic Glow Orbs */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[320px] bg-cyan-500/15 blur-[130px] rounded-full" />
          <div className="pointer-events-none absolute bottom-0 right-1/4 w-[380px] h-[260px] bg-indigo-500/10 blur-[120px] rounded-full" />

          <div className="relative z-10 w-full max-w-md glass-panel-strong rounded-2xl overflow-hidden">
            <div className="bg-white/[0.04] border-b border-white/10 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-cyan-400" />
                <span className="font-jakarta font-bold text-xs uppercase tracking-[0.18em] text-white">
                  Login Lisensi Studio Fotografer
                </span>
              </div>
              <span className="font-jakarta text-[11px] text-cyan-400 font-semibold">
                Member Only
              </span>
            </div>

            <form
              onSubmit={handleLoginSubmit}
              className="p-6 md:p-8 flex flex-col gap-5"
            >
              <div className="flex flex-col gap-1.5">
                <h1 className="font-fraunces font-bold text-2xl text-white">
                  Masuk ke Dashboard Studio
                </h1>
                <p className="font-jakarta text-xs text-slate-400 leading-relaxed">
                  Dashboard ini hanya dapat diakses oleh fotografer &amp; studio
                  yang memiliki lisensi berlangganan aktif di Difotoin.
                </p>
              </div>

              {loginError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 font-jakarta text-xs font-semibold leading-relaxed">
                  {loginError}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="login-studio-slug"
                  className="font-jakarta font-bold text-xs uppercase tracking-wider text-slate-300"
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
                  placeholder="Contoh: zeevisual"
                  required
                  className="w-full bg-white/[0.04] text-white placeholder:text-slate-500 px-3.5 py-2.5 rounded-xl border border-white/15 font-jakarta font-semibold text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="login-access-code"
                  className="font-jakarta font-bold text-xs uppercase tracking-wider text-slate-300"
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
                  className="w-full bg-white/[0.04] text-white placeholder:text-slate-500 px-3.5 py-2.5 rounded-xl border border-white/15 font-mono font-bold text-sm tracking-wider focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 py-3.5 px-5 rounded-xl font-jakarta font-bold text-xs uppercase tracking-[0.18em] shadow-[0_0_24px_rgba(34,211,238,0.35)] transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {isLoggingIn
                    ? 'Memverifikasi Lisensi...'
                    : 'Buka Dashboard Studio'}
                </span>
              </button>

              {/* Free Photographer Sandbox Demo Card (Test with Own Google Drive Link) */}
              <div className="pt-3 border-t border-white/10 flex flex-col gap-3">
                <div className="p-4 rounded-xl bg-cyan-400/[0.07] border border-cyan-400/30 flex flex-col gap-2.5 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-jakarta font-bold text-xs text-cyan-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Fotografer Lain? Coba Mode Demo Gratis</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono text-[10px] font-bold uppercase">
                      Testing
                    </span>
                  </div>
                  <p className="font-jakarta text-[11px] text-slate-300 leading-relaxed">
                    Tes langsung tampilan Pilih Foto &amp; Album 3D memakai{' '}
                    <strong className="text-white">
                      link folder Google Drive foto Anda sendiri
                    </strong>
                    . Pengiriman link klien &amp; teks daftar foto dikunci hingga
                    berlangganan.
                  </p>
                  <Link
                    href="/studio/demo"
                    data-cursor="DEMO"
                    className="btn-futuristic w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-cyan-400 hover:text-slate-950 text-white border border-cyan-400/40 font-jakarta font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Coba Demo Pakai Google Drive Sendiri →</span>
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-left">
                  <div className="p-2.5 rounded-xl bg-amber-400/[0.06] border border-amber-400/20">
                    <div className="font-jakarta font-bold text-[11px] text-amber-300 flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      <span>Super Admin</span>
                    </div>
                    <p className="font-jakarta text-[10px] text-slate-400 mt-0.5 leading-snug">
                      Owner Utama (Zeevisual) — Kelola member, lisensi &amp; seluruh galeri.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-cyan-400/[0.06] border border-cyan-400/20">
                    <div className="font-jakarta font-bold text-[11px] text-cyan-300 flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      <span>Studio Admin</span>
                    </div>
                    <p className="font-jakarta text-[10px] text-slate-400 mt-0.5 leading-snug">
                      Fotografer Terdaftar — Nama web otomatis mengikuti brand studio Anda.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/[0.03] p-3.5 rounded-xl border border-white/10 flex flex-col gap-1.5 text-center">
                <span className="font-jakarta text-xs text-slate-300">
                  Ingin Full Akses (Kirim Link Klien &amp; Ekspor Teks Foto)?
                </span>
                <a
                  href="https://wa.me/6289614114644?text=Halo%20Super%20Admin%20Zeevisual%2C%20saya%20ingin%20berlangganan%20Full%20Akses%20Studio%20di%20Difotoin."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 font-jakarta font-bold text-xs text-cyan-400 hover:text-cyan-300"
                >
                  <span>Hubungi Super Admin • WA 089614114644 →</span>
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
    <div className="min-h-screen flex flex-col futuristic-canvas text-slate-100">
      {/* Clean Futuristic Glass Sticky Header */}
      <header className="sticky top-0 z-50 w-full glass-header">
        <div className="w-full px-4 md:px-10 h-16 flex items-center justify-between">
          <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-1 h-5 bg-cyan-400 rounded-full shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
                <span className="font-anton text-2xl text-white uppercase tracking-widest group-hover:text-cyan-400 transition-colors">
                  {loggedStudio?.is_super_admin
                    ? 'DIFOTOIN'
                    : loggedStudio?.studio_name || 'DIFOTOIN'}
                </span>
              </Link>
              <span className="hidden sm:inline-flex items-center gap-1.5 bg-white/5 text-slate-200 font-jakarta font-bold text-xs px-2.5 py-1 rounded-lg border border-white/10">
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                /{loggedStudio?.studio_slug || studioSlug}
              </span>
              {loggedStudio?.is_super_admin ? (
                <span className="hidden md:inline-flex items-center gap-1.5 bg-amber-400/15 text-amber-300 font-jakarta font-bold text-[11px] px-3 py-0.5 rounded-full border border-amber-400/40 shadow-[0_0_14px_rgba(251,191,36,0.2)]">
                  <Crown className="w-3.5 h-3.5 text-amber-300" />
                  SUPER ADMIN (OWNER ZEEVISUAL)
                </span>
              ) : (
                <span className="hidden md:inline-flex items-center gap-1.5 bg-cyan-400/15 text-cyan-300 font-jakarta font-bold text-[11px] px-3 py-0.5 rounded-full border border-cyan-400/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  STUDIO ADMIN PARTNER
                </span>
              )}
            </div>

            <nav className="hidden lg:flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('galleries')}
                className={`font-jakarta font-bold text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-lg border transition-all ${
                  activeTab === 'galleries'
                    ? 'bg-cyan-400 text-slate-950 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                    : 'text-slate-300 border-transparent hover:bg-white/5 hover:text-white'
                }`}
              >
                Kelola Galeri Klien
              </button>

              {loggedStudio?.is_super_admin && (
                <button
                  type="button"
                  onClick={() => setActiveTab('subscriptions')}
                  className={`inline-flex items-center gap-1.5 font-jakarta font-bold text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-lg border transition-all ${
                    activeTab === 'subscriptions'
                      ? 'bg-cyan-400 text-slate-950 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                      : 'text-slate-300 border-transparent hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Member Langganan ({studioList.length})</span>
                </button>
              )}

              <Link
                href={`/${studioSlug || 'zeevisual'}/${slug || 'aida-fitri-harahab'}`}
                className="font-jakarta font-semibold text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                Lihat Pilih Foto
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col text-right">
                <span className="font-jakarta font-bold text-xs text-white">
                  {loggedStudio?.studio_name || 'Zeevisual'}
                </span>
                <span className="font-jakarta text-[11px] text-slate-400">
                  {loggedStudio?.plan_name} •{' '}
                  {isSupabaseConfigured ? 'Supabase Aktif' : 'Mode Lokal'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Keluar dari Dashboard Studio"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 hover:border-rose-500/40 text-slate-200 hover:text-rose-200 border border-white/10 font-jakarta font-bold text-xs transition-all"
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
        {/* Futuristic Glass Top Header Card + Tab Switcher */}
        <section className="w-full glass-panel p-6 md:p-8 rounded-2xl flex flex-col gap-6 relative overflow-hidden">
          <div className="pointer-events-none absolute -right-20 -top-20 w-72 h-72 bg-cyan-500/10 blur-[100px] rounded-full" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="flex flex-col gap-1.5 max-w-2xl">
              {loggedStudio?.is_super_admin ? (
                <div className="inline-flex items-center gap-2 text-amber-300 font-jakarta font-bold text-xs uppercase tracking-[0.2em]">
                  <Crown className="w-3.5 h-3.5 text-amber-300" />
                  <span>
                    SUPER ADMIN COMMAND CENTER • ZEEVISUAL (PLATFORM OWNER)
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 text-cyan-400 font-jakarta font-bold text-xs uppercase tracking-[0.2em]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    STUDIO ADMIN WORKSPACE •{' '}
                    {loggedStudio?.studio_name.toUpperCase()} (
                    {loggedStudio?.plan_name})
                  </span>
                </div>
              )}
              <h1 className="font-anton text-3xl md:text-4xl text-white uppercase tracking-wider leading-none mt-1">
                {activeTab === 'subscriptions' && loggedStudio?.is_super_admin
                  ? 'Kelola Member & Lisensi Langganan Fotografer'
                  : loggedStudio?.is_super_admin
                  ? 'Master Studio & Seleksi Foto (Super Admin)'
                  : `Workspace Fotografer — ${loggedStudio?.studio_name}`}
              </h1>
              <p className="font-jakarta text-sm text-slate-400 leading-relaxed mt-1">
                {activeTab === 'subscriptions' && loggedStudio?.is_super_admin
                  ? 'Khusus Super Admin (Zeevisual): daftarkan fotografer berlangganan, kelola kode akses privat, atur kuota galeri, dan salin pesan aktivasi WhatsApp.'
                  : loggedStudio?.is_super_admin
                  ? 'Kontrol penuh seluruh galeri klien Zeevisual maupun mitra fotografer, salin filter Lightroom, dan pantau aktivitas seleksi foto.'
                  : `Seluruh halaman pilih foto & album klien Anda otomatis memakai identitas brand "${studioBrandName || loggedStudio?.studio_name}" (dengan watermark platform Crafted by Zeevisual).`}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full lg:w-auto shrink-0">
              <div className="bg-white/[0.03] p-3.5 px-4 rounded-xl border border-white/10 flex flex-col justify-center">
                <span className="font-jakarta font-semibold text-[11px] text-slate-400 uppercase tracking-wider">
                  Galeri Studio
                </span>
                <span className="font-anton text-2xl text-white leading-tight mt-0.5">
                  {visibleGalleries.length} /{' '}
                  {loggedStudio?.is_super_admin
                    ? '∞'
                    : loggedStudio?.max_galleries}
                </span>
              </div>
              <div className="bg-cyan-400/10 p-3.5 px-4 rounded-xl border border-cyan-400/30 flex flex-col justify-center">
                <span className="font-jakarta font-semibold text-[11px] text-cyan-300 uppercase tracking-wider">
                  Foto Terpilih
                </span>
                <span className="font-anton text-2xl text-cyan-300 leading-tight mt-0.5">
                  {activeSelections.length} File
                </span>
              </div>
              {loggedStudio?.is_super_admin ? (
                <div className="bg-amber-400/10 p-3.5 px-4 rounded-xl border border-amber-400/30 flex flex-col justify-center">
                  <span className="font-jakarta font-semibold text-[11px] text-amber-300 uppercase tracking-wider">
                    Member Studio
                  </span>
                  <span className="font-anton text-2xl text-amber-200 leading-tight mt-0.5">
                    {studioList.length} Akun
                  </span>
                </div>
              ) : (
                <div className="bg-emerald-400/10 p-3.5 px-4 rounded-xl border border-emerald-400/30 flex flex-col justify-center">
                  <span className="font-jakarta font-semibold text-[11px] text-emerald-300 uppercase tracking-wider">
                    Status Lisensi
                  </span>
                  <span className="font-anton text-2xl text-emerald-200 leading-tight mt-0.5">
                    AKTIF
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Mobile & Desktop Quick Mode Switcher for Super Admin */}
          {loggedStudio?.is_super_admin && (
            <div className="flex flex-wrap items-center gap-2.5 pt-4 border-t border-white/10 relative z-10">
              <button
                type="button"
                onClick={() => setActiveTab('galleries')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-jakarta font-bold text-xs border transition-all ${
                  activeTab === 'galleries'
                    ? 'bg-cyan-400 text-slate-950 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]'
                    : 'bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>1. Kelola Galeri Klien</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('subscriptions')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-jakarta font-bold text-xs border transition-all ${
                  activeTab === 'subscriptions'
                    ? 'bg-cyan-400 text-slate-950 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]'
                    : 'bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Crown className="w-4 h-4" />
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
            <div className="lg:col-span-5 glass-panel rounded-2xl overflow-hidden flex flex-col">
              <div className="bg-white/[0.04] border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-cyan-400" />
                  <span className="font-jakarta font-bold text-xs uppercase tracking-[0.18em] text-white">
                    Tambah Member Fotografer Baru
                  </span>
                </div>
              </div>

              <form
                onSubmit={handleCreateSubscriber}
                className="p-6 flex flex-col gap-4"
              >
                <div className="flex flex-col gap-1.5">
                  <label className="font-jakarta font-bold text-xs uppercase tracking-wider text-slate-300">
                    Nama Studio Fotografer
                  </label>
                  <input
                    type="text"
                    value={newSubStudioName}
                    onChange={(e) => {
                      setNewSubStudioName(e.target.value);
                      setNewSubStudioSlug(slugifyClientName(e.target.value));
                    }}
                    placeholder="Contoh: Zeevisual"
                    required
                    className="w-full bg-white/[0.04] text-white placeholder:text-slate-500 px-3.5 py-2.5 rounded-xl border border-white/15 font-jakarta font-semibold text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-jakarta font-bold text-xs uppercase tracking-wider text-slate-300">
                      Slug URL Studio
                    </label>
                    <input
                      type="text"
                      value={newSubStudioSlug}
                      onChange={(e) =>
                        setNewSubStudioSlug(slugifyClientName(e.target.value))
                      }
                      placeholder="zeevisual"
                      required
                      className="w-full bg-white/[0.03] text-cyan-300 placeholder:text-slate-500 px-3.5 py-2.5 rounded-xl border border-white/15 font-mono font-bold text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-jakarta font-bold text-xs uppercase tracking-wider text-slate-300">
                      Nama Pemilik
                    </label>
                    <input
                      type="text"
                      value={newSubOwnerName}
                      onChange={(e) => setNewSubOwnerName(e.target.value)}
                      placeholder="Contoh: Zeevisual"
                      required
                      className="w-full bg-white/[0.04] text-white placeholder:text-slate-500 px-3.5 py-2.5 rounded-xl border border-white/15 font-jakarta text-sm focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-jakarta font-bold text-xs uppercase tracking-wider text-slate-300">
                      Paket Langganan
                    </label>
                    <select
                      value={newSubPlan}
                      onChange={(e) =>
                        setNewSubPlan(
                          e.target.value as StudioSubscription['plan_name']
                        )
                      }
                      className="w-full bg-[#111722] text-white px-3 py-2.5 rounded-xl border border-white/15 font-jakarta font-semibold text-xs focus:outline-none focus:border-cyan-400"
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
                    <label className="font-jakarta font-bold text-xs uppercase tracking-wider text-slate-300">
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
                      className="w-full bg-white/[0.04] text-white px-3.5 py-2 rounded-xl border border-white/15 font-jakarta font-bold text-sm focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-jakarta font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center justify-between">
                    <span>Kode Lisensi Login</span>
                    <button
                      type="button"
                      onClick={() =>
                        setNewSubAccessCode(generateLicenseCode('DFTN'))
                      }
                      className="inline-flex items-center gap-1 text-[11px] text-cyan-400 font-semibold hover:underline"
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
                    className="w-full bg-white/[0.03] text-cyan-300 px-3.5 py-2.5 rounded-xl border border-white/15 font-mono font-bold text-sm tracking-wider focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-1 w-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 py-3 px-5 rounded-xl font-jakarta font-bold text-xs uppercase tracking-[0.18em] shadow-[0_0_24px_rgba(34,211,238,0.3)] transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Aktifkan Lisensi Member</span>
                </button>

                {subSuccessMsg && (
                  <div className="p-3 rounded-xl bg-cyan-400/10 border border-cyan-400/30 font-jakarta text-xs font-bold text-cyan-200">
                    ✓ {subSuccessMsg}
                  </div>
                )}
              </form>
            </div>

            {/* RIGHT: LIST OF SUBSCRIBED STUDIOS */}
            <div className="lg:col-span-7 glass-panel rounded-2xl overflow-hidden flex flex-col">
              <div className="bg-white/[0.04] border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <span className="font-jakarta font-bold text-xs uppercase tracking-[0.18em] text-white">
                  Daftar Studio Berlangganan ({studioList.length})
                </span>
                <span className="font-jakarta text-xs text-slate-400">
                  Salin Lisensi WA atau Bekukan Akses
                </span>
              </div>

              <div className="divide-y divide-white/10">
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
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-fraunces font-bold text-lg text-white">
                            {sub.studio_name}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/15 font-mono font-bold text-xs text-cyan-300">
                            /{sub.studio_slug}
                          </span>
                          {sub.is_super_admin ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 font-jakarta font-bold text-[10px] uppercase">
                              Owner Utama
                            </span>
                          ) : !sub.is_active || isExpired ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-jakarta font-bold text-[10px] uppercase">
                              {isExpired ? 'Expired' : 'Nonaktif'}
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-jakarta font-bold text-[10px] uppercase">
                              Aktif
                            </span>
                          )}
                        </div>

                        <div className="font-jakarta text-xs text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>Pemilik: {sub.owner_name}</span>
                          <span>•</span>
                          <span>
                            Kode Lisensi:{' '}
                            <strong className="font-mono text-white">
                              {sub.access_code}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>
                            Galeri: {studioGalleryCount} /{' '}
                            {sub.is_super_admin ? '∞' : sub.max_galleries}
                          </span>
                        </div>

                        <div className="font-jakarta text-[11px] text-slate-400">
                          Paket: <strong className="text-slate-200">{sub.plan_name}</strong>{' '}
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
                          className="px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-jakarta font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
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
                              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 border border-white/15 font-jakarta font-bold text-xs transition-colors"
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
                              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 border border-white/15 font-jakarta font-bold text-xs transition-colors"
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
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 text-slate-400 border border-white/10 transition-colors"
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
              <div className="lg:col-span-7 glass-panel rounded-2xl overflow-hidden flex flex-col">
                <div className="bg-white/[0.04] border-b border-white/10 px-6 py-4 flex items-center justify-between">
                  <span className="font-jakarta font-bold text-xs uppercase tracking-[0.18em] text-white">
                    Konfigurasi Galeri Klien
                  </span>
                  <button
                    type="button"
                    onClick={handleResetNewForm}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white/5 hover:bg-cyan-400 hover:text-slate-950 text-slate-200 border border-white/10 font-jakarta font-bold text-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Reset Form Baru</span>
                  </button>
                </div>

                <form
                  onSubmit={handlePublishGallery}
                  className="p-6 md:p-8 flex flex-col gap-5"
                >
                  {/* Row 1: Studio Brand Identity (studio_slug + Nama Brand Fotografer) */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/10">
                    <div className="sm:col-span-5 flex flex-col gap-1.5">
                      <label
                        htmlFor="studio-slug-input"
                        className="font-jakarta font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center justify-between"
                      >
                        <span>ID Studio (`studio_slug`)</span>
                        {!loggedStudio?.is_super_admin && (
                          <span className="text-[10px] text-slate-400">
                            Terkunci
                          </span>
                        )}
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
                        className="w-full bg-white/[0.03] text-cyan-300 px-3.5 py-2.5 rounded-xl border border-white/15 font-mono font-semibold text-sm focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div className="sm:col-span-7 flex flex-col gap-1.5">
                      <label
                        htmlFor="studio-brand-input"
                        className="font-jakarta font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center justify-between"
                      >
                        <span>Nama Brand Fotografer di Web</span>
                        <span className="text-[10px] text-cyan-400 font-semibold">
                          Tampil di Halaman Klien
                        </span>
                      </label>
                      <input
                        id="studio-brand-input"
                        type="text"
                        value={studioBrandName}
                        onChange={(e) => setStudioBrandName(e.target.value)}
                        placeholder={
                          loggedStudio?.studio_name || 'Contoh: Zeevisual'
                        }
                        required
                        className="w-full bg-white/[0.04] text-white placeholder:text-slate-500 px-3.5 py-2.5 rounded-xl border border-white/15 font-jakarta font-bold text-sm focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div className="sm:col-span-12 flex items-center justify-between gap-2 pt-1 text-[11px] font-jakarta text-slate-400">
                      <span>
                        Seluruh header, judul, &amp; pesan WA klien otomatis menggunakan nama brand{' '}
                        <strong className="text-cyan-300">
                          {studioBrandName || loggedStudio?.studio_name || 'Zeevisual'}
                        </strong>
                        .
                      </span>
                      <span className="hidden md:inline-block font-mono text-[10px] text-slate-500 uppercase tracking-widest shrink-0">
                        Watermark: Crafted by Zeevisual
                      </span>
                    </div>
                  </div>

                  {/* Row 1B: Client Name */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="client-name-input"
                      className="font-jakarta font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center justify-between"
                    >
                      <span>Nama Klien / Pasangan / Event</span>
                      <span className="text-[11px] text-cyan-400 font-semibold">
                        *wajib diisi
                      </span>
                    </label>
                    <input
                      id="client-name-input"
                      type="text"
                      value={clientName}
                      onChange={(e) => handleClientNameChange(e.target.value)}
                      placeholder="Contoh: Zeevisual"
                      required
                      className="w-full bg-white/[0.04] text-white placeholder:text-slate-500 px-3.5 py-2.5 rounded-xl border border-white/15 font-fraunces font-bold text-base focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  {/* Row 2: Auto-generated Slug & Owner Token */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <div className="sm:col-span-6 flex flex-col gap-1.5">
                      <label
                        htmlFor="client-slug-input"
                        className="font-jakarta font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center justify-between"
                      >
                        <span>Slug URL Klien</span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsSlugManual(false);
                            setSlug(slugifyClientName(clientName));
                          }}
                          className="text-[11px] text-cyan-400 hover:underline font-semibold"
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
                        className="w-full bg-white/[0.03] text-slate-200 px-3.5 py-2.5 rounded-xl border border-white/15 font-mono text-xs font-bold focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div className="sm:col-span-6 flex flex-col gap-1.5">
                      <label
                        htmlFor="owner-token-input"
                        className="font-jakarta font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center justify-between"
                      >
                        <span>Token Pemilik (`owner_token`)</span>
                        <button
                          type="button"
                          onClick={() => setOwnerToken(generateOwnerToken(12))}
                          className="inline-flex items-center gap-1 text-[11px] text-cyan-400 font-semibold hover:underline"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Acak Baru
                        </button>
                      </label>
                      <div className="flex items-center gap-2 bg-white/[0.03] px-3.5 py-2 rounded-xl border border-white/15">
                        <KeyRound className="w-4 h-4 text-cyan-400 shrink-0" />
                        <input
                          id="owner-token-input"
                          type="text"
                          value={ownerToken}
                          onChange={(e) => setOwnerToken(e.target.value)}
                          maxLength={24}
                          required
                          className="w-full bg-transparent text-white font-mono font-bold text-sm tracking-wider focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Google Drive Folder URL + Live Preview Button */}
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="gdrive-url-input"
                      className="font-jakarta font-bold text-xs uppercase tracking-wider text-slate-300 flex flex-wrap items-center justify-between gap-1"
                    >
                      <span>Link Folder Google Drive</span>
                      <span className="font-mono text-[11px] text-cyan-300 bg-white/5 px-2.5 py-0.5 rounded border border-white/10">
                        ID: {parsedFolderId}
                      </span>
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="flex-1 flex items-center gap-2.5 bg-white/[0.04] px-3.5 py-2.5 rounded-xl border border-white/15 focus-within:border-cyan-400">
                        <FolderOpen className="w-4 h-4 text-cyan-400 shrink-0" />
                        <input
                          id="gdrive-url-input"
                          type="text"
                          value={gdriveFolderUrl}
                          onChange={(e) => setGdriveFolderUrl(e.target.value)}
                          placeholder="Tempel link folder Google Drive di sini..."
                          required
                          className="w-full bg-transparent text-white placeholder:text-slate-500 font-jakarta text-sm focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleTestDriveFolder}
                        disabled={isTestingDrive}
                        className="shrink-0 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-cyan-400 hover:text-slate-950 text-slate-200 border border-white/15 font-jakarta font-bold text-xs transition-all"
                      >
                        {isTestingDrive ? 'Memuat...' : 'Cek Isi Folder'}
                      </button>
                    </div>

                    {drivePreviewPhotos.length > 0 && (
                      <div className="mt-1 p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between text-xs font-jakarta">
                          <span className="font-bold text-cyan-300">
                            ✓ {driveSourceLabel}
                          </span>
                          <button
                            type="button"
                            onClick={() => setDrivePreviewPhotos([])}
                            className="text-slate-400 hover:text-white underline text-[11px]"
                          >
                            Tutup Pratinjau
                          </button>
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto py-1">
                          {drivePreviewPhotos.slice(0, 8).map((p) => (
                            <div
                              key={p.id}
                              className={`shrink-0 h-16 rounded-none border border-white/15 overflow-hidden bg-slate-950 ${
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
                                className="w-full h-full object-cover rounded-none"
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
                      <label className="font-jakarta font-bold text-xs uppercase tracking-wider text-slate-300">
                        Kuota Pilih Foto (`selection_quota`)
                      </label>
                      <span className="font-jakarta font-bold text-xs text-cyan-300">
                        Maksimal {selectionQuota} Foto
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {[20, 40, 50, 80].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setSelectionQuota(preset)}
                          className={`py-2 rounded-xl font-jakarta font-bold text-xs border transition-all ${
                            selectionQuota === preset
                              ? 'bg-cyan-400 text-slate-950 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.25)]'
                              : 'bg-white/[0.03] text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
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
                        className="w-full bg-white/[0.04] text-center font-jakarta font-bold text-sm text-white rounded-xl border border-white/15 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  {/* Row 5: Session Type, Deadline, Optional PIN & Photographer WA */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-jakarta font-bold text-xs uppercase tracking-wider text-slate-300">
                        Nomor WA Fotografer (Tujuan Kirim Pilihan Klien)
                      </label>
                      <input
                        type="text"
                        value={studioWhatsapp}
                        onChange={(e) => setStudioWhatsapp(e.target.value)}
                        placeholder="Contoh: 089614114644"
                        className="w-full bg-white/[0.04] text-white placeholder:text-slate-500 px-3.5 py-2.5 rounded-xl border border-white/15 font-jakarta text-xs font-semibold focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-jakarta font-bold text-xs uppercase tracking-wider text-slate-300">
                        Kategori Sesi
                      </label>
                      <select
                        value={sessionType}
                        onChange={(e) => setSessionType(e.target.value)}
                        className="w-full bg-[#111722] text-white px-3 py-2.5 rounded-xl border border-white/15 font-jakarta text-xs font-semibold focus:outline-none focus:border-cyan-400"
                      >
                        <option>Editorial Pre-Wedding</option>
                        <option>Wedding Documentation</option>
                        <option>Studio Portrait Session</option>
                        <option>Family &amp; Engagement</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-jakarta font-bold text-xs uppercase tracking-wider text-slate-300">
                        Batas Waktu
                      </label>
                      <div className="flex items-center bg-white/[0.04] px-3 py-2 rounded-xl border border-white/15">
                        <Calendar className="w-4 h-4 text-cyan-400 mr-2 shrink-0" />
                        <input
                          type="text"
                          value={deadlineDate}
                          onChange={(e) => setDeadlineDate(e.target.value)}
                          className="w-full bg-transparent text-white font-jakarta text-xs font-semibold focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-jakarta font-bold text-xs uppercase tracking-wider text-slate-300">
                        PIN Album (Opsional)
                      </label>
                      <div className="flex items-center bg-white/[0.04] px-3 py-2 rounded-xl border border-white/15">
                        <Lock className="w-4 h-4 text-cyan-400 mr-2 shrink-0" />
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
                          className="w-full bg-transparent text-white placeholder:text-slate-500 font-mono font-bold text-sm tracking-widest focus:outline-none"
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
                        className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                      />
                      <span className="font-jakarta text-xs md:text-sm text-slate-300">
                        Aktifkan PIN 4 digit untuk pengunjung publik
                      </span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={enableWatermark}
                        onChange={(e) => setEnableWatermark(e.target.checked)}
                        className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                      />
                      <span className="font-jakarta text-xs md:text-sm text-slate-300">
                        Tampilkan watermark tipis pada foto preview
                      </span>
                    </label>
                  </div>

                  {/* Submit CTA Button */}
                  <button
                    type="submit"
                    disabled={isPublishing}
                    className="mt-1 w-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 py-3.5 px-6 rounded-xl font-jakarta font-bold text-xs md:text-sm uppercase tracking-[0.18em] shadow-[0_0_24px_rgba(34,211,238,0.35)] transition-all flex items-center justify-center gap-2"
                  >
                    <Bolt className="w-4 h-4 fill-slate-950" />
                    <span>
                      {isPublishing
                        ? 'Menyimpan Galeri...'
                        : 'Simpan & Buat Link Galeri'}
                    </span>
                  </button>

                  {publishSuccessMsg && (
                    <div className="p-3.5 rounded-xl bg-cyan-400/10 border border-cyan-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-jakarta text-xs font-bold text-cyan-200">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>{publishSuccessMsg}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/${loggedStudio && !loggedStudio.is_super_admin ? loggedStudio.studio_slug : studioSlug}/${slug}`}
                          className="px-3 py-1.5 rounded-lg bg-cyan-400 text-slate-950 font-jakarta font-bold text-xs"
                        >
                          Buka Pilih Foto →
                        </Link>
                        <Link
                          href={`/${slug}?t=${ownerToken}`}
                          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-jakarta font-bold text-xs border border-white/15"
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
                <div className="glass-panel rounded-2xl overflow-hidden flex flex-col">
                  <div className="bg-white/[0.04] border-b border-white/10 px-5 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-cyan-400" />
                      <span className="font-jakarta font-bold text-xs uppercase tracking-[0.18em] text-white">
                        Pesan WhatsApp Otomatis
                      </span>
                    </div>
                    <span className="font-jakarta text-[11px] text-cyan-300 font-semibold">
                      Siap Salin
                    </span>
                  </div>

                  <div className="p-5 flex flex-col gap-3.5">
                    <div className="bg-white/[0.03] p-4 rounded-xl border border-white/10">
                      <pre className="font-jakarta text-xs md:text-[13px] text-slate-200 whitespace-pre-wrap leading-relaxed select-all overflow-x-auto">
                        {whatsappMessage}
                      </pre>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2.5">
                      <button
                        type="button"
                        onClick={handleCopyWa}
                        className="w-full sm:flex-1 bg-cyan-400 hover:bg-cyan-300 text-slate-950 py-2.5 px-4 rounded-xl font-jakarta font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(34,211,238,0.25)] transition-all flex items-center justify-center gap-2"
                      >
                        {copiedWa ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-slate-950" />
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
                        className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white py-2.5 px-4 rounded-xl border border-white/15 font-jakarta font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Kirim WA</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* CARD 2: LIGHTROOM FILTER EXPORTER */}
                <div className="glass-panel rounded-2xl overflow-hidden flex flex-col">
                  <div className="bg-white/[0.04] border-b border-white/10 px-5 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-cyan-400" />
                      <span className="font-jakarta font-bold text-xs uppercase tracking-[0.18em] text-white">
                        Export Filter Lightroom
                      </span>
                    </div>
                    <span className="font-jakarta text-[11px] text-cyan-300 font-semibold">
                      {activeSelections.length} /{' '}
                      {activeGallery.selection_quota} Dipilih
                    </span>
                  </div>

                  <div className="p-5 flex flex-col gap-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-fraunces font-bold text-sm text-white">
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
                          className="bg-[#111722] text-slate-200 px-2.5 py-1 rounded-lg border border-white/15 font-jakarta text-xs font-semibold focus:outline-none focus:border-cyan-400"
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
                            className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                          />
                          <span className="font-jakarta text-xs font-semibold text-slate-300">
                            .JPG
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="bg-white/[0.03] text-cyan-300 p-3.5 rounded-xl border border-white/10 font-mono text-xs leading-relaxed select-all overflow-x-auto max-h-36">
                      <pre className="whitespace-pre-wrap">
                        {lightroomFilterString}
                      </pre>
                    </div>

                    {activeSelections.some(
                      (s) => s.note.trim().length > 0
                    ) && (
                      <div className="bg-white/[0.02] p-3 rounded-xl border border-white/10 flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                        <span className="font-jakarta font-bold text-[11px] uppercase tracking-wider text-slate-400">
                          Catatan Revisi Klien:
                        </span>
                        {activeSelections
                          .filter((s) => s.note.trim().length > 0)
                          .map((s) => (
                            <div
                              key={s.photo_id}
                              className="font-jakarta text-xs text-slate-200 leading-snug"
                            >
                              <strong className="font-mono text-cyan-300">
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
                        className="w-full sm:flex-1 bg-cyan-400 hover:bg-cyan-300 text-slate-950 py-2.5 px-4 rounded-xl font-jakarta font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(34,211,238,0.25)] transition-all flex items-center justify-center gap-2"
                      >
                        {copiedLr ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-slate-950" />
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
                        className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white py-2.5 px-4 rounded-xl border border-white/15 font-jakarta font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5 text-cyan-400" />
                        <span>.TXT</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM TABLE: RECENT CLIENT GALLERIES */}
            <section className="w-full glass-panel rounded-2xl overflow-hidden flex flex-col">
              <div className="bg-white/[0.04] border-b border-white/10 px-6 py-4 flex flex-wrap items-center justify-between gap-2">
                <span className="font-jakarta font-bold text-xs uppercase tracking-[0.18em] text-white">
                  Daftar Galeri Klien ({loggedStudio?.studio_name})
                </span>
                <span className="font-jakarta text-xs text-slate-400">
                  Klik baris untuk memuat link WA &amp; Lightroom
                </span>
              </div>

              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/[0.02] text-slate-400 font-jakarta font-bold text-[11px] uppercase tracking-wider border-b border-white/10">
                      <th className="p-3.5 pl-6">Kode</th>
                      <th className="p-3.5">Klien &amp; Link</th>
                      <th className="p-3.5">Progres Pilihan</th>
                      <th className="p-3.5">Token Pemilik</th>
                      <th className="p-3.5">PIN</th>
                      <th className="p-3.5 pr-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 font-jakarta text-sm">
                    {visibleGalleries.map((gal) => {
                      const galSels = selectionsMap[gal.id] || [];
                      const isRowActive = activeGallery.id === gal.id;

                      return (
                        <tr
                          key={gal.id}
                          onClick={() => handleSelectGalleryFromRow(gal)}
                          className={`cursor-pointer transition-colors ${
                            isRowActive
                              ? 'bg-cyan-400/[0.08]'
                              : 'hover:bg-white/[0.03]'
                          }`}
                        >
                          <td className="p-3.5 pl-6 font-mono font-bold text-xs text-cyan-300">
                            {gal.order_code}
                          </td>
                          <td className="p-3.5">
                            <div className="flex flex-col">
                              <span className="font-fraunces font-bold text-white">
                                {gal.client_name}
                              </span>
                              <span className="font-mono text-xs text-slate-400">
                                /{gal.studio_slug}/{gal.slug}
                              </span>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 font-jakarta font-bold text-xs px-2.5 py-1 rounded-full border ${
                                gal.is_locked
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : galSels.length > 0
                                    ? 'bg-cyan-400/15 text-cyan-300 border-cyan-400/30'
                                    : 'bg-white/5 text-slate-300 border-white/10'
                              }`}
                            >
                              {galSels.length} / {gal.selection_quota} Foto{' '}
                              {gal.is_locked ? '(Terkunci)' : ''}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono text-xs text-slate-400">
                            {gal.owner_token}
                          </td>
                          <td className="p-3.5 font-mono text-xs font-bold text-slate-200">
                            {gal.album_pin || '—'}
                          </td>
                          <td
                            className="p-3.5 pr-6 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="inline-flex items-center gap-2">
                              <Link
                                href={`/${gal.studio_slug}/${gal.slug}`}
                                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-cyan-400 hover:text-slate-950 text-slate-200 border border-white/15 font-jakarta font-bold text-xs transition-colors"
                              >
                                Pilih Foto
                              </Link>
                              <Link
                                href={`/${gal.slug}?t=${gal.owner_token}`}
                                className="px-3 py-1.5 rounded-lg bg-cyan-400/15 text-cyan-300 hover:bg-cyan-400 hover:text-slate-950 border border-cyan-400/30 font-jakarta font-bold text-xs transition-colors"
                              >
                                Album
                              </Link>
                              {visibleGalleries.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteGallery(gal)}
                                  title="Hapus Galeri"
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 text-slate-400 border border-white/10 transition-colors"
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
