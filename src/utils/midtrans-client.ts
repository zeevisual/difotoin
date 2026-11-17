export interface MidtransInitResult {
  configured?: boolean;
  midtransPendingReview?: boolean;
  orderId?: string;
  qrImageUrl?: string;
  qrString?: string;
  expiryTime?: string;
  isSandbox?: boolean;
  error?: string;
}

export interface MidtransStatusResult {
  paid?: boolean;
  transactionStatus?: string;
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
  orderId: string
): Promise<MidtransStatusResult | null> {
  try {
    const res = await fetch(
      `/api/midtrans/status/${encodeURIComponent(orderId)}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    return (await res.json()) as MidtransStatusResult;
  } catch {
    return null;
  }
}
