import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
  if (!serverKey) {
    return NextResponse.json({ ok: false, error: 'Midtrans not configured' }, { status: 500 });
  }

  try {
    const body = (await request.json()) as {
      order_id?: string;
      status_code?: string;
      gross_amount?: string;
      signature_key?: string;
      transaction_status?: string;
      fraud_status?: string;
    };

    const orderId = String(body.order_id || '');
    const statusCode = String(body.status_code || '');
    const grossAmount = String(body.gross_amount || '');
    const signatureKey = String(body.signature_key || '');

    const expectedKeys = [
      serverKey,
      process.env.MIDTRANS_SIGNATURE_KEY || '',
    ].filter(Boolean);

    const sigBuf = Buffer.from(signatureKey, 'utf8');
    const isValidSig = expectedKeys.some((secret) => {
      const expectedSig = crypto
        .createHash('sha512')
        .update(`${orderId}${statusCode}${grossAmount}${secret}`)
        .digest('hex');
      const expBuf = Buffer.from(expectedSig, 'utf8');
      return sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
    });

    if (!isValidSig) {
      return NextResponse.json({ ok: false, error: 'Invalid signature' }, { status: 403 });
    }

    const txStatus = body.transaction_status || 'pending';
    const isPaid =
      txStatus === 'settlement' ||
      (txStatus === 'capture' && body.fraud_status === 'accept');

    return NextResponse.json({
      ok: true,
      paid: isPaid,
      orderId,
      transactionStatus: txStatus,
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
  }
}
