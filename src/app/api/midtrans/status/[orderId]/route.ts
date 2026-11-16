import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  context: { params: { orderId: string } }
) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
  if (!serverKey) {
    return NextResponse.json({ configured: false, paid: false });
  }

  const orderId = context.params.orderId?.trim();
  if (!orderId) {
    return NextResponse.json({ error: 'Order ID wajib diisi.' }, { status: 400 });
  }

  const isSandbox = serverKey.startsWith('SB-');
  const statusUrl = `https://api.${isSandbox ? 'sandbox.' : ''}midtrans.com/v2/${encodeURIComponent(orderId)}/status`;
  const authHeader = `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`;

  try {
    const res = await fetch(statusUrl, {
      headers: {
        Accept: 'application/json',
        Authorization: authHeader,
      },
      cache: 'no-store',
    });

    if (res.status === 404) {
      return NextResponse.json({
        configured: true,
        paid: false,
        transactionStatus: 'pending',
        orderId,
      });
    }

    const data = (await res.json()) as {
      transaction_status?: string;
      fraud_status?: string;
      status_code?: string;
    };

    // Snap transaction before customer picks a payment method returns status_code 404 in JSON
    if (data.status_code === '404') {
      return NextResponse.json({
        configured: true,
        paid: false,
        transactionStatus: 'pending',
        orderId,
      });
    }

    const txStatus = data.transaction_status || 'pending';
    const isPaid =
      txStatus === 'settlement' ||
      (txStatus === 'capture' && data.fraud_status === 'accept');

    return NextResponse.json({
      configured: true,
      paid: isPaid,
      transactionStatus: txStatus,
      orderId,
    });
  } catch {
    return NextResponse.json(
      { configured: true, paid: false, transactionStatus: 'error', orderId },
      { status: 500 }
    );
  }
}
