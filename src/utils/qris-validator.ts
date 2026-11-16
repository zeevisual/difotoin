const USED_REFS_KEY = 'bukafoto_used_qris_refs_v1';
const USED_HASHES_KEY = 'bukafoto_used_qris_hashes_v1';

const BLOCKED_DUMMY_REFS = new Set([
  '12345678',
  '123456789',
  '1234567890',
  '0123456789',
  '11223344',
  '87654321',
  'TEST1234',
]);

function readStringArray(key: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function computeFileSha256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyReceiptImageCanvas(file: File): Promise<string | null> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('invalid-image'));
      el.src = objectUrl;
    });

    if (img.naturalWidth < 240 || img.naturalHeight < 240) {
      return 'Resolusi gambar terlalu kecil (min. 240x240 px). Gunakan screenshot struk pembayaran QRIS yang asli.';
    }

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0, 64, 64);
    const pixels = ctx.getImageData(0, 0, 64, 64).data;

    let minLum = 255;
    let maxLum = 0;
    let sum = 0;
    let sumSq = 0;
    const count = pixels.length / 4;

    for (let i = 0; i < pixels.length; i += 4) {
      const lum = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
      if (lum < minLum) minLum = lum;
      if (lum > maxLum) maxLum = lum;
      sum += lum;
      sumSq += lum * lum;
    }

    const mean = sum / count;
    const stdDev = Math.sqrt(Math.max(0, sumSq / count - mean * mean));

    if (maxLum - minLum < 45 || stdDev < 10) {
      return 'Gambar terdeteksi kosong/polos dan tidak menyerupai struk pembayaran QRIS.';
    }
    return null;
  } catch {
    return 'File bukti pembayaran rusak atau tidak dapat dibaca sebagai gambar.';
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function validateQrisPaymentProof(params: {
  file: File | null;
  referenceId: string;
  payerName: string;
  expectedAmount: number;
}): Promise<{ ok: boolean; error?: string; receiptHash?: string }> {
  const { file, referenceId, payerName, expectedAmount } = params;

  if (!payerName.trim() || payerName.trim().length < 3) {
    return { ok: false, error: 'Masukkan nama pengirim / bank / e-wallet minimal 3 huruf.' };
  }

  const cleanRef = referenceId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (
    cleanRef.length < 8 ||
    cleanRef.length > 28 ||
    !/\d/.test(cleanRef) ||
    /^([A-Z0-9])\1+$/.test(cleanRef) ||
    BLOCKED_DUMMY_REFS.has(cleanRef)
  ) {
    return {
      ok: false,
      error: `Masukkan Nomor Referensi / RRN asli (8–28 digit angka/huruf) dari struk transfer senilai Rp ${expectedAmount.toLocaleString('id-ID')}.`,
    };
  }

  if (readStringArray(USED_REFS_KEY).includes(cleanRef)) {
    return {
      ok: false,
      error: 'Nomor Referensi QRIS ini sudah pernah dipakai. Gunakan transaksi baru.',
    };
  }

  if (!file) {
    return { ok: false, error: 'Wajib mengunggah screenshot/foto bukti pembayaran QRIS asli.' };
  }

  const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
  if (!allowedTypes.has(file.type)) {
    return { ok: false, error: 'Bukti bayar harus berupa gambar JPG, PNG, atau WEBP.' };
  }

  if (file.size < 8192) {
    return { ok: false, error: 'File gambar terlalu kecil (< 8 KB). Unggah screenshot struk asli.' };
  }

  const receiptHash = await computeFileSha256(file);
  if (readStringArray(USED_HASHES_KEY).includes(receiptHash)) {
    return {
      ok: false,
      error: 'Bukti pembayaran ini sudah pernah digunakan sebelumnya. Harap unggah struk transaksi baru.',
    };
  }

  const canvasErr = await verifyReceiptImageCanvas(file);
  if (canvasErr) return { ok: false, error: canvasErr };

  return { ok: true, receiptHash };
}

export function markQrisProofAsUsed(referenceId: string, receiptHash: string): void {
  if (typeof window === 'undefined') return;
  try {
    const cleanRef = referenceId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const refs = Array.from(new Set([...readStringArray(USED_REFS_KEY), cleanRef])).slice(-200);
    const hashes = Array.from(new Set([...readStringArray(USED_HASHES_KEY), receiptHash])).slice(-200);
    window.localStorage.setItem(USED_REFS_KEY, JSON.stringify(refs));
    window.localStorage.setItem(USED_HASHES_KEY, JSON.stringify(hashes));
  } catch {
    // ignore storage errors
  }
}
