import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getMayarConfig } from '@/utils/mayar-server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const cfg = getMayarConfig();
  if (!cfg.apiKey) {
    return NextResponse.json({ ok: false, error: 'Mayar not configured' }, { status: 500 });
  }

  if (cfg.webhookSecret) {
    const queryToken = request.nextUrl.searchParams.get('token') || '';
    const headerToken = request.headers.get('x-mayar-token') || '';
    const candidate = queryToken || headerToken;
    const a = Buffer.from(candidate, 'utf8');
    const b = Buffer.from(cfg.webhookSecret, 'utf8');
    const matches = a.length === b.length && crypto.timingSafeEqual(a, b);
    if (!matches) {
      return NextResponse.json({ ok: false, error: 'Invalid webhook token' }, { status: 403 });
    }
  }

  try {
    const body = (await request.json()) as {
      event?: string;
      data?: { id?: string; status?: boolean | string; amount?: number };
    };
    const eventName = String(body.event || '');
    const rawStatus = body.data?.status;
    const isPaid =
      eventName === 'payment.received' &&
      (rawStatus === true || rawStatus === 'paid' || rawStatus === 'settled');

    return NextResponse.json({
      ok: true,
      event: eventName,
      paid: isPaid,
      invoiceId: body.data?.id || null,
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
  }
}
