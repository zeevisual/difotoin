import { NextRequest, NextResponse } from 'next/server';
import {
  fetchMidtransTransactionStatus,
  getMidtransConfig,
} from '@/utils/midtrans-server';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  context: { params: { orderId: string } }
) {
  const cfg = getMidtransConfig();
  if (!cfg.serverKey) {
    return NextResponse.json({ configured: false, paid: false });
  }

  const orderId = context.params.orderId?.trim();
  if (!orderId) {
    return NextResponse.json({ error: 'Order ID wajib diisi.' }, { status: 400 });
  }

  try {
    const status = await fetchMidtransTransactionStatus(orderId, cfg);
    return NextResponse.json({
      configured: true,
      paid: status.paid,
      transactionStatus: status.transactionStatus,
      orderId,
    });
  } catch {
    return NextResponse.json(
      { configured: true, paid: false, transactionStatus: 'error', orderId },
      { status: 500 }
    );
  }
}
