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
