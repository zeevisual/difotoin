export interface DrivePhoto {
  id: string;
  name: string;
  mimeType: string;
  thumbnailUrl: string;
  fullResUrl: string;
  downloadUrl: string;
  category: 'Outdoor' | 'Studio' | 'Detail & Cincin';
  location: string;
  capturedAt: string;
  caption: string;
  exif: string;
  aspectRatio?: 'portrait' | 'landscape' | 'square';
}

export interface GalleryRecord {
  id: string;
  order_code: string;
  studio_slug: string;
  studio_name: string;
  studio_whatsapp?: string;
  client_name: string;
  slug: string;
  session_type: string;
  session_date: string;
  deadline_date: string;
  gdrive_folder_url: string;
  gdrive_folder_id: string;
  selection_quota: number;
  owner_token: string;
  cover_photo_id: string | null;
  album_pin: string | null;
  hidden_photo_ids: string[];
  is_locked: boolean;
  watermark_enabled: boolean;
  created_at: string;
  updated_at?: string;
}

export interface SelectionRecord {
  id: string;
  gallery_id: string;
  photo_id: string;
  filename: string;
  note: string;
  selected_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateGalleryInput {
  studio_slug: string;
  studio_name?: string;
  studio_whatsapp?: string;
  client_name: string;
  slug?: string;
  session_type?: string;
  session_date?: string;
  deadline_date?: string;
  gdrive_folder_url: string;
  selection_quota: number;
  owner_token?: string;
  album_pin?: string | null;
  watermark_enabled?: boolean;
}

export interface StudioSubscription {
  id: string;
  studio_slug: string;
  studio_name: string;
  owner_name: string;
  whatsapp_number: string;
  access_code: string;
  plan_name: 'Bulanan (30 Hari)' | '3 Bulan (90 Hari)' | 'Tahunan (365 Hari)' | 'Lifetime Partner' | 'Super Admin';
  max_galleries: number;
  is_active: boolean;
  is_super_admin: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface CreateStudioSubscriptionInput {
  studio_slug: string;
  studio_name: string;
  owner_name: string;
  whatsapp_number?: string;
  access_code: string;
  plan_name: StudioSubscription['plan_name'];
  max_galleries: number;
  duration_days: number | null;
}
