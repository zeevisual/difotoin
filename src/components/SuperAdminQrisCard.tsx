'use client';

import React, { useEffect, useState } from 'react';
import { QrCode, RotateCcw, Upload } from 'lucide-react';
import {
  DEFAULT_QRIS_IMAGE_URL,
  getQrisImageUrl,
  saveCustomQrisImageUrl,
} from '@/utils/pricing-plans';

export default function SuperAdminQrisCard() {
  const [qrisSrc, setQrisSrc] = useState(DEFAULT_QRIS_IMAGE_URL);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setQrisSrc(getQrisImageUrl());
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_500_000) {
      setNotice('Ukuran gambar maksimal 1.5 MB agar cepat dimuat.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        saveCustomQrisImageUrl(reader.result);
        setQrisSrc(reader.result);
        setNotice(
          'Barcode QRIS diperbarui di browser ini (kirim gambar ke chat untuk dipasang permanen ke semua user).'
        );
      }
    };
    reader.readAsDataURL(file);
  }

  function handleReset() {
    saveCustomQrisImageUrl(null);
    setQrisSrc(DEFAULT_QRIS_IMAGE_URL);
    setNotice('Barcode QRIS dikembalikan ke default.');
  }

  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border border-cyan-400/25">
      <div className="flex items-center gap-4">
        <img
          src={qrisSrc}
          alt="Preview Barcode QRIS"
          className="w-20 h-20 object-contain rounded-xl bg-white p-1 border border-white/20 shrink-0"
        />
        <div className="flex flex-col gap-1">
          <div className="inline-flex items-center gap-1.5 font-jakarta font-bold text-xs uppercase tracking-[0.16em] text-cyan-300">
            <QrCode className="w-3.5 h-3.5" />
            <span>Barcode QRIS Pembayaran Otomatis</span>
          </div>
          <p className="font-jakarta text-xs text-slate-300 max-w-xl leading-relaxed">
            Fotografer yang berlangganan akan scan barcode ini dan langsung
            mendapatkan akun aktif sesuai paket.
          </p>
          {notice && (
            <span className="font-jakarta text-[11px] font-semibold text-emerald-300">
              {notice}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-jakarta font-bold text-xs transition-colors">
          <Upload className="w-3.5 h-3.5" />
          <span>Upload QRIS Baru</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        {qrisSrc !== DEFAULT_QRIS_IMAGE_URL && (
          <button
            type="button"
            onClick={handleReset}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 border border-white/15"
            title="Reset ke QRIS Default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
