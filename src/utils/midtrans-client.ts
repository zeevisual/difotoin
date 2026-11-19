import { StudioSubscription } from '@/types/difotoin';
import { SUPER_ADMIN_WA_NUMBER } from '@/lib/supabase';
import { formatRupiah } from '@/utils/pricing-plans';

export const PENDING_MIDTRANS_DRAFT_KEY = 'bukafoto_pending_midtrans_checkout_v1';

export interface MidtransUiSession {
  provider: 'mayar' | 'midtrans';
  orderId: string | null;
  checkoutToken: string | null;
  qrUrl: string | null;
  paymentUrl: string | null;
  expiryTime: string | null;
  isSandbox: boolean;
  pendingReview: boolean;
  statusText: string;
}

export const INITIAL_MIDTRANS_SESSION: MidtransUiSession = {
  provider: 'midtrans',
  orderId: null,
  checkoutToken: null,
  qrUrl: null,
  paymentUrl: null,
  expiryTime: null,
  isSandbox: false,
  pendingReview: false,
  statusText: 'pending',
};

export function buildAdminConfirmWaUrl(params: {
  isRenewal: boolean;
  studioName: string;
  studioSlug: string;
  ownerName: string;
  whatsapp: string;
  planTitle: string;
  price: number;
  accessCode: string;
  payerName?: string;
  referenceId?: string;
}): string {
  const modeLabel = params.isRenewal ? 'Perpanjangan/Upgrade Paket' : 'Pendaftaran Studio Baru';
  const rrnLine = params.referenceId?.trim()
    ? `\nPengirim: ${(params.payerName || '').trim()}\nNo. Ref/RRN: ${params.referenceId.trim()}`
    : '';
  const msg =
    `Halo Admin Zeevisual, saya ingin konfirmasi pembayaran ${modeLabel} Bukafoto:` +
    `\nStudio: ${params.studioName.trim()} (/${params.studioSlug})` +
    `\nOwner: ${params.ownerName.trim() || params.studioName.trim()} (${params.whatsapp.trim()})` +
    `\nPaket: ${params.planTitle} (${formatRupiah(params.price)})` +
    `\nKode Lisensi: ${params.accessCode.trim()}${rrnLine}`;
  return `https://wa.me/${SUPER_ADMIN_WA_NUMBER}?text=${encodeURIComponent(msg)}`;
}

export interface MidtransInitResult {
  configured?: boolean;
  provider?: 'mayar' | 'midtrans';
  midtransPendingReview?: boolean;
  orderId?: string;
  checkoutToken?: string;
  qrImageUrl?: string;
  paymentUrl?: string;
  qrString?: string;
  expiryTime?: string;
  isSandbox?: boolean;
  error?: string;
}

export interface MidtransStatusResult {
  paid?: boolean;
  transactionStatus?: string;
}

export interface PendingMidtransDraft {
  provider?: 'mayar' | 'midtrans';
  orderId: string;
  checkoutToken: string;
  planId: string;
  studioSlug: string;
  studioName: string;
  ownerName: string;
  whatsapp: string;
  accessCode: string;
  mode?: 'signup' | 'renew';
}

export async function requestMidtransTransaction(payload: {
  planId: string;
  studioSlug: string;
  ownerName: string;
  whatsapp: string;
}): Promise<MidtransInitResult> {
  const res = await fetch('/api/midtrans/create-transaction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return (await res.json()) as MidtransInitResult;
}

export async function fetchMidtransPaidStatus(
  orderId: string,
  provider?: 'mayar' | 'midtrans'
): Promise<MidtransStatusResult | null> {
  try {
    const qs = provider ? `?provider=${encodeURIComponent(provider)}` : '';
    const res = await fetch(
      `/api/midtrans/status/${encodeURIComponent(orderId)}${qs}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    return (await res.json()) as MidtransStatusResult;
  } catch {
    return null;
  }
}

export async function activateVerifiedMidtransStudio(
  draft: PendingMidtransDraft
): Promise<{ ok: boolean; studio?: StudioSubscription; error?: string }> {
  const res = await fetch('/api/midtrans/activate-studio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft),
  });
  return (await res.json()) as {
    ok: boolean;
    studio?: StudioSubscription;
    error?: string;
  };
}

export function savePendingMidtransDraft(draft: PendingMidtransDraft): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PENDING_MIDTRANS_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // ignore storage quota errors
  }
}

export function readPendingMidtransDraft(): PendingMidtransDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PENDING_MIDTRANS_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingMidtransDraft;
    return parsed?.orderId && parsed?.checkoutToken ? parsed : null;
  } catch {
    return null;
  }
}

export function clearPendingMidtransDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(PENDING_MIDTRANS_DRAFT_KEY);
  } catch {
    // ignore
  }
}
