import type { Metadata } from 'next';
import LegalPageShell from '@/components/LegalPageShell';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi | Bukafoto by Zeevisual',
  description:
    'Kebijakan privasi mengenai data akun studio, data transaksi QRIS Midtrans, dan akses folder Google Drive di Bukafoto.',
};

const SECTIONS = [
  {
    heading: '1. Data yang Kami Kumpulkan',
    body: 'Kami menyimpan informasi pendaftaran studio (nama studio, slug URL, nama pemilik, nomor WhatsApp, paket langganan) serta metadata galeri klien dan daftar pilihan foto yang dibuat di dalam aplikasi.',
  },
  {
    heading: '2. Keamanan Akses Google Drive',
    body: 'Bukafoto hanya membaca daftar berkas gambar pada folder Google Drive publik yang tautannya dibagikan langsung oleh fotografer. Platform tidak memodifikasi, menghapus, atau mengakses file di luar folder galeri tersebut.',
  },
  {
    heading: '3. Data Pembayaran (Midtrans)',
    body: 'Bukafoto tidak pernah menyimpan data kartu kredit atau PIN e-wallet pengguna. Pemrosesan QRIS ditangani secara aman melalui payment gateway berizin (PT Midtrans / GoTo Financial) dengan enkripsi dan verifikasi server.',
  },
  {
    heading: '4. Penyimpanan Lokal & Penghapusan Data',
    body: 'Preferensi tema warna dan sesi login studio disimpan sementara di browser pengguna. Pemilik studio dapat mengajukan permintaan pembaruan atau penghapusan data akun melalui email ziyadfuture99@gmail.com atau WhatsApp +62 896-1411-4644.',
  },
];

export default function PrivacyPage() {
  return (
    <LegalPageShell
      badge="Privasi & Keamanan"
      title="Kebijakan Privasi Pengguna"
      updatedAt="17 November 2026"
      intro="Bukafoto berkomitmen menjaga kerahasiaan data studio fotografer, informasi klien galeri, serta keamanan proses transaksi digital."
      sections={SECTIONS}
    />
  );
}
