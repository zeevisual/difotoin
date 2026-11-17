import type { Metadata } from 'next';
import LegalPageShell from '@/components/LegalPageShell';

export const metadata: Metadata = {
  title: 'Kebijakan Refund & Kontak | Bukafoto by Zeevisual',
  description:
    'Kebijakan pembatalan, pengembalian dana transaksi QRIS, masa aktif langganan, dan layanan bantuan resmi Bukafoto.',
};

const SECTIONS = [
  {
    heading: '1. Aktivasi Instan & Sifat Layanan Digital',
    body: 'Langganan Bukafoto adalah layanan SaaS digital yang aktif otomatis segera setelah pembayaran terkonfirmasi. Pastikan Anda telah mencoba Mode Demo Gratis (/studio/demo) sebelum melakukan pembayaran.',
  },
  {
    heading: '2. Ketentuan Pengembalian Dana (Refund)',
    body: 'Pengembalian dana penuh (100%) diberikan apabila terjadi kelebihan transfer, pembayaran ganda pada order ID berbeda akibat gangguan jaringan, atau kegagalan aktivasi akun yang tidak dapat diselesaikan oleh tim teknis dalam 1x24 jam kerja.',
  },
  {
    heading: '3. Transaksi yang Tidak Dapat Di-refund',
    body: 'Pembayaran paket yang akunnya telah diaktifkan dan telah digunakan untuk membuat galeri klien aktif umumnya tidak dapat dibatalkan di tengah periode berjalan, kecuali terdapat kendala teknis sistem yang berkepanjangan.',
  },
  {
    heading: '4. Prosedur Klaim & Layanan Bantuan Resmi',
    body: 'Kirimkan Order ID Midtrans / bukti transfer QRIS dan nama slug studio Anda dalam maksimal 3x24 jam setelah transaksi melalui:\n• Email Resmi: ziyadfuture99@gmail.com\n• WhatsApp Customer Support: +62 896-1411-4644 (Respons Senin–Minggu 09.00–21.00 WIB)\nProses verifikasi refund diselesaikan dalam 3–7 hari kerja.',
  },
];

export default function RefundPage() {
  return (
    <LegalPageShell
      badge="Transaksi & Support"
      title="Kebijakan Refund & Kontak Resmi"
      updatedAt="17 November 2026"
      intro="Transparansi pembayaran QRIS, prosedur pengembalian dana, dan kontak resmi pengelola Bukafoto by Zeevisual."
      sections={SECTIONS}
    />
  );
}
