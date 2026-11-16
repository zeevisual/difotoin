import { NextRequest, NextResponse } from 'next/server';
import { SUBSCRIPTION_PLANS } from '@/utils/pricing-plans';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
  if (!serverKey) {
    return NextResponse.json({ configured: false });
  }

  try {
    const body = (await request.json()) as {
      planId?: string;
      studioSlug?: string;
      ownerName?: string;
      whatsapp?: string;
    };

    const selectedPlan =
      SUBSCRIPTION_PLANS.find((p) => p.id === body.planId) ||
      SUBSCRIPTION_PLANS[1];

    const isSandbox = serverKey.startsWith('SB-');
    const endpoint = isSandbox
      ? 'https://app.sandbox.midtrans.com/snap/v1/transactions'
      : 'https://app.midtrans.com/snap/v1/transactions';

    const orderId = `BKFT-${Date.now()}-${Math.floor(100 + Math.random() * 899)}`;
    const authHeader = `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`;

    const midtransRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: orderId,
          gross_amount: selectedPlan.price,
        },
        item_details: [
          {
            id: selectedPlan.id,
            price: selectedPlan.price,
            quantity: 1,
            name: `Bukafoto - ${selectedPlan.title}`.slice(0, 50),
          },
        ],
        customer_details: {
          first_name: (body.ownerName || body.studioSlug || 'Studio').slice(0, 50),
          email: 'studio@bukafoto.my.id',
          phone: (body.whatsapp || '089614114644').slice(0, 20),
        },
      }),
    });

    const data = (await midtransRes.json()) as {
      token?: string;
      redirect_url?: string;
      error_messages?: string[];
    };

    if (!midtransRes.ok || !data.redirect_url) {
      return NextResponse.json(
        {
          configured: true,
          error:
            data.error_messages?.[0] || 'Gagal membuat transaksi Midtrans Snap.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      configured: true,
      orderId,
      token: data.token,
      redirectUrl: data.redirect_url,
      amount: selectedPlan.price,
      isSandbox,
    });
  } catch {
    return NextResponse.json(
      { configured: true, error: 'Gagal memproses permintaan Midtrans.' },
      { status: 500 }
    );
  }
}
