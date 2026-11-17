import type { Metadata } from 'next';
import LegalPageShell from '@/components/LegalPageShell';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan | Bukafoto by Zeevisual',
  description:
    'Syarat dan ketentuan penggunaan platform kurasi foto klien Google Drive dan langganan studio Bukafoto.',
};

const SECTIONS = [
  {
    heading: '1. Ruang Lingkup Layanan',
    body: 'Bukafoto (dikelola oleh Zeevisual) menyediakan platform digital proofing, kurasi foto klien berbasis tautan Google Drive, dan album digital 3D untuk studio foto maupun fotografer profesional.',
  },
  {
    heading: '2. Akun Studio & Lisensi Berlangganan',
    body: 'Setiap mitra studio wajib menjaga kerahasiaan Kode Lisensi / Password Dashboard Studio. Kuota galeri klien dan masa aktif mengikuti paket yang dipilih (Bulanan 30 hari, 3 Bulan 90 hari, Tahunan 365 hari, atau Lifetime Partner).',
  },
  {
    heading: '3. Konten Foto & Hak Cipta',
    body: 'Bukafoto tidak mengambil kepemilikan atas foto yang ditautkan melalui Google Drive milik fotografer. Fotografer bertanggung jawab penuh atas izin distribusi, hak cipta, dan legalitas foto klien yang ditampilkan di galeri masing-masing.',
  },
  {
    heading: '4. Pembayaran Resmi & Anti-Penyalahgunaan',
    body: 'Seluruh transaksi langganan diproses melalui kanal pembayaran resmi Bukafoto (QRIS terverifikasi Midtrans atau konfirmasi resmi Admin Zeevisual). Segala upaya pemalsuan bukti bayar atau manipulasi transaksi akan menyebabkan penonaktifan akun permanen.',
  },
  {
    heading: '5. Kontak Pengelola Usaha',
    body: 'Bukafoto / Zeevisual\nWebsite: https://bukafoto.my.id\nEmail Resmi: ziyadfuture99@gmail.com\nWhatsApp Support: +62 896-1411-4644',
  },
];

export default function TermsPage() {
  return (
    <LegalPageShell
      badge="Legal & Kepatuhan"
      title="Syarat & Ketentuan Layanan"
      updatedAt="17 November 2026"
      intro="Dengan mendaftar, mengakses, atau berlangganan layanan di Bukafoto (https://bukafoto.my.id), Anda menyetujui syarat dan ketentuan berikut."
      sections={SECTIONS}
    />
  );
}
