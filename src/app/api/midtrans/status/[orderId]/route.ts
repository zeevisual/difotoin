import { NextRequest, NextResponse } from 'next/server';
import {
  fetchProviderOrderStatus,
  PaymentProvider,
} from '@/utils/midtrans-server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: { orderId: string } }
) {
  const orderId = context.params.orderId?.trim();
  if (!orderId) {
    return NextResponse.json({ error: 'Order ID wajib diisi.' }, { status: 400 });
  }

  const rawProvider = request.nextUrl.searchParams.get('provider');
  const provider: PaymentProvider | null =
    rawProvider === 'mayar' || rawProvider === 'midtrans' ? rawProvider : null;

  try {
    const res = await fetchProviderOrderStatus(orderId, provider);
    if (!res.configured) {
      return NextResponse.json({ configured: false, paid: false });
    }
    return NextResponse.json({
      configured: true,
      paid: res.status.paid,
      transactionStatus: res.status.transactionStatus,
      orderId,
    });
  } catch {
    return NextResponse.json(
      { configured: true, paid: false, transactionStatus: 'error', orderId },
      { status: 500 }
    );
  }
}
