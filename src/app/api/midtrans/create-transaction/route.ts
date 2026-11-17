import { NextRequest, NextResponse } from 'next/server';
import {
  findPricingPlan,
  getMidtransConfig,
  signCheckoutToken,
} from '@/utils/midtrans-server';

export const dynamic = 'force-dynamic';

interface MidtransChargeResponse {
  status_code?: string;
  status_message?: string;
  order_id?: string;
  qr_string?: string;
  expiry_time?: string;
  actions?: Array<{ name?: string; url?: string }>;
}

export async function POST(request: NextRequest) {
  const cfg = getMidtransConfig();
  if (!cfg.serverKey) {
    return NextResponse.json({ configured: false });
  }

  try {
    const body = (await request.json()) as {
      planId?: string;
      studioSlug?: string;
      ownerName?: string;
      whatsapp?: string;
    };

    const selectedPlan = findPricingPlan(body.planId);
    const cleanSlug = String(body.studioSlug || 'studio')
      .trim()
      .toLowerCase();
    const endpoint = `${cfg.baseUrl}/v2/charge`;
    const orderId = `BKFT-${Date.now()}-${Math.floor(100 + Math.random() * 899)}`;

    const midtransRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: cfg.authHeader,
      },
      body: JSON.stringify({
        payment_type: 'qris',
        qris: { acquirer: 'gopay' },
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

    const data = (await midtransRes.json()) as MidtransChargeResponse;

    if (
      data.status_code === '402' ||
      data.status_code === '406' ||
      String(data.status_message || '')
        .toLowerCase()
        .includes('not activated')
    ) {
      return NextResponse.json({
        configured: false,
        midtransPendingReview: true,
      });
    }

    const qrAction =
      data.actions?.find((a) => a.name === 'generate-qr-code') ||
      data.actions?.find((a) => a.name === 'generate-qr-code-v2');

    if (data.status_code !== '201' || !qrAction?.url) {
      return NextResponse.json(
        {
          configured: true,
          error:
            data.status_message || 'Gagal membuat QRIS dinamis dari Midtrans.',
        },
        { status: 502 }
      );
    }

    const checkoutToken = signCheckoutToken(
      {
        orderId,
        planId: selectedPlan.id,
        studioSlug: cleanSlug,
        amount: selectedPlan.price,
      },
      cfg.serverKey
    );

    return NextResponse.json({
      configured: true,
      orderId,
      checkoutToken,
      qrImageUrl: qrAction.url,
      qrString: data.qr_string,
      expiryTime: data.expiry_time,
      amount: selectedPlan.price,
      isSandbox: cfg.isSandbox,
    });
  } catch {
    return NextResponse.json(
      { configured: true, error: 'Gagal memproses permintaan Midtrans.' },
      { status: 500 }
    );
  }
}
