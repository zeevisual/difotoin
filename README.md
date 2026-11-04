# DIFOTOIN × ZEEVISUAL — Client Photo Proofing & Digital Album

Aplikasi web kurasi/pemilihan foto klien (proofing) & album digital untuk **Zeevisual** yang dibangun menggunakan **Next.js 14 (App Router)**, **Tailwind CSS**, **Lucide React**, **Supabase**, dan **Google Drive API v3**.

---

## Fitur Utama

1. **`/studio/dashboard` (Dashboard Fotografer Zeevisual)**
   - Buat galeri baru dengan `studio_slug` default `zeevisual`, `client_name`, auto-generated `slug`, auto-parsed `gdrive_folder_url`, `selection_quota`, dan `owner_token`.
   - Tombol **Cek Isi Folder** untuk langsung melihat pratinjau isi folder Google Drive.
   - **Pesan WhatsApp Otomatis**: Salin format pesan Bahasa Indonesia lengkap dengan link pemilihan foto (`/{studio_slug}/{slug}`) dan link pemilik album (`/{slug}?t={owner_token}`).
   - **Export Filter Lightroom**: Daftar filename foto terpilih dipisahkan koma (dengan toggle `.JPG`) + tombol **Copy untuk Lightroom** & **Unduh .TXT**.

2. **`/[studio_slug]/[slug]` (Halaman Pilih Foto Klien / Proofing)**
   - Contoh: `/zeevisual/aida-fitri-harahab`
   - **Susunan Otomatis Rapi (Portrait & Landscape)**: Foto vertikal (portrait) dan horizontal (landscape) dari link folder Google Drive otomatis menyesuaikan proporsi aslinya tanpa terpotong dan tersusun rapi dalam Masonry Grid.
   - Sticky top bar, counter kuota live, filter (`Semua Foto`, `Sudah Dipilih`, `Belum Dipilih`), pencarian nama file, bingkai aktif Mustard `4px`, dan catatan revisi per foto.

3. **`/[slug]` (Album Digital & Magic Token `?t=`)**
   - **Mode Pemilik (`/[slug]?t={owner_token}`)**: Menampilkan bar **Mode Pemilik Album** dengan 4 kontrol: **Ganti Sampul**, **Bikin PIN**, **Atur Siapa yang Lihat** (sembunyikan foto tertentu dari publik), dan **Bagikan Link** (otomatis menghapus `?t=`).
   - **Mode Tamu / Keluarga (`/[slug]`)**: Layar PIN 4 digit jika diaktifkan, menyembunyikan foto privat, Lightbox layar penuh, dan tombol unduh resolusi tinggi (HD).

---

## Cara Menjalankan Lokal

```bash
npm install
npm run dev
```

Untuk menghubungkan ke Supabase & Google Drive API v3, salin `.env.example` menjadi `.env.local` dan jalankan [`supabase_schema.sql`](./supabase_schema.sql) di Supabase SQL Editor.
