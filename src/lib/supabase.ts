import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  CreateGalleryInput,
  CreateStudioSubscriptionInput,
  GalleryRecord,
  SelectionRecord,
  StudioSubscription,
} from '@/types/difotoin';
import {
  generateOwnerToken,
  parseGoogleDriveFolderId,
  slugifyClientName,
} from '@/lib/drive-utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseAnonKey.includes('your-anon');

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const STORAGE_GALLERIES_KEY = 'difotoin_galleries_zv_v2';
const STORAGE_SELECTIONS_KEY = 'difotoin_selections_zv_v2';
const STORAGE_STUDIOS_KEY = 'difotoin_studio_subs_zv_v2';
const LEGACY_DUMMY_STUDIO_ID = '99999999-9999-4999-8999-999999999992';

export const SUPER_ADMIN_WA_NUMBER = '6289614114644';
export const SUPER_ADMIN_WA_DISPLAY = '0896-1411-4644';

export function buildSuperAdminUpgradeWaUrl(studioName?: string): string {
  const cleanBrand = studioName?.trim();
  const intro = cleanBrand
    ? `Halo Super Admin Zeevisual, saya dari studio *${cleanBrand}* sudah mencoba Mode Demo Difotoin dan ingin berlangganan Full Akses.`
    : 'Halo Super Admin Zeevisual, saya sudah mencoba Mode Demo Difotoin dan ingin berlangganan Full Akses untuk studio saya.';
  return `https://wa.me/${SUPER_ADMIN_WA_NUMBER}?text=${encodeURIComponent(intro)}`;
}

export const SEED_STUDIO_SUBSCRIPTIONS: StudioSubscription[] = [
  {
    id: '99999999-9999-4999-8999-999999999991',
    studio_slug: 'zeevisual',
    studio_name: 'Zeevisual',
    owner_name: 'Zeevisual (Super Admin)',
    whatsapp_number: SUPER_ADMIN_WA_NUMBER,
    access_code: 'ZV2025',
    plan_name: 'Super Admin',
    max_galleries: 9999,
    is_active: true,
    is_super_admin: true,
    expires_at: null,
    created_at: '2024-10-01T00:00:00.000Z',
  },
];

export const SEED_GALLERIES: GalleryRecord[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    order_code: '#ZV-7910',
    studio_slug: 'zeevisual',
    studio_name: 'Zeevisual',
    client_name: 'Aida Fitri Harahab',
    slug: 'aida-fitri-harahab',
    session_type: 'Editorial Pre-Wedding',
    session_date: '14 Oktober 2024',
    deadline_date: '28 Oktober 2024',
    gdrive_folder_url:
      'https://drive.google.com/drive/folders/1x9BAidaFauziRAW74Editorial',
    gdrive_folder_id: '1x9BAidaFauziRAW74Editorial',
    selection_quota: 50,
    owner_token: 'mhttesqg7rjx',
    cover_photo_id: 'photo-01',
    album_pin: '2408',
    hidden_photo_ids: ['photo-08'],
    is_locked: false,
    watermark_enabled: true,
    created_at: '2024-10-14T10:00:00.000Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    order_code: '#ZV-7908',
    studio_slug: 'zeevisual',
    studio_name: 'Zeevisual',
    client_name: 'Dimas Bagus & Sarah Amalia',
    slug: 'dimas-bagus-dan-sarah-amalia',
    session_type: 'Holy Matrimony & Intimate Dinner',
    session_date: '10 Oktober 2024',
    deadline_date: '22 Oktober 2024',
    gdrive_folder_url:
      'https://drive.google.com/drive/folders/1y8CDimasSarahWedding74',
    gdrive_folder_id: '1y8CDimasSarahWedding74',
    selection_quota: 50,
    owner_token: 'k9p2x7v4nqw1',
    cover_photo_id: 'photo-02',
    album_pin: '9102',
    hidden_photo_ids: [],
    is_locked: true,
    watermark_enabled: true,
    created_at: '2024-10-10T09:00:00.000Z',
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    order_code: '#ZV-7905',
    studio_slug: 'zeevisual',
    studio_name: 'Zeevisual',
    client_name: 'Reza Mahardika & Kirana',
    slug: 'reza-mahardika-dan-kirana',
    session_type: 'Studio Portrait Film 35mm',
    session_date: '16 Oktober 2024',
    deadline_date: '30 Oktober 2024',
    gdrive_folder_url:
      'https://drive.google.com/drive/folders/1z7DRezaKiranaPortrait35mm',
    gdrive_folder_id: '1z7DRezaKiranaPortrait35mm',
    selection_quota: 30,
    owner_token: 'v5m8r2t9b4cx',
    cover_photo_id: 'photo-05',
    album_pin: null,
    hidden_photo_ids: [],
    is_locked: false,
    watermark_enabled: true,
    created_at: '2024-10-16T11:30:00.000Z',
  },
];

export const SEED_SELECTIONS: SelectionRecord[] = [
  {
    id: 'sel-01',
    gallery_id: '11111111-1111-4111-8111-111111111111',
    photo_id: 'photo-01',
    filename: 'ZV_0488.JPG',
    note: 'Tolong ratakan pencahayaan di bagian latar belakang taman & bersihkan bayangan di pipi.',
    selected_order: 1,
  },
  {
    id: 'sel-02',
    gallery_id: '11111111-1111-4111-8111-111111111111',
    photo_id: 'photo-02',
    filename: 'ZV_0489.JPG',
    note: 'Jadikan spread halaman tengah buku album.',
    selected_order: 2,
  },
  {
    id: 'sel-03',
    gallery_id: '11111111-1111-4111-8111-111111111111',
    photo_id: 'photo-05',
    filename: 'ZV_0501.JPG',
    note: 'Warna kebaya jangan terlalu putih, buat bernuansa krem hangat.',
    selected_order: 3,
  },
  {
    id: 'sel-04',
    gallery_id: '11111111-1111-4111-8111-111111111111',
    photo_id: 'photo-07',
    filename: 'ZV_0514.JPG',
    note: 'Pertahankan kontras hitam putih ini.',
    selected_order: 4,
  },
  {
    id: 'sel-05',
    gallery_id: '11111111-1111-4111-8111-111111111111',
    photo_id: 'photo-09',
    filename: 'ZV_0520.JPG',
    note: 'Tonjolkan kilau cincin emas dengan grain halus.',
    selected_order: 5,
  },
  {
    id: 'sel-06',
    gallery_id: '11111111-1111-4111-8111-111111111111',
    photo_id: 'photo-10',
    filename: 'ZV_0525.JPG',
    note: '',
    selected_order: 6,
  },
  {
    id: 'sel-07',
    gallery_id: '22222222-2222-4222-8222-222222222222',
    photo_id: 'photo-01',
    filename: 'ZV_0488.JPG',
    note: 'Cetak ukuran 16R untuk ruang tamu.',
    selected_order: 1,
  },
  {
    id: 'sel-08',
    gallery_id: '22222222-2222-4222-8222-222222222222',
    photo_id: 'photo-02',
    filename: 'ZV_0489.JPG',
    note: '',
    selected_order: 2,
  },
  {
    id: 'sel-09',
    gallery_id: '22222222-2222-4222-8222-222222222222',
    photo_id: 'photo-03',
    filename: 'ZV_0492.JPG',
    note: '',
    selected_order: 3,
  },
];

export function generateLicenseCode(prefix = 'DFTN'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 4; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length));
    part2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${part1}-${part2}`;
}

function getLocalStudios(): StudioSubscription[] {
  if (typeof window === 'undefined') return SEED_STUDIO_SUBSCRIPTIONS;
  try {
    const raw = window.localStorage.getItem(STORAGE_STUDIOS_KEY);
    if (!raw) {
      window.localStorage.setItem(
        STORAGE_STUDIOS_KEY,
        JSON.stringify(SEED_STUDIO_SUBSCRIPTIONS)
      );
      return SEED_STUDIO_SUBSCRIPTIONS;
    }
    const parsed = JSON.parse(raw) as StudioSubscription[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : SEED_STUDIO_SUBSCRIPTIONS;
  } catch {
    return SEED_STUDIO_SUBSCRIPTIONS;
  }
}

function saveLocalStudios(studios: StudioSubscription[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_STUDIOS_KEY, JSON.stringify(studios));
  } catch {
    // ignore storage quota errors
  }
}

export async function fetchAllStudioSubscriptions(): Promise<
  StudioSubscription[]
> {
  if (supabase) {
    const { data, error } = await supabase
      .from('studio_subscriptions')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && data && data.length > 0) {
      const hasLegacyDummy = (data as StudioSubscription[]).some(
        (s) => s.id === LEGACY_DUMMY_STUDIO_ID
      );
      if (hasLegacyDummy) {
        await supabase
          .from('studio_subscriptions')
          .delete()
          .eq('id', LEGACY_DUMMY_STUDIO_ID);
      }
      const cleaned = (data as StudioSubscription[]).filter(
        (s) => s.id !== LEGACY_DUMMY_STUDIO_ID
      );
      const finalStudios =
        cleaned.length > 0 ? cleaned : SEED_STUDIO_SUBSCRIPTIONS;
      saveLocalStudios(finalStudios);
      return finalStudios;
    }
  }
  return getLocalStudios().filter((s) => s.id !== LEGACY_DUMMY_STUDIO_ID);
}

export async function authenticateStudio(
  studioSlug: string,
  accessCode: string
): Promise<{ ok: boolean; studio?: StudioSubscription; error?: string }> {
  const cleanSlug = studioSlug.trim().toLowerCase();
  const cleanCode = accessCode.trim();

  const allStudios = await fetchAllStudioSubscriptions();
  const match = allStudios.find(
    (s) => s.studio_slug.toLowerCase() === cleanSlug
  );

  if (!match) {
    return {
      ok: false,
      error:
        'Studio belum terdaftar sebagai member berlangganan Difotoin. Silakan hubungi Admin Zeevisual untuk berlangganan.',
    };
  }

  if (match.access_code.toLowerCase() !== cleanCode.toLowerCase()) {
    return {
      ok: false,
      error: 'Kode Lisensi / Password Studio tidak sesuai.',
    };
  }

  if (!match.is_active) {
    return {
      ok: false,
      error:
        'Akses langganan studio ini sedang dinonaktifkan. Hubungi Admin Zeevisual untuk mengaktifkan kembali.',
    };
  }

  if (match.expires_at) {
    const expiryTime = new Date(match.expires_at).getTime();
    if (Date.now() > expiryTime) {
      return {
        ok: false,
        error:
          'Masa aktif langganan studio Anda telah habis. Silakan perpanjang langganan melalui Admin Zeevisual.',
      };
    }
  }

  return { ok: true, studio: match };
}

export async function createStudioSubscription(
  input: CreateStudioSubscriptionInput
): Promise<StudioSubscription> {
  const cleanSlug = slugifyClientName(input.studio_slug || input.studio_name);
  const expiresAt =
    input.duration_days && input.duration_days > 0
      ? new Date(Date.now() + input.duration_days * 86400 * 1000).toISOString()
      : null;

  const newStudio: StudioSubscription = {
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `std-${Date.now()}`,
    studio_slug: cleanSlug,
    studio_name: input.studio_name.trim(),
    owner_name: input.owner_name.trim() || input.studio_name.trim(),
    whatsapp_number: (input.whatsapp_number || '').trim(),
    access_code: input.access_code.trim() || generateLicenseCode('DFTN'),
    plan_name: input.plan_name,
    max_galleries: Number(input.max_galleries) || 50,
    is_active: true,
    is_super_admin: cleanSlug === 'zeevisual',
    expires_at: expiresAt,
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    const { data, error } = await supabase
      .from('studio_subscriptions')
      .upsert(newStudio, { onConflict: 'studio_slug' })
      .select('*')
      .single();

    if (!error && data) {
      const current = getLocalStudios().filter(
        (s) => s.studio_slug !== data.studio_slug
      );
      saveLocalStudios([...current, data as StudioSubscription]);
      return data as StudioSubscription;
    }
  }

  const current = getLocalStudios().filter(
    (s) => s.studio_slug !== newStudio.studio_slug
  );
  const updated = [...current, newStudio];
  saveLocalStudios(updated);
  return newStudio;
}

export async function toggleStudioSubscriptionActive(
  studioId: string,
  isActive: boolean
): Promise<StudioSubscription[]> {
  if (supabase) {
    await supabase
      .from('studio_subscriptions')
      .update({ is_active: isActive })
      .eq('id', studioId);
  }
  const updated = getLocalStudios().map((s) =>
    s.id === studioId ? { ...s, is_active: isActive } : s
  );
  saveLocalStudios(updated);
  return updated;
}

export async function extendStudioSubscription(
  studioId: string,
  extraDays: number
): Promise<StudioSubscription[]> {
  const current = getLocalStudios();
  const target = current.find((s) => s.id === studioId);
  if (!target) return current;

  const baseTime =
    target.expires_at && new Date(target.expires_at).getTime() > Date.now()
      ? new Date(target.expires_at).getTime()
      : Date.now();
  const nextExpiresAt = new Date(
    baseTime + extraDays * 86400 * 1000
  ).toISOString();

  if (supabase) {
    await supabase
      .from('studio_subscriptions')
      .update({ expires_at: nextExpiresAt, is_active: true })
      .eq('id', studioId);
  }

  const updated = current.map((s) =>
    s.id === studioId
      ? { ...s, expires_at: nextExpiresAt, is_active: true }
      : s
  );
  saveLocalStudios(updated);
  return updated;
}

export async function deleteStudioSubscription(
  studioId: string
): Promise<StudioSubscription[]> {
  if (supabase) {
    await supabase
      .from('studio_subscriptions')
      .delete()
      .eq('id', studioId)
      .eq('is_super_admin', false);
  }
  const updated = getLocalStudios().filter(
    (s) => s.id !== studioId || s.is_super_admin
  );
  saveLocalStudios(updated);
  return updated;
}

export async function updateStudioSubscriptionInfo(
  studioId: string,
  patch: Partial<
    Pick<
      StudioSubscription,
      'studio_name' | 'owner_name' | 'whatsapp_number' | 'access_code'
    >
  >
): Promise<StudioSubscription | null> {
  if (supabase) {
    await supabase
      .from('studio_subscriptions')
      .update(patch)
      .eq('id', studioId);
  }
  const current = getLocalStudios();
  let updatedRecord: StudioSubscription | null = null;
  const updated = current.map((s) => {
    if (s.id === studioId) {
      updatedRecord = { ...s, ...patch };
      return updatedRecord;
    }
    return s;
  });
  saveLocalStudios(updated);
  return updatedRecord;
}

function getLocalGalleries(): GalleryRecord[] {
  if (typeof window === 'undefined') return SEED_GALLERIES;
  try {
    const raw = window.localStorage.getItem(STORAGE_GALLERIES_KEY);
    if (!raw) {
      window.localStorage.setItem(
        STORAGE_GALLERIES_KEY,
        JSON.stringify(SEED_GALLERIES)
      );
      return SEED_GALLERIES;
    }
    const parsed = JSON.parse(raw) as GalleryRecord[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_GALLERIES;
  } catch {
    return SEED_GALLERIES;
  }
}

function saveLocalGalleries(galleries: GalleryRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      STORAGE_GALLERIES_KEY,
      JSON.stringify(galleries)
    );
  } catch {
    // ignore storage quota errors
  }
}

function getLocalSelections(): SelectionRecord[] {
  if (typeof window === 'undefined') return SEED_SELECTIONS;
  try {
    const raw = window.localStorage.getItem(STORAGE_SELECTIONS_KEY);
    if (!raw) {
      window.localStorage.setItem(
        STORAGE_SELECTIONS_KEY,
        JSON.stringify(SEED_SELECTIONS)
      );
      return SEED_SELECTIONS;
    }
    const parsed = JSON.parse(raw) as SelectionRecord[];
    return Array.isArray(parsed) ? parsed : SEED_SELECTIONS;
  } catch {
    return SEED_SELECTIONS;
  }
}

function saveLocalSelections(selections: SelectionRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      STORAGE_SELECTIONS_KEY,
      JSON.stringify(selections)
    );
  } catch {
    // ignore storage quota errors
  }
}

export async function fetchAllGalleries(): Promise<GalleryRecord[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('galleries')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      saveLocalGalleries(data as GalleryRecord[]);
      return data as GalleryRecord[];
    }
  }
  return getLocalGalleries();
}

export async function fetchGalleryBySlug(
  slug: string,
  studioSlug?: string
): Promise<GalleryRecord | null> {
  if (supabase) {
    let query = supabase.from('galleries').select('*').eq('slug', slug);
    if (studioSlug) {
      query = query.eq('studio_slug', studioSlug);
    }
    const { data, error } = await query.maybeSingle();
    if (!error && data) {
      return data as GalleryRecord;
    }
  }

  const local = getLocalGalleries();
  const found = local.find(
    (g) =>
      g.slug.toLowerCase() === slug.toLowerCase() &&
      (!studioSlug || g.studio_slug.toLowerCase() === studioSlug.toLowerCase())
  );
  if (found) return found;

  return (
    local.find((g) => g.slug.toLowerCase() === slug.toLowerCase()) ||
    SEED_GALLERIES[0]
  );
}

export async function createGallery(
  input: CreateGalleryInput
): Promise<GalleryRecord> {
  const slug = input.slug?.trim() || slugifyClientName(input.client_name);
  const owner_token = input.owner_token?.trim() || generateOwnerToken(12);
  const gdrive_folder_id = parseGoogleDriveFolderId(input.gdrive_folder_url);
  const orderNumber = Math.floor(7911 + Math.random() * 80);
  const cleanStudioSlug = input.studio_slug.trim() || 'zeevisual';
  const cleanWhatsapp = (input.studio_whatsapp || '')
    .replace(/\D/g, '')
    .replace(/^0/, '62');

  const resolvedStudioName =
    input.studio_name?.trim() ||
    (cleanStudioSlug === 'zeevisual' ? 'Zeevisual' : cleanStudioSlug);
  const studioPrefix =
    cleanStudioSlug === 'zeevisual'
      ? 'ZV'
      : cleanStudioSlug.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() ||
        'ST';

  const newGallery: GalleryRecord = {
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `gal-${Date.now()}`,
    order_code: `#${studioPrefix}-${orderNumber}`,
    studio_slug: cleanStudioSlug,
    studio_name: resolvedStudioName,
    studio_whatsapp: cleanWhatsapp,
    client_name: input.client_name.trim(),
    slug,
    session_type: input.session_type || 'Editorial Pre-Wedding',
    session_date:
      input.session_date ||
      new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    deadline_date: input.deadline_date || '28 Oktober 2024',
    gdrive_folder_url: input.gdrive_folder_url.trim(),
    gdrive_folder_id,
    selection_quota: Number(input.selection_quota) || 50,
    owner_token,
    cover_photo_id: 'photo-01',
    album_pin: input.album_pin ? input.album_pin.slice(0, 4) : null,
    hidden_photo_ids: [],
    is_locked: false,
    watermark_enabled: input.watermark_enabled ?? true,
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    const { data, error } = await supabase
      .from('galleries')
      .upsert(newGallery, { onConflict: 'slug' })
      .select('*')
      .single();

    if (!error && data) {
      const current = getLocalGalleries().filter((g) => g.slug !== data.slug);
      saveLocalGalleries([data as GalleryRecord, ...current]);
      return data as GalleryRecord;
    }
  }

  const current = getLocalGalleries().filter((g) => g.slug !== newGallery.slug);
  const updated = [newGallery, ...current];
  saveLocalGalleries(updated);
  return newGallery;
}

export async function deleteGallery(galleryId: string): Promise<GalleryRecord[]> {
  if (supabase) {
    await supabase.from('galleries').delete().eq('id', galleryId);
  }
  const remainingGalleries = getLocalGalleries().filter(
    (g) => g.id !== galleryId
  );
  saveLocalGalleries(remainingGalleries);

  const remainingSelections = getLocalSelections().filter(
    (s) => s.gallery_id !== galleryId
  );
  saveLocalSelections(remainingSelections);

  return remainingGalleries;
}

export async function updateGallerySettings(
  galleryId: string,
  ownerToken: string,
  updates: Partial<
    Pick<
      GalleryRecord,
      'cover_photo_id' | 'album_pin' | 'hidden_photo_ids' | 'is_locked'
    >
  >
): Promise<GalleryRecord | null> {
  if (supabase) {
    const { data, error } = await supabase
      .from('galleries')
      .update(updates)
      .eq('id', galleryId)
      .eq('owner_token', ownerToken)
      .select('*')
      .maybeSingle();

    if (!error && data) {
      const local = getLocalGalleries().map((g) =>
        g.id === galleryId ? (data as GalleryRecord) : g
      );
      saveLocalGalleries(local);
      return data as GalleryRecord;
    }
  }

  const local = getLocalGalleries();
  let updatedRecord: GalleryRecord | null = null;
  const next = local.map((g) => {
    if (g.id === galleryId) {
      updatedRecord = { ...g, ...updates, updated_at: new Date().toISOString() };
      return updatedRecord;
    }
    return g;
  });
  saveLocalGalleries(next);
  return updatedRecord;
}

export async function fetchSelectionsForGallery(
  galleryId: string
): Promise<SelectionRecord[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('selections')
      .select('*')
      .eq('gallery_id', galleryId)
      .order('selected_order', { ascending: true });

    if (!error && data) {
      return data as SelectionRecord[];
    }
  }

  return getLocalSelections()
    .filter((s) => s.gallery_id === galleryId)
    .sort((a, b) => a.selected_order - b.selected_order);
}

export async function togglePhotoSelection(params: {
  galleryId: string;
  photoId: string;
  filename: string;
}): Promise<{ selected: boolean; selections: SelectionRecord[] }> {
  const { galleryId, photoId, filename } = params;
  const existingAll = getLocalSelections();
  const gallerySelections = existingAll
    .filter((s) => s.gallery_id === galleryId)
    .sort((a, b) => a.selected_order - b.selected_order);

  const alreadySelected = gallerySelections.find((s) => s.photo_id === photoId);

  if (alreadySelected) {
    if (supabase) {
      await supabase
        .from('selections')
        .delete()
        .eq('gallery_id', galleryId)
        .eq('photo_id', photoId);
    }

    const remainingForGallery = gallerySelections
      .filter((s) => s.photo_id !== photoId)
      .map((s, idx) => ({ ...s, selected_order: idx + 1 }));

    const otherGalleries = existingAll.filter(
      (s) => s.gallery_id !== galleryId
    );
    saveLocalSelections([...otherGalleries, ...remainingForGallery]);
    return { selected: false, selections: remainingForGallery };
  } else {
    const nextOrder = gallerySelections.length + 1;
    const newRecord: SelectionRecord = {
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `sel-${Date.now()}`,
      gallery_id: galleryId,
      photo_id: photoId,
      filename,
      note: '',
      selected_order: nextOrder,
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      await supabase.from('selections').upsert(
        {
          gallery_id: galleryId,
          photo_id: photoId,
          filename,
          note: '',
          selected_order: nextOrder,
        },
        { onConflict: 'gallery_id,photo_id' }
      );
    }

    const updatedForGallery = [...gallerySelections, newRecord];
    const otherGalleries = existingAll.filter(
      (s) => s.gallery_id !== galleryId
    );
    saveLocalSelections([...otherGalleries, ...updatedForGallery]);
    return { selected: true, selections: updatedForGallery };
  }
}

export async function updateSelectionNote(params: {
  galleryId: string;
  photoId: string;
  filename: string;
  note: string;
}): Promise<SelectionRecord[]> {
  const { galleryId, photoId, filename, note } = params;
  const existingAll = getLocalSelections();
  const gallerySelections = existingAll
    .filter((s) => s.gallery_id === galleryId)
    .sort((a, b) => a.selected_order - b.selected_order);

  const exists = gallerySelections.find((s) => s.photo_id === photoId);
  let updatedForGallery: SelectionRecord[];

  if (exists) {
    updatedForGallery = gallerySelections.map((s) =>
      s.photo_id === photoId ? { ...s, note } : s
    );
  } else {
    const newRecord: SelectionRecord = {
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `sel-${Date.now()}`,
      gallery_id: galleryId,
      photo_id: photoId,
      filename,
      note,
      selected_order: gallerySelections.length + 1,
      created_at: new Date().toISOString(),
    };
    updatedForGallery = [...gallerySelections, newRecord];
  }

  if (supabase) {
    const target = updatedForGallery.find((s) => s.photo_id === photoId);
    if (target) {
      await supabase.from('selections').upsert(
        {
          gallery_id: galleryId,
          photo_id: photoId,
          filename: target.filename,
          note: target.note,
          selected_order: target.selected_order,
        },
        { onConflict: 'gallery_id,photo_id' }
      );
    }
  }

  const otherGalleries = existingAll.filter((s) => s.gallery_id !== galleryId);
  saveLocalSelections([...otherGalleries, ...updatedForGallery]);
  return updatedForGallery;
}
