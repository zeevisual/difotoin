import { StudioSubscription } from '@/types/difotoin';

export interface PricingPlan {
  id: string;
  plan_name: StudioSubscription['plan_name'];
  title: string;
  price: number;
  originalPrice: number;
  periodLabel: string;
  duration_days: number | null;
  max_galleries: number;
  badge: string;
  isPopular?: boolean;
  features: string[];
}

export const DEFAULT_QRIS_IMAGE_URL = '/qris-bukafoto.svg';
export const CUSTOM_QRIS_STORAGE_KEY = 'bukafoto_custom_qris_v1';

export const SUBSCRIPTION_PLANS: PricingPlan[] = [
  {
    id: 'starter-monthly',
    plan_name: 'Bulanan (30 Hari)',
    title: 'Starter Bulanan',
    price: 29000,
    originalPrice: 49000,
    periodLabel: '/ 30 hari',
    duration_days: 30,
    max_galleries: 30,
    badge: 'Hemat & Pemula',
    features: [
      'Kuota hingga 30 Galeri Klien',
      'Nama & Brand Studio Sendiri',
      'Sinkronisasi Link Google Drive',
      'Kirim Pilihan Foto & Export Lightroom',
      'Album Digital 3D & Kurasi Tamu',
    ],
  },
  {
    id: 'pro-quarterly',
    plan_name: '3 Bulan (90 Hari)',
    title: 'Pro Studio 3 Bulan',
    price: 69000,
    originalPrice: 120000,
    periodLabel: '/ 90 hari',
    duration_days: 90,
    max_galleries: 100,
    badge: 'Paling Laris ★',
    isPopular: true,
    features: [
      'Kuota hingga 100 Galeri Klien',
      'Hemat 22% (Rp 23rb / bulan)',
      'Nama & Brand Studio Sendiri',
      'Kirim Pilihan Foto & Export Lightroom',
      'Album Digital 3D + PIN Privasi',
    ],
  },
  {
    id: 'studio-yearly',
    plan_name: 'Tahunan (365 Hari)',
    title: 'Master Tahunan',
    price: 199000,
    originalPrice: 348000,
    periodLabel: '/ 1 tahun',
    duration_days: 365,
    max_galleries: 500,
    badge: 'Hemat 45%',
    features: [
      'Kuota hingga 500 Galeri Klien',
      'Cuma Rp 16rb-an / bulan',
      'Nama & Brand Studio Sendiri',
      'Fitur Lengkap Pilih Foto & Album 3D',
      'Prioritas Update & Support',
    ],
  },
  {
    id: 'lifetime-partner',
    plan_name: 'Lifetime Partner',
    title: 'Lifetime Partner',
    price: 349000,
    originalPrice: 699000,
    periodLabel: 'Sekali Bayar',
    duration_days: null,
    max_galleries: 9999,
    badge: 'Akses Selamanya',
    features: [
      'Kuota Unlimited (9.999 Galeri)',
      'Sekali Bayar Aktif Selamanya',
      'Tanpa Biaya Perpanjangan Bulanan',
      'Nama & Brand Studio Sendiri',
      'Seluruh Fitur Ekosistem Bukafoto',
    ],
  },
];

export function formatRupiah(amount: number): string {
  return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
}

export function getQrisImageUrl(): string {
  if (typeof window === 'undefined') return DEFAULT_QRIS_IMAGE_URL;
  try {
    const saved = window.localStorage.getItem(CUSTOM_QRIS_STORAGE_KEY);
    return saved && saved.trim().length > 0 ? saved : DEFAULT_QRIS_IMAGE_URL;
  } catch {
    return DEFAULT_QRIS_IMAGE_URL;
  }
}

export function saveCustomQrisImageUrl(dataUrl: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!dataUrl || !dataUrl.trim()) {
      window.localStorage.removeItem(CUSTOM_QRIS_STORAGE_KEY);
    } else {
      window.localStorage.setItem(CUSTOM_QRIS_STORAGE_KEY, dataUrl.trim());
    }
  } catch {
    // ignore storage quota errors
  }
}
