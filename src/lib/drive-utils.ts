import { DrivePhoto } from '@/types/difotoin';

/**
 * Extracts a Google Drive Folder ID from any Google Drive link or returns the input if already an ID.
 * Supports:
 * - https://drive.google.com/drive/folders/1x9B...
 * - https://drive.google.com/drive/u/0/folders/1x9B...
 * - https://drive.google.com/open?id=1x9B...
 * - Direct folder ID string
 */
export function parseGoogleDriveFolderId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return 'demo-zeevisual-folder';

  const foldersMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (foldersMatch?.[1]) {
    return foldersMatch[1];
  }

  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch?.[1]) {
    return idParamMatch[1];
  }

  const fileDMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch?.[1]) {
    return fileDMatch[1];
  }

  const cleaned = trimmed
    .replace(/^https?:\/\/drive\.google\.com\/drive\/folders\//i, '')
    .split(/[/?&#]/)[0]
    .replace(/\.\.\./g, '');

  return cleaned || 'demo-zeevisual-folder';
}

/**
 * Generates a URL-safe kebab-case slug from a client name.
 */
export function slugifyClientName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, 'dan')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Generates a 12-character lowercase alphanumeric owner token.
 */
export function generateOwnerToken(length = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Curated mixed-orientation (Portrait + Landscape) editorial photos for Zeevisual demo.
 */
export const DEMO_EDITORIAL_PHOTOS: DrivePhoto[] = [
  {
    id: 'photo-01',
    name: 'ZV_0488.JPG',
    mimeType: 'image/jpeg',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80',
    fullResUrl:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=90',
    downloadUrl:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2200&q=95',
    category: 'Outdoor',
    location: 'Taman Hutan Raya Bandung',
    capturedAt: '16:45 WIB',
    caption: 'Potret Senja Aida & Bunga Kering',
    exif: 'f/1.8 • 1/500s • ISO 100',
    aspectRatio: 'portrait',
  },
  {
    id: 'photo-02',
    name: 'ZV_0489.JPG',
    mimeType: 'image/jpeg',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
    fullResUrl:
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=2000&q=90',
    downloadUrl:
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=2400&q=95',
    category: 'Outdoor',
    location: 'Padang Rumput Lembang',
    capturedAt: '16:52 WIB',
    caption: 'Langkah Bersama Menuju Senja (Wide Landscape)',
    exif: 'f/2.8 • 1/400s • ISO 200',
    aspectRatio: 'landscape',
  },
  {
    id: 'photo-03',
    name: 'ZV_0492.JPG',
    mimeType: 'image/jpeg',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80',
    fullResUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1800&q=90',
    downloadUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=2200&q=95',
    category: 'Outdoor',
    location: 'Kebun Teh Rancabali',
    capturedAt: '17:05 WIB',
    caption: 'Tawa Spontan di Bawah Cahaya Sore',
    exif: 'f/2.0 • 1/800s • ISO 160',
    aspectRatio: 'portrait',
  },
  {
    id: 'photo-04',
    name: 'ZV_0495.JPG',
    mimeType: 'image/jpeg',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80',
    fullResUrl:
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=2000&q=90',
    downloadUrl:
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=2400&q=95',
    category: 'Outdoor',
    location: 'Perkebunan Teh Ciwidey',
    capturedAt: '15:50 WIB',
    caption: 'Panorama Kabut Sore & Mobil Klasik',
    exif: 'f/4.0 • 1/320s • ISO 400',
    aspectRatio: 'landscape',
  },
  {
    id: 'photo-05',
    name: 'ZV_0501.JPG',
    mimeType: 'image/jpeg',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=900&q=80',
    fullResUrl:
      'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1800&q=90',
    downloadUrl:
      'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=2200&q=95',
    category: 'Studio',
    location: 'Studio Klasik Braga',
    capturedAt: '15:30 WIB',
    caption: 'Kebaya Renda Gading & Siluet Klasik',
    exif: 'f/1.4 • 1/640s • ISO 100',
    aspectRatio: 'portrait',
  },
  {
    id: 'photo-06',
    name: 'ZV_0503.JPG',
    mimeType: 'image/jpeg',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1200&q=80',
    fullResUrl:
      'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1800&q=90',
    downloadUrl:
      'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=2200&q=95',
    category: 'Detail & Cincin',
    location: 'Meja Arsip Studio',
    capturedAt: '14:15 WIB',
    caption: 'Cincin Emas Klasik & Surat Tulisan Tangan',
    exif: 'f/2.8 • 1/250s • ISO 100',
    aspectRatio: 'landscape',
  },
  {
    id: 'photo-07',
    name: 'ZV_0514.JPG',
    mimeType: 'image/jpeg',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80',
    fullResUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1800&q=90',
    downloadUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=2200&q=95',
    category: 'Studio',
    location: 'Window Light Studio',
    capturedAt: '14:40 WIB',
    caption: 'Monokrom Tri-X 400 • Potret Profil',
    exif: 'f/1.8 • 1/1000s • ISO 100',
    aspectRatio: 'portrait',
  },
  {
    id: 'photo-08',
    name: 'ZV_0519.JPG',
    mimeType: 'image/jpeg',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80',
    fullResUrl:
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=2000&q=90',
    downloadUrl:
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=2400&q=95',
    category: 'Detail & Cincin',
    location: 'Private Backstage',
    capturedAt: '13:45 WIB',
    caption: 'Dekorasi Meja Makan Malam Intimate (Wide)',
    exif: 'f/2.8 • 1/200s • ISO 100',
    aspectRatio: 'landscape',
  },
  {
    id: 'photo-09',
    name: 'ZV_0520.JPG',
    mimeType: 'image/jpeg',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1000&q=80',
    fullResUrl:
      'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1800&q=90',
    downloadUrl:
      'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=2200&q=95',
    category: 'Detail & Cincin',
    location: 'Studio Flatlay',
    capturedAt: '13:15 WIB',
    caption: 'Cincin Pernikahan & Segel Lilin Antik',
    exif: 'f/2.8 • 1/160s • ISO 100',
    aspectRatio: 'landscape',
  },
  {
    id: 'photo-10',
    name: 'ZV_0525.JPG',
    mimeType: 'image/jpeg',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=900&q=80',
    fullResUrl:
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1800&q=90',
    downloadUrl:
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=2200&q=95',
    category: 'Outdoor',
    location: 'Hutan Pinus Cikole',
    capturedAt: '17:20 WIB',
    caption: 'Pelukan Hangat di Antara Sinar Senja',
    exif: 'f/1.8 • 1/640s • ISO 200',
    aspectRatio: 'portrait',
  },
  {
    id: 'photo-11',
    name: 'ZV_0531.JPG',
    mimeType: 'image/jpeg',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=900&q=80',
    fullResUrl:
      'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=1800&q=90',
    downloadUrl:
      'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=2200&q=95',
    category: 'Detail & Cincin',
    location: 'Paviliun Kayu Klasik',
    capturedAt: '16:10 WIB',
    caption: 'Buket Bunga Kering & Pita Sutra',
    exif: 'f/2.2 • 1/320s • ISO 250',
    aspectRatio: 'portrait',
  },
  {
    id: 'photo-12',
    name: 'ZV_0538.JPG',
    mimeType: 'image/jpeg',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80',
    fullResUrl:
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=2000&q=90',
    downloadUrl:
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=2400&q=95',
    category: 'Studio',
    location: 'Studio Kanvas Cokelat',
    capturedAt: '15:05 WIB',
    caption: 'Potret Pasangan Editorial Landscape',
    exif: 'f/2.0 • 1/500s • ISO 160',
    aspectRatio: 'landscape',
  },
];
