export interface MayarConfig {
  apiKey: string;
  webhookSecret: string;
  isSandbox: boolean;
  baseUrl: string;
}

export interface MayarInvoiceCreated {
  id: string;
  transactionId?: string;
  link: string;
  expiredAt?: string;
}

export interface MayarStatusSummary {
  found: boolean;
  paid: boolean;
  transactionStatus: string;
  grossAmount: number;
}

export function getMayarConfig(): MayarConfig {
  const apiKey = (process.env.MAYAR_API_KEY || '').trim();
  const webhookSecret = (process.env.MAYAR_WEBHOOK_SECRET || '').trim();
  const isSandbox = process.env.MAYAR_IS_SANDBOX === 'true';
  const baseUrl = isSandbox
    ? 'https://api.mayar.io/hl/v1'
    : 'https://api.mayar.id/hl/v1';
  return { apiKey, webhookSecret, isSandbox, baseUrl };
}

export function normalizeMayarMobile(raw?: string): string {
  const digits = String(raw || '').replace(/\D/g, '');
  const normalized = digits.startsWith('62') ? `0${digits.slice(2)}` : digits;
  return normalized.length >= 10 ? normalized.slice(0, 15) : '089614114644';
}

export async function createMayarInvoice(params: {
  cfg: MayarConfig;
  planId: string;
  planTitle: string;
  price: number;
  studioSlug: string;
  ownerName: string;
  whatsapp?: string;
  redirectUrl: string;
}): Promise<{ ok: true; data: MayarInvoiceCreated } | { ok: false; error: string }> {
  const { cfg, planId, planTitle, price, studioSlug, ownerName, whatsapp, redirectUrl } = params;
  const expiryIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const res = await fetch(`${cfg.baseUrl}/invoice/create`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      name: (ownerName || studioSlug || 'Studio Bukafoto').slice(0, 60),
      email: `${studioSlug.replace(/[^a-z0-9-]/g, '') || 'studio'}@bukafoto.my.id`,
      mobile: normalizeMayarMobile(whatsapp),
      redirectUrl,
      description: `Langganan Bukafoto - ${planTitle} (/${studioSlug})`,
      expiredAt: expiryIso,
      items: [
        {
          quantity: 1,
          rate: price,
          description: `Bukafoto ${planTitle} - /${studioSlug}`.slice(0, 80),
        },
      ],
      extraData: {
        noCustomer: studioSlug,
        idProd: planId,
      },
    }),
  });

  const json = (await res.json()) as {
    statusCode?: number;
    messages?: string;
    data?: { id?: string; transactionId?: string; link?: string; expiredAt?: number };
  };

  if (!res.ok || !json.data?.id || !json.data?.link) {
    return {
      ok: false,
      error: json.messages || 'Gagal membuat tagihan pembayaran di Mayar.',
    };
  }

  return {
    ok: true,
    data: {
      id: json.data.id,
      transactionId: json.data.transactionId,
      link: json.data.link,
      expiredAt: json.data.expiredAt
        ? new Date(json.data.expiredAt).toLocaleString('id-ID')
        : expiryIso,
    },
  };
}

export async function fetchMayarInvoiceStatus(
  invoiceId: string,
  cfg: MayarConfig
): Promise<MayarStatusSummary> {
  if (!cfg.apiKey || !invoiceId.trim()) {
    return { found: false, paid: false, transactionStatus: 'unconfigured', grossAmount: 0 };
  }

  const res = await fetch(
    `${cfg.baseUrl}/invoice/${encodeURIComponent(invoiceId.trim())}`,
    {
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    }
  );

  if (res.status === 404) {
    return { found: false, paid: false, transactionStatus: 'unpaid', grossAmount: 0 };
  }

  const json = (await res.json()) as {
    data?: { status?: string; amount?: number };
  };

  if (!res.ok || !json.data) {
    return { found: false, paid: false, transactionStatus: 'error', grossAmount: 0 };
  }

  const status = String(json.data.status || 'unpaid').toLowerCase();
  const paid = status === 'paid' || status === 'settled' || status === 'success';
  return {
    found: true,
    paid,
    transactionStatus: status,
    grossAmount: Number(json.data.amount || 0),
  };
}
