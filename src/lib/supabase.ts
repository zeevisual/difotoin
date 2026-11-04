import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  CreateGalleryInput,
  GalleryRecord,
  SelectionRecord,
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

  const newGallery: GalleryRecord = {
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `gal-${Date.now()}`,
    order_code: `#ZV-${orderNumber}`,
    studio_slug: cleanStudioSlug,
    studio_name:
      input.studio_name ||
      (cleanStudioSlug === 'zeevisual' ? 'Zeevisual' : cleanStudioSlug),
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
