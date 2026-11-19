import crypto from 'crypto';
import { SUBSCRIPTION_PLANS, PricingPlan } from '@/utils/pricing-plans';
import { fetchMayarInvoiceStatus, getMayarConfig } from '@/utils/mayar-server';

export type PaymentProvider = 'mayar' | 'midtrans';

export interface MidtransConfig {
  serverKey: string;
  signatureKey: string;
  isSandbox: boolean;
  baseUrl: string;
  authHeader: string;
}

export interface CheckoutTokenPayload {
  provider?: PaymentProvider;
  orderId: string;
  planId: string;
  studioSlug: string;
  amount: number;
}

export interface PaymentStatusSummary {
  found: boolean;
  paid: boolean;
  transactionStatus: string;
  grossAmount: number;
  statusCode?: string;
}

export function getMidtransConfig(): MidtransConfig {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
  const signatureKey = process.env.MIDTRANS_SIGNATURE_KEY || '';
  const isSandbox = serverKey.startsWith('SB-');
  const baseUrl = isSandbox
    ? 'https://api.sandbox.midtrans.com'
    : 'https://api.midtrans.com';
  const authHeader = serverKey
    ? `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`
    : '';
  return { serverKey, signatureKey, isSandbox, baseUrl, authHeader };
}

export function findPricingPlan(planId?: string): PricingPlan {
  return SUBSCRIPTION_PLANS.find((p) => p.id === planId) || SUBSCRIPTION_PLANS[1];
}

export function signCheckoutToken(
  payload: CheckoutTokenPayload,
  secret: string
): string {
  const prefix = payload.provider === 'mayar' ? 'mayar|' : '';
  const msg = `${prefix}${payload.orderId}|${payload.planId}|${payload.studioSlug}|${payload.amount}`;
  return crypto.createHmac('sha256', secret).update(msg).digest('hex');
}

export function verifyCheckoutToken(
  payload: CheckoutTokenPayload,
  token: string,
  secret: string
): boolean {
  if (!token || !secret) return false;
  const expected = signCheckoutToken(payload, secret);
  const a = Buffer.from(token, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function fetchMidtransTransactionStatus(
  orderId: string,
  cfg: MidtransConfig
): Promise<PaymentStatusSummary> {
  if (!cfg.serverKey || !orderId.trim()) {
    return { found: false, paid: false, transactionStatus: 'unconfigured', grossAmount: 0 };
  }
  const url = `${cfg.baseUrl}/v2/${encodeURIComponent(orderId.trim())}/status`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json', Authorization: cfg.authHeader },
    cache: 'no-store',
  });
  if (res.status === 404) {
    return { found: false, paid: false, transactionStatus: 'pending', grossAmount: 0 };
  }
  const data = (await res.json()) as {
    transaction_status?: string;
    fraud_status?: string;
    status_code?: string;
    gross_amount?: string;
  };
  if (data.status_code === '404') {
    return { found: false, paid: false, transactionStatus: 'pending', grossAmount: 0 };
  }
  const txStatus = data.transaction_status || 'pending';
  const paid =
    txStatus === 'settlement' ||
    (txStatus === 'capture' && data.fraud_status === 'accept');
  return {
    found: true,
    paid,
    transactionStatus: txStatus,
    grossAmount: Number(data.gross_amount || 0),
    statusCode: data.status_code,
  };
}

export function getProviderSecret(provider: PaymentProvider): string {
  return provider === 'mayar'
    ? getMayarConfig().apiKey
    : getMidtransConfig().serverKey;
}

export async function fetchProviderOrderStatus(
  orderId: string,
  provider?: PaymentProvider | null
): Promise<{ configured: boolean; status: PaymentStatusSummary }> {
  const resolved: PaymentProvider =
    provider === 'mayar' || (!provider && !orderId.startsWith('BKFT-'))
      ? 'mayar'
      : 'midtrans';

  if (resolved === 'mayar') {
    const cfg = getMayarConfig();
    if (!cfg.apiKey) {
      return { configured: false, status: { found: false, paid: false, transactionStatus: 'unconfigured', grossAmount: 0 } };
    }
    return { configured: true, status: await fetchMayarInvoiceStatus(orderId, cfg) };
  }

  const cfg = getMidtransConfig();
  if (!cfg.serverKey) {
    return { configured: false, status: { found: false, paid: false, transactionStatus: 'unconfigured', grossAmount: 0 } };
  }
  return { configured: true, status: await fetchMidtransTransactionStatus(orderId, cfg) };
}
